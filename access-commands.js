const {
  isAdmin,
  upsertPendingUser,
  approveUser,
  blockUser,
  getBotUser,
  requireApprovedUser,
  getUsageToday,
  setUserLimit,
  setUserRole,
  getFullUserInfo,
  removeUserAccess,
  getUserStats,
  getUsersByStatus,
} = require("./access-control");

function getAdminNotifyChatIds() {
  const notifyIds = String(process.env.ADMIN_NOTIFY_CHAT_ID || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (notifyIds.length) {
    return notifyIds;
  }

  return String(process.env.ADMIN_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

async function notifyAdminsAboutAccessRequest(bot, user) {
  const adminChatIds = getAdminNotifyChatIds();

  if (!adminChatIds.length) {
    console.log("⚠️ Keine ADMIN_NOTIFY_CHAT_ID oder ADMIN_IDS gesetzt.");
    return;
  }

  const name = [
    user.first_name,
    user.last_name
  ].filter(Boolean).join(" ") || "Unbekannt";

  const username =
    user.username
      ? `@${user.username}`
      : "—";

  const message =
    `🔐 Neue Freischaltungs-Anfrage\n\n` +
    `👤 Name: ${name}\n` +
    `🔗 Username: ${username}\n` +
    `🆔 User-ID: ${user.id}\n\n` +
    `Du kannst den User direkt per Button verwalten.`;

  for (const adminChatId of adminChatIds) {
    try {
      await bot.sendMessage(adminChatId, message, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Freigeben",
                callback_data: `access:approve:${user.id}`
              },
              {
                text: "⛔ Sperren",
                callback_data: `access:block:${user.id}`
              }
            ],
            [
              {
                text: "🗑 Entfernen",
                callback_data: `access:remove:${user.id}`
              }
            ]
          ]
        }
      });
    } catch (err) {
      console.error(
        "❌ Admin-Benachrichtigung fehlgeschlagen:",
        adminChatId,
        err.response?.data || err.message
      );
    }
  }
}

function formatAccessUserName(user) {
  const name = [
    user.first_name,
    user.last_name
  ].filter(Boolean).join(" ");

  if (name) return name;

  if (user.username) return `@${user.username}`;

  return "Unbekannt";
}

function formatAccessUserLine(user, index) {
  const name = formatAccessUserName(user);

  const username =
    user.username
      ? `@${user.username}`
      : "—";

  const searchIcon =
    user.search_enabled
      ? "✅"
      : "❌";

  const downloadIcon =
    user.download_enabled
      ? "✅"
      : "❌";

  return (
    `${index}. 👤 ${name}\n` +
    `   🔗 ${username}\n` +
    `   🆔 ${user.telegram_user_id}\n` +
    `   📌 ${user.status} · 🏷 ${user.role}\n` +
    `   🔎 Suche: ${searchIcon} · 📦 Holen: ${downloadIcon}\n` +
    `   ℹ️ /userinfo ${user.telegram_user_id}`
  );
}

function formatUsersHeader(status, count) {
  const labels = {
    pending: "Offene Anfragen",
    approved: "Freigeschaltete User",
    rejected: "Entfernte User",
    blocked: "Gesperrte User",
    all: "Alle User"
  };

  return (
    `👥 ${labels[status] || "User"}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `Gefunden: ${count}\n\n`
  );
}

function buildUserManagementKeyboard(userId) {
  const id = String(userId);

  return {
    inline_keyboard: [
      [
        {
          text: "⭐ VIP",
          callback_data: `access:setrole:${id}:vip`
        },
        {
          text: "👤 Member",
          callback_data: `access:setrole:${id}:member`
        }
      ],
      [
        {
          text: "🛡 Admin",
          callback_data: `access:setrole:${id}:admin`
        }
      ],
      [
        {
          text: "🗑 Entfernen",
          callback_data: `access:remove:${id}`
        },
        {
          text: "⛔ Sperren",
          callback_data: `access:block:${id}`
        }
      ]
    ]
  };
}

function formatFullUserInfoMessage(user, usage) {
  const name = [
    user.first_name,
    user.last_name
  ].filter(Boolean).join(" ") || "—";

  return (
    `👤 User-Info\n\n` +
    `🆔 ID: ${user.telegram_user_id}\n` +
    `👤 Name: ${name}\n` +
    `🔗 Username: ${user.username ? "@" + user.username : "—"}\n\n` +
    `📌 Status: ${user.status}\n` +
    `🏷 Rolle: ${user.role}\n` +
    `🔎 Suche: ${user.search_enabled ? "✅" : "❌"}\n` +
    `📦 Holen: ${user.download_enabled ? "✅" : "❌"}\n\n` +
    `📊 Nutzung heute\n` +
    `🎬 Filme: ${usage.movie}/${user.daily_movie_limit}\n` +
    `📺 Folgen: ${usage.episode}/${user.daily_episode_limit ?? user.daily_movie_limit}\n` +
    `💿 Staffeln: ${usage.season}/${user.daily_season_limit}\n` +
    `🗂 Serien: ${usage.series_all}/${user.daily_series_limit}`
  );
}

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
    `Ein Admin wurde benachrichtigt.`,
  { reply_to_message_id: msg.message_id }
);

await notifyAdminsAboutAccessRequest(bot, from);

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
  `📺 Einzelne Folgen: ${usage.episode}/${user.daily_episode_limit ?? user.daily_movie_limit}\n` +
  `💿 Staffeln: ${usage.season}/${user.daily_season_limit}\n` +
  `🗂 Ganze Serien: ${usage.series_all}/${user.daily_series_limit}\n\n` +
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
  
    // User entfernen, aber nicht dauerhaft sperren
  if (text.startsWith("/entfernen ")) {
    if (!isAdmin(from.id)) {
      await bot.sendMessage(chatId, "⛔ Nur Admins können User entfernen.", {
        reply_to_message_id: msg.message_id,
      });
      return true;
    }

    const targetId = text.split(/\s+/)[1]?.trim();

    if (!targetId || !/^\d+$/.test(targetId)) {
      await bot.sendMessage(chatId, "❌ Nutzung:\n/entfernen USER_ID", {
        reply_to_message_id: msg.message_id,
      });
      return true;
    }

    const removed = await removeUserAccess(pgPool, targetId);

    if (!removed.ok) {
      await bot.sendMessage(chatId, removed.message, {
        reply_to_message_id: msg.message_id,
      });
      return true;
    }

    await bot.sendMessage(
      chatId,
      `✅ Zugriff entfernt.\n\n` +
        `🆔 User: ${targetId}\n` +
        `📌 Status: rejected\n` +
        `🔎 Suche: ❌\n` +
        `📦 Holen: ❌\n\n` +
        `Der User ist nicht gesperrt und kann später wieder !freischaltung senden.`,
      {
        reply_to_message_id: msg.message_id,
      }
    );

    try {
      await bot.sendMessage(
        targetId,
        `ℹ️ Dein Zugriff auf den Bot wurde entfernt.\n\n` +
          `Du wurdest nicht gesperrt.\n` +
          `Wenn du erneut Zugriff möchtest, kannst du wieder schreiben:\n\n` +
          `!freischaltung`
      );
    } catch (err) {
      console.error(
        "⚠️ Konnte entfernten User nicht benachrichtigen:",
        targetId,
        err.response?.data || err.message
      );
    }

    return true;
  }
  
    // User-Übersicht / User-Listen
  if (text === "/users" || text.startsWith("/users ")) {
    if (!isAdmin(from.id)) {
      await bot.sendMessage(chatId, "⛔ Nur Admins können die User-Liste abrufen.", {
        reply_to_message_id: msg.message_id,
      });
      return true;
    }

    const parts = text.trim().split(/\s+/);
    const filter = parts[1];

    if (!filter) {
      const stats = await getUserStats(pgPool);

      await bot.sendMessage(
        chatId,
        `👥 User-Übersicht\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `📊 Gesamt: ${stats.total}\n\n` +
          `🕓 Offen: ${stats.pending}\n` +
          `✅ Freigeschaltet: ${stats.approved}\n` +
          `🗑 Entfernt: ${stats.rejected}\n` +
          `⛔ Gesperrt: ${stats.blocked}\n\n` +
          `🏷 Rollen\n` +
          `👤 Member: ${stats.member}\n` +
          `⭐ VIP: ${stats.vip}\n` +
          `🛡 Admin: ${stats.admin}\n\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `Listen anzeigen:\n` +
          `/users pending\n` +
          `/users approved\n` +
          `/users rejected\n` +
          `/users blocked\n` +
          `/users all`,
        {
          reply_to_message_id: msg.message_id,
        }
      );

      return true;
    }

    const result = await getUsersByStatus(pgPool, filter, 30);

    if (!result.ok) {
      await bot.sendMessage(
        chatId,
        `❌ Unbekannter User-Filter.\n\n` +
          `Erlaubt sind:\n` +
          `/users pending\n` +
          `/users approved\n` +
          `/users rejected\n` +
          `/users blocked\n` +
          `/users all`,
        {
          reply_to_message_id: msg.message_id,
        }
      );

      return true;
    }

    const users = result.users || [];

    if (!users.length) {
      await bot.sendMessage(
        chatId,
        formatUsersHeader(result.status, 0) +
          `Keine Einträge vorhanden.`,
        {
          reply_to_message_id: msg.message_id,
        }
      );

      return true;
    }

    const body = users
      .map((user, index) => formatAccessUserLine(user, index + 1))
      .join("\n\n");

    const message =
      formatUsersHeader(result.status, users.length) +
      body +
      `\n\n━━━━━━━━━━━━━━━━━━\n` +
      `Maximal 30 Einträge pro Liste.`;

    await bot.sendMessage(
      chatId,
      message.slice(0, 3900),
      {
        reply_to_message_id: msg.message_id,
      }
    );

    return true;
  }
  
    // User-Info anzeigen
  if (text.startsWith("/userinfo ")) {
    if (!isAdmin(from.id)) {
      await bot.sendMessage(chatId, "⛔ Nur Admins können User-Infos abrufen.", {
        reply_to_message_id: msg.message_id,
      });
      return true;
    }

    const targetId = text.split(/\s+/)[1]?.trim();

    if (!targetId || !/^\d+$/.test(targetId)) {
      await bot.sendMessage(chatId, "❌ Nutzung:\n/userinfo USER_ID", {
        reply_to_message_id: msg.message_id,
      });
      return true;
    }

    const info = await getFullUserInfo(pgPool, targetId);

    if (!info) {
      await bot.sendMessage(chatId, `❌ User ${targetId} wurde nicht gefunden.`, {
        reply_to_message_id: msg.message_id,
      });
      return true;
    }

    const user = info.user;
const usage = info.usage;

await bot.sendMessage(
  chatId,
  formatFullUserInfoMessage(user, usage),
  {
    reply_to_message_id: msg.message_id,
    reply_markup: buildUserManagementKeyboard(user.telegram_user_id)
  }
);

return true;
      chatId,
      `👤 User-Info\n\n` +
        `🆔 ID: ${user.telegram_user_id}\n` +
        `👤 Name: ${name}\n` +
        `🔗 Username: ${user.username ? "@" + user.username : "—"}\n\n` +
        `📌 Status: ${user.status}\n` +
        `🏷 Rolle: ${user.role}\n` +
        `🔎 Suche: ${user.search_enabled ? "✅" : "❌"}\n` +
        `📦 Holen: ${user.download_enabled ? "✅" : "❌"}\n\n` +
        `📊 Nutzung heute\n` +
        `🎬 Filme: ${usage.movie}/${user.daily_movie_limit}\n` +
        `📺 Folgen: ${usage.episode}/${user.daily_episode_limit ?? user.daily_movie_limit}\n` +
        `💿 Staffeln: ${usage.season}/${user.daily_season_limit}\n` +
        `🗂 Serien: ${usage.series_all}/${user.daily_series_limit}`,
      {
        reply_to_message_id: msg.message_id,
      }
    );

    return true;
  }

  // Limit setzen
  if (text.startsWith("/setlimit ")) {
    if (!isAdmin(from.id)) {
      await bot.sendMessage(chatId, "⛔ Nur Admins können Limits ändern.", {
        reply_to_message_id: msg.message_id,
      });
      return true;
    }

    const parts = text.trim().split(/\s+/);

    const targetId = parts[1];
    const limitType = parts[2];
    const limitValue = parts[3];

    if (!targetId || !limitType || limitValue === undefined || !/^\d+$/.test(targetId)) {
      await bot.sendMessage(
        chatId,
        `❌ Nutzung:\n\n` +
          `/setlimit USER_ID filme 3\n` +
          `/setlimit USER_ID folgen 3\n` +
          `/setlimit USER_ID staffeln 1\n` +
          `/setlimit USER_ID serien 0`,
        {
          reply_to_message_id: msg.message_id,
        }
      );
      return true;
    }

    const updated = await setUserLimit(
      pgPool,
      targetId,
      limitType,
      limitValue
    );

    if (!updated.ok) {
      await bot.sendMessage(chatId, updated.message, {
        reply_to_message_id: msg.message_id,
      });
      return true;
    }

    await bot.sendMessage(
      chatId,
      `✅ Limit aktualisiert.\n\n` +
        `🆔 User: ${targetId}\n` +
        `📌 Bereich: ${updated.label}\n` +
        `📊 Neues Limit: ${updated.value}`,
      {
        reply_to_message_id: msg.message_id,
      }
    );

    return true;
  }

  // Rolle setzen
  if (text.startsWith("/setrole ")) {
    if (!isAdmin(from.id)) {
      await bot.sendMessage(chatId, "⛔ Nur Admins können Rollen ändern.", {
        reply_to_message_id: msg.message_id,
      });
      return true;
    }

    const parts = text.trim().split(/\s+/);

    const targetId = parts[1];
    const role = parts[2];

    if (!targetId || !role || !/^\d+$/.test(targetId)) {
      await bot.sendMessage(
        chatId,
        `❌ Nutzung:\n\n` +
          `/setrole USER_ID member\n` +
          `/setrole USER_ID vip\n` +
          `/setrole USER_ID admin`,
        {
          reply_to_message_id: msg.message_id,
        }
      );
      return true;
    }

    const updated = await setUserRole(pgPool, targetId, role);

    if (!updated.ok) {
      await bot.sendMessage(chatId, updated.message, {
        reply_to_message_id: msg.message_id,
      });
      return true;
    }

    const user = updated.user;

    await bot.sendMessage(
      chatId,
      `✅ Rolle aktualisiert.\n\n` +
        `🆔 User: ${targetId}\n` +
        `🏷 Neue Rolle: ${user.role}\n\n` +
        `🎬 Filme: ${user.daily_movie_limit}\n` +
        `📺 Folgen: ${user.daily_episode_limit ?? user.daily_movie_limit}\n` +
        `💿 Staffeln: ${user.daily_season_limit}\n` +
        `🗂 Serien: ${user.daily_series_limit}`,
      {
        reply_to_message_id: msg.message_id,
      }
    );

    return true;
  }

  return false;
}

async function handleAccessCallback(bot, callback, pgPool) {
  const data = callback.data || "";

  if (!data.startsWith("access:")) {
    return false;
  }

  const from = callback.from;

  if (!from || !isAdmin(from.id)) {
    await bot.answerCallbackQuery(callback.id, {
      text: "⛔ Nur Admins dürfen das.",
      show_alert: true
    });
    return true;
  }

  const parts = data.split(":");
  const action = parts[1];
  const targetId = parts[2];

  if (!targetId || !/^\d+$/.test(targetId)) {
    await bot.answerCallbackQuery(callback.id, {
      text: "❌ Ungültige User-ID.",
      show_alert: true
    });
    return true;
  }

  const chatId = callback.message?.chat?.id;
  const messageId = callback.message?.message_id;
  
    // Selbstschutz: Admin soll sich nicht aus Versehen selbst sperren/entfernen
  if (
    String(targetId) === String(from.id) &&
    (action === "block" || action === "remove")
  ) {
    await bot.answerCallbackQuery(callback.id, {
      text: "⚠️ Du kannst dich nicht selbst sperren oder entfernen.",
      show_alert: true
    });
    return true;
  }

  // Rolle per Button ändern
  if (action === "setrole") {
    const role = parts[3];

    if (!["member", "vip", "admin"].includes(role)) {
      await bot.answerCallbackQuery(callback.id, {
        text: "❌ Ungültige Rolle.",
        show_alert: true
      });
      return true;
    }

    const updated = await setUserRole(pgPool, targetId, role);

    if (!updated.ok) {
      await bot.answerCallbackQuery(callback.id, {
        text: updated.message || "❌ Rolle konnte nicht geändert werden.",
        show_alert: true
      });
      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: `✅ Rolle geändert: ${role}`
    });

    const info = await getFullUserInfo(pgPool, targetId);

    if (info && chatId && messageId) {
      await bot.editMessageText(
        chatId,
        messageId,
        formatFullUserInfoMessage(info.user, info.usage),
        {
          reply_markup: buildUserManagementKeyboard(targetId)
        }
      );
    }

    try {
      await bot.sendMessage(
        targetId,
        `ℹ️ Deine Rolle wurde geändert.\n\n` +
          `🏷 Neue Rolle: ${role}\n\n` +
          `Dein aktuelles Limit siehst du mit:\n` +
          `!meinlimit`
      );
    } catch (err) {
      console.error(
        "⚠️ Konnte User über Rollenänderung nicht benachrichtigen:",
        targetId,
        err.response?.data || err.message
      );
    }

    return true;
  }

  if (action === "approve") {
    const user = await approveUser(pgPool, targetId, from.id);

    if (!user) {
      await bot.answerCallbackQuery(callback.id, {
        text: "❌ User wurde nicht gefunden.",
        show_alert: true
      });
      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: "✅ User freigegeben."
    });

    if (chatId && messageId) {
      await bot.editMessageText(
        chatId,
        messageId,
        `✅ Freischaltung erledigt.\n\n` +
          `🆔 User: ${targetId}\n` +
          `📌 Status: approved\n` +
          `🔎 Suche: ✅\n` +
          `📦 Holen: ✅`
      );
    }

    try {
      await bot.sendMessage(
        targetId,
        `✅ Du wurdest freigeschaltet.\n\n` +
          `Du kannst jetzt suchen mit:\n` +
          `!suche TITEL\n\n` +
          `Dein Limit siehst du mit:\n` +
          `!meinlimit`
      );
    } catch (err) {
      console.error(
        "⚠️ Konnte freigegebenen User nicht benachrichtigen:",
        targetId,
        err.response?.data || err.message
      );
    }

    return true;
  }

  if (action === "block") {
    const user = await blockUser(pgPool, targetId);

    if (!user) {
      await bot.answerCallbackQuery(callback.id, {
        text: "❌ User wurde nicht gefunden.",
        show_alert: true
      });
      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: "⛔ User gesperrt."
    });

    if (chatId && messageId) {
      await bot.editMessageText(
        chatId,
        messageId,
        `⛔ User gesperrt.\n\n` +
          `🆔 User: ${targetId}\n` +
          `📌 Status: blocked\n` +
          `🔎 Suche: ❌\n` +
          `📦 Holen: ❌`
      );
    }

    try {
      await bot.sendMessage(
        targetId,
        `⛔ Deine Freischaltungs-Anfrage wurde abgelehnt.\n\n` +
          `Dein Zugriff wurde gesperrt.`
      );
    } catch (err) {
      console.error(
        "⚠️ Konnte gesperrten User nicht benachrichtigen:",
        targetId,
        err.response?.data || err.message
      );
    }

    return true;
  }

  if (action === "remove") {
    const removed = await removeUserAccess(pgPool, targetId);

    if (!removed.ok) {
      await bot.answerCallbackQuery(callback.id, {
        text: removed.message || "❌ User wurde nicht gefunden.",
        show_alert: true
      });
      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: "🗑 Zugriff entfernt."
    });

    if (chatId && messageId) {
      await bot.editMessageText(
        chatId,
        messageId,
        `🗑 Zugriff entfernt.\n\n` +
          `🆔 User: ${targetId}\n` +
          `📌 Status: rejected\n` +
          `🔎 Suche: ❌\n` +
          `📦 Holen: ❌\n\n` +
          `Der User kann später wieder !freischaltung senden.`
      );
    }

    try {
      await bot.sendMessage(
        targetId,
        `ℹ️ Dein Zugriff auf den Bot wurde entfernt.\n\n` +
          `Du wurdest nicht dauerhaft gesperrt.\n` +
          `Du kannst später erneut eine Anfrage senden mit:\n\n` +
          `!freischaltung`
      );
    } catch (err) {
      console.error(
        "⚠️ Konnte entfernten User nicht benachrichtigen:",
        targetId,
        err.response?.data || err.message
      );
    }

    return true;
  }

  await bot.answerCallbackQuery(callback.id, {
    text: "❌ Unbekannte Aktion.",
    show_alert: true
  });

  return true;
}

module.exports = {
  handleAccessCommands,
  handleAccessCallback,
};