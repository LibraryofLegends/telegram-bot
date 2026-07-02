const {
  isAdmin,
} = require("./access-control");

async function safeResetCount(pgPool, sql, params = []) {
  try {
    const result =
      await pgPool.query(sql, params);

    return Number(result.rows[0]?.count || 0);
  } catch (err) {
    console.error("❌ Reset preview count error:", err.message);
    return null;
  }
}

function formatResetCount(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  return Number(value || 0).toLocaleString("de-DE");
}

async function getResetPreviewStats(pgPool) {
  const [
    movies,
    seriesEpisodes,
    seriesGroups,
    seriesLibrary,
    topics,
    movieTopics,
    seriesTopics,
    userFavorites,
    deletedItems,
    editLogs,
    usageLogs,
    users,
    settings
  ] = await Promise.all([
    safeResetCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM movies;
      `
    ),

    safeResetCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM series;
      `
    ),

    safeResetCount(
      pgPool,
      `
      WITH grouped AS (
        SELECT
          COALESCE(series_library_id::text, LOWER(series_title)) AS series_key
        FROM series
        WHERE series_title IS NOT NULL
          AND TRIM(series_title) <> ''
        GROUP BY
          COALESCE(series_library_id::text, LOWER(series_title))
      )
      SELECT COUNT(*)::int AS count
      FROM grouped;
      `
    ),

    safeResetCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM series_library;
      `
    ),

    safeResetCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM topics;
      `
    ),

    safeResetCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM topics
      WHERE type ILIKE '%movie%'
         OR type ILIKE '%film%';
      `
    ),

    safeResetCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM topics
      WHERE type ILIKE '%series%'
         OR type ILIKE '%serie%';
      `
    ),

    safeResetCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM user_favorites;
      `
    ),

    safeResetCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM deleted_library_items;
      `
    ),

    safeResetCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM library_edit_logs;
      `
    ),

    safeResetCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM bot_usage_logs;
      `
    ),

    safeResetCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM bot_users;
      `
    ),

    safeResetCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM bot_settings;
      `
    )
  ]);

  return {
    movies,
    seriesEpisodes,
    seriesGroups,
    seriesLibrary,
    topics,
    movieTopics,
    seriesTopics,
    userFavorites,
    deletedItems,
    editLogs,
    usageLogs,
    users,
    settings
  };
}

function buildResetPreviewText(stats) {
  return (
    `🧨 Reset-Preview\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Diese Vorschau löscht nichts.\n` +
    `Sie zeigt nur, was beim späteren Archiv-Reset betroffen wäre.\n\n` +

    `Würde beim Archiv-Neuaufbau gelöscht werden:\n\n` +
    `🎬 Filme: ${formatResetCount(stats.movies)}\n` +
    `📺 Serienbereiche: ${formatResetCount(stats.seriesGroups)}\n` +
    `🎞 Serienfolgen: ${formatResetCount(stats.seriesEpisodes)}\n` +
    `📚 Serien-Library: ${formatResetCount(stats.seriesLibrary)}\n` +
    `🏷 Topics gesamt: ${formatResetCount(stats.topics)}\n` +
    `   🎬 Film-Topics: ${formatResetCount(stats.movieTopics)}\n` +
    `   📺 Serien-Topics: ${formatResetCount(stats.seriesTopics)}\n\n` +

    `Sollte beim sauberen Neustart ebenfalls geleert werden:\n\n` +
    `⭐ Merklisten: ${formatResetCount(stats.userFavorites)}\n` +
    `🗑 Papierkorb: ${formatResetCount(stats.deletedItems)}\n` +
    `🧾 Bearbeitungs-Logs: ${formatResetCount(stats.editLogs)}\n\n` +

    `Bleibt erhalten:\n\n` +
    `👥 User / Freischaltungen: ${formatResetCount(stats.users)}\n` +
    `⚙️ Bot-Einstellungen: ${formatResetCount(stats.settings)}\n` +
    `📊 Nutzungs-Logs: ${formatResetCount(stats.usageLogs)}\n` +
    `🛠 Adminrechte bleiben über deine Admin-ID erhalten.\n\n` +

    `━━━━━━━━━━━━━━━━━━\n` +
    `Nächster Schritt später:\n` +
    `/resetarchive preview\n\n` +
    `Erst danach bauen wir einen echten Confirm-Befehl.`
  );
}

async function handleResetCommands(bot, msg, pgPool) {
  const text =
    String(msg.text || "").trim();

  const lower =
    text.toLowerCase();

  const from =
    msg.from;

  const chatId =
    msg.chat?.id;

  if (!text || !from || !chatId) {
    return false;
  }

  const isResetPreviewCommand =
    lower === "/resetpreview" ||
    lower === "!resetpreview" ||
    lower === "/reset preview" ||
    lower === "!reset preview" ||
    lower === "/resetarchive preview" ||
    lower === "!resetarchive preview" ||
    lower === "/neuaufbau preview" ||
    lower === "!neuaufbau preview";

  if (!isResetPreviewCommand) {
    return false;
  }

  if (!isAdmin(from.id)) {
    await bot.sendMessage(
      chatId,
      "⛔ Nur Admins können die Reset-Vorschau sehen.",
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  const stats =
    await getResetPreviewStats(pgPool);

  await bot.sendMessage(
    chatId,
    buildResetPreviewText(stats).slice(0, 3900),
    {
      reply_to_message_id: msg.message_id
    }
  );

  return true;
}

module.exports = {
  handleResetCommands,
  getResetPreviewStats,
  buildResetPreviewText,
};