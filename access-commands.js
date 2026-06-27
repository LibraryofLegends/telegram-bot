const {
  isAdmin,
  upsertPendingUser,
  approveUser,
  blockUser,
  getBotUser,
  requireApprovedUser,
  getUsageToday,
} = require("./access-control");

async function handleAccessCommands(bot, msg, pgPool) {
  const text = msg.text || "";
  const chatId = msg.chat.id;
  const from = msg.from;

  if (!from) return false;

  // Eigene Telegram-ID anzeigen
  if (text === "!id" || text === "/id") {
    await bot.sendMessage(
      chatId,
      `🆔 Deine Telegram-ID:\n\n${from.id}`,
      { reply_to_message_id: msg.message_id }
    );
    return true;
  }

  // Freischaltung beantragen
  if (text === "!freischaltung" || text === "/freischaltung") {
    const user = await upsertPendingUser(pgPool, from);

    if (user.status === "approved") {
      await bot.sendMessage(
        chatId,
        "✅ Du bist bereits freigeschaltet.",
        { reply_to_message_id: msg.message_id }
      );
      return true;
    }

    if (user.status === "blocked") {
      await bot.sendMessage(
        chatId,
        "⛔ Dein Zugriff wurde gesperrt.",
        { reply_to_message_id: msg.message_id }
      );
      return true;
    }

    await bot.sendMessage(
      chatId,
      `✅ Freischaltungs-Anfrage wurde gespeichert.\n\n` +
        `Ein Admin kann dich freigeben mit:\n` +
        `/freigeben ${from.id}`,
      { reply_to_message_id: msg.message_id }
    );

    return true;
  }

  // Mein Limit anzeigen
  if (text === "!meinlimit" || text === "/meinlimit") {
    const access = await requireApprovedUser(pgPool, from.id);

    if (!access.ok) {
      await bot.sendMessage(chatId, access.message, {
        reply_to_message_id: msg.message_id,
      });
      return true;
    }

    const usage = await getUsageToday(pgPool, from.id);
    const user = access.user;

    const message =
      `📊 Dein Tageslimit\n\n` +
      `🎬 Filme: ${usage.movie}/${user.daily_movie_limit}\n` +
      `📀 Staffeln: ${usage.season}/${user.daily_season_limit}\n` +
      `📺 Ganze Serien: ${usage.series_all}/${user.daily_series_limit}\n\n` +
      `🔎 Suche: unbegrenzt`;

    await bot.sendMessage(chatId, message, {
      reply_to_message_id: msg.message_id,
    });

    return true;
  }

  // User freigeben
  if (text.startsWith("/freigeben ")) {
    if (!isAdmin(from.id)) {
      await bot.sendMessage(chatId, "⛔ Nur Admins können User freigeben.", {
        reply_to_message_id: msg.message_id,
      });
      return true;
    }

    const targetId = text.split(" ")[1]?.trim();

    if (!targetId || !/^\d+$/.test(targetId)) {
      await bot.sendMessage(chatId, "❌ Nutzung:\n/freigeben USER_ID", {
        reply_to_message_id: msg.message_id,
      });
      return true;
    }

    const approved = await approveUser(pgPool, targetId, from.id);

    if (!approved) {
      await bot.sendMessage(
        chatId,
        `❌ Kein Antrag für User-ID ${targetId} gefunden.\n\nDer User soll zuerst !freischaltung senden.`,
        { reply_to_message_id: msg.message_id }
      );
      return true;
    }

    await bot.sendMessage(
      chatId,
      `✅ User wurde freigegeben.\n\n` +
        `ID: ${targetId}\n` +
        `Rolle: ${approved.role}\n` +
        `Limit: ${approved.daily_movie_limit} Filme / ${approved.daily_season_limit} Staffel pro Tag`,
      { reply_to_message_id: msg.message_id }
    );

    return true;
  }

  // User sperren
  if (text.startsWith("/sperren ")) {
    if (!isAdmin(from.id)) {
      await bot.sendMessage(chatId, "⛔ Nur Admins können User sperren.", {
        reply_to_message_id: msg.message_id,
      });
      return true;
    }

    const targetId = text.split(" ")[1]?.trim();

    if (!targetId || !/^\d+$/.test(targetId)) {
      await bot.sendMessage(chatId, "❌ Nutzung:\n/sperren USER_ID", {
        reply_to_message_id: msg.message_id,
      });
      return true;
    }

    const blocked = await blockUser(pgPool, targetId);

    if (!blocked) {
      await bot.sendMessage(chatId, `❌ User-ID ${targetId} wurde nicht gefunden.`, {
        reply_to_message_id: msg.message_id,
      });
      return true;
    }

    await bot.sendMessage(chatId, `⛔ User wurde gesperrt.\n\nID: ${targetId}`, {
      reply_to_message_id: msg.message_id,
    });

    return true;
  }

  return false;
}

module.exports = {
  handleAccessCommands,
};