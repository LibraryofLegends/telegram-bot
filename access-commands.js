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

const { sendUserHistoryMessage } = require("./library-history-commands");

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
          text: "🎬 Filme +1",
          callback_data: `access:limit:${id}:filme:1`
        },
        {
          text: "🎬 Filme -1",
          callback_data: `access:limit:${id}:filme:-1`
        }
      ],
      [
        {
          text: "📺 Folgen +1",
          callback_data: `access:limit:${id}:folgen:1`
        },
        {
          text: "📺 Folgen -1",
          callback_data: `access:limit:${id}:folgen:-1`
        }
      ],
      [
        {
          text: "💿 Staffeln +1",
          callback_data: `access:limit:${id}:staffeln:1`
        },
        {
          text: "💿 Staffeln -1",
          callback_data: `access:limit:${id}:staffeln:-1`
        }
      ],
      [
        {
          text: "🗂 Serien +1",
          callback_data: `access:limit:${id}:serien:1`
        },
        {
          text: "🗂 Serien -1",
          callback_data: `access:limit:${id}:serien:-1`
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

function getCurrentLimitValue(user, limitType) {
  if (limitType === "filme") {
    return Number(user.daily_movie_limit || 0);
  }

  if (limitType === "folgen") {
    return Number(user.daily_episode_limit ?? user.daily_movie_limit ?? 0);
  }

  if (limitType === "staffeln") {
    return Number(user.daily_season_limit || 0);
  }

  if (limitType === "serien") {
    return Number(user.daily_series_limit || 0);
  }

  return null;
}

function getLimitLabel(limitType) {
  const labels = {
    filme: "Filme",
    folgen: "Folgen",
    staffeln: "Staffeln",
    serien: "Ganze Serien"
  };

  return labels[limitType] || limitType;
}

function buildCommandListMessage(isAdminUser = false) {
  let message =
    `📜 Library of Legends Befehle\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +

    `👤 Allgemein\n` +
        `/start\n` +
    `/menu\n` +
    `→ Startmenü anzeigen\n\n` +
    `!id\n` +
    `/id\n` +
    `→ Eigene Telegram-ID anzeigen\n\n` +

    `!freischaltung\n` +
    `/freischaltung\n` +
    `→ Zugriff beantragen\n\n` +

    `!meinlimit\n` +
    `/meinlimit\n` +
    `→ Eigenes Tageslimit anzeigen\n\n` +
    
        `🔥 Neu im Archiv\n` +
    `!neu\n` +
    `/neu\n` +
    `→ Zuletzt hinzugefügte Filme und Serien anzeigen\n\n` +
    
        `⭐ Merkliste\n` +
    `!merken movie ID\n` +
    `!merken LIB-CODE\n` +
    `!merken FILMTITEL\n` +
    `!merken serie SERIENTITEL\n` +
    `!merkliste\n` +
    `!vergessen ID\n` +
    `!merkliste leeren\n` +
    `→ Persönliche Merkliste verwalten\n\n` +
    
        `🕘 Verlauf\n` +
    `!verlauf\n` +
    `/verlauf\n` +
    `/history\n` +
    `→ Zuletzt geholte Inhalte anzeigen\n\n` +

    `🔎 Suche\n` +
    `!suche TITEL\n` +
    `→ Filme und Serien suchen\n\n` +

    `Beispiele:\n` +
    `!suche superman\n` +
    `!suche tulsa\n` +
    `!suche 4k\n\n` +

    `📦 Holen\n` +
    `!hol movie ID\n` +
    `!hol LIB-CODE\n` +
    `!hol FILMTITEL\n` +
    `!hol serie ID s1e1\n` +
    `!hol serie ID staffel 1\n` +
    `!hol SERIENTITEL s1e1\n` +
    `!hol SERIENTITEL staffel 1\n\n` +

    `Beispiele:\n` +
    `!hol movie 167\n` +
    `!hol LIB-ACT-0001\n` +
    `!hol oblivion\n` +
    `!hol tulsa king s1e1\n` +
    `!hol tulsa king staffel 1\n\n`;

  if (isAdminUser) {
    message +=
      `━━━━━━━━━━━━━━━━━━\n` +
      `🛡 Admin-Befehle\n\n` +

      `👥 User-Verwaltung\n` +
      `/users\n` +
      `/users pending\n` +
      `/users approved\n` +
      `/users rejected\n` +
      `/users blocked\n` +
      `/users all\n\n` +

      `/userinfo USER_ID\n` +
      `→ User anzeigen und per Buttons verwalten\n\n` +

      `/freigeben USER_ID\n` +
      `→ User freischalten\n\n` +

      `/sperren USER_ID\n` +
      `→ User dauerhaft sperren\n\n` +

      `/entfernen USER_ID\n` +
      `→ Zugriff entfernen, aber neue Anfrage erlauben\n\n` +

      `🏷 Rollen\n` +
      `/setrole USER_ID member\n` +
      `/setrole USER_ID vip\n` +
      `/setrole USER_ID admin\n\n` +
      
            `/usage USER_ID\n` +
      `/userverlauf USER_ID\n` +
      `→ Hol-Verlauf eines Users anzeigen\n\n` +

      `📊 Limits\n` +
      `/setlimit USER_ID filme 3\n` +
      `/setlimit USER_ID folgen 3\n` +
      `/setlimit USER_ID staffeln 1\n` +
      `/setlimit USER_ID serien 0\n\n` +

      `🎬 Film-/Serien-Admin\n` +
      `/movies\n` +
      `/series\n` +
      `/search TITEL\n` +
      `/editmovie Suchname | feld=wert\n` +
      `/dashboard\n` +
      `/stats\n\n` +

      `━━━━━━━━━━━━━━━━━━\n` +
      `Tipp: Bei /userinfo kannst du Rollen und Limits direkt per Button ändern.`;
  }

  return message;
}

async function handleAccessCommands(bot, msg, pgPool) {
  const text = msg.text || "";
  const chatId = msg.chat.id;
  const from = msg.from;

  if (!from) return false;
  
    // Startmenü anzeigen
  // /start wird für normale User abgefangen.
  // Admin-/start bleibt für dein altes Admin-System frei.
  if (
    text === "/menu" ||
    text === "!menu" ||
    (text === "/start" && !isAdmin(from.id))
  ) {
    const user = await getBotUser(pgPool, from.id);

    await bot.sendMessage(
      chatId,
      buildPublicMenuMessage(user),
      {
        reply_to_message_id: msg.message_id,
        reply_markup: buildPublicMenuKeyboard(isAdmin(from.id))
      }
    );

    return true;
  }
  
    // Neu im Archiv anzeigen
  if (
    text === "/neu" ||
    text === "!neu" ||
    text === "/new" ||
    text === "!new"
  ) {
    const user = await getBotUser(pgPool, from.id);

    if (!isAdmin(from.id) && (!user || user.status !== "approved")) {
      await bot.sendMessage(
        chatId,
        `⛔ Du bist noch nicht freigeschaltet.\n\n` +
          `Beantrage Zugriff mit:\n` +
          `!freischaltung`,
        {
          reply_to_message_id: msg.message_id
        }
      );

      return true;
    }

    await sendLatestLibraryMessage(
      bot,
      chatId,
      msg.message_id,
      pgPool
    );

    return true;
  }
  
    // Befehlsliste anzeigen
  if (
    text === "/befehle" ||
    text === "!befehle" ||
    text === "/hilfe" ||
    text === "!hilfe" ||
    text === "/adminhilfe"
  ) {
    await bot.sendMessage(
      chatId,
      buildCommandListMessage(isAdmin(from.id)),
      {
        reply_to_message_id: msg.message_id
      }
    );

    return true;
  }

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

function formatPublicUserStatus(user) {
  if (!user) {
    return "nicht beantragt";
  }

  if (user.status === "approved") {
    return "✅ freigeschaltet";
  }

  if (user.status === "pending") {
    return "🕓 Anfrage offen";
  }

  if (user.status === "rejected") {
    return "🗑 entfernt / neue Anfrage möglich";
  }

  if (user.status === "blocked") {
    return "⛔ gesperrt";
  }

  return user.status || "unbekannt";
}

function buildPublicMenuMessage(user) {
  return (
    `🏛 Library of Legends\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Willkommen im Archiv-Menü.\n\n` +
    `📌 Status: ${formatPublicUserStatus(user)}\n\n` +
    `Nutze die Buttons unten oder schreibe direkt:\n\n` +
    `🔎 !suche TITEL\n` +
    `📦 !hol CODE\n` +
    `📊 !meinlimit\n` +
    `📜 /befehle`
  );
}

function buildPublicMenuKeyboard(isAdminUser = false) {
  const keyboard = [
    [
      {
        text: "🔐 Freischaltung",
        callback_data: "public:request"
      },
      {
        text: "📊 Mein Limit",
        callback_data: "public:limit"
      }
    ],
    [
      {
        text: "🔎 Suche Hilfe",
        callback_data: "public:searchhelp"
      },
      {
        text: "📦 Hol Hilfe",
        callback_data: "public:holhelp"
      }
    ],
    [
  {
    text: "🔥 Neu im Archiv",
    callback_data: "public:new"
  }
],
[
  {
    text: "⭐ Merkliste",
    callback_data: "public:favorites"
  },
  {
    text: "🕘 Verlauf",
    callback_data: "public:history"
  }
],
[
  {
    text: "📜 Befehle",
    callback_data: "public:commands"
  }
]
  ];

  if (isAdminUser) {
    keyboard.push([
      {
        text: "🛡 Admin-Hilfe",
        callback_data: "public:commands"
      }
    ]);
  }

  return {
    inline_keyboard: keyboard
  };
}

function formatOwnLimitMessage(user, usage) {
  return (
    `📊 Dein Tageslimit\n\n` +
    `🎬 Filme: ${usage.movie}/${user.daily_movie_limit}\n` +
    `📺 Einzelne Folgen: ${usage.episode}/${user.daily_episode_limit ?? user.daily_movie_limit}\n` +
    `💿 Staffeln: ${usage.season}/${user.daily_season_limit}\n` +
    `🗂 Ganze Serien: ${usage.series_all}/${user.daily_series_limit}\n\n` +
    `🔎 Suche: unbegrenzt`
  );
}

function formatLatestMovieLine(movie, index) {
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
    `${index}. 🎬 ${movie.title || "Unbekannter Film"}${movie.year ? ` (${movie.year})` : ""}\n` +
    `   ${label}\n` +
    `   ${meta || "Keine technischen Daten"}\n` +
    `   !hol movie ${movie.id}`
  );
}

function parseLatestSeasonList(value) {
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

function pad2(value) {
  return String(value || 0).padStart(2, "0");
}

function formatLatestSeriesLine(series, index) {
  const number =
    series.series_ref ||
    series.series_library_id ||
    series.id;

  const seasons =
    parseLatestSeasonList(series.season_list);

  const seasonText =
    seasons.length
      ? seasons.map((s) => `S${pad2(s)}`).join(", ")
      : "—";

  const firstSeason =
    seasons[0] || 1;

  return (
    `${index}. 📺 ${series.series_title || "Unbekannte Serie"}\n` +
    `   ${series.seasons_count || 0} Staffel(n) · ${series.episodes_count || 0} Folge(n)\n` +
    `   Staffeln: ${seasonText}\n` +
    `   !hol serie ${number} s${firstSeason}e1\n` +
    `   !hol serie ${number} staffel ${firstSeason}`
  );
}

async function getLatestLibraryItems(pgPool, limit = 10) {
  const cleanLimit =
    Math.max(1, Math.min(Number(limit) || 10, 20));

  const moviesResult = await pgPool.query(
    `
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
    ORDER BY
      created_at DESC NULLS LAST,
      id DESC
    LIMIT $1;
    `,
    [cleanLimit]
  );

  const seriesResult = await pgPool.query(
    `
    SELECT
      MIN(id) AS id,
      COALESCE(NULLIF(MAX(series_library_id::text), ''), MIN(id)::text) AS series_ref,
      MAX(series_library_id::text) AS series_library_id,
      series_title,
      COUNT(*)::int AS episodes_count,
      COUNT(DISTINCT season::text)::int AS seasons_count,
      ARRAY_AGG(DISTINCT season::text) AS season_list,
      MAX(created_at) AS latest_created_at
    FROM series
    GROUP BY
      COALESCE(NULLIF(series_library_id::text, ''), LOWER(series_title)),
      series_title
    ORDER BY
      latest_created_at DESC NULLS LAST,
      MIN(id) DESC
    LIMIT $1;
    `,
    [cleanLimit]
  );

  return {
    movies: moviesResult.rows || [],
    series: seriesResult.rows || []
  };
}

function buildLatestLibraryMessage(latest) {
  const movieLines =
    latest.movies.length
      ? latest.movies.map(formatLatestMovieLine).join("\n\n")
      : "Keine neuen Filme gefunden.";

  const seriesLines =
    latest.series.length
      ? latest.series.map(formatLatestSeriesLine).join("\n\n")
      : "Keine neuen Serien gefunden.";

  return (
    `🔥 Neu im Archiv\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
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

async function sendLatestLibraryMessage(bot, chatId, replyToMessageId, pgPool) {
  const latest = await getLatestLibraryItems(pgPool, 10);

  await bot.sendMessage(
    chatId,
    buildLatestLibraryMessage(latest).slice(0, 3900),
    {
      reply_to_message_id: replyToMessageId
    }
  );
}

async function handlePublicCallback(bot, callback, pgPool) {
  const data = callback.data || "";

  if (!data.startsWith("public:")) {
    return false;
  }

  const from = callback.from;
  const chatId = callback.message?.chat?.id;
  const messageId = callback.message?.message_id;

  if (!from || !chatId) {
    await bot.answerCallbackQuery(callback.id, {
      text: "❌ Ungültiger Button.",
      show_alert: true
    });
    return true;
  }

  const action = data.split(":")[1];
  
    if (action === "new") {
    const user = await getBotUser(pgPool, from.id);

    if (!isAdmin(from.id) && (!user || user.status !== "approved")) {
      await bot.answerCallbackQuery(callback.id, {
        text: "⛔ Du bist noch nicht freigeschaltet.",
        show_alert: true
      });
      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: "🔥 Neu im Archiv wird angezeigt."
    });

    await sendLatestLibraryMessage(
      bot,
      chatId,
      messageId,
      pgPool
    );

    return true;
  }
  
    if (action === "favorites") {
    await bot.answerCallbackQuery(callback.id, {
      text: "⭐ Merkliste"
    });

    await bot.sendMessage(
      chatId,
      `⭐ Merkliste\n\n` +
        `Anzeigen:\n` +
        `!merkliste\n\n` +
        `Etwas merken:\n` +
        `!merken movie 167\n` +
        `!merken LIB-ACT-0001\n` +
        `!merken tulsa king\n\n` +
        `Entfernen:\n` +
        `!vergessen ID`,
      {
        reply_to_message_id: messageId
      }
    );

    return true;
  }
  
    if (action === "history") {
    const user = await getBotUser(pgPool, from.id);

    if (!isAdmin(from.id) && (!user || user.status !== "approved")) {
      await bot.answerCallbackQuery(callback.id, {
        text: "⛔ Du bist noch nicht freigeschaltet.",
        show_alert: true
      });
      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: "🕘 Verlauf wird angezeigt."
    });

    await sendUserHistoryMessage(
      bot,
      chatId,
      messageId,
      pgPool,
      from.id
    );

    return true;
  }

  if (action === "commands") {
    await bot.answerCallbackQuery(callback.id, {
      text: "📜 Befehle werden angezeigt."
    });

    await bot.sendMessage(
      chatId,
      buildCommandListMessage(isAdmin(from.id)),
      {
        reply_to_message_id: messageId
      }
    );

    return true;
  }

  if (action === "searchhelp") {
    await bot.answerCallbackQuery(callback.id, {
      text: "🔎 Suche-Hilfe"
    });

    await bot.sendMessage(
      chatId,
      `🔎 Suche verwenden\n\n` +
        `Nutze:\n` +
        `!suche TITEL\n\n` +
        `Beispiele:\n` +
        `!suche superman\n` +
        `!suche tulsa\n` +
        `!suche 4k\n\n` +
        `Die Suche ist unbegrenzt.`,
      {
        reply_to_message_id: messageId
      }
    );

    return true;
  }

  if (action === "holhelp") {
    await bot.answerCallbackQuery(callback.id, {
      text: "📦 Hol-Hilfe"
    });

    await bot.sendMessage(
      chatId,
      `📦 Medien holen\n\n` +
        `Nutze einen eindeutigen Code aus der Suche.\n\n` +
        `Beispiele:\n` +
        `!hol movie 167\n` +
        `!hol LIB-ACT-0001\n` +
        `!hol oblivion\n` +
        `!hol tulsa king s1e1\n` +
        `!hol tulsa king staffel 1\n\n` +
        `Bei mehreren Treffern zeigt der Bot eine Auswahl an.`,
      {
        reply_to_message_id: messageId
      }
    );

    return true;
  }

  if (action === "limit") {
    const user = await getBotUser(pgPool, from.id);

    if (!user || user.status !== "approved") {
      await bot.answerCallbackQuery(callback.id, {
        text: "⛔ Du bist noch nicht freigeschaltet.",
        show_alert: true
      });
      return true;
    }

    const usage = await getUsageToday(pgPool, from.id);

    await bot.answerCallbackQuery(callback.id, {
      text: "📊 Limit wird angezeigt."
    });

    await bot.sendMessage(
      chatId,
      formatOwnLimitMessage(user, usage),
      {
        reply_to_message_id: messageId
      }
    );

    return true;
  }

  if (action === "request") {
    const existingUser = await getBotUser(pgPool, from.id);

    if (existingUser?.status === "approved") {
      await bot.answerCallbackQuery(callback.id, {
        text: "✅ Du bist bereits freigeschaltet.",
        show_alert: true
      });
      return true;
    }

    if (existingUser?.status === "blocked") {
      await bot.answerCallbackQuery(callback.id, {
        text: "⛔ Dein Zugriff wurde gesperrt.",
        show_alert: true
      });
      return true;
    }

    if (existingUser?.status === "pending") {
      await bot.answerCallbackQuery(callback.id, {
        text: "🕓 Deine Anfrage ist bereits offen.",
        show_alert: true
      });
      return true;
    }

    const user = await upsertPendingUser(pgPool, from);

    await bot.answerCallbackQuery(callback.id, {
      text: "✅ Anfrage gespeichert."
    });

    await bot.sendMessage(
      chatId,
      `✅ Freischaltungs-Anfrage wurde gespeichert.\n\n` +
        `Ein Admin wurde benachrichtigt.`,
      {
        reply_to_message_id: messageId
      }
    );

    await notifyAdminsAboutAccessRequest(bot, from);

    return true;
  }

  await bot.answerCallbackQuery(callback.id, {
    text: "❌ Unbekannte Aktion.",
    show_alert: true
  });

  return true;
}

async function handleAccessCallback(bot, callback, pgPool) {
  const data = callback.data || "";

  if (data.startsWith("public:")) {
    return await handlePublicCallback(bot, callback, pgPool);
  }

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
  
    // Limit per Button ändern
  if (action === "limit") {
    const limitType = parts[3];
    const delta = Number(parts[4]);

    const allowedLimitTypes = [
      "filme",
      "folgen",
      "staffeln",
      "serien"
    ];

    if (!allowedLimitTypes.includes(limitType) || !Number.isInteger(delta)) {
      await bot.answerCallbackQuery(callback.id, {
        text: "❌ Ungültige Limit-Aktion.",
        show_alert: true
      });
      return true;
    }

    const infoBefore = await getFullUserInfo(pgPool, targetId);

    if (!infoBefore) {
      await bot.answerCallbackQuery(callback.id, {
        text: "❌ User wurde nicht gefunden.",
        show_alert: true
      });
      return true;
    }

    const currentValue = getCurrentLimitValue(infoBefore.user, limitType);

    if (currentValue === null) {
      await bot.answerCallbackQuery(callback.id, {
        text: "❌ Limit-Typ nicht erkannt.",
        show_alert: true
      });
      return true;
    }

    const nextValue = Math.max(
      0,
      Math.min(999, currentValue + delta)
    );

    const updated = await setUserLimit(
      pgPool,
      targetId,
      limitType,
      nextValue
    );

    if (!updated.ok) {
      await bot.answerCallbackQuery(callback.id, {
        text: updated.message || "❌ Limit konnte nicht geändert werden.",
        show_alert: true
      });
      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: `✅ ${getLimitLabel(limitType)}: ${nextValue}`
    });

    const infoAfter = await getFullUserInfo(pgPool, targetId);

    if (infoAfter && chatId && messageId) {
      await bot.editMessageText(
        chatId,
        messageId,
        formatFullUserInfoMessage(infoAfter.user, infoAfter.usage),
        {
          reply_markup: buildUserManagementKeyboard(targetId)
        }
      );
    }

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