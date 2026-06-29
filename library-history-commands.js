const {
  isAdmin,
  requireApprovedUser,
} = require("./access-control");

function pad2(value) {
  return String(value || 0).padStart(2, "0");
}

function formatDateTime(value) {
  if (!value) return "Unbekannt";

  try {
    return new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

async function getHistoryRows(pgPool, telegramUserId, limit = 20) {
  const cleanLimit =
    Math.max(1, Math.min(Number(limit) || 20, 50));

  const result = await pgPool.query(
    `
    SELECT
      l.id,
      l.telegram_user_id,
      l.action_type,
      l.item_id,
      l.usage_date,
      l.created_at,

      m.id AS movie_db_id,
      m.title AS movie_title,
      m.year AS movie_year,
      m.library_id AS movie_library_id,

      s.id AS episode_db_id,
      s.series_title,
      s.season,
      s.episode,
      s.episode_title,
      s.series_library_id

    FROM bot_usage_logs l

    LEFT JOIN movies m
      ON l.action_type = 'movie'
      AND m.id::text = l.item_id::text

    LEFT JOIN series s
      ON l.action_type = 'episode'
      AND s.id::text = l.item_id::text

    WHERE l.telegram_user_id = $1

    ORDER BY
      l.created_at DESC NULLS LAST,
      l.id DESC

    LIMIT $2;
    `,
    [
      telegramUserId,
      cleanLimit
    ]
  );

  return result.rows || [];
}

function formatHistoryLine(row, index) {
  const date =
    formatDateTime(row.created_at);

  if (row.action_type === "movie") {
    const movieTitle =
      row.movie_title ||
      row.item_id ||
      "Unbekannter Film";

    const label =
      row.movie_library_id ||
      row.movie_db_id ||
      row.item_id;

    return (
      `${index}. 🎬 ${movieTitle}${row.movie_year ? ` (${row.movie_year})` : ""}\n` +
      `   🆔 ${label}\n` +
      `   🕘 ${date}\n` +
      `   !hol movie ${row.movie_db_id || row.item_id}`
    );
  }

  if (row.action_type === "episode") {
    const seriesTitle =
      row.series_title ||
      "Unbekannte Serie";

    const season =
      Number(row.season || 0);

    const episode =
      Number(row.episode || 0);

    const seriesRef =
      row.series_library_id ||
      row.series_title ||
      row.item_id;

    return (
      `${index}. 📺 ${seriesTitle} S${pad2(season)}E${pad2(episode)}\n` +
      `   ${row.episode_title ? `🎞 ${row.episode_title}\n` : ""}` +
      `   🕘 ${date}\n` +
      `   !hol serie ${seriesRef} s${season}e${episode}`
    );
  }

  if (row.action_type === "season") {
    return (
      `${index}. 💿 Staffel geholt\n` +
      `   📺 ${row.item_id || "Unbekannt"}\n` +
      `   🕘 ${date}`
    );
  }

  if (row.action_type === "series_all") {
    return (
      `${index}. 🗂 Ganze Serie geholt\n` +
      `   📺 ${row.item_id || "Unbekannt"}\n` +
      `   🕘 ${date}`
    );
  }

  return (
    `${index}. 📦 ${row.action_type}\n` +
    `   🆔 ${row.item_id || "Unbekannt"}\n` +
    `   🕘 ${date}`
  );
}

function buildHistoryMessage(rows, title = "🕘 Dein Hol-Verlauf") {
  if (!rows.length) {
    return (
      `${title}\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Noch keine Einträge vorhanden.`
    );
  }

  return (
    `${title}\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    rows.map(formatHistoryLine).join("\n\n") +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Maximal 20 letzte Einträge.`
  );
}

async function sendUserHistoryMessage(
  bot,
  chatId,
  replyToMessageId,
  pgPool,
  telegramUserId,
  title = "🕘 Dein Hol-Verlauf"
) {
  const rows = await getHistoryRows(pgPool, telegramUserId, 20);

  await bot.sendMessage(
    chatId,
    buildHistoryMessage(rows, title).slice(0, 3900),
    {
      reply_to_message_id: replyToMessageId
    }
  );
}

async function handleHistoryCommands(bot, msg, pgPool) {
  const text =
    String(msg.text || "").trim();

  const chatId =
    msg.chat.id;

  const from =
    msg.from;

  if (!from || !text) return false;

  const isOwnHistoryCommand =
    text === "!verlauf" ||
    text === "/verlauf" ||
    text === "!history" ||
    text === "/history";

  const isAdminHistoryCommand =
    text.startsWith("/usage ") ||
    text.startsWith("/userverlauf ");

  if (!isOwnHistoryCommand && !isAdminHistoryCommand) {
    return false;
  }

  if (isOwnHistoryCommand) {
    const userCheck = await requireApprovedUser(pgPool, from.id);

    if (!isAdmin(from.id) && !userCheck.ok) {
      await bot.sendMessage(chatId, userCheck.message, {
        reply_to_message_id: msg.message_id
      });
      return true;
    }

    await sendUserHistoryMessage(
      bot,
      chatId,
      msg.message_id,
      pgPool,
      from.id
    );

    return true;
  }

  if (isAdminHistoryCommand) {
    if (!isAdmin(from.id)) {
      await bot.sendMessage(
        chatId,
        "⛔ Nur Admins können fremde Verläufe abrufen.",
        {
          reply_to_message_id: msg.message_id
        }
      );
      return true;
    }

    const targetId =
      text.split(/\s+/)[1]?.trim();

    if (!targetId || !/^\d+$/.test(targetId)) {
      await bot.sendMessage(
        chatId,
        `❌ Nutzung:\n/usage USER_ID\n/userverlauf USER_ID`,
        {
          reply_to_message_id: msg.message_id
        }
      );
      return true;
    }

    await sendUserHistoryMessage(
      bot,
      chatId,
      msg.message_id,
      pgPool,
      targetId,
      `🕘 Hol-Verlauf von ${targetId}`
    );

    return true;
  }

  return false;
}

module.exports = {
  handleHistoryCommands,
  sendUserHistoryMessage,
};