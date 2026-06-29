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

async function getPopularLibraryItems(pgPool, days = 30, limit = 10) {
  const cleanDays = Math.max(1, Math.min(Number(days) || 30, 365));
  const cleanLimit = Math.max(1, Math.min(Number(limit) || 10, 20));

  const moviesResult = await pgPool.query(
    `
    SELECT
      m.id,
      m.title,
      m.year,
      m.library_id,
      m.quality,
      m.resolution,
      m.file_size,
      m.runtime,
      COUNT(*)::int AS hits,
      MAX(l.created_at) AS last_used_at
    FROM bot_usage_logs l
    JOIN movies m
      ON l.action_type = 'movie'
      AND m.id::text = l.item_id::text
    WHERE l.created_at >= NOW() - ($1 || ' days')::interval
    GROUP BY
      m.id,
      m.title,
      m.year,
      m.library_id,
      m.quality,
      m.resolution,
      m.file_size,
      m.runtime
    ORDER BY
      hits DESC,
      last_used_at DESC NULLS LAST,
      m.title ASC
    LIMIT $2;
    `,
    [cleanDays, cleanLimit]
  );

  const seriesResult = await pgPool.query(
    `
    SELECT
      COALESCE(NULLIF(MAX(s.series_library_id::text), ''), MIN(s.id)::text) AS series_ref,
      MAX(s.series_library_id::text) AS series_library_id,
      s.series_title,
      COUNT(*)::int AS hits,
      COUNT(DISTINCT s.id)::int AS episode_hits,
      COUNT(DISTINCT s.season::text)::int AS seasons_count,
      ARRAY_AGG(DISTINCT s.season::text) AS season_list,
      MAX(l.created_at) AS last_used_at
    FROM bot_usage_logs l
    JOIN series s
      ON l.action_type = 'episode'
      AND s.id::text = l.item_id::text
    WHERE l.created_at >= NOW() - ($1 || ' days')::interval
    GROUP BY
      s.series_title
    ORDER BY
      hits DESC,
      last_used_at DESC NULLS LAST,
      s.series_title ASC
    LIMIT $2;
    `,
    [cleanDays, cleanLimit]
  );

  return {
    days: cleanDays,
    movies: moviesResult.rows || [],
    series: seriesResult.rows || []
  };
}

function formatPopularMovieLine(movie, index) {
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
    `   🔥 ${movie.hits}x geholt\n` +
    `   🆔 ${label}\n` +
    `   ${meta || "Keine technischen Daten"}\n` +
    `   !hol movie ${movie.id}`
  );
}

function formatPopularSeriesLine(series, index) {
  const number =
    series.series_ref ||
    series.series_library_id;

  const seasons =
    parseSeasonList(series.season_list);

  const seasonText =
    seasons.length
      ? seasons.map((s) => `S${pad2(s)}`).join(", ")
      : "—";

  const firstSeason =
    seasons[0] || 1;

  return (
    `${index + 1}. 📺 ${series.series_title || "Unbekannte Serie"}\n` +
    `   🔥 ${series.hits}x Folge geholt\n` +
    `   Staffeln im Verlauf: ${seasonText}\n` +
    `   !hol serie ${number} s${firstSeason}e1\n` +
    `   !hol serie ${number} staffel ${firstSeason}`
  );
}

function buildPopularLibraryMessage(popular) {
  const movieLines =
    popular.movies.length
      ? popular.movies.map(formatPopularMovieLine).join("\n\n")
      : "Noch keine Film-Nutzung vorhanden.";

  const seriesLines =
    popular.series.length
      ? popular.series.map(formatPopularSeriesLine).join("\n\n")
      : "Noch keine Serien-Nutzung vorhanden.";

  return (
    `🏆 Beliebt im Archiv\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Zeitraum: letzte ${popular.days} Tage\n\n` +
    `🎬 Filme\n\n` +
    movieLines +
    `\n\n━━━━━━━━━━━━━━━━━━\n\n` +
    `📺 Serien\n\n` +
    seriesLines +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `🔎 Suche: unbegrenzt\n` +
    `📦 Zum Holen einfach den !hol-Code kopieren.`
  );
}

async function sendPopularLibraryMessage(bot, chatId, replyToMessageId, pgPool) {
  const popular = await getPopularLibraryItems(pgPool, 30, 10);

  await bot.sendMessage(
    chatId,
    buildPopularLibraryMessage(popular).slice(0, 3900),
    {
      reply_to_message_id: replyToMessageId
    }
  );
}

async function handlePopularCommands(bot, msg, pgPool) {
  const text = String(msg.text || "").trim();
  const chatId = msg.chat.id;
  const from = msg.from;

  if (!from || !text) return false;

  const supported =
    text === "!beliebt" ||
    text === "/beliebt" ||
    text === "!top" ||
    text === "/top" ||
    text === "!popular" ||
    text === "/popular";

  if (!supported) return false;

  const userCheck = await requireApprovedUser(pgPool, from.id);

  if (!isAdmin(from.id) && !userCheck.ok) {
    await bot.sendMessage(chatId, userCheck.message, {
      reply_to_message_id: msg.message_id
    });
    return true;
  }

  await sendPopularLibraryMessage(
    bot,
    chatId,
    msg.message_id,
    pgPool
  );

  return true;
}

module.exports = {
  handlePopularCommands,
  sendPopularLibraryMessage,
};