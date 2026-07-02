const {
  isAdmin,
} = require("./access-control");

const {
  getMaintenanceMode,
} = require("./maintenance-commands");

const RESET_CONFIRM_PHRASE =
  "ICH WILL DAS ARCHIV ZURUECKSETZEN";

const RESET_TABLES = [
  "user_favorites",
  "deleted_library_items",
  "library_edit_logs",
  "movies",
  "series",
  "series_library",
  "topics",
];

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

async function tableExists(pgPool, tableName) {
  const result = await pgPool.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
    ) AS exists;
    `,
    [
      tableName
    ]
  );

  return result.rows[0]?.exists === true;
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
    `Echter Reset nur mit:\n\n` +
    `/maintenance on\n` +
    `/resetarchive confirm ${RESET_CONFIRM_PHRASE}`
  );
}

function buildResetHelpText() {
  return (
    `🧨 Archiv-Reset\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Verfügbare Befehle:\n\n` +
    `/resetpreview\n` +
    `/resetarchive preview\n\n` +
    `Echter Reset:\n\n` +
    `/maintenance on\n` +
    `/resetarchive confirm ${RESET_CONFIRM_PHRASE}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `Der echte Reset ist absichtlich gesichert und funktioniert nur im Wartungsmodus.`
  );
}

function buildResetBlockedText(reason) {
  return (
    `🧨 Archiv-Reset blockiert\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `${reason}\n\n` +
    `Sichere Reihenfolge:\n\n` +
    `1. /resetarchive preview\n` +
    `2. /maintenance on\n` +
    `3. /resetarchive confirm ${RESET_CONFIRM_PHRASE}`
  );
}

async function runArchiveReset(pgPool) {
  const before =
    await getResetPreviewStats(pgPool);

  const truncated = [];
  const skipped = [];

  for (const tableName of RESET_TABLES) {
    const exists =
      await tableExists(pgPool, tableName);

    if (!exists) {
      skipped.push(tableName);
      continue;
    }

    await pgPool.query(
      `TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE;`
    );

    truncated.push(tableName);
  }

  const after =
    await getResetPreviewStats(pgPool);

  return {
    before,
    after,
    truncated,
    skipped
  };
}

function buildResetDoneText(result) {
  return (
    `✅ Archiv-Reset abgeschlossen\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Geleerte Tabellen:\n\n` +
    (
      result.truncated.length
        ? result.truncated.map((name) => `• ${name}`).join("\n")
        : "Keine Tabellen geleert."
    ) +
    `\n\n` +
    (
      result.skipped.length
        ? `Nicht gefunden / übersprungen:\n${result.skipped.map((name) => `• ${name}`).join("\n")}\n\n`
        : ""
    ) +
    `Vorher:\n\n` +
    `🎬 Filme: ${formatResetCount(result.before.movies)}\n` +
    `📺 Serienbereiche: ${formatResetCount(result.before.seriesGroups)}\n` +
    `🎞 Folgen: ${formatResetCount(result.before.seriesEpisodes)}\n` +
    `🏷 Topics: ${formatResetCount(result.before.topics)}\n\n` +
    `Nachher:\n\n` +
    `🎬 Filme: ${formatResetCount(result.after.movies)}\n` +
    `📺 Serienbereiche: ${formatResetCount(result.after.seriesGroups)}\n` +
    `🎞 Folgen: ${formatResetCount(result.after.seriesEpisodes)}\n` +
    `🏷 Topics: ${formatResetCount(result.after.topics)}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `Wartungsmodus bitte erst ausschalten, wenn der Neuaufbau bereit ist:\n\n` +
    `/maintenance off`
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

  const isResetCommand =
    lower.startsWith("/resetpreview") ||
    lower.startsWith("!resetpreview") ||
    lower.startsWith("/reset preview") ||
    lower.startsWith("!reset preview") ||
    lower.startsWith("/resetarchive") ||
    lower.startsWith("!resetarchive") ||
    lower.startsWith("/neuaufbau");

  if (!isResetCommand) {
    return false;
  }

  if (!isAdmin(from.id)) {
    await bot.sendMessage(
      chatId,
      "⛔ Nur Admins können Reset-Befehle nutzen.",
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  const isPreview =
    lower === "/resetpreview" ||
    lower === "!resetpreview" ||
    lower === "/reset preview" ||
    lower === "!reset preview" ||
    lower === "/resetarchive preview" ||
    lower === "!resetarchive preview" ||
    lower === "/neuaufbau preview" ||
    lower === "!neuaufbau preview";

  if (isPreview) {
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

  const exactConfirmCommand =
    `/resetarchive confirm ${RESET_CONFIRM_PHRASE}`.toLowerCase();

  const exactConfirmBangCommand =
    `!resetarchive confirm ${RESET_CONFIRM_PHRASE}`.toLowerCase();

  const isExactConfirm =
    lower === exactConfirmCommand ||
    lower === exactConfirmBangCommand;

  if (lower.startsWith("/resetarchive confirm") || lower.startsWith("!resetarchive confirm")) {
    if (!isExactConfirm) {
      await bot.sendMessage(
        chatId,
        buildResetBlockedText(
          `Der Confirm-Satz stimmt nicht exakt.\n\nErwartet:\n/resetarchive confirm ${RESET_CONFIRM_PHRASE}`
        ),
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    const maintenanceActive =
      await getMaintenanceMode(pgPool);

    if (!maintenanceActive) {
      await bot.sendMessage(
        chatId,
        buildResetBlockedText(
          `Der Wartungsmodus ist AUS.\n\nAktiviere zuerst:\n/maintenance on`
        ),
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    await bot.sendMessage(
      chatId,
      `🧨 Archiv-Reset startet jetzt.\n\nBitte warten...`,
      {
        reply_to_message_id: msg.message_id
      }
    );

    const result =
      await runArchiveReset(pgPool);

    await bot.sendMessage(
      chatId,
      buildResetDoneText(result).slice(0, 3900),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

  await bot.sendMessage(
    chatId,
    buildResetHelpText(),
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