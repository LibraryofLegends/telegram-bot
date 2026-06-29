const {
  isAdmin,
  requireApprovedUser,
} = require("./access-control");

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

function cleanRandomMode(text = "") {
  const value = String(text || "")
    .replace(/^(!zufall|\/zufall|!random|\/random|!vorschlag|\/vorschlag)/i, "")
    .trim()
    .toLowerCase();

  if (["film", "movie", "filme", "movies"].includes(value)) {
    return "movie";
  }

  if (["serie", "series", "show", "serien"].includes(value)) {
    return "series";
  }

  if (["4k", "uhd", "2160p"].includes(value)) {
    return "uhd";
  }

  return "mixed";
}

async function getRandomMovie(pgPool, onlyUhd = false) {
  const whereParts = [
    "file_id IS NOT NULL",
    "file_id <> ''"
  ];

  if (onlyUhd) {
    whereParts.push(`
      (
        quality ILIKE '%UHD%'
        OR quality ILIKE '%4K%'
        OR resolution ILIKE '3840%'
        OR resolution ILIKE '2160%'
        OR file_name ILIKE '%2160p%'
        OR file_name ILIKE '%uhd%'
        OR file_name ILIKE '%4k%'
      )
    `);
  }

  const result = await pgPool.query(
    `
    SELECT
      id,
      title,
      year,
      library_id,
      genre,
      rating,
      quality,
      resolution,
      file_size,
      runtime
    FROM movies
    WHERE ${whereParts.join(" AND ")}
    ORDER BY RANDOM()
    LIMIT 1;
    `
  );

  return result.rows[0] || null;
}

async function getRandomSeries(pgPool) {
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
      ) AS first_season
    FROM series
    WHERE file_id IS NOT NULL
      AND file_id <> ''
    GROUP BY
      COALESCE(NULLIF(series_library_id::text, ''), LOWER(series_title)),
      series_title
    ORDER BY RANDOM()
    LIMIT 1;
    `
  );

  return result.rows[0] || null;
}

function formatRandomMovie(movie) {
  if (!movie) {
    return "🎬 Kein passender Film gefunden.";
  }

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
    `🎬 Film-Vorschlag\n\n` +
    `${movie.title || "Unbekannter Film"}${movie.year ? ` (${movie.year})` : ""}\n` +
    `🆔 ${label}\n` +
    `${movie.genre ? `📂 ${movie.genre}\n` : ""}` +
    `${movie.rating ? `⭐ ${movie.rating}\n` : ""}` +
    `${meta ? `🔥 ${meta}\n` : ""}` +
    `\n📦 Holen mit:\n` +
    `!hol movie ${movie.id}`
  );
}

function formatRandomSeries(series) {
  if (!series) {
    return "📺 Keine passende Serie gefunden.";
  }

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
    `📺 Serien-Vorschlag\n\n` +
    `${series.series_title || "Unbekannte Serie"}\n` +
    `${series.seasons_count || 0} Staffel(n) · ${series.episodes_count || 0} Folge(n)\n` +
    `Staffeln: ${seasonText}\n\n` +
    `📦 Starten mit:\n` +
    `!hol serie ${number} s${firstSeason}e1\n\n` +
    `📀 Staffel holen:\n` +
    `!hol serie ${number} staffel ${firstSeason}`
  );
}

function buildRandomMessage({ mode, movie, series }) {
  if (mode === "movie" || mode === "uhd") {
    return (
      `🎲 Zufalls-Vorschlag\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      formatRandomMovie(movie)
    );
  }

  if (mode === "series") {
    return (
      `🎲 Zufalls-Vorschlag\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      formatRandomSeries(series)
    );
  }

  return (
    `🎲 Zufalls-Vorschlag\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    formatRandomMovie(movie) +
    `\n\n━━━━━━━━━━━━━━━━━━\n\n` +
    formatRandomSeries(series)
  );
}

async function sendRandomLibraryMessage(bot, chatId, replyToMessageId, pgPool, mode = "mixed") {
  const movie =
    mode === "series"
      ? null
      : await getRandomMovie(pgPool, mode === "uhd");

  const series =
    mode === "movie" || mode === "uhd"
      ? null
      : await getRandomSeries(pgPool);

  await bot.sendMessage(
    chatId,
    buildRandomMessage({
      mode,
      movie,
      series
    }).slice(0, 3900),
    {
      reply_to_message_id: replyToMessageId
    }
  );
}

async function handleRandomCommands(bot, msg, pgPool) {
  const text = String(msg.text || "").trim();
  const chatId = msg.chat.id;
  const from = msg.from;

  if (!from || !text) return false;

  const supported =
    text === "!zufall" ||
    text === "/zufall" ||
    text === "!random" ||
    text === "/random" ||
    text === "!vorschlag" ||
    text === "/vorschlag" ||
    text.startsWith("!zufall ") ||
    text.startsWith("/zufall ") ||
    text.startsWith("!random ") ||
    text.startsWith("/random ") ||
    text.startsWith("!vorschlag ") ||
    text.startsWith("/vorschlag ");

  if (!supported) return false;

  const userCheck = await requireApprovedUser(pgPool, from.id);

  if (!isAdmin(from.id) && !userCheck.ok) {
    await bot.sendMessage(chatId, userCheck.message, {
      reply_to_message_id: msg.message_id
    });
    return true;
  }

  const mode = cleanRandomMode(text);

  await sendRandomLibraryMessage(
    bot,
    chatId,
    msg.message_id,
    pgPool,
    mode
  );

  return true;
}

module.exports = {
  handleRandomCommands,
  sendRandomLibraryMessage,
};