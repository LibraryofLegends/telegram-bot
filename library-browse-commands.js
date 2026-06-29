const {
  isAdmin,
  requireApprovedUser,
} = require("./access-control");

function pad2(value) {
  return String(value || 0).padStart(2, "0");
}

function normalizeGenreToken(value = "") {
  return String(value || "")
    .trim()
    .replace(/^#/, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");
}

function splitGenres(value = "") {
  return String(value || "")
    .split(/[,/|;#]+/g)
    .map(normalizeGenreToken)
    .filter((v) => v.length >= 2);
}

function buildGenrePattern(query = "") {
  const clean = normalizeGenreToken(query);

  if (!clean) {
    return null;
  }

  return `%${clean}%`;
}

function formatMovieLine(movie, index) {
  const label =
    movie.library_id ||
    String(movie.id);

  const meta = [
    movie.quality,
    movie.resolution,
    movie.file_size,
    movie.runtime
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .join(" · ");

  return (
    `${index + 1}. 🎬 ${movie.title || "Unbekannter Film"}${movie.year ? ` (${movie.year})` : ""}\n` +
    `   🆔 ${label}\n` +
    `   ${meta || "Keine technischen Daten"}\n` +
    `   !hol movie ${movie.id}`
  );
}

function parseSeasonList(value) {
  if (Array.isArray(value)) {
    return value
      .map((v) => Number(String(v).trim()))
      .filter((n) => Number.isInteger(n) && n > 0)
      .sort((a, b) => a - b);
  }

  return String(value || "")
    .split(",")
    .map((v) => Number(String(v).trim()))
    .filter((n) => Number.isInteger(n) && n > 0)
    .sort((a, b) => a - b);
}

function formatSeriesLine(series, index) {
  const number =
    series.series_ref ||
    series.series_library_id ||
    series.id;

  const seasons =
    parseSeasonList(series.season_list);

  const firstSeason =
    seasons[0] ||
    series.first_season ||
    1;

  const seasonText =
    seasons.length
      ? seasons.map((s) => `S${pad2(s)}`).join(", ")
      : "—";

  return (
    `${index + 1}.  📺 ${series.series_title || "Unbekannte Serie"}\n` +
    `   ${series.seasons_count || 0} Staffel(n) · ${series.episodes_count || 0} Folge(n)\n` +
    `   Staffeln: ${seasonText}\n` +
    `   !hol serie ${number} s${firstSeason}e1\n` +
    `   !hol serie ${number} staffel ${firstSeason}`
  );
}

async function getGenreOverview(pgPool) {
  const movieRows = await pgPool.query(`
    SELECT genre
    FROM movies
    WHERE genre IS NOT NULL
      AND TRIM(genre) <> '';
  `);

  const seriesRows = await pgPool.query(`
    SELECT genre
    FROM series
    WHERE genre IS NOT NULL
      AND TRIM(genre) <> '';
  `);

  const counter = new Map();

  for (const row of movieRows.rows || []) {
    for (const genre of splitGenres(row.genre)) {
      const key = genre.toLowerCase();
      const current = counter.get(key) || {
        name: genre,
        count: 0
      };

      current.count += 1;
      counter.set(key, current);
    }
  }

  for (const row of seriesRows.rows || []) {
    for (const genre of splitGenres(row.genre)) {
      const key = genre.toLowerCase();
      const current = counter.get(key) || {
        name: genre,
        count: 0
      };

      current.count += 1;
      counter.set(key, current);
    }
  }

  return Array.from(counter.values())
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 40);
}

function buildGenreOverviewMessage(genres) {
  if (!genres.length) {
    return (
      `📂 Kategorien\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Noch keine Genres gefunden.`
    );
  }

  const lines = genres
    .map((genre, index) => {
      return `${index + 1}. ${genre.name} · ${genre.count}`;
    })
    .join("\n");

  return (
    `📂 Kategorien\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    lines +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Stöbern mit:\n` +
    `!genre action\n` +
    `!genre horror\n` +
    `!filme action\n` +
    `!serien drama\n` +
    `!4k`
  );
}

async function getMoviesByGenre(pgPool, query, limit = 12) {
  const pattern = buildGenrePattern(query);

  if (!pattern) return [];

  const result = await pgPool.query(
    `
    SELECT
      id,
      title,
      year,
      genre,
      library_id,
      quality,
      resolution,
      file_size,
      runtime,
      created_at
    FROM movies
    WHERE genre ILIKE $1
    ORDER BY
      created_at DESC NULLS LAST,
      year DESC NULLS LAST,
      title ASC
    LIMIT $2;
    `,
    [
      pattern,
      Math.max(1, Math.min(Number(limit) || 12, 20))
    ]
  );

  return result.rows || [];
}

async function getSeriesByGenre(pgPool, query, limit = 8) {
  const pattern = buildGenrePattern(query);

  if (!pattern) return [];

  const result = await pgPool.query(
    `
    SELECT
      MIN(id) AS id,
      COALESCE(NULLIF(MAX(series_library_id::text), ''), MIN(id)::text) AS series_ref,
      MAX(series_library_id::text) AS series_library_id,
      series_title,
      COUNT(*)::int AS episodes_count,
      COUNT(DISTINCT season::text)::int AS seasons_count,
      ARRAY_AGG(DISTINCT season::text) AS season_list,
      MIN(
        CASE
          WHEN season::text ~ '^[0-9]+$'
          THEN season::integer
          ELSE NULL
        END
      ) AS first_season,
      MAX(created_at) AS latest_created_at
    FROM series
    WHERE genre ILIKE $1
    GROUP BY
      COALESCE(NULLIF(series_library_id::text, ''), LOWER(series_title)),
      series_title
    ORDER BY
      latest_created_at DESC NULLS LAST,
      series_title ASC
    LIMIT $2;
    `,
    [
      pattern,
      Math.max(1, Math.min(Number(limit) || 8, 20))
    ]
  );

  return result.rows || [];
}

async function getUhdMovies(pgPool, limit = 15) {
  const result = await pgPool.query(
    `
    SELECT
      id,
      title,
      year,
      genre,
      library_id,
      quality,
      resolution,
      file_size,
      runtime,
      created_at
    FROM movies
    WHERE
      quality ILIKE '%UHD%'
      OR quality ILIKE '%4K%'
      OR resolution ILIKE '3840%'
      OR resolution ILIKE '2160%'
      OR file_name ILIKE '%2160p%'
      OR file_name ILIKE '%uhd%'
      OR file_name ILIKE '%4k%'
    ORDER BY
      created_at DESC NULLS LAST,
      year DESC NULLS LAST,
      title ASC
    LIMIT $1;
    `,
    [
      Math.max(1, Math.min(Number(limit) || 15, 20))
    ]
  );

  return result.rows || [];
}

function buildBrowseMessage({ query, mode, movies, series }) {
  const title =
    mode === "movies"
      ? `🎬 Filme: ${query}`
      : mode === "series"
        ? `📺 Serien: ${query}`
        : mode === "uhd"
          ? "🔥 4K / UHD im Archiv"
          : `📂 Kategorie: ${query}`;

  let message =
    `${title}\n` +
    `━━━━━━━━━━━━━━━━━━\n\n`;

  if (mode === "movies" || mode === "uhd") {
    message +=
      `🎬 Filme\n\n` +
      (
        movies.length
          ? movies.map(formatMovieLine).join("\n\n")
          : "Keine Filme gefunden."
      ) +
      `\n\n━━━━━━━━━━━━━━━━━━\n` +
      `🔎 Mehr finden mit:\n` +
      `!suche ${query}`;

    return message;
  }

  if (mode === "series") {
    message +=
      `📺 Serien\n\n` +
      (
        series.length
          ? series.map(formatSeriesLine).join("\n\n")
          : "Keine Serien gefunden."
      ) +
      `\n\n━━━━━━━━━━━━━━━━━━\n` +
      `🔎 Mehr finden mit:\n` +
      `!suche ${query}`;

    return message;
  }

  message +=
    `🎬 Filme\n\n` +
    (
      movies.length
        ? movies.map(formatMovieLine).join("\n\n")
        : "Keine Filme gefunden."
    ) +
    `\n\n━━━━━━━━━━━━━━━━━━\n\n` +
    `📺 Serien\n\n` +
    (
      series.length
        ? series.map(formatSeriesLine).join("\n\n")
        : "Keine Serien gefunden."
    ) +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `🔎 Mehr finden mit:\n` +
    `!suche ${query}`;

  return message;
}

async function sendGenreListMessage(bot, chatId, replyToMessageId, pgPool) {
  const genres = await getGenreOverview(pgPool);

  await bot.sendMessage(
    chatId,
    buildGenreOverviewMessage(genres).slice(0, 3900),
    {
      reply_to_message_id: replyToMessageId
    }
  );
}

async function sendBrowseMessage(bot, chatId, replyToMessageId, pgPool, query, mode = "both") {
  if (mode === "uhd") {
    const movies = await getUhdMovies(pgPool, 15);

    await bot.sendMessage(
      chatId,
      buildBrowseMessage({
        query: "4k",
        mode,
        movies,
        series: []
      }).slice(0, 3900),
      {
        reply_to_message_id: replyToMessageId
      }
    );

    return;
  }

  const movies =
    mode === "series"
      ? []
      : await getMoviesByGenre(pgPool, query, 12);

  const series =
    mode === "movies"
      ? []
      : await getSeriesByGenre(pgPool, query, 8);

  await bot.sendMessage(
    chatId,
    buildBrowseMessage({
      query,
      mode,
      movies,
      series
    }).slice(0, 3900),
    {
      reply_to_message_id: replyToMessageId
    }
  );
}

function parseBrowseCommand(text = "") {
  const clean = String(text || "").trim();

  const lower = clean.toLowerCase();

  if (
    lower === "!kategorien" ||
    lower === "/kategorien" ||
    lower === "!genres" ||
    lower === "/genres" ||
    lower === "!genre" ||
    lower === "/genre"
  ) {
    return {
      type: "list"
    };
  }

  if (
    lower === "!4k" ||
    lower === "/4k" ||
    lower === "!uhd" ||
    lower === "/uhd"
  ) {
    return {
      type: "browse",
      mode: "uhd",
      query: "4k"
    };
  }

  const genreMatch =
    clean.match(/^(!genre|\/genre|!kategorie|\/kategorie)\s+(.+)$/i);

  if (genreMatch) {
    return {
      type: "browse",
      mode: "both",
      query: genreMatch[2].trim()
    };
  }

  const movieMatch =
    clean.match(/^(!filme|\/filme)\s+(.+)$/i);

  if (movieMatch) {
    return {
      type: "browse",
      mode: "movies",
      query: movieMatch[2].trim()
    };
  }

  const seriesMatch =
    clean.match(/^(!serien|\/serien)\s+(.+)$/i);

  if (seriesMatch) {
    return {
      type: "browse",
      mode: "series",
      query: seriesMatch[2].trim()
    };
  }

  return null;
}

async function handleBrowseCommands(bot, msg, pgPool) {
  const text =
    String(msg.text || "").trim();

  const chatId =
    msg.chat.id;

  const from =
    msg.from;

  if (!from || !text) return false;

  const parsed = parseBrowseCommand(text);

  if (!parsed) {
    return false;
  }

  const userCheck = await requireApprovedUser(pgPool, from.id);

  if (!isAdmin(from.id) && !userCheck.ok) {
    await bot.sendMessage(chatId, userCheck.message, {
      reply_to_message_id: msg.message_id
    });
    return true;
  }

  if (parsed.type === "list") {
    await sendGenreListMessage(
      bot,
      chatId,
      msg.message_id,
      pgPool
    );

    return true;
  }

  await sendBrowseMessage(
    bot,
    chatId,
    msg.message_id,
    pgPool,
    parsed.query,
    parsed.mode
  );

  return true;
}

module.exports = {
  handleBrowseCommands,
  sendGenreListMessage,
  sendBrowseMessage,
};