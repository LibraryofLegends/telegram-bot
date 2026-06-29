const {
  isAdmin,
  requireApprovedUser,
} = require("./access-control");

const AZ_LETTERS = [
  "A", "B", "C", "D", "E", "F", "G",
  "H", "I", "J", "K", "L", "M", "N",
  "O", "P", "Q", "R", "S", "T", "U",
  "V", "W", "X", "Y", "Z", "#"
];

function pad2(value) {
  return String(value || 0).padStart(2, "0");
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

function normalizeForAz(value = "") {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^["'„“”‚‘’\-–—:;,.!?()\[\]\s]+/g, "")
    .toUpperCase();
}

function getAzLetter(title = "") {
  const clean = normalizeForAz(title);
  const first = clean.charAt(0);

  if (/^[A-Z]$/.test(first)) {
    return first;
  }

  return "#";
}

function parseAzLetter(value = "") {
  const clean = String(value || "")
    .trim()
    .replace(/^#$/, "#")
    .toUpperCase();

  if (clean === "#" || clean === "0-9" || clean === "ZAHLEN") {
    return "#";
  }

  const normalized = normalizeForAz(clean);
  const first = normalized.charAt(0);

  if (/^[A-Z]$/.test(first) && normalized.length === 1) {
    return first;
  }

  return null;
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
    `${index + 1}. 📺 ${series.series_title || "Unbekannte Serie"}\n` +
    `   ${series.seasons_count || 0} Staffel(n) · ${series.episodes_count || 0} Folge(n)\n` +
    `   Staffeln: ${seasonText}\n` +
    `   !hol serie ${number} s${firstSeason}e1\n` +
    `   !hol serie ${number} staffel ${firstSeason}`
  );
}

async function getAllMovieAzRows(pgPool) {
  const result = await pgPool.query(`
    SELECT
      id,
      title,
      year,
      library_id,
      quality,
      resolution,
      file_size,
      runtime,
      created_at
    FROM movies
    WHERE title IS NOT NULL
      AND TRIM(title) <> ''
    ORDER BY
      title ASC,
      year ASC NULLS LAST,
      id ASC;
  `);

  return result.rows || [];
}

async function getAllSeriesAzRows(pgPool) {
  const result = await pgPool.query(`
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
    WHERE series_title IS NOT NULL
      AND TRIM(series_title) <> ''
    GROUP BY
      COALESCE(NULLIF(series_library_id::text, ''), LOWER(series_title)),
      series_title
    ORDER BY
      series_title ASC;
  `);

  return result.rows || [];
}

async function getAzOverview(pgPool) {
  const movies = await getAllMovieAzRows(pgPool);
  const series = await getAllSeriesAzRows(pgPool);

  const map = new Map();

  for (const letter of AZ_LETTERS) {
    map.set(letter, {
      letter,
      movies: 0,
      series: 0
    });
  }

  for (const movie of movies) {
    const letter = getAzLetter(movie.title);
    const current = map.get(letter);

    if (current) {
      current.movies += 1;
    }
  }

  for (const item of series) {
    const letter = getAzLetter(item.series_title);
    const current = map.get(letter);

    if (current) {
      current.series += 1;
    }
  }

  return AZ_LETTERS.map((letter) => map.get(letter));
}

function buildAzOverviewMessage(rows) {
  const lines = rows
    .map((row) => {
      const parts = [];

      if (row.movies) {
        parts.push(`🎬 ${row.movies}`);
      }

      if (row.series) {
        parts.push(`📺 ${row.series}`);
      }

      return `${row.letter} · ${parts.join(" · ") || "0"}`;
    })
    .join("\n");

  return (
    `🔤 A–Z Browser\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    lines +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Stöbern mit:\n` +
    `!az a\n` +
    `!az s\n` +
    `!a\n` +
    `!filme a\n` +
    `!serien s`
  );
}

async function getMoviesByAzLetter(pgPool, letter, limit = 15) {
  const rows = await getAllMovieAzRows(pgPool);

  return rows
    .filter((movie) => getAzLetter(movie.title) === letter)
    .slice(0, Math.max(1, Math.min(Number(limit) || 15, 20)));
}

async function getSeriesByAzLetter(pgPool, letter, limit = 10) {
  const rows = await getAllSeriesAzRows(pgPool);

  return rows
    .filter((series) => getAzLetter(series.series_title) === letter)
    .slice(0, Math.max(1, Math.min(Number(limit) || 10, 20)));
}

function buildAzBrowseMessage({ letter, mode, movies, series }) {
  const title =
    mode === "movies"
      ? `🔤 Filme mit ${letter}`
      : mode === "series"
        ? `🔤 Serien mit ${letter}`
        : `🔤 A–Z: ${letter}`;

  let message =
    `${title}\n` +
    `━━━━━━━━━━━━━━━━━━\n\n`;

  if (mode === "movies") {
    message +=
      `🎬 Filme\n\n` +
      (
        movies.length
          ? movies.map(formatMovieLine).join("\n\n")
          : "Keine Filme gefunden."
      ) +
      `\n\n━━━━━━━━━━━━━━━━━━\n` +
      `Mehr anzeigen über:\n` +
      `!suche ${letter}`;

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
      `Mehr anzeigen über:\n` +
      `!suche ${letter}`;

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
    `Nur Filme:\n` +
    `!filme ${letter}\n\n` +
    `Nur Serien:\n` +
    `!serien ${letter}`;

  return message;
}

async function sendAzOverviewMessage(bot, chatId, replyToMessageId, pgPool) {
  const rows = await getAzOverview(pgPool);

  await bot.sendMessage(
    chatId,
    buildAzOverviewMessage(rows).slice(0, 3900),
    {
      reply_to_message_id: replyToMessageId
    }
  );
}

async function sendAzBrowseMessage(bot, chatId, replyToMessageId, pgPool, letter, mode = "both") {
  const movies =
    mode === "series"
      ? []
      : await getMoviesByAzLetter(pgPool, letter, 15);

  const series =
    mode === "movies"
      ? []
      : await getSeriesByAzLetter(pgPool, letter, 10);

  await bot.sendMessage(
    chatId,
    buildAzBrowseMessage({
      letter,
      mode,
      movies,
      series
    }).slice(0, 3900),
    {
      reply_to_message_id: replyToMessageId
    }
  );
}

function parseAzCommand(text = "") {
  const clean = String(text || "").trim();
  const lower = clean.toLowerCase();

  if (
    lower === "!az" ||
    lower === "/az" ||
    lower === "!a-z" ||
    lower === "/a-z" ||
    lower === "!alphabet" ||
    lower === "/alphabet"
  ) {
    return {
      type: "overview"
    };
  }

  const azMatch =
    clean.match(/^(!az|\/az|!a-z|\/a-z)\s+(.+)$/i);

  if (azMatch) {
    const letter = parseAzLetter(azMatch[2]);

    if (letter) {
      return {
        type: "browse",
        mode: "both",
        letter
      };
    }
  }

  const directLetter =
    clean.match(/^!([a-zäöü])$/i) ||
    clean.match(/^\/([a-zäöü])$/i);

  if (directLetter) {
    const letter = parseAzLetter(directLetter[1]);

    if (letter) {
      return {
        type: "browse",
        mode: "both",
        letter
      };
    }
  }

  const movieMatch =
    clean.match(/^(!filme|\/filme)\s+([a-zäöü#])$/i);

  if (movieMatch) {
    const letter = parseAzLetter(movieMatch[2]);

    if (letter) {
      return {
        type: "browse",
        mode: "movies",
        letter
      };
    }
  }

  const seriesMatch =
    clean.match(/^(!serien|\/serien)\s+([a-zäöü#])$/i);

  if (seriesMatch) {
    const letter = parseAzLetter(seriesMatch[2]);

    if (letter) {
      return {
        type: "browse",
        mode: "series",
        letter
      };
    }
  }

  return null;
}

async function handleAzCommands(bot, msg, pgPool) {
  const text =
    String(msg.text || "").trim();

  const chatId =
    msg.chat.id;

  const from =
    msg.from;

  if (!from || !text) return false;

  const parsed = parseAzCommand(text);

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

  if (parsed.type === "overview") {
    await sendAzOverviewMessage(
      bot,
      chatId,
      msg.message_id,
      pgPool
    );

    return true;
  }

  if (parsed.type === "browse") {
    await sendAzBrowseMessage(
      bot,
      chatId,
      msg.message_id,
      pgPool,
      parsed.letter,
      parsed.mode
    );

    return true;
  }

  return false;
}

module.exports = {
  handleAzCommands,
  sendAzOverviewMessage,
};