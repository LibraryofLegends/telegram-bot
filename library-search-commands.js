const {
  requireApprovedUser
} = require("./access-control");

function cleanQuery(text = "") {
  return String(text || "")
    .replace(/^!suche/i, "")
    .replace(/^\/suche/i, "")
    .replace(/^\/search/i, "")
    .trim();
}

function shortValue(value, fallback = "—") {
  const v = String(value || "").trim();
  return v || fallback;
}

function formatMovieLine(movie) {
  const number =
    movie.library_id ||
    String(movie.id).padStart(4, "0");

  const qualityLine = [
    movie.quality,
    movie.resolution,
    movie.file_size,
    movie.runtime
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .join(" · ");

  return (
    `${number}. 🎬 ${movie.title || "Unbekannter Film"}${movie.year ? ` (${movie.year})` : ""}\n` +
    `   ${qualityLine || "Keine technischen Daten"}\n` +
    `   !hol movie ${movie.id}`
  );
}

function pad2(value) {
  return String(value || 0).padStart(2, "0");
}

function parseSeasonList(value = "") {
  return String(value || "")
    .split(",")
    .map((v) => Number(String(v).trim()))
    .filter((n) => Number.isInteger(n) && n > 0)
    .sort((a, b) => a - b);
}

function formatSeriesLine(series) {
  const number =
    series.series_ref ||
    series.series_library_id ||
    series.id;

  const seasons = parseSeasonList(series.season_list);
  const firstSeason = seasons[0] || series.first_season || 1;

  const seasonLabel =
    seasons.length
      ? `Staffeln: ${seasons.map((s) => `S${pad2(s)}`).join(", ")}`
      : "Staffeln: —";

  const seasonCommands = seasons
    .slice(0, 5)
    .map((s) => `   !hol serie ${number} staffel ${s}`)
    .join("\n");

  return (
    `${number}. 📺 ${series.series_title || "Unbekannte Serie"}\n` +
    `   ${series.seasons_count || 0} Staffel(n) · ${series.episodes_count || 0} Folge(n)\n` +
    `   ${seasonLabel}\n\n` +
    `   !hol serie ${number} s${firstSeason}e1\n` +
    `${seasonCommands ? seasonCommands : `   !hol serie ${number} staffel ${firstSeason}`}`
  );
}

function buildSearchPatterns(query = "") {
  const raw = String(query || "").trim();
  const lower = raw.toLowerCase();

  const terms = new Set();

  if (raw) {
    terms.add(raw);
  }

  // 4K / UHD Mapping für deine Datenbank
  if (
    lower === "4k" ||
    lower.includes("4k") ||
    lower === "uhd" ||
    lower.includes("uhd") ||
    lower.includes("2160") ||
    lower.includes("3840")
  ) {
    terms.add("4K");
    terms.add("UHD");
    terms.add("2160p");
    terms.add("2160");
    terms.add("3840");
  }

  // Full HD Mapping
  if (
    lower === "fhd" ||
    lower.includes("fhd") ||
    lower.includes("1080") ||
    lower.includes("1920")
  ) {
    terms.add("FHD");
    terms.add("1080p");
    terms.add("1080");
    terms.add("1920");
  }

  // HD Mapping
  if (
    lower === "hd" ||
    lower.includes("720") ||
    lower.includes("1280")
  ) {
    terms.add("HD");
    terms.add("720p");
    terms.add("720");
    terms.add("1280");
  }

  return Array.from(terms).map((term) => `%${term}%`);
}

async function searchMovies(pgPool, query) {
  const patterns = buildSearchPatterns(query);

  const result = await pgPool.query(
    `
    SELECT
      id,
      title,
      year,
      genre,
      runtime,
      file_name,
      library_id,
      quality,
      resolution,
      file_size,
      source,
      audio,
      collection,
      universe
    FROM movies
    WHERE
      title ILIKE ANY($1)
      OR file_name ILIKE ANY($1)
      OR genre ILIKE ANY($1)
      OR year ILIKE ANY($1)
      OR library_id ILIKE ANY($1)
      OR quality ILIKE ANY($1)
      OR resolution ILIKE ANY($1)
      OR file_size ILIKE ANY($1)
      OR source ILIKE ANY($1)
      OR audio ILIKE ANY($1)
      OR collection ILIKE ANY($1)
      OR universe ILIKE ANY($1)
    ORDER BY
      CASE
        WHEN LOWER(title) = LOWER($2) THEN 0
        WHEN LOWER(title) LIKE LOWER($3) THEN 1
        ELSE 2
      END,
      year NULLS LAST,
      title ASC
    LIMIT 20;
    `,
    [patterns, query, `${query}%`]
  );

  return result.rows || [];
}

async function searchSeries(pgPool, query) {
  const patterns = buildSearchPatterns(query);

  const result = await pgPool.query(
    `
    SELECT
      MIN(id) AS id,
      COALESCE(NULLIF(MAX(series_library_id::text), ''), MIN(id)::text) AS series_ref,
      MAX(series_library_id::text) AS series_library_id,
      series_title,
      COUNT(*)::int AS episodes_count,
      COUNT(DISTINCT season::text)::int AS seasons_count,
      MIN(
        CASE
          WHEN season::text ~ '^[0-9]+$'
          THEN season::integer
          ELSE NULL
        END
      ) AS first_season,
      MAX(
        CASE
          WHEN season::text ~ '^[0-9]+$'
          THEN season::integer
          ELSE NULL
        END
      ) AS last_season,
      STRING_AGG(
        DISTINCT season::text,
        ', ' ORDER BY season::text
      ) AS season_list
    FROM series
    WHERE
      series_title ILIKE ANY($1)
      OR episode_title ILIKE ANY($1)
      OR file_name ILIKE ANY($1)
      OR genre ILIKE ANY($1)
      OR series_library_id::text ILIKE ANY($1)
    GROUP BY
      COALESCE(NULLIF(series_library_id::text, ''), LOWER(series_title)),
      series_title
    ORDER BY
      CASE
        WHEN LOWER(series_title) = LOWER($2) THEN 0
        WHEN LOWER(series_title) LIKE LOWER($3) THEN 1
        ELSE 2
      END,
      series_title ASC
    LIMIT 10;
    `,
    [patterns, query, `${query}%`]
  );

  return result.rows || [];
}

async function handleLibrarySearchCommands(bot, msg, pgPool) {
  const text = msg.text || "";
  const chatId = msg.chat.id;
  const from = msg.from;

  if (!from) return false;

  const isSearchCommand =
    text.toLowerCase().startsWith("!suche ") ||
    text.toLowerCase() === "!suche" ||
    text.toLowerCase().startsWith("/suche ") ||
    text.toLowerCase() === "/suche";

  if (!isSearchCommand) {
    return false;
  }

  const access = await requireApprovedUser(pgPool, from.id);

  if (!access.ok) {
    await bot.sendMessage(chatId, access.message, {
      reply_to_message_id: msg.message_id
    });
    return true;
  }

  const query = cleanQuery(text);

  if (!query || query.length < 2) {
    await bot.sendMessage(
      chatId,
      "🔎 Nutzung:\n\n!suche TITEL\n\nBeispiel:\n!suche terminator",
      {
        reply_to_message_id: msg.message_id
      }
    );
    return true;
  }

  const movies = await searchMovies(pgPool, query);
  const series = await searchSeries(pgPool, query);

  if (!movies.length && !series.length) {
    await bot.sendMessage(
      chatId,
      `🔎 Suche: ${query}\n\n❌ Keine Treffer gefunden.`,
      {
        reply_to_message_id: msg.message_id
      }
    );
    return true;
  }

  let message =
    `🔎 Suche: ${query}\n\n`;

  if (movies.length) {
    message +=
      `🎬 Filme\n\n` +
      movies.map(formatMovieLine).join("\n\n") +
      "\n\n";
  }

  if (series.length) {
    message +=
      `📺 Serien\n\n` +
      series.map(formatSeriesLine).join("\n\n") +
      "\n\n";
  }

  message +=
    "━━━━━━━━━━━━━━━━━━\n" +
    "🔎 Suche: unbegrenzt\n" +
    "📦 Hol-Funktion folgt im nächsten Schritt.";

  await bot.sendMessage(chatId, message, {
    reply_to_message_id: msg.message_id
  });

  return true;
}

module.exports = {
  handleLibrarySearchCommands
};