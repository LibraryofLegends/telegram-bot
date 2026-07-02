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
const { sendPopularLibraryMessage } = require("./library-popular-commands");
const { sendRandomLibraryMessage } = require("./library-random-commands");
const { sendGenreListMessage } = require("./library-browse-commands");
const { sendYearOverviewMessage } = require("./library-year-commands");
const { sendAzOverviewMessage } = require("./library-az-commands");
const { handleLibraryHolCommands } = require("./library-hol-commands");
const { handleCleanupCommands } = require("./library-cleanup-commands");

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
    
        `🏆 Beliebt\n` +
    `!beliebt\n` +
    `/beliebt\n` +
    `!top\n` +
    `/top\n` +
    `→ Häufig geholte Filme und Serien anzeigen\n\n` +
    
        `🎲 Zufall\n` +
    `!zufall\n` +
    `/zufall\n` +
    `!zufall film\n` +
    `!zufall serie\n` +
    `!zufall 4k\n` +
    `→ Zufälligen Vorschlag anzeigen\n\n` +
    
        `📂 Kategorien\n` +
    `!kategorien\n` +
    `/kategorien\n` +
    `!genre action\n` +
    `!filme action\n` +
    `!serien drama\n` +
    `!4k\n` +
    `→ Nach Kategorien und Qualität stöbern\n\n` +
    
        `📅 Jahre & Jahrzehnte\n` +
    `!jahre\n` +
    `!jahr 2025\n` +
    `!jahr 1994\n` +
    `!dekade 90er\n` +
    `!dekade 2000er\n` +
    `!2025\n` +
    `!90er\n` +
    `→ Nach Erscheinungsjahr oder Jahrzehnt stöbern\n\n` +
    
        `🔤 A–Z Browser\n` +
    `!az\n` +
    `!az a\n` +
    `!az s\n` +
    `!a\n` +
    `!filme a\n` +
    `!serien s\n` +
    `→ Alphabetisch durch Filme und Serien stöbern\n\n` +
    
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
      
            `🧹 Duplikat-Scanner\n` +
      `/dupes\n` +
      `/dupes movies\n` +
      `/dupes series\n` +
      `/dupe TITEL\n` +
      `→ Mögliche doppelte Einträge finden\n\n` +
      
            `🧪 Fehlimport-Scanner\n` +
      `/wrongimports\n` +
      `/wrongmovies\n` +
      `/wrongmovie ID\n` +
      `/wrongmovie TITEL\n` +
      `→ Serienfolgen finden, die versehentlich als Film gespeichert wurden\n\n` +
      
            `🧪 Episoden-Abgleich\n` +
      `/episodecheck\n` +
      `/episodecheck TITEL\n` +
      `/episodecheck ID\n` +
      `/episodemismatch\n` +
      `/episodemismatch TITEL\n` +
      `→ Serienfolgen finden, bei denen DB-Folge und Dateiname nicht zusammenpassen\n\n` +
      
            `🛠 Episoden-Reparatur\n` +
      `/episodefix ID\n` +
      `/episodefix ID file\n` +
      `/episodefix ID file confirm\n` +
      `/episodefix ID season 1 episode 3\n` +
      `/episodefix ID season 1 episode 3 title Episodentitel\n` +
      `→ Staffel/Folge sicher per Vorschau reparieren\n\n` +
      
            `🧭 Serien-Audit\n` +
      `/seriesaudit TITEL\n` +
      `/seriesaudit ID\n` +
      `→ Serienfolgen nach Datei-Clustern und Nummerierungsfehlern prüfen\n\n` +
      
            `📦 Serien-Cluster\n` +
      `/seriesclusters ID\n` +
      `/seriescluster ID CLUSTERNAME\n` +
      `→ Gemischte Serienimporte nach Datei-Gruppen prüfen\n\n` +
      
            `📦 Serien-Split\n` +
      `/seriessplit GRUPPE CLUSTER title NEUER TITEL\n` +
      `/seriessplit GRUPPE CLUSTER title NEUER TITEL confirm\n` +
      `→ Datei-Cluster aus falscher Seriengruppe in neue Library-Gruppe verschieben\n\n` +
      
            `🧰 Serien-Batch-Reparatur\n` +
      `/seriesfixfromfile LIBRARY_ID\n` +
      `/seriesfixfromfile LIBRARY_ID preview\n` +
      `/seriesfixfromfile LIBRARY_ID confirm\n` +
      `→ Staffel/Folge und Titel sicher aus Dateinamen übernehmen\n\n` +
      
                  `🗑 Papierkorb / Bereinigung\n` +
      `/trashmovie ID\n` +
      `/trashmovie ID confirm\n` +
      `/trashwrong ID confirm\n` +
      `/trashepisode ID\n` +
      `/trashepisode ID confirm\n` +
      `/trashdupemovie keep ID remove ID\n` +
      `/trashdupemovie keep ID remove ID confirm\n` +
      `/trashdupeepisode keep ID remove ID\n` +
      `/trashdupeepisode keep ID remove ID confirm\n` +
      `/trashlist\n` +
      `/restoremovie PAPIERKORB_ID\n` +
      `/restoreepisode PAPIERKORB_ID\n` +
      `→ Filme und Serienfolgen sicher entfernen und wiederherstellen\n\n` +

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
  
      // Streaming-Startmenü anzeigen
  // /start wird für normale User abgefangen.
  // Admin-/start bleibt für dein altes Admin-System frei.
  if (
    text === "/menu" ||
    text === "!menu" ||
    text === "/home" ||
    text === "!home" ||
    (text === "/start" && !isAdmin(from.id))
  ) {
    await sendNetflixHomeMenu(
      bot,
      msg,
      pgPool
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

function formatHomeCount(value) {
  const number =
    Number(value || 0);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("de-DE");
}

async function getNetflixHomeStats(pgPool) {
  const stats = {
    movies: 0,
    series: 0,
    episodes: 0,
    uhd: 0,
    latestMovies: [],
    latestSeries: []
  };

  try {
    const [
      movieCount,
      seriesCount,
      episodeCount,
      uhdCount,
      latestMovies,
      latestSeries
    ] = await Promise.all([
      pgPool.query(`
        SELECT COUNT(*)::int AS count
        FROM movies;
      `),

      pgPool.query(`
        SELECT COUNT(DISTINCT COALESCE(series_library_id::text, LOWER(series_title)))::int AS count
        FROM series
        WHERE series_title IS NOT NULL
          AND TRIM(series_title) <> '';
      `),

      pgPool.query(`
        SELECT COUNT(*)::int AS count
        FROM series;
      `),

      pgPool.query(`
        SELECT COUNT(*)::int AS count
        FROM movies
        WHERE
          quality ILIKE '%UHD%'
          OR quality ILIKE '%4K%'
          OR resolution ILIKE '3840%'
          OR resolution ILIKE '2160%'
          OR file_name ILIKE '%2160p%'
          OR file_name ILIKE '%uhd%'
          OR file_name ILIKE '%4k%';
      `),

      pgPool.query(`
        SELECT
          title,
          year,
          quality
        FROM movies
        ORDER BY
          created_at DESC NULLS LAST,
          id DESC
        LIMIT 3;
      `),

      pgPool.query(`
        SELECT
          series_title,
          COUNT(*)::int AS episodes_count,
          MAX(created_at) AS latest_created_at
        FROM series
        WHERE series_title IS NOT NULL
          AND TRIM(series_title) <> ''
        GROUP BY
          COALESCE(series_library_id::text, LOWER(series_title)),
          series_title
        ORDER BY
          latest_created_at DESC NULLS LAST
        LIMIT 3;
      `)
    ]);

    stats.movies = movieCount.rows[0]?.count || 0;
    stats.series = seriesCount.rows[0]?.count || 0;
    stats.episodes = episodeCount.rows[0]?.count || 0;
    stats.uhd = uhdCount.rows[0]?.count || 0;
    stats.latestMovies = latestMovies.rows || [];
    stats.latestSeries = latestSeries.rows || [];
  } catch (err) {
    console.warn("⚠️ Startmenü-Stats Fehler:", err.message);
  }

  return stats;
}

function buildLatestMovieHomeLine(movie, index) {
  return (
    `${index + 1}. 🎬 ${movie.title || "Unbekannter Film"}${movie.year ? ` (${movie.year})` : ""}` +
    `${movie.quality ? ` · ${movie.quality}` : ""}`
  );
}

function buildLatestSeriesHomeLine(series, index) {
  return (
    `${index + 1}. 📺 ${series.series_title || "Unbekannte Serie"}` +
    `${series.episodes_count ? ` · ${series.episodes_count} Folge(n)` : ""}`
  );
}

function buildNetflixHomeText({ statusText, isAdminUser, isApproved, stats }) {
  const latestMovieText =
    stats.latestMovies.length
      ? stats.latestMovies.map(buildLatestMovieHomeLine).join("\n")
      : "Noch keine Filme gefunden.";

  const latestSeriesText =
    stats.latestSeries.length
      ? stats.latestSeries.map(buildLatestSeriesHomeLine).join("\n")
      : "Noch keine Serien gefunden.";

  const lockedHint =
    !isApproved && !isAdminUser
      ? (
          `\n\n🔐 Freischaltung erforderlich\n` +
          `Fordere Zugriff an, um das Archiv vollständig zu nutzen.\n` +
          `Befehl: /freischaltung`
        )
      : "";

  return (
    `🏛 Library of Legends\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Streaming-Startseite\n` +
    `📌 Status: ${statusText}\n\n` +

    `🎞 Archiv-Übersicht\n` +
    `🎬 Filme: ${formatHomeCount(stats.movies)}\n` +
    `📺 Serien: ${formatHomeCount(stats.series)}\n` +
    `🎞 Folgen: ${formatHomeCount(stats.episodes)}\n` +
    `💎 4K / UHD: ${formatHomeCount(stats.uhd)}\n\n` +

    `▶️ Neu im Archiv\n` +
    latestMovieText +
    `\n\n` +

    `📺 Neue Serienbereiche\n` +
    latestSeriesText +
    `\n\n` +

    `━━━━━━━━━━━━━━━━━━\n` +
    `Wähle unten ein Regal aus.${lockedHint}`
  );
}

function buildBackHomeKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "🏠 Zurück zur Startseite",
          callback_data: "public:home"
        }
      ]
    ]
  };
}

function buildSearchHelpText() {
  return (
    `🔎 Suche im Archiv\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Du kannst nach Filmen, Serien, Jahren oder Begriffen suchen.\n\n` +
    `Beispiele:\n` +
    `!suche hulk\n` +
    `!suche star wars\n` +
    `!suche 2025\n` +
    `!suche 4k\n\n` +
    `Tipp:\n` +
    `Wenn du den genauen Titel nicht kennst, reicht oft ein Teil des Namens.`
  );
}

function buildHolHelpText() {
  return (
    `📦 Titel aus dem Archiv holen\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Nutze den Hol-Befehl, wenn du einen bestimmten Eintrag abrufen möchtest.\n\n` +
    `Filme:\n` +
    `!hol movie 123\n` +
    `!hol LIB-ACT-0001\n\n` +
    `Serien:\n` +
    `!hol serie 1691 s1e1\n` +
    `!hol serie 1691 staffel 1\n\n` +
    `Tipp:\n` +
    `Die passenden IDs findest du über Suche, A–Z, Kategorien oder Jahre.`
  );
}

function buildUhdHelpText() {
  return (
    `💎 4K / UHD Regal\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Zeigt dir Filme mit 4K-, UHD- oder 2160p-Hinweisen.\n\n` +
    `Befehl:\n` +
    `!4k\n\n` +
    `Alternativ:\n` +
    `!uhd`
  );
}

function buildAccessHelpText() {
  return (
    `✅ Freischaltung\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Um das Archiv vollständig nutzen zu können, fordere deine Freischaltung an.\n\n` +
    `Befehl:\n` +
    `/freischaltung\n\n` +
    `Deine Telegram-ID kannst du mit diesem Button anzeigen lassen:\n` +
    `🆔 Meine ID anzeigen`
  );
}

function buildAdminHelpText() {
  return (
    `🛠 Admin-Zentrale\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Wichtige Admin-Bereiche:\n\n` +
    `🧹 Scanner\n` +
    `/dupes\n` +
    `/wrongimports\n` +
    `/episodecheck\n` +
    `/seriesaudit TITEL\n\n` +
    `🗑 Bereinigung\n` +
    `/trashlist\n` +
    `/trashmovie ID\n` +
    `/trashepisode ID\n\n` +
    `🛠 Reparatur\n` +
    `/episodefix ID\n` +
    `/seriesfixfromfile LIBRARY_ID preview\n\n` +
    `📜 Alle Befehle:\n` +
    `/befehle`
  );
}

async function sendNetflixHomeMenu(bot, msg, pgPool) {
  const chatId =
    msg.chat.id;

  const from =
    msg.from;

  const isAdminUser =
    from?.id ? isAdmin(from.id) : false;

  const user =
    from?.id ? await getBotUser(pgPool, from.id) : null;

  const isApproved =
    isAdminUser || user?.status === "approved";

  const statusText =
    isAdminUser
      ? "👑 Admin"
      : user?.status === "approved"
        ? "✅ freigeschaltet"
        : user?.status === "pending"
          ? "⏳ wartet auf Freigabe"
          : user?.status === "blocked"
            ? "⛔ gesperrt"
            : "🔐 nicht freigeschaltet";

  const stats =
    await getNetflixHomeStats(pgPool);

  await bot.sendMessage(
    chatId,
    buildNetflixHomeText({
      statusText,
      isAdminUser,
      isApproved,
      stats
    }).slice(0, 3900),
    {
      reply_to_message_id: msg.message_id,
      reply_markup: buildPublicMenuKeyboard(isAdminUser, isApproved)
    }
  );
}

async function editNetflixHomeMenu(bot, callback, pgPool) {
  const chatId =
    callback.message.chat.id;

  const messageId =
    callback.message.message_id;

  const from =
    callback.from;

  const isAdminUser =
    from?.id ? isAdmin(from.id) : false;

  const user =
    from?.id ? await getBotUser(pgPool, from.id) : null;

  const isApproved =
    isAdminUser || user?.status === "approved";

  const statusText =
    isAdminUser
      ? "👑 Admin"
      : user?.status === "approved"
        ? "✅ freigeschaltet"
        : user?.status === "pending"
          ? "⏳ wartet auf Freigabe"
          : user?.status === "blocked"
            ? "⛔ gesperrt"
            : "🔐 nicht freigeschaltet";

  const stats =
    await getNetflixHomeStats(pgPool);

  const text =
    buildNetflixHomeText({
      statusText,
      isAdminUser,
      isApproved,
      stats
    }).slice(0, 3900);

  const options = {
    reply_markup: buildPublicMenuKeyboard(isAdminUser, isApproved)
  };

  try {
    await bot.editMessageText(
      chatId,
      messageId,
      text,
      options
    );
  } catch (err) {
    await bot.sendMessage(
      chatId,
      text,
      options
    );
  }
}

async function editPublicInfoScreen(bot, callback, text) {
  const chatId =
    callback.message.chat.id;

  const messageId =
    callback.message.message_id;

  const options = {
    reply_markup: buildBackHomeKeyboard()
  };

  try {
    await bot.editMessageText(
      chatId,
      messageId,
      text.slice(0, 3900),
      options
    );
  } catch (err) {
    await bot.sendMessage(
      chatId,
      text.slice(0, 3900),
      options
    );
  }
}

function buildShelfKeyboard(type = "movies") {
  if (type === "series") {
    return {
      inline_keyboard: [
        [
          {
            text: "▶️ Neue Serien",
            callback_data: "public:new_series"
          },
          {
            text: "🔤 Serien A–Z",
            callback_data: "public:az_series"
          }
        ],
        [
          {
            text: "📂 Serien-Kategorien",
            callback_data: "public:genres_series"
          },
          {
            text: "📅 Serien nach Jahren",
            callback_data: "public:years_series"
          }
        ],
        [
          {
            text: "🎲 Serien-Zufall",
            callback_data: "public:random_series"
          },
          {
            text: "🔎 Serien suchen",
            callback_data: "public:search_series_help"
          }
        ],
        [
          {
            text: "📦 Serie holen",
            callback_data: "public:hol_series_help"
          },
          {
            text: "🏠 Startseite",
            callback_data: "public:home"
          }
        ]
      ]
    };
  }

  return {
    inline_keyboard: [
      [
        {
          text: "▶️ Neue Filme",
          callback_data: "public:new_movies"
        },
        {
          text: "💎 4K / UHD",
          callback_data: "public:uhd_movies"
        }
      ],
      [
        {
          text: "🔤 Filme A–Z",
          callback_data: "public:az_movies"
        },
        {
          text: "📂 Film-Kategorien",
          callback_data: "public:genres_movies"
        }
      ],
      [
        {
          text: "📅 Filme nach Jahren",
          callback_data: "public:years_movies"
        },
        {
          text: "🎲 Film-Zufall",
          callback_data: "public:random_movies"
        }
      ],
      [
        {
          text: "🔎 Filme suchen",
          callback_data: "public:search_movies_help"
        },
        {
          text: "📦 Film holen",
          callback_data: "public:hol_movies_help"
        }
      ],
      [
        {
          text: "🏠 Startseite",
          callback_data: "public:home"
        }
      ]
    ]
  };
}

async function editPublicScreenWithKeyboard(bot, callback, text, replyMarkup) {
  const chatId =
    callback.message.chat.id;

  const messageId =
    callback.message.message_id;

  const options = {
    reply_markup: replyMarkup
  };

  try {
    await bot.editMessageText(
      chatId,
      messageId,
      text.slice(0, 3900),
      options
    );
  } catch (err) {
    await bot.sendMessage(
      chatId,
      text.slice(0, 3900),
      options
    );
  }
}

async function getMovieShelfStats(pgPool) {
  const stats = {
    movies: 0,
    uhd: 0,
    latest: []
  };

  try {
    const [movieCount, uhdCount, latestMovies] = await Promise.all([
      pgPool.query(`
        SELECT COUNT(*)::int AS count
        FROM movies;
      `),

      pgPool.query(`
        SELECT COUNT(*)::int AS count
        FROM movies
        WHERE
          quality ILIKE '%UHD%'
          OR quality ILIKE '%4K%'
          OR resolution ILIKE '3840%'
          OR resolution ILIKE '2160%'
          OR file_name ILIKE '%2160p%'
          OR file_name ILIKE '%uhd%'
          OR file_name ILIKE '%4k%';
      `),

      pgPool.query(`
        SELECT
          title,
          year,
          quality
        FROM (
          SELECT DISTINCT ON (
            LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')),
            COALESCE(year::text, '')
          )
            id,
            title,
            year,
            quality,
            created_at
          FROM movies
          WHERE title IS NOT NULL
            AND TRIM(title) <> ''
          ORDER BY
            LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')),
            COALESCE(year::text, ''),
            created_at DESC NULLS LAST,
            id DESC
        ) AS unique_movies
        ORDER BY
          created_at DESC NULLS LAST,
          id DESC
        LIMIT 5;
      `)
    ]);

    stats.movies = movieCount.rows[0]?.count || 0;
    stats.uhd = uhdCount.rows[0]?.count || 0;
    stats.latest = latestMovies.rows || [];
  } catch (err) {
    console.warn("⚠️ Film-Regal Fehler:", err.message);
  }

  return stats;
}

async function getSeriesShelfStats(pgPool) {
  const stats = {
    series: 0,
    episodes: 0,
    latest: []
  };

  try {
    const [seriesCount, episodeCount, latestSeries] = await Promise.all([
      pgPool.query(`
        SELECT COUNT(DISTINCT COALESCE(series_library_id::text, LOWER(series_title)))::int AS count
        FROM series
        WHERE series_title IS NOT NULL
          AND TRIM(series_title) <> '';
      `),

      pgPool.query(`
        SELECT COUNT(*)::int AS count
        FROM series;
      `),

      pgPool.query(`
        SELECT
          series_title,
          COUNT(*)::int AS episodes_count,
          COUNT(DISTINCT season::text)::int AS seasons_count,
          MAX(created_at) AS latest_created_at
        FROM series
        WHERE series_title IS NOT NULL
          AND TRIM(series_title) <> ''
        GROUP BY
          COALESCE(series_library_id::text, LOWER(series_title)),
          series_title
        ORDER BY
          latest_created_at DESC NULLS LAST
        LIMIT 5;
      `)
    ]);

    stats.series = seriesCount.rows[0]?.count || 0;
    stats.episodes = episodeCount.rows[0]?.count || 0;
    stats.latest = latestSeries.rows || [];
  } catch (err) {
    console.warn("⚠️ Serien-Regal Fehler:", err.message);
  }

  return stats;
}

function formatMovieShelfLine(movie, index) {
  return (
    `${index + 1}. 🎬 ${movie.title || "Unbekannter Film"}${movie.year ? ` (${movie.year})` : ""}` +
    `${movie.quality ? ` · ${movie.quality}` : ""}`
  );
}

function formatSeriesShelfLine(series, index) {
  return (
    `${index + 1}. 📺 ${series.series_title || "Unbekannte Serie"}` +
    ` · ${series.seasons_count || 0} Staffel(n)` +
    ` · ${series.episodes_count || 0} Folge(n)`
  );
}

function buildMovieShelfText(stats) {
  const latestText =
    stats.latest.length
      ? stats.latest.map(formatMovieShelfLine).join("\n")
      : "Noch keine Filme gefunden.";

  return (
    `🎬 Film-Regal\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Dein Kino-Bereich im Archiv.\n\n` +
    `🎞 Filme gesamt: ${formatHomeCount(stats.movies)}\n` +
    `💎 4K / UHD: ${formatHomeCount(stats.uhd)}\n\n` +
    `▶️ Neue Filme\n` +
    latestText +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Nutze die Buttons unten, um durch Filme zu stöbern.`
  );
}

function buildSeriesShelfText(stats) {
  const latestText =
    stats.latest.length
      ? stats.latest.map(formatSeriesShelfLine).join("\n")
      : "Noch keine Serien gefunden.";

  return (
    `📺 Serien-Regal\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Dein Serien-Bereich im Archiv.\n\n` +
    `📺 Serien gesamt: ${formatHomeCount(stats.series)}\n` +
    `🎞 Folgen gesamt: ${formatHomeCount(stats.episodes)}\n\n` +
    `▶️ Neue Serienbereiche\n` +
    latestText +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Nutze die Buttons unten, um durch Serien zu stöbern.`
  );
}

function buildBackToShelfKeyboard(type = "movies") {
  return {
    inline_keyboard: [
      [
        {
          text: type === "series" ? "📺 Zurück zum Serien-Regal" : "🎬 Zurück zum Film-Regal",
          callback_data: type === "series" ? "public:series_shelf" : "public:movies_shelf"
        }
      ],
      [
        {
          text: "🏠 Zurück zur Startseite",
          callback_data: "public:home"
        }
      ]
    ]
  };
}

async function ensurePublicCallbackAccess(bot, callback, pgPool) {
  const from =
    callback.from;

  if (isAdmin(from.id)) {
    return true;
  }

  const user =
    await getBotUser(pgPool, from.id);

  if (!user || user.status !== "approved") {
    await bot.answerCallbackQuery(callback.id, {
      text: "⛔ Du bist noch nicht freigeschaltet.",
      show_alert: true
    });

    return false;
  }

  return true;
}

async function getLatestMovieMenuRows(pgPool, limit = 10) {
  const result = await pgPool.query(
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
    FROM (
      SELECT DISTINCT ON (
        LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')),
        COALESCE(year::text, '')
      )
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
        LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')),
        COALESCE(year::text, ''),
        created_at DESC NULLS LAST,
        id DESC
    ) AS unique_movies
    ORDER BY
      created_at DESC NULLS LAST,
      id DESC
    LIMIT $1;
    `,
    [
      Math.max(1, Math.min(Number(limit) || 10, 20))
    ]
  );

  return result.rows || [];
}

async function getUhdMovieMenuRows(pgPool, limit = 10) {
  const result = await pgPool.query(
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
    WHERE
      quality ILIKE '%UHD%'
      OR quality ILIKE '%4K%'
      OR resolution ILIKE '3840%'
      OR resolution ILIKE '2160%'
      OR file_name ILIKE '%2160p%'
      OR file_name ILIKE '%uhd%'
      OR file_name ILIKE '%4k%'
    ORDER BY
      created_at DESC NULLS LAST,
      id DESC
    LIMIT $1;
    `,
    [
      Math.max(1, Math.min(Number(limit) || 10, 20))
    ]
  );

  return result.rows || [];
}

async function getLatestSeriesMenuRows(pgPool, limit = 10) {
  const result = await pgPool.query(
    `
    SELECT
      COALESCE(NULLIF(MAX(series_library_id::text), ''), MIN(id)::text) AS series_ref,
      series_title,
      COUNT(*)::int AS episodes_count,
      COUNT(DISTINCT season::text)::int AS seasons_count,
      MAX(created_at) AS latest_created_at
    FROM series
    WHERE series_title IS NOT NULL
      AND TRIM(series_title) <> ''
    GROUP BY
      COALESCE(series_library_id::text, LOWER(series_title)),
      series_title
    ORDER BY
      latest_created_at DESC NULLS LAST
    LIMIT $1;
    `,
    [
      Math.max(1, Math.min(Number(limit) || 10, 20))
    ]
  );

  return result.rows || [];
}

async function getMovieGenreMenuRows(pgPool, limit = 20) {
  const result = await pgPool.query(
    `
    WITH genre_parts AS (
      SELECT
        TRIM(part) AS genre
      FROM movies,
      regexp_split_to_table(COALESCE(genre, ''), '\\s*/\\s*') AS part
      WHERE TRIM(part) <> ''
    )
    SELECT
      genre,
      COUNT(*)::int AS count
    FROM genre_parts
    GROUP BY genre
    ORDER BY
      count DESC,
      genre ASC
    LIMIT $1;
    `,
    [
      Math.max(1, Math.min(Number(limit) || 20, 40))
    ]
  );

  return result.rows || [];
}

async function getSeriesGenreMenuRows(pgPool, limit = 20) {
  const result = await pgPool.query(
    `
    WITH genre_parts AS (
      SELECT
        COALESCE(series_library_id::text, LOWER(series_title)) AS series_key,
        TRIM(part) AS genre
      FROM series,
      regexp_split_to_table(COALESCE(genre, ''), '\\s*/\\s*') AS part
      WHERE series_title IS NOT NULL
        AND TRIM(series_title) <> ''
        AND TRIM(part) <> ''
    )
    SELECT
      genre,
      COUNT(DISTINCT series_key)::int AS count
    FROM genre_parts
    GROUP BY genre
    ORDER BY
      count DESC,
      genre ASC
    LIMIT $1;
    `,
    [
      Math.max(1, Math.min(Number(limit) || 20, 40))
    ]
  );

  return result.rows || [];
}

async function getMovieYearMenuRows(pgPool, limit = 20) {
  const result = await pgPool.query(
    `
    SELECT
      year,
      COUNT(*)::int AS count
    FROM movies
    WHERE year IS NOT NULL
    GROUP BY year
    ORDER BY year DESC
    LIMIT $1;
    `,
    [
      Math.max(1, Math.min(Number(limit) || 20, 40))
    ]
  );

  return result.rows || [];
}

async function getSeriesYearMenuRows(pgPool, limit = 20) {
  try {
    const result = await pgPool.query(
      `
      WITH grouped AS (
        SELECT
          COALESCE(
            CASE
              WHEN MAX(sl.first_air_date::text) ~ '^[0-9]{4}'
              THEN LEFT(MAX(sl.first_air_date::text), 4)::int
              ELSE NULL
            END,
            EXTRACT(YEAR FROM MIN(s.created_at))::int
          ) AS year,
          COALESCE(s.series_library_id::text, LOWER(s.series_title)) AS series_key
        FROM series s
        LEFT JOIN series_library sl
          ON s.series_library_id::text = sl.id::text
        WHERE s.series_title IS NOT NULL
          AND TRIM(s.series_title) <> ''
        GROUP BY
          COALESCE(s.series_library_id::text, LOWER(s.series_title))
      )
      SELECT
        year,
        COUNT(*)::int AS count
      FROM grouped
      WHERE year IS NOT NULL
      GROUP BY year
      ORDER BY year DESC
      LIMIT $1;
      `,
      [
        Math.max(1, Math.min(Number(limit) || 20, 40))
      ]
    );

    return result.rows || [];
  } catch (err) {
    console.warn("⚠️ Serien-Jahre konnten nicht über series_library gelesen werden:", err.message);

    const fallback = await pgPool.query(
      `
      WITH grouped AS (
        SELECT
          EXTRACT(YEAR FROM MIN(created_at))::int AS year,
          COALESCE(series_library_id::text, LOWER(series_title)) AS series_key
        FROM series
        WHERE series_title IS NOT NULL
          AND TRIM(series_title) <> ''
        GROUP BY
          COALESCE(series_library_id::text, LOWER(series_title))
      )
      SELECT
        year,
        COUNT(*)::int AS count
      FROM grouped
      WHERE year IS NOT NULL
      GROUP BY year
      ORDER BY year DESC
      LIMIT $1;
      `,
      [
        Math.max(1, Math.min(Number(limit) || 20, 40))
      ]
    );

    return fallback.rows || [];
  }
}

async function getMovieAzMenuRows(pgPool) {
  const result = await pgPool.query(`
    SELECT title
    FROM movies
    WHERE title IS NOT NULL
      AND TRIM(title) <> '';
  `);

  return result.rows || [];
}

async function getSeriesAzMenuRows(pgPool) {
  const result = await pgPool.query(`
    SELECT DISTINCT
      series_title
    FROM series
    WHERE series_title IS NOT NULL
      AND TRIM(series_title) <> '';
  `);

  return result.rows || [];
}

function getAzLetterFromTitle(title = "") {
  const clean =
    String(title || "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/^["'„“”‚‘’\\-–—:;,.!?()\\[\\]\\s]+/g, "")
      .toUpperCase();

  const first =
    clean.charAt(0);

  if (/^[A-Z]$/.test(first)) {
    return first;
  }

  return "#";
}

function buildMovieMenuLine(movie, index) {
  const label =
    movie.library_id ||
    movie.id;

  const meta =
    [
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
    `   ${meta || "Keine technischen Daten"}`
  );
}

function buildSeriesMenuLine(series, index) {
  return (
    `${index + 1}. 📺 ${series.series_title || "Unbekannte Serie"}\n` +
    `   ${series.seasons_count || 0} Staffel(n) · ${series.episodes_count || 0} Folge(n)`
  );
}

function buildPageTitle(title, pageInfo = null) {
  if (!pageInfo || !pageInfo.totalPages || pageInfo.totalPages <= 1) {
    return title;
  }

  return `${title} · Seite ${pageInfo.page}/${pageInfo.totalPages}`;
}

function buildMovieListScreen(title, rows, pageInfo = null) {
  return (
    `${buildPageTitle(title, pageInfo)}\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    (
      rows.length
        ? rows.map(buildMovieMenuLine).join("\n\n")
        : "Keine Filme gefunden."
    ) +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Tippe unten auf einen Titel, um ihn zu holen.`
  );
}

function buildSeriesListScreen(title, rows, pageInfo = null) {
  return (
    `${buildPageTitle(title, pageInfo)}\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    (
      rows.length
        ? rows.map(buildSeriesMenuLine).join("\n\n")
        : "Keine Serien gefunden."
    ) +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Tippe unten auf eine Serie, um S01E01 zu holen.`
  );
}

function buildGenreScreen(title, rows, type = "movies") {
  const lines =
    rows.length
      ? rows.slice(0, 20).map((row, index) => {
          return (
            `${index + 1}. ${row.genre || "Unbekannt"} · ${row.count}`
          );
        }).join("\n")
      : "Keine Kategorien gefunden.";

  return (
    `${title}\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    lines +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Wähle unten eine Kategorie aus.`
  );
}

function buildYearScreen(title, rows, type = "movies") {
  const lines =
    rows.length
      ? rows.slice(0, 20).map((row, index) => {
          return (
            `${index + 1}. ${row.year} · ${row.count}`
          );
        }).join("\n")
      : "Keine Jahre gefunden.";

  return (
    `${title}\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    lines +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Wähle unten ein Jahr aus.`
  );
}

function buildAzScreen(title, rows, type = "movies") {
  const letters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");

  const counts =
    new Map();

  for (const letter of letters) {
    counts.set(letter, 0);
  }

  for (const row of rows) {
    const titleValue =
      type === "series"
        ? row.series_title
        : row.title;

    const letter =
      getAzLetterFromTitle(titleValue);

    counts.set(letter, (counts.get(letter) || 0) + 1);
  }

  const lines =
    letters
      .map((letter) => {
        return `${letter} · ${counts.get(letter) || 0}`;
      })
      .join("\n");

  return (
    `${title}\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    lines +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Wähle unten einen Buchstaben aus.`
  );
}

function buildMovieSearchHelpText() {
  return (
    `🔎 Filme suchen\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Suche nach Filmtiteln, Jahren, Qualität oder Begriffen.\n\n` +
    `Beispiele:\n` +
    `!suche superman\n` +
    `!suche 2025\n` +
    `!suche 4k\n\n` +
    `Tipp:\n` +
    `Ein Teil des Titels reicht meistens.`
  );
}

function buildSeriesSearchHelpText() {
  return (
    `🔎 Serien suchen\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Suche nach Seriennamen oder Episodenbegriffen.\n\n` +
    `Beispiele:\n` +
    `!suche hulk\n` +
    `!suche star wars\n` +
    `!suche tulsa\n\n` +
    `Tipp:\n` +
    `Nach der Suche kannst du einzelne Folgen oder ganze Staffeln holen.`
  );
}

function buildMovieHolHelpText() {
  return (
    `📦 Film holen\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Nutze eine Film-ID oder einen Library-Code.\n\n` +
    `Beispiele:\n` +
    `!hol movie 123\n` +
    `!hol LIB-ACT-0001\n` +
    `!hol superman\n\n` +
    `Die passenden IDs findest du über Suche, A–Z, Kategorien oder Jahre.`
  );
}

function buildSeriesHolHelpText() {
  return (
    `📦 Serie holen\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Einzelne Folge:\n` +
    `!hol serie 1691 s1e1\n\n` +
    `Ganze Staffel:\n` +
    `!hol serie 1691 staffel 1\n\n` +
    `Tipp:\n` +
    `Die Serien-ID findest du über Suche oder Serien A–Z.`
  );
}

function shortenButtonText(text = "", max = 28) {
  const value =
    String(text || "").trim();

  if (value.length <= max) {
    return value;
  }

  return value.slice(0, max - 1).trim() + "…";
}

function buildGenreButtonsKeyboard(type = "movies", rows = []) {
  const prefix =
    type === "series"
      ? "gs"
      : "gm";

  const backShelf =
    type === "series"
      ? "public:series_shelf"
      : "public:movies_shelf";

  const buttons =
    rows.slice(0, 20).map((row, index) => {
      return {
        text: `${index + 1}. ${shortenButtonText(row.genre || "Unbekannt", 24)}`,
        callback_data: `public:${prefix}_${index}`
      };
    });

  const keyboard = [];

  for (let i = 0; i < buttons.length; i += 2) {
    keyboard.push(buttons.slice(i, i + 2));
  }

  keyboard.push([
    {
      text: type === "series" ? "📺 Zurück zum Serien-Regal" : "🎬 Zurück zum Film-Regal",
      callback_data: backShelf
    }
  ]);

  keyboard.push([
    {
      text: "🏠 Startseite",
      callback_data: "public:home"
    }
  ]);

  return {
    inline_keyboard: keyboard
  };
}

function buildAzButtonsKeyboard(type = "movies") {
  const prefix =
    type === "series"
      ? "as"
      : "am";

  const backShelf =
    type === "series"
      ? "public:series_shelf"
      : "public:movies_shelf";

  const letters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const keyboard = [];

  for (let i = 0; i < letters.length; i += 6) {
    keyboard.push(
      letters.slice(i, i + 6).map((letter) => {
        return {
          text: letter,
          callback_data: `public:${prefix}_${letter}`
        };
      })
    );
  }

  keyboard.push([
    {
      text: "#",
      callback_data: `public:${prefix}_HASH`
    }
  ]);

  keyboard.push([
    {
      text: type === "series" ? "📺 Zurück zum Serien-Regal" : "🎬 Zurück zum Film-Regal",
      callback_data: backShelf
    }
  ]);

  keyboard.push([
    {
      text: "🏠 Startseite",
      callback_data: "public:home"
    }
  ]);

  return {
    inline_keyboard: keyboard
  };
}

function buildYearButtonsKeyboard(type = "movies", rows = []) {
  const prefix =
    type === "series"
      ? "ys"
      : "ym";

  const backShelf =
    type === "series"
      ? "public:series_shelf"
      : "public:movies_shelf";

  const buttons =
    rows.slice(0, 20).map((row) => {
      return {
        text: `${row.year} · ${row.count}`,
        callback_data: `public:${prefix}_${row.year}`
      };
    });

  const keyboard = [];

  for (let i = 0; i < buttons.length; i += 2) {
    keyboard.push(buttons.slice(i, i + 2));
  }

  keyboard.push([
    {
      text: type === "series" ? "📺 Zurück zum Serien-Regal" : "🎬 Zurück zum Film-Regal",
      callback_data: backShelf
    }
  ]);

  keyboard.push([
    {
      text: "🏠 Startseite",
      callback_data: "public:home"
    }
  ]);

  return {
    inline_keyboard: keyboard
  };
}

function buildBackToCategoryKeyboard(type = "movies") {
  return {
    inline_keyboard: [
      [
        {
          text: type === "series" ? "📂 Zurück zu Serien-Kategorien" : "📂 Zurück zu Film-Kategorien",
          callback_data: type === "series" ? "public:genres_series" : "public:genres_movies"
        }
      ],
      [
        {
          text: type === "series" ? "📺 Zurück zum Serien-Regal" : "🎬 Zurück zum Film-Regal",
          callback_data: type === "series" ? "public:series_shelf" : "public:movies_shelf"
        }
      ],
      [
        {
          text: "🏠 Startseite",
          callback_data: "public:home"
        }
      ]
    ]
  };
}

function buildBackToAzKeyboard(type = "movies") {
  return {
    inline_keyboard: [
      [
        {
          text: type === "series" ? "🔤 Zurück zu Serien A–Z" : "🔤 Zurück zu Filme A–Z",
          callback_data: type === "series" ? "public:az_series" : "public:az_movies"
        }
      ],
      [
        {
          text: type === "series" ? "📺 Zurück zum Serien-Regal" : "🎬 Zurück zum Film-Regal",
          callback_data: type === "series" ? "public:series_shelf" : "public:movies_shelf"
        }
      ],
      [
        {
          text: "🏠 Startseite",
          callback_data: "public:home"
        }
      ]
    ]
  };
}

function buildBackToYearKeyboard(type = "movies") {
  return {
    inline_keyboard: [
      [
        {
          text: type === "series" ? "📅 Zurück zu Serien-Jahren" : "📅 Zurück zu Film-Jahren",
          callback_data: type === "series" ? "public:years_series" : "public:years_movies"
        }
      ],
      [
        {
          text: type === "series" ? "📺 Zurück zum Serien-Regal" : "🎬 Zurück zum Film-Regal",
          callback_data: type === "series" ? "public:series_shelf" : "public:movies_shelf"
        }
      ],
      [
        {
          text: "🏠 Startseite",
          callback_data: "public:home"
        }
      ]
    ]
  };
}

function buildPaginationRow(pagination) {
  if (!pagination) {
    return [];
  }

  const page =
    Number(pagination.page || 1);

  const totalPages =
    Number(pagination.totalPages || 1);

  const baseAction =
    pagination.baseAction;

  if (!baseAction || totalPages <= 1) {
    return [];
  }

  const row = [];

  if (page > 1) {
    row.push({
      text: "⬅️ Zurück",
      callback_data: `public:${baseAction}_${page - 1}`
    });
  }

  row.push({
    text: `Seite ${page}/${totalPages}`,
    callback_data: "public:noop"
  });

  if (page < totalPages) {
    row.push({
      text: "Weiter ➡️",
      callback_data: `public:${baseAction}_${page + 1}`
    });
  }

  return [row];
}

function buildMovieResultKeyboard(rows = [], backKeyboard, pagination = null) {
  const keyboard = [];

  for (const [index, movie] of rows.slice(0, 10).entries()) {
    keyboard.push([
      {
        text: `▶️ ${index + 1}. ${shortenButtonText(movie.title || "Film", 34)}`,
        callback_data: `public:hm_${movie.id}`
      }
    ]);
  }

  keyboard.push(...buildPaginationRow(pagination));

  if (backKeyboard?.inline_keyboard?.length) {
    keyboard.push(...backKeyboard.inline_keyboard);
  }

  return {
    inline_keyboard: keyboard
  };
}

function buildSeriesResultKeyboard(rows = [], backKeyboard, pagination = null) {
  const keyboard = [];

  for (const [index, series] of rows.slice(0, 10).entries()) {
    const ref =
      series.series_ref ||
      series.series_library_id ||
      series.id;

    keyboard.push([
      {
        text: `📺 ${index + 1}. ${shortenButtonText(series.series_title || "Serie", 34)}`,
        callback_data: `public:sd_${ref}`
      }
    ]);
  }

  keyboard.push(...buildPaginationRow(pagination));

  if (backKeyboard?.inline_keyboard?.length) {
    keyboard.push(...backKeyboard.inline_keyboard);
  }

  return {
    inline_keyboard: keyboard
  };
}

async function getSeriesDetailRows(pgPool, seriesRef, limit = 1000) {
  const ref =
    String(seriesRef || "").trim();

  if (!ref) {
    return [];
  }

  const cleanLimit =
    Math.max(1, Math.min(Number(limit) || 1000, 3000));

  if (/^\d+$/.test(ref)) {
    const byLibraryResult = await pgPool.query(
      `
      SELECT
        id,
        series_library_id,
        series_title,
        season,
        episode,
        episode_title,
        file_name,
        created_at
      FROM series
      WHERE series_library_id::text = $1::text
      ORDER BY
        CASE
          WHEN season::text ~ '^[0-9]+$'
          THEN season::int
          ELSE 999
        END ASC,
        CASE
          WHEN episode::text ~ '^[0-9]+$'
          THEN episode::int
          ELSE 999
        END ASC,
        id ASC
      LIMIT $2;
      `,
      [
        ref,
        cleanLimit
      ]
    );

    if ((byLibraryResult.rows || []).length) {
      return byLibraryResult.rows || [];
    }

    const baseResult = await pgPool.query(
      `
      SELECT
        id,
        series_library_id,
        series_title
      FROM series
      WHERE id::text = $1::text
      LIMIT 1;
      `,
      [
        ref
      ]
    );

    const base =
      baseResult.rows[0];

    if (base?.series_library_id) {
      const groupResult = await pgPool.query(
        `
        SELECT
          id,
          series_library_id,
          series_title,
          season,
          episode,
          episode_title,
          file_name,
          created_at
        FROM series
        WHERE series_library_id::text = $1::text
        ORDER BY
          CASE
            WHEN season::text ~ '^[0-9]+$'
            THEN season::int
            ELSE 999
          END ASC,
          CASE
            WHEN episode::text ~ '^[0-9]+$'
            THEN episode::int
            ELSE 999
          END ASC,
          id ASC
        LIMIT $2;
        `,
        [
          String(base.series_library_id),
          cleanLimit
        ]
      );

      return groupResult.rows || [];
    }

    if (base?.series_title) {
      const titleResult = await pgPool.query(
        `
        SELECT
          id,
          series_library_id,
          series_title,
          season,
          episode,
          episode_title,
          file_name,
          created_at
        FROM series
        WHERE LOWER(series_title) = LOWER($1)
        ORDER BY
          CASE
            WHEN season::text ~ '^[0-9]+$'
            THEN season::int
            ELSE 999
          END ASC,
          CASE
            WHEN episode::text ~ '^[0-9]+$'
            THEN episode::int
            ELSE 999
          END ASC,
          id ASC
        LIMIT $2;
        `,
        [
          String(base.series_title),
          cleanLimit
        ]
      );

      return titleResult.rows || [];
    }
  }

  const titleResult = await pgPool.query(
    `
    SELECT
      id,
      series_library_id,
      series_title,
      season,
      episode,
      episode_title,
      file_name,
      created_at
    FROM series
    WHERE series_title ILIKE $1
    ORDER BY
      CASE
        WHEN season::text ~ '^[0-9]+$'
        THEN season::int
        ELSE 999
      END ASC,
      CASE
        WHEN episode::text ~ '^[0-9]+$'
        THEN episode::int
        ELSE 999
      END ASC,
      id ASC
    LIMIT $2;
    `,
    [
      `%${ref}%`,
      cleanLimit
    ]
  );

  return titleResult.rows || [];
}

function getSeriesDetailSummary(rows = [], fallbackRef = "") {
  const seasons =
    Array.from(
      new Set(
        rows
          .map((row) => Number(row.season || 0))
          .filter((season) => Number.isInteger(season) && season > 0)
      )
    ).sort((a, b) => a - b);

  const firstRow =
    rows[0] || null;

  const firstEpisode =
    rows
      .slice()
      .sort((a, b) => {
        const seasonA = Number(a.season || 999);
        const seasonB = Number(b.season || 999);
        const episodeA = Number(a.episode || 999);
        const episodeB = Number(b.episode || 999);

        return seasonA - seasonB || episodeA - episodeB || Number(a.id || 0) - Number(b.id || 0);
      })[0] || null;

  const ref =
    firstRow?.series_library_id ||
    fallbackRef ||
    firstRow?.id;

  return {
    ref,
    title: firstRow?.series_title || "Unbekannte Serie",
    seasons,
    seasonsCount: seasons.length,
    episodesCount: rows.length,
    firstSeason: Number(firstEpisode?.season || seasons[0] || 1),
    firstEpisode: Number(firstEpisode?.episode || 1)
  };
}

function buildSeriesDetailText(summary) {
  const seasonText =
    summary.seasons.length
      ? summary.seasons.map((season) => `S${pad2(season)}`).join(", ")
      : "—";

  return (
    `📺 ${summary.title}\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Serien-Detailseite\n\n` +
    `📀 Staffeln: ${summary.seasonsCount}\n` +
    `🎞 Folgen: ${summary.episodesCount}\n` +
    `🆔 Serien-ID: ${summary.ref}\n\n` +
    `Verfügbare Staffeln:\n` +
    `${seasonText}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `Wähle unten eine Staffel oder starte direkt mit der ersten Folge.`
  );
}

function buildSeriesDetailKeyboard(summary) {
  const keyboard = [];

  keyboard.push([
    {
      text: `▶️ Erste Folge S${pad2(summary.firstSeason)}E${pad2(summary.firstEpisode)}`,
      callback_data: `public:he_${summary.ref}_${summary.firstSeason}_${summary.firstEpisode}`
    }
  ]);

  const seasonButtons =
    summary.seasons.map((season) => {
      return {
        text: `📀 Staffel ${season}`,
        callback_data: `public:sl_${summary.ref}_${season}_1`
      };
    });

  for (let i = 0; i < seasonButtons.length; i += 2) {
    keyboard.push(seasonButtons.slice(i, i + 2));
  }

  keyboard.push([
    {
      text: "📺 Zurück zum Serien-Regal",
      callback_data: "public:series_shelf"
    }
  ]);

  keyboard.push([
    {
      text: "🏠 Startseite",
      callback_data: "public:home"
    }
  ]);

  return {
    inline_keyboard: keyboard
  };
}

function getSeasonRowsFromSeriesRows(rows = [], season) {
  const wantedSeason =
    Number(season || 0);

  return rows
    .filter((row) => Number(row.season || 0) === wantedSeason)
    .sort((a, b) => {
      return Number(a.episode || 0) - Number(b.episode || 0) || Number(a.id || 0) - Number(b.id || 0);
    });
}

function buildSeasonPage(rows = [], page = 1) {
  const safePage =
    normalizePage(page);

  const total =
    rows.length;

  const totalPages =
    Math.max(1, Math.ceil(total / MENU_PAGE_SIZE));

  const finalPage =
    Math.min(safePage, totalPages);

  const start =
    (finalPage - 1) * MENU_PAGE_SIZE;

  return {
    rows: rows.slice(start, start + MENU_PAGE_SIZE),
    pageInfo: {
      page: finalPage,
      total,
      totalPages,
      pageSize: MENU_PAGE_SIZE
    }
  };
}

function buildSeasonEpisodeLine(row, index) {
  return (
    `${index + 1}. S${pad2(row.season)}E${pad2(row.episode)} · ${row.episode_title || "Ohne Titel"}`
  );
}

function buildSeasonDetailText(summary, season, pageRows, pageInfo) {
  return (
    `📀 ${summary.title} · Staffel ${season}` +
    (
      pageInfo.totalPages > 1
        ? ` · Seite ${pageInfo.page}/${pageInfo.totalPages}`
        : ""
    ) +
    `\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    (
      pageRows.length
        ? pageRows.map(buildSeasonEpisodeLine).join("\n")
        : "Keine Folgen gefunden."
    ) +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Tippe unten auf eine Folge oder hole die ganze Staffel.`
  );
}

function buildSeasonDetailKeyboard(summary, season, pageRows, pageInfo) {
  const keyboard = [];

  for (const row of pageRows) {
    keyboard.push([
      {
        text: `▶️ S${pad2(row.season)}E${pad2(row.episode)} ${shortenButtonText(row.episode_title || "Folge", 28)}`,
        callback_data: `public:he_${summary.ref}_${Number(row.season)}_${Number(row.episode)}`
      }
    ]);
  }

  if (pageInfo.totalPages > 1) {
    const paginationRow = [];

    if (pageInfo.page > 1) {
      paginationRow.push({
        text: "⬅️ Zurück",
        callback_data: `public:sl_${summary.ref}_${season}_${pageInfo.page - 1}`
      });
    }

    paginationRow.push({
      text: `Seite ${pageInfo.page}/${pageInfo.totalPages}`,
      callback_data: "public:noop"
    });

    if (pageInfo.page < pageInfo.totalPages) {
      paginationRow.push({
        text: "Weiter ➡️",
        callback_data: `public:sl_${summary.ref}_${season}_${pageInfo.page + 1}`
      });
    }

    keyboard.push(paginationRow);
  }

  keyboard.push([
    {
      text: `💿 Staffel ${season} holen`,
      callback_data: `public:hst_${summary.ref}_${season}`
    }
  ]);

  keyboard.push([
    {
      text: "📺 Zurück zur Serie",
      callback_data: `public:sd_${summary.ref}`
    }
  ]);

  keyboard.push([
    {
      text: "📺 Zurück zum Serien-Regal",
      callback_data: "public:series_shelf"
    }
  ]);

  keyboard.push([
    {
      text: "🏠 Startseite",
      callback_data: "public:home"
    }
  ]);

  return {
    inline_keyboard: keyboard
  };
}

async function getMoviesByGenreButtonRows(pgPool, genre, limit = 10) {
  const result = await pgPool.query(
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
    FROM movies m
    WHERE EXISTS (
      SELECT 1
      FROM regexp_split_to_table(COALESCE(m.genre, ''), '\\s*/\\s*') AS part
      WHERE LOWER(TRIM(part)) = LOWER($1)
    )
    ORDER BY
      created_at DESC NULLS LAST,
      year DESC NULLS LAST,
      title ASC
    LIMIT $2;
    `,
    [
      genre,
      Math.max(1, Math.min(Number(limit) || 10, 20))
    ]
  );

  return result.rows || [];
}

async function getSeriesByGenreButtonRows(pgPool, genre, limit = 10) {
  const result = await pgPool.query(
    `
    SELECT
      COALESCE(NULLIF(MAX(series_library_id::text), ''), MIN(id)::text) AS series_ref,
      series_title,
      COUNT(*)::int AS episodes_count,
      COUNT(DISTINCT season::text)::int AS seasons_count,
      MAX(created_at) AS latest_created_at
    FROM series s
    WHERE series_title IS NOT NULL
      AND TRIM(series_title) <> ''
      AND EXISTS (
        SELECT 1
        FROM regexp_split_to_table(COALESCE(s.genre, ''), '\\s*/\\s*') AS part
        WHERE LOWER(TRIM(part)) = LOWER($1)
      )
    GROUP BY
      COALESCE(series_library_id::text, LOWER(series_title)),
      series_title
    ORDER BY
      latest_created_at DESC NULLS LAST,
      series_title ASC
    LIMIT $2;
    `,
    [
      genre,
      Math.max(1, Math.min(Number(limit) || 10, 20))
    ]
  );

  return result.rows || [];
}

async function getMoviesByAzButtonRows(pgPool, letter, limit = 10) {
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

  return (result.rows || [])
    .filter((movie) => getAzLetterFromTitle(movie.title) === letter)
    .slice(0, Math.max(1, Math.min(Number(limit) || 10, 20)));
}

async function getSeriesByAzButtonRows(pgPool, letter, limit = 10) {
  const result = await pgPool.query(`
    SELECT
      COALESCE(NULLIF(MAX(series_library_id::text), ''), MIN(id)::text) AS series_ref,
      series_title,
      COUNT(*)::int AS episodes_count,
      COUNT(DISTINCT season::text)::int AS seasons_count,
      MAX(created_at) AS latest_created_at
    FROM series
    WHERE series_title IS NOT NULL
      AND TRIM(series_title) <> ''
    GROUP BY
      COALESCE(series_library_id::text, LOWER(series_title)),
      series_title
    ORDER BY
      series_title ASC;
  `);

  return (result.rows || [])
    .filter((series) => getAzLetterFromTitle(series.series_title) === letter)
    .slice(0, Math.max(1, Math.min(Number(limit) || 10, 20)));
}

async function getMoviesByYearButtonRows(pgPool, year, limit = 10) {
  const result = await pgPool.query(
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
    WHERE year::text = $1::text
    ORDER BY
      created_at DESC NULLS LAST,
      title ASC
    LIMIT $2;
    `,
    [
      String(year),
      Math.max(1, Math.min(Number(limit) || 10, 20))
    ]
  );

  return result.rows || [];
}

async function getSeriesByYearButtonRows(pgPool, year, limit = 10) {
  const result = await pgPool.query(
    `
    WITH grouped AS (
      SELECT
        COALESCE(
          CASE
            WHEN MAX(sl.first_air_date::text) ~ '^[0-9]{4}'
            THEN LEFT(MAX(sl.first_air_date::text), 4)::int
            ELSE NULL
          END,
          EXTRACT(YEAR FROM MIN(s.created_at))::int
        ) AS year,
        COALESCE(s.series_library_id::text, LOWER(s.series_title)) AS series_key,
        COALESCE(NULLIF(MAX(s.series_library_id::text), ''), MIN(s.id)::text) AS series_ref,
        MIN(s.series_title) AS series_title,
        COUNT(*)::int AS episodes_count,
        COUNT(DISTINCT s.season::text)::int AS seasons_count,
        MAX(s.created_at) AS latest_created_at
      FROM series s
      LEFT JOIN series_library sl
        ON s.series_library_id::text = sl.id::text
      WHERE s.series_title IS NOT NULL
        AND TRIM(s.series_title) <> ''
      GROUP BY
        COALESCE(s.series_library_id::text, LOWER(s.series_title))
    )
    SELECT *
    FROM grouped
    WHERE year::text = $1::text
    ORDER BY
      latest_created_at DESC NULLS LAST,
      series_title ASC
    LIMIT $2;
    `,
    [
      String(year),
      Math.max(1, Math.min(Number(limit) || 10, 20))
    ]
  );

  return result.rows || [];
}

const MENU_PAGE_SIZE = 10;

function normalizePage(value) {
  const page =
    Number(value || 1);

  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

function buildPageInfo(page, total, baseAction) {
  const safePage =
    normalizePage(page);

  const safeTotal =
    Number(total || 0);

  const totalPages =
    Math.max(1, Math.ceil(safeTotal / MENU_PAGE_SIZE));

  return {
    page: Math.min(safePage, totalPages),
    total: safeTotal,
    totalPages,
    pageSize: MENU_PAGE_SIZE,
    baseAction
  };
}

function getPageOffset(page) {
  return (normalizePage(page) - 1) * MENU_PAGE_SIZE;
}

async function getLatestMovieMenuPage(pgPool, page = 1) {
  const pageInfoBase =
    normalizePage(page);

  const offset =
    getPageOffset(pageInfoBase);

  const totalResult = await pgPool.query(`
    WITH unique_movies AS (
      SELECT DISTINCT ON (
        LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')),
        COALESCE(year::text, '')
      )
        id
      FROM movies
      WHERE title IS NOT NULL
        AND TRIM(title) <> ''
      ORDER BY
        LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')),
        COALESCE(year::text, ''),
        created_at DESC NULLS LAST,
        id DESC
    )
    SELECT COUNT(*)::int AS count
    FROM unique_movies;
  `);

  const rowsResult = await pgPool.query(
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
    FROM (
      SELECT DISTINCT ON (
        LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')),
        COALESCE(year::text, '')
      )
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
        LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')),
        COALESCE(year::text, ''),
        created_at DESC NULLS LAST,
        id DESC
    ) AS unique_movies
    ORDER BY
      created_at DESC NULLS LAST,
      id DESC
    LIMIT $1 OFFSET $2;
    `,
    [
      MENU_PAGE_SIZE,
      offset
    ]
  );

  const pageInfo =
    buildPageInfo(
      pageInfoBase,
      totalResult.rows[0]?.count || 0,
      "pg_newm"
    );

  return {
    rows: rowsResult.rows || [],
    pageInfo
  };
}

async function getUhdMovieMenuPage(pgPool, page = 1) {
  const pageInfoBase =
    normalizePage(page);

  const offset =
    getPageOffset(pageInfoBase);

  const whereSql = `
    WHERE
      quality ILIKE '%UHD%'
      OR quality ILIKE '%4K%'
      OR resolution ILIKE '3840%'
      OR resolution ILIKE '2160%'
      OR file_name ILIKE '%2160p%'
      OR file_name ILIKE '%uhd%'
      OR file_name ILIKE '%4k%'
  `;

  const totalResult = await pgPool.query(`
    SELECT COUNT(*)::int AS count
    FROM movies
    ${whereSql};
  `);

  const rowsResult = await pgPool.query(
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
    ${whereSql}
    ORDER BY
      created_at DESC NULLS LAST,
      id DESC
    LIMIT $1 OFFSET $2;
    `,
    [
      MENU_PAGE_SIZE,
      offset
    ]
  );

  const pageInfo =
    buildPageInfo(
      pageInfoBase,
      totalResult.rows[0]?.count || 0,
      "pg_uhd"
    );

  return {
    rows: rowsResult.rows || [],
    pageInfo
  };
}

async function getLatestSeriesMenuPage(pgPool, page = 1) {
  const pageInfoBase =
    normalizePage(page);

  const offset =
    getPageOffset(pageInfoBase);

  const totalResult = await pgPool.query(`
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
  `);

  const rowsResult = await pgPool.query(
    `
    SELECT
      COALESCE(NULLIF(MAX(series_library_id::text), ''), MIN(id)::text) AS series_ref,
      series_title,
      COUNT(*)::int AS episodes_count,
      COUNT(DISTINCT season::text)::int AS seasons_count,
      MAX(created_at) AS latest_created_at
    FROM series
    WHERE series_title IS NOT NULL
      AND TRIM(series_title) <> ''
    GROUP BY
      COALESCE(series_library_id::text, LOWER(series_title)),
      series_title
    ORDER BY
      latest_created_at DESC NULLS LAST
    LIMIT $1 OFFSET $2;
    `,
    [
      MENU_PAGE_SIZE,
      offset
    ]
  );

  const pageInfo =
    buildPageInfo(
      pageInfoBase,
      totalResult.rows[0]?.count || 0,
      "pg_news"
    );

  return {
    rows: rowsResult.rows || [],
    pageInfo
  };
}

async function getMoviesByGenreButtonPage(pgPool, genre, page = 1) {
  const pageInfoBase =
    normalizePage(page);

  const offset =
    getPageOffset(pageInfoBase);

  const totalResult = await pgPool.query(
    `
    SELECT COUNT(*)::int AS count
    FROM movies m
    WHERE EXISTS (
      SELECT 1
      FROM regexp_split_to_table(COALESCE(m.genre, ''), '\\s*/\\s*') AS part
      WHERE LOWER(TRIM(part)) = LOWER($1)
    );
    `,
    [genre]
  );

  const rowsResult = await pgPool.query(
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
    FROM movies m
    WHERE EXISTS (
      SELECT 1
      FROM regexp_split_to_table(COALESCE(m.genre, ''), '\\s*/\\s*') AS part
      WHERE LOWER(TRIM(part)) = LOWER($1)
    )
    ORDER BY
      created_at DESC NULLS LAST,
      year DESC NULLS LAST,
      title ASC
    LIMIT $2 OFFSET $3;
    `,
    [
      genre,
      MENU_PAGE_SIZE,
      offset
    ]
  );

  return {
    rows: rowsResult.rows || [],
    pageInfo: buildPageInfo(pageInfoBase, totalResult.rows[0]?.count || 0, null)
  };
}

async function getSeriesByGenreButtonPage(pgPool, genre, page = 1) {
  const pageInfoBase =
    normalizePage(page);

  const offset =
    getPageOffset(pageInfoBase);

  const totalResult = await pgPool.query(
    `
    WITH grouped AS (
      SELECT
        COALESCE(s.series_library_id::text, LOWER(s.series_title)) AS series_key
      FROM series s
      WHERE s.series_title IS NOT NULL
        AND TRIM(s.series_title) <> ''
        AND EXISTS (
          SELECT 1
          FROM regexp_split_to_table(COALESCE(s.genre, ''), '\\s*/\\s*') AS part
          WHERE LOWER(TRIM(part)) = LOWER($1)
        )
      GROUP BY
        COALESCE(s.series_library_id::text, LOWER(s.series_title))
    )
    SELECT COUNT(*)::int AS count
    FROM grouped;
    `,
    [genre]
  );

  const rowsResult = await pgPool.query(
    `
    SELECT
      COALESCE(NULLIF(MAX(series_library_id::text), ''), MIN(id)::text) AS series_ref,
      series_title,
      COUNT(*)::int AS episodes_count,
      COUNT(DISTINCT season::text)::int AS seasons_count,
      MAX(created_at) AS latest_created_at
    FROM series s
    WHERE series_title IS NOT NULL
      AND TRIM(series_title) <> ''
      AND EXISTS (
        SELECT 1
        FROM regexp_split_to_table(COALESCE(s.genre, ''), '\\s*/\\s*') AS part
        WHERE LOWER(TRIM(part)) = LOWER($1)
      )
    GROUP BY
      COALESCE(series_library_id::text, LOWER(series_title)),
      series_title
    ORDER BY
      latest_created_at DESC NULLS LAST,
      series_title ASC
    LIMIT $2 OFFSET $3;
    `,
    [
      genre,
      MENU_PAGE_SIZE,
      offset
    ]
  );

  return {
    rows: rowsResult.rows || [],
    pageInfo: buildPageInfo(pageInfoBase, totalResult.rows[0]?.count || 0, null)
  };
}

async function getMoviesByAzButtonPage(pgPool, letter, page = 1) {
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

  const filtered =
    (result.rows || []).filter((movie) => {
      return getAzLetterFromTitle(movie.title) === letter;
    });

  const pageInfo =
    buildPageInfo(
      page,
      filtered.length,
      null
    );

  const start =
    (pageInfo.page - 1) * MENU_PAGE_SIZE;

  return {
    rows: filtered.slice(start, start + MENU_PAGE_SIZE),
    pageInfo
  };
}

async function getSeriesByAzButtonPage(pgPool, letter, page = 1) {
  const result = await pgPool.query(`
    SELECT
      COALESCE(NULLIF(MAX(series_library_id::text), ''), MIN(id)::text) AS series_ref,
      series_title,
      COUNT(*)::int AS episodes_count,
      COUNT(DISTINCT season::text)::int AS seasons_count,
      MAX(created_at) AS latest_created_at
    FROM series
    WHERE series_title IS NOT NULL
      AND TRIM(series_title) <> ''
    GROUP BY
      COALESCE(series_library_id::text, LOWER(series_title)),
      series_title
    ORDER BY
      series_title ASC;
  `);

  const filtered =
    (result.rows || []).filter((series) => {
      return getAzLetterFromTitle(series.series_title) === letter;
    });

  const pageInfo =
    buildPageInfo(
      page,
      filtered.length,
      null
    );

  const start =
    (pageInfo.page - 1) * MENU_PAGE_SIZE;

  return {
    rows: filtered.slice(start, start + MENU_PAGE_SIZE),
    pageInfo
  };
}

async function getMoviesByYearButtonPage(pgPool, year, page = 1) {
  const pageInfoBase =
    normalizePage(page);

  const offset =
    getPageOffset(pageInfoBase);

  const totalResult = await pgPool.query(
    `
    SELECT COUNT(*)::int AS count
    FROM movies
    WHERE year::text = $1::text;
    `,
    [String(year)]
  );

  const rowsResult = await pgPool.query(
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
    WHERE year::text = $1::text
    ORDER BY
      created_at DESC NULLS LAST,
      title ASC
    LIMIT $2 OFFSET $3;
    `,
    [
      String(year),
      MENU_PAGE_SIZE,
      offset
    ]
  );

  return {
    rows: rowsResult.rows || [],
    pageInfo: buildPageInfo(pageInfoBase, totalResult.rows[0]?.count || 0, null)
  };
}

async function getSeriesByYearButtonPage(pgPool, year, page = 1) {
  const pageInfoBase =
    normalizePage(page);

  const offset =
    getPageOffset(pageInfoBase);

  const baseSql = `
    WITH grouped AS (
      SELECT
        COALESCE(
          CASE
            WHEN MAX(sl.first_air_date::text) ~ '^[0-9]{4}'
            THEN LEFT(MAX(sl.first_air_date::text), 4)::int
            ELSE NULL
          END,
          EXTRACT(YEAR FROM MIN(s.created_at))::int
        ) AS year,
        COALESCE(s.series_library_id::text, LOWER(s.series_title)) AS series_key,
        COALESCE(NULLIF(MAX(s.series_library_id::text), ''), MIN(s.id)::text) AS series_ref,
        MIN(s.series_title) AS series_title,
        COUNT(*)::int AS episodes_count,
        COUNT(DISTINCT s.season::text)::int AS seasons_count,
        MAX(s.created_at) AS latest_created_at
      FROM series s
      LEFT JOIN series_library sl
        ON s.series_library_id::text = sl.id::text
      WHERE s.series_title IS NOT NULL
        AND TRIM(s.series_title) <> ''
      GROUP BY
        COALESCE(s.series_library_id::text, LOWER(s.series_title))
    )
  `;

  const totalResult = await pgPool.query(
    `
    ${baseSql}
    SELECT COUNT(*)::int AS count
    FROM grouped
    WHERE year::text = $1::text;
    `,
    [String(year)]
  );

  const rowsResult = await pgPool.query(
    `
    ${baseSql}
    SELECT *
    FROM grouped
    WHERE year::text = $1::text
    ORDER BY
      latest_created_at DESC NULLS LAST,
      series_title ASC
    LIMIT $2 OFFSET $3;
    `,
    [
      String(year),
      MENU_PAGE_SIZE,
      offset
    ]
  );

  return {
    rows: rowsResult.rows || [],
    pageInfo: buildPageInfo(pageInfoBase, totalResult.rows[0]?.count || 0, null)
  };
}

function buildPublicMenuKeyboard(isAdminUser = false, isApproved = true) {
  if (!isApproved && !isAdminUser) {
    return {
      inline_keyboard: [
        [
          {
            text: "✅ Freischaltung anfordern",
            callback_data: "public:access_help"
          }
        ],
        [
          {
            text: "🆔 Meine ID anzeigen",
            callback_data: "public:id_help"
          }
        ],
        [
          {
            text: "🔎 Suche Hilfe",
            callback_data: "public:search_help"
          }
        ]
      ]
    };
  }

  const rows = [
    [
      {
        text: "🎬 Filme",
        callback_data: "public:movies_shelf"
      },
      {
        text: "📺 Serien",
        callback_data: "public:series_shelf"
      }
    ],
    [
      {
        text: "▶️ Neu im Archiv",
        callback_data: "public:new"
      },
      {
        text: "🔥 Beliebt",
        callback_data: "public:popular"
      }
    ],
    [
      {
        text: "🎲 Zufall",
        callback_data: "public:random"
      },
      {
        text: "🔤 A–Z",
        callback_data: "public:az"
      }
    ],
    [
      {
        text: "📂 Kategorien",
        callback_data: "public:genres"
      },
      {
        text: "📅 Jahre",
        callback_data: "public:years"
      }
    ],
    [
  {
    text: "💎 4K / UHD",
    callback_data: "public:uhd_help"
  },
  {
    text: "🏛 Sammlungen",
    callback_data: "public:collections_shelf"
  }
],
[
  {
    text: "📦 Holen",
    callback_data: "public:hol_help"
  },
  {
    text: "🔎 Suche",
    callback_data: "public:search_help"
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
        text: "🔎 Suche",
        callback_data: "public:search_help"
      },
      {
        text: "🏠 Startseite",
        callback_data: "public:home"
      }
    ]
  ];

  if (isAdminUser) {
    rows.push([
      {
        text: "🛠 Admin-Zentrale",
        callback_data: "public:admin_help"
      }
    ]);
  }

  return {
    inline_keyboard: rows
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

const COLLECTION_DEFINITIONS = [
  {
    id: "marvel",
    emoji: "🦸",
    title: "Marvel",
    keywords: [
      "marvel",
      "avengers",
      "iron man",
      "captain america",
      "thor",
      "hulk",
      "spider-man",
      "spiderman",
      "ant-man",
      "black panther",
      "doctor strange",
      "guardians"
    ]
  },
  {
    id: "starwars",
    emoji: "⭐",
    title: "Star Wars",
    keywords: [
      "star wars",
      "ahsoka",
      "andor",
      "mandalorian",
      "boba fett",
      "jedi",
      "sith",
      "maul",
      "rebels",
      "clone wars"
    ]
  },
  {
    id: "disney",
    emoji: "🏰",
    title: "Disney",
    keywords: [
      "disney",
      "toy story",
      "pixar",
      "frozen",
      "eiskönigin",
      "lion king",
      "könig der löwen",
      "moana",
      "vaiana",
      "aladdin",
      "mulan",
      "lilo",
      "stitch"
    ]
  },
  {
    id: "harrypotter",
    emoji: "🧙",
    title: "Harry Potter",
    keywords: [
      "harry potter",
      "fantastic beasts",
      "phantastische tierwesen",
      "hogwarts",
      "dumbledore",
      "grindelwald"
    ]
  },
  {
    id: "jurassic",
    emoji: "🦖",
    title: "Jurassic Universe",
    keywords: [
      "jurassic",
      "jurassic park",
      "jurassic world"
    ]
  },
  {
    id: "fast",
    emoji: "🚗",
    title: "Fast & Furious",
    keywords: [
      "fast furious",
      "fast & furious",
      "fast and furious",
      "tokyo drift",
      "hobbs",
      "shaw"
    ]
  },
  {
    id: "budspencer",
    emoji: "👊",
    title: "Bud Spencer & Terence Hill",
    keywords: [
      "bud spencer",
      "terence hill",
      "plattfuß",
      "vier fäuste",
      "zwei himmelhunde",
      "trinity",
      "mücke",
      "banane"
    ]
  },
  {
    id: "horror",
    emoji: "👻",
    title: "Horror-Reihen",
    keywords: [
      "scream",
      "halloween",
      "freitag der 13",
      "friday the 13th",
      "final destination",
      "conjuring",
      "annabelle",
      "insidious",
      "saw",
      "evil dead"
    ]
  },
  {
    id: "scifi",
    emoji: "🤖",
    title: "Sci-Fi & Fantasy",
    keywords: [
      "sci-fi",
      "science fiction",
      "fantasy",
      "star trek",
      "alien",
      "predator",
      "terminator",
      "matrix",
      "dune",
      "godzilla"
    ]
  },
  {
    id: "animation",
    emoji: "🎨",
    title: "Animation & Anime",
    keywords: [
      "animation",
      "anime",
      "zeichentrick",
      "cartoon",
      "pixar",
      "dreamworks",
      "scooby",
      "darkwing",
      "dragonball",
      "naruto"
    ]
  }
];

function getCollectionDefinition(collectionId) {
  return COLLECTION_DEFINITIONS.find((collection) => collection.id === collectionId) || null;
}

function buildCollectionPatterns(collection) {
  return collection.keywords.map((keyword) => `%${String(keyword || "").toLowerCase()}%`);
}

async function getCollectionCounts(pgPool, collection) {
  const patterns =
    buildCollectionPatterns(collection);

  const [moviesResult, seriesResult] = await Promise.all([
    pgPool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM movies
      WHERE LOWER(
        COALESCE(title, '') || ' ' ||
        COALESCE(file_name, '') || ' ' ||
        COALESCE(genre, '')
      ) LIKE ANY($1::text[]);
      `,
      [
        patterns
      ]
    ),

    pgPool.query(
      `
      WITH grouped AS (
        SELECT
          COALESCE(series_library_id::text, LOWER(series_title)) AS series_key
        FROM series
        WHERE series_title IS NOT NULL
          AND TRIM(series_title) <> ''
          AND LOWER(
            COALESCE(series_title, '') || ' ' ||
            COALESCE(episode_title, '') || ' ' ||
            COALESCE(file_name, '') || ' ' ||
            COALESCE(genre, '')
          ) LIKE ANY($1::text[])
        GROUP BY
          COALESCE(series_library_id::text, LOWER(series_title))
      )
      SELECT COUNT(*)::int AS count
      FROM grouped;
      `,
      [
        patterns
      ]
    )
  ]);

  return {
    movies: moviesResult.rows[0]?.count || 0,
    series: seriesResult.rows[0]?.count || 0
  };
}

async function getCollectionsOverview(pgPool) {
  const rows = [];

  for (const collection of COLLECTION_DEFINITIONS) {
    const counts =
      await getCollectionCounts(pgPool, collection);

    rows.push({
      ...collection,
      movies: counts.movies,
      series: counts.series
    });
  }

  return rows;
}

async function getCollectionMovieRows(pgPool, collection, limit = 8) {
  const patterns =
    buildCollectionPatterns(collection);

  const result = await pgPool.query(
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
    FROM (
      SELECT DISTINCT ON (
        LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')),
        COALESCE(year::text, '')
      )
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
        AND LOWER(
          COALESCE(title, '') || ' ' ||
          COALESCE(file_name, '') || ' ' ||
          COALESCE(genre, '')
        ) LIKE ANY($1::text[])
      ORDER BY
        LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')),
        COALESCE(year::text, ''),
        created_at DESC NULLS LAST,
        id DESC
    ) AS unique_movies
    ORDER BY
      year ASC NULLS LAST,
      title ASC
    LIMIT $2;
    `,
    [
      patterns,
      Math.max(1, Math.min(Number(limit) || 8, 15))
    ]
  );

  return result.rows || [];
}

async function getCollectionSeriesRows(pgPool, collection, limit = 8) {
  const patterns =
    buildCollectionPatterns(collection);

  const result = await pgPool.query(
    `
    SELECT
      COALESCE(NULLIF(MAX(series_library_id::text), ''), MIN(id)::text) AS series_ref,
      series_title,
      COUNT(*)::int AS episodes_count,
      COUNT(DISTINCT season::text)::int AS seasons_count,
      MAX(created_at) AS latest_created_at
    FROM series
    WHERE series_title IS NOT NULL
      AND TRIM(series_title) <> ''
      AND LOWER(
        COALESCE(series_title, '') || ' ' ||
        COALESCE(episode_title, '') || ' ' ||
        COALESCE(file_name, '') || ' ' ||
        COALESCE(genre, '')
      ) LIKE ANY($1::text[])
    GROUP BY
      COALESCE(series_library_id::text, LOWER(series_title)),
      series_title
    ORDER BY
      series_title ASC
    LIMIT $2;
    `,
    [
      patterns,
      Math.max(1, Math.min(Number(limit) || 8, 15))
    ]
  );

  return result.rows || [];
}

async function getCollectionMoviePage(pgPool, collection, page = 1) {
  const patterns =
    buildCollectionPatterns(collection);

  const safePage =
    normalizePage(page);

  const offset =
    getPageOffset(safePage);

  const totalResult = await pgPool.query(
    `
    WITH unique_movies AS (
      SELECT DISTINCT ON (
        LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')),
        COALESCE(year::text, '')
      )
        id
      FROM movies
      WHERE title IS NOT NULL
        AND TRIM(title) <> ''
        AND LOWER(
          COALESCE(title, '') || ' ' ||
          COALESCE(file_name, '') || ' ' ||
          COALESCE(genre, '')
        ) LIKE ANY($1::text[])
      ORDER BY
        LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')),
        COALESCE(year::text, ''),
        created_at DESC NULLS LAST,
        id DESC
    )
    SELECT COUNT(*)::int AS count
    FROM unique_movies;
    `,
    [
      patterns
    ]
  );

  const rowsResult = await pgPool.query(
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
    FROM (
      SELECT DISTINCT ON (
        LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')),
        COALESCE(year::text, '')
      )
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
        AND LOWER(
          COALESCE(title, '') || ' ' ||
          COALESCE(file_name, '') || ' ' ||
          COALESCE(genre, '')
        ) LIKE ANY($1::text[])
      ORDER BY
        LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')),
        COALESCE(year::text, ''),
        created_at DESC NULLS LAST,
        id DESC
    ) AS unique_movies
    ORDER BY
      year ASC NULLS LAST,
      title ASC
    LIMIT $2 OFFSET $3;
    `,
    [
      patterns,
      MENU_PAGE_SIZE,
      offset
    ]
  );

  const pageInfo =
    buildPageInfo(
      safePage,
      totalResult.rows[0]?.count || 0,
      `colmv_${collection.id}`
    );

  return {
    rows: rowsResult.rows || [],
    pageInfo
  };
}

async function getCollectionSeriesPage(pgPool, collection, page = 1) {
  const patterns =
    buildCollectionPatterns(collection);

  const safePage =
    normalizePage(page);

  const offset =
    getPageOffset(safePage);

  const totalResult = await pgPool.query(
    `
    WITH grouped AS (
      SELECT
        COALESCE(series_library_id::text, LOWER(series_title)) AS series_key
      FROM series
      WHERE series_title IS NOT NULL
        AND TRIM(series_title) <> ''
        AND LOWER(
          COALESCE(series_title, '') || ' ' ||
          COALESCE(episode_title, '') || ' ' ||
          COALESCE(file_name, '') || ' ' ||
          COALESCE(genre, '')
        ) LIKE ANY($1::text[])
      GROUP BY
        COALESCE(series_library_id::text, LOWER(series_title))
    )
    SELECT COUNT(*)::int AS count
    FROM grouped;
    `,
    [
      patterns
    ]
  );

  const rowsResult = await pgPool.query(
    `
    SELECT
      COALESCE(NULLIF(MAX(series_library_id::text), ''), MIN(id)::text) AS series_ref,
      series_title,
      COUNT(*)::int AS episodes_count,
      COUNT(DISTINCT season::text)::int AS seasons_count,
      MAX(created_at) AS latest_created_at
    FROM series
    WHERE series_title IS NOT NULL
      AND TRIM(series_title) <> ''
      AND LOWER(
        COALESCE(series_title, '') || ' ' ||
        COALESCE(episode_title, '') || ' ' ||
        COALESCE(file_name, '') || ' ' ||
        COALESCE(genre, '')
      ) LIKE ANY($1::text[])
    GROUP BY
      COALESCE(series_library_id::text, LOWER(series_title)),
      series_title
    ORDER BY
      series_title ASC
    LIMIT $2 OFFSET $3;
    `,
    [
      patterns,
      MENU_PAGE_SIZE,
      offset
    ]
  );

  const pageInfo =
    buildPageInfo(
      safePage,
      totalResult.rows[0]?.count || 0,
      `colsr_${collection.id}`
    );

  return {
    rows: rowsResult.rows || [],
    pageInfo
  };
}

function buildCollectionsShelfText(rows = []) {
  const lines =
    rows.length
      ? rows.map((collection, index) => {
          const parts = [];

          if (collection.movies) {
            parts.push(`🎬 ${collection.movies}`);
          }

          if (collection.series) {
            parts.push(`📺 ${collection.series}`);
          }

          return (
            `${index + 1}. ${collection.emoji} ${collection.title}\n` +
            `   ${parts.length ? parts.join(" · ") : "Keine Treffer"}`
          );
        }).join("\n\n")
      : "Keine Sammlungen gefunden.";

  return (
    `🏛 Sammlungen & Universen\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Legendäre Reihen, Franchises und Themenwelten.\n\n` +
    lines +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Wähle unten eine Sammlung aus.`
  );
}

function buildCollectionsShelfKeyboard(rows = []) {
  const keyboard = [];

  const buttons =
    rows.map((collection) => {
      return {
        text: `${collection.emoji} ${shortenButtonText(collection.title, 26)}`,
        callback_data: `public:col_${collection.id}`
      };
    });

  for (let i = 0; i < buttons.length; i += 2) {
    keyboard.push(buttons.slice(i, i + 2));
  }

  keyboard.push([
    {
      text: "🏠 Zurück zur Startseite",
      callback_data: "public:home"
    }
  ]);

  return {
    inline_keyboard: keyboard
  };
}

function buildCollectionDetailText(collection, movies = [], series = []) {
  const movieText =
    movies.length
      ? movies.map(buildMovieMenuLine).join("\n\n")
      : "Keine Filme gefunden.";

  const seriesText =
    series.length
      ? series.map(buildSeriesMenuLine).join("\n\n")
      : "Keine Serien gefunden.";

  return (
    `${collection.emoji} ${collection.title}\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `🎬 Filme\n\n` +
    movieText +
    `\n\n━━━━━━━━━━━━━━━━━━\n\n` +
    `📺 Serien\n\n` +
    seriesText +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Tippe unten auf einen Titel oder gehe zurück zu den Sammlungen.`
  );
}

function buildBackToCollectionKeyboard(collectionId) {
  return {
    inline_keyboard: [
      [
        {
          text: "🏛 Zurück zur Sammlung",
          callback_data: `public:col_${collectionId}`
        }
      ],
      [
        {
          text: "🏛 Alle Sammlungen",
          callback_data: "public:collections_shelf"
        }
      ],
      [
        {
          text: "🏠 Startseite",
          callback_data: "public:home"
        }
      ]
    ]
  };
}

function buildCollectionDetailKeyboard(collection, movies = [], series = []) {
  const keyboard = [];

  keyboard.push([
    {
      text: "🎬 Alle Filme anzeigen",
      callback_data: `public:colmv_${collection.id}_1`
    }
  ]);

  keyboard.push([
    {
      text: "📺 Alle Serien anzeigen",
      callback_data: `public:colsr_${collection.id}_1`
    }
  ]);

  for (const [index, movie] of movies.slice(0, 6).entries()) {
    keyboard.push([
      {
        text: `🎬 ${index + 1}. ${shortenButtonText(movie.title || "Film", 34)}`,
        callback_data: `public:hm_${movie.id}`
      }
    ]);
  }

  for (const [index, item] of series.slice(0, 6).entries()) {
    const ref =
      item.series_ref ||
      item.series_library_id ||
      item.id;

    keyboard.push([
      {
        text: `📺 ${index + 1}. ${shortenButtonText(item.series_title || "Serie", 34)}`,
        callback_data: `public:sd_${ref}`
      }
    ]);
  }

  keyboard.push([
    {
      text: "🏛 Zurück zu Sammlungen",
      callback_data: "public:collections_shelf"
    }
  ]);

  keyboard.push([
    {
      text: "🏠 Startseite",
      callback_data: "public:home"
    }
  ]);

  return {
    inline_keyboard: keyboard
  };
}

async function safeAdminCount(pgPool, sql, params = []) {
  try {
    const result =
      await pgPool.query(sql, params);

    return Number(result.rows[0]?.count || 0);
  } catch (err) {
    console.error("❌ Admin count error:", err.message);
    return null;
  }
}

function formatAdminCount(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  return Number(value || 0).toLocaleString("de-DE");
}

async function getAdminDashboardStats(pgPool) {
  const [
    movies,
    series,
    episodes,
    uhdMovies,
    movieDupeGroups,
    seriesDupeGroups,
    possibleWrongMovies,
    trashItems,
    usersTotal,
    usersApproved,
    usersPending,
    usersBlocked,
    usageToday
  ] = await Promise.all([
    safeAdminCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM movies;
      `
    ),

    safeAdminCount(
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

    safeAdminCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM series;
      `
    ),

    safeAdminCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM movies
      WHERE
        quality ILIKE '%UHD%'
        OR quality ILIKE '%4K%'
        OR resolution ILIKE '3840%'
        OR resolution ILIKE '2160%'
        OR file_name ILIKE '%2160p%'
        OR file_name ILIKE '%uhd%'
        OR file_name ILIKE '%4k%';
      `
    ),

    safeAdminCount(
      pgPool,
      `
      WITH duplicate_groups AS (
        SELECT
          LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')) AS normalized_title,
          COALESCE(year::text, '') AS movie_year,
          COUNT(*)::int AS amount
        FROM movies
        WHERE title IS NOT NULL
          AND TRIM(title) <> ''
        GROUP BY
          LOWER(REGEXP_REPLACE(TRIM(title), '\\s+', ' ', 'g')),
          COALESCE(year::text, '')
        HAVING COUNT(*) > 1
      )
      SELECT COUNT(*)::int AS count
      FROM duplicate_groups;
      `
    ),

    safeAdminCount(
      pgPool,
      `
      WITH duplicate_groups AS (
        SELECT
          COALESCE(series_library_id::text, LOWER(series_title)) AS series_key,
          season::text AS season,
          episode::text AS episode,
          COUNT(*)::int AS amount
        FROM series
        WHERE series_title IS NOT NULL
          AND TRIM(series_title) <> ''
          AND season IS NOT NULL
          AND episode IS NOT NULL
        GROUP BY
          COALESCE(series_library_id::text, LOWER(series_title)),
          season::text,
          episode::text
        HAVING COUNT(*) > 1
      )
      SELECT COUNT(*)::int AS count
      FROM duplicate_groups;
      `
    ),

    safeAdminCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM movies
      WHERE
        file_name ~* '(s[0-9]{1,2}e[0-9]{1,2})'
        OR file_name ~* '([0-9]{1,2}x[0-9]{1,2})'
        OR title ~* '(s[0-9]{1,2}e[0-9]{1,2})'
        OR title ~* '([0-9]{1,2}x[0-9]{1,2})';
      `
    ),

    safeAdminCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM deleted_library_items;
      `
    ),

    safeAdminCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM bot_users;
      `
    ),

    safeAdminCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM bot_users
      WHERE status = 'approved';
      `
    ),

    safeAdminCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM bot_users
      WHERE status = 'pending';
      `
    ),

    safeAdminCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM bot_users
      WHERE status = 'blocked';
      `
    ),

    safeAdminCount(
      pgPool,
      `
      SELECT COUNT(*)::int AS count
      FROM bot_usage_logs
      WHERE created_at::date = CURRENT_DATE;
      `
    )
  ]);

  return {
    movies,
    series,
    episodes,
    uhdMovies,
    movieDupeGroups,
    seriesDupeGroups,
    possibleWrongMovies,
    trashItems,
    usersTotal,
    usersApproved,
    usersPending,
    usersBlocked,
    usageToday
  };
}

function buildAdminDashboardText(stats) {
  return (
    `🛠 Admin-Dashboard\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Archiv-Status\n\n` +
    `🎬 Filme: ${formatAdminCount(stats.movies)}\n` +
    `📺 Serien: ${formatAdminCount(stats.series)}\n` +
    `🎞 Folgen: ${formatAdminCount(stats.episodes)}\n` +
    `💎 4K / UHD: ${formatAdminCount(stats.uhdMovies)}\n\n` +
    `Qualitätskontrolle\n\n` +
    `🧹 Film-Duplikatgruppen: ${formatAdminCount(stats.movieDupeGroups)}\n` +
    `🧩 Serien-Duplikatgruppen: ${formatAdminCount(stats.seriesDupeGroups)}\n` +
    `⚠️ Mögliche Fehlimporte: ${formatAdminCount(stats.possibleWrongMovies)}\n` +
    `🗑 Papierkorb: ${formatAdminCount(stats.trashItems)}\n\n` +
    `User & Nutzung\n\n` +
    `👥 User gesamt: ${formatAdminCount(stats.usersTotal)}\n` +
    `✅ Freigeschaltet: ${formatAdminCount(stats.usersApproved)}\n` +
    `🕓 Offen: ${formatAdminCount(stats.usersPending)}\n` +
    `⛔ Gesperrt: ${formatAdminCount(stats.usersBlocked)}\n` +
    `📦 Heute geholt: ${formatAdminCount(stats.usageToday)}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `Wähle unten einen Admin-Bereich aus.`
  );
}

function buildAdminDashboardKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "🔁 Aktualisieren",
          callback_data: "public:admin_dashboard"
        }
      ],
      [
        {
          text: "🧹 Duplikate",
          callback_data: "public:admin_dupes"
        },
        {
          text: "⚠️ Fehlimporte",
          callback_data: "public:admin_wrong"
        }
      ],
      [
        {
          text: "🗑 Papierkorb",
          callback_data: "public:admin_trash"
        },
        {
          text: "👥 User",
          callback_data: "public:admin_users"
        }
      ],
      [
        {
          text: "📊 Nutzung",
          callback_data: "public:admin_usage"
        },
        {
          text: "🧪 System",
          callback_data: "public:admin_system"
        }
      ],
      [
        {
          text: "🏠 Startseite",
          callback_data: "public:home"
        }
      ]
    ]
  };
}

function buildBackToAdminKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "🛠 Zurück zum Admin-Dashboard",
          callback_data: "public:admin_dashboard"
        }
      ],
      [
        {
          text: "🏠 Startseite",
          callback_data: "public:home"
        }
      ]
    ]
  };
}

function buildAdminDupesText(stats) {
  return (
    `🧹 Duplikat-Zentrale\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Aktueller Stand:\n\n` +
    `🎬 Film-Duplikatgruppen: ${formatAdminCount(stats.movieDupeGroups)}\n` +
    `🧩 Serien-Duplikatgruppen: ${formatAdminCount(stats.seriesDupeGroups)}\n\n` +
    `Befehle:\n\n` +
    `/dupes\n` +
    `/dupes movies\n` +
    `/dupes series\n` +
    `/dupe TITEL\n\n` +
    `Bereinigung:\n\n` +
    `/trashdupemovie keep ID remove ID\n` +
    `/trashdupemovie keep ID remove ID confirm\n\n` +
    `/trashdupeepisode keep ID remove ID\n` +
    `/trashdupeepisode keep ID remove ID confirm`
  );
}

function buildAdminWrongText(stats) {
  return (
    `⚠️ Fehlimport-Zentrale\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Mögliche Fehlimporte in movies:\n\n` +
    `🎬 Verdächtige Filme: ${formatAdminCount(stats.possibleWrongMovies)}\n\n` +
    `Befehle:\n\n` +
    `/wrongimports\n` +
    `/wrongmovies\n` +
    `/wrongmovie ID\n` +
    `/wrongmovie TITEL\n\n` +
    `Entfernen:\n\n` +
    `/trashwrong ID confirm\n\n` +
    `Hinweis:\n` +
    `Verdächtig sind Filme, deren Dateiname wie eine Serienfolge aussieht.`
  );
}

async function getAdminWrongMovieRows(pgPool, limit = 10) {
  const cleanLimit =
    Math.max(1, Math.min(Number(limit) || 10, 20));

  const result = await pgPool.query(
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
      file_name,
      created_at
    FROM movies
    WHERE
      file_name ~* '(s[0-9]{1,2}e[0-9]{1,2})'
      OR file_name ~* '([0-9]{1,2}x[0-9]{1,2})'
      OR title ~* '(s[0-9]{1,2}e[0-9]{1,2})'
      OR title ~* '([0-9]{1,2}x[0-9]{1,2})'
    ORDER BY
      created_at DESC NULLS LAST,
      id DESC
    LIMIT $1;
    `,
    [
      cleanLimit
    ]
  );

  return result.rows || [];
}

function buildAdminWrongLiveText(rows = []) {
  const lines =
    rows.length
      ? rows.map((movie, index) => {
          const meta =
            [
              movie.quality,
              movie.resolution,
              movie.file_size,
              movie.runtime ? `${movie.runtime} Min.` : ""
            ]
              .map((v) => String(v || "").trim())
              .filter(Boolean)
              .join(" · ");

          return (
            `${index + 1}. 🎬 ${movie.title || "Unbekannter Titel"}${movie.year ? ` (${movie.year})` : ""}\n` +
            `   🆔 Movie-ID: ${movie.id}\n` +
            `   🏷 ${movie.library_id || "Keine Library-ID"}\n` +
            `   ${meta || "Keine technischen Daten"}\n` +
            `   📁 ${shortenButtonText(movie.file_name || "Keine Datei", 70)}`
          );
        }).join("\n\n")
      : "Keine verdächtigen Fehlimporte gefunden.";

  return (
    `⚠️ Fehlimporte · Live-Liste\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Verdächtig sind Filme, deren Dateiname wie eine Serienfolge aussieht.\n\n` +
    lines +
    `\n\n━━━━━━━━━━━━━━━━━━\n` +
    `Nutze unten die Buttons zum Prüfen oder Entfernen.`
  );
}

function buildAdminWrongLiveKeyboard(rows = []) {
  const keyboard = [];

  for (const movie of rows.slice(0, 10)) {
    keyboard.push([
      {
        text: `🔎 Prüfen ${movie.id}`,
        callback_data: `public:adm_wrong_check_${movie.id}`
      },
      {
        text: `🗑 Entfernen ${movie.id}`,
        callback_data: `public:adm_wrong_ask_${movie.id}`
      }
    ]);
  }

  keyboard.push([
    {
      text: "🔁 Aktualisieren",
      callback_data: "public:admin_wrong"
    }
  ]);

  keyboard.push([
    {
      text: "🛠 Zurück zum Admin-Dashboard",
      callback_data: "public:admin_dashboard"
    }
  ]);

  keyboard.push([
    {
      text: "🏠 Startseite",
      callback_data: "public:home"
    }
  ]);

  return {
    inline_keyboard: keyboard
  };
}

async function getAdminWrongMovieById(pgPool, movieId) {
  const result = await pgPool.query(
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
      genre,
      file_name,
      created_at
    FROM movies
    WHERE id::text = $1::text
    LIMIT 1;
    `,
    [
      String(movieId)
    ]
  );

  return result.rows[0] || null;
}

function buildAdminWrongCheckText(movie) {
  if (!movie) {
    return (
      `⚠️ Fehlimport prüfen\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Eintrag nicht gefunden.`
    );
  }

  return (
    `⚠️ Fehlimport prüfen\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `🎬 Titel:\n` +
    `${movie.title || "Unbekannt"}${movie.year ? ` (${movie.year})` : ""}\n\n` +
    `🆔 Movie-ID:\n` +
    `${movie.id}\n\n` +
    `🏷 Library-ID:\n` +
    `${movie.library_id || "—"}\n\n` +
    `📂 Genre:\n` +
    `${movie.genre || "—"}\n\n` +
    `🔥 Qualität:\n` +
    `${movie.quality || "—"} · ${movie.resolution || "—"} · ${movie.file_size || "—"}\n\n` +
    `📁 Datei:\n` +
    `${movie.file_name || "—"}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `Wenn das wirklich eine Serienfolge ist, kannst du sie in den Papierkorb verschieben.`
  );
}

function buildAdminWrongCheckKeyboard(movieId) {
  return {
    inline_keyboard: [
      [
        {
          text: "🗑 Entfernen vorbereiten",
          callback_data: `public:adm_wrong_ask_${movieId}`
        }
      ],
      [
        {
          text: "⚠️ Zurück zu Fehlimporten",
          callback_data: "public:admin_wrong"
        }
      ],
      [
        {
          text: "🛠 Admin-Dashboard",
          callback_data: "public:admin_dashboard"
        }
      ],
      [
        {
          text: "🏠 Startseite",
          callback_data: "public:home"
        }
      ]
    ]
  };
}

function buildAdminWrongConfirmText(movie) {
  if (!movie) {
    return (
      `🗑 Fehlimport entfernen\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `Eintrag nicht gefunden.`
    );
  }

  return (
    `🗑 Fehlimport entfernen?\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Dieser Eintrag wird nicht endgültig gelöscht, sondern in deinen Papierkorb verschoben.\n\n` +
    `🎬 ${movie.title || "Unbekannt"}${movie.year ? ` (${movie.year})` : ""}\n` +
    `🆔 Movie-ID: ${movie.id}\n` +
    `📁 ${movie.file_name || "—"}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `Bitte nur bestätigen, wenn es wirklich ein Fehlimport ist.`
  );
}

function buildAdminWrongConfirmKeyboard(movieId) {
  return {
    inline_keyboard: [
      [
        {
          text: "✅ Ja, entfernen",
          callback_data: `public:adm_wrong_confirm_${movieId}`
        }
      ],
      [
        {
          text: "❌ Abbrechen",
          callback_data: "public:admin_wrong"
        }
      ],
      [
        {
          text: "🛠 Admin-Dashboard",
          callback_data: "public:admin_dashboard"
        }
      ]
    ]
  };
}

function buildAdminTrashText(stats) {
  return (
    `🗑 Papierkorb\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Aktueller Stand:\n\n` +
    `🗑 Einträge im Papierkorb: ${formatAdminCount(stats.trashItems)}\n\n` +
    `Befehle:\n\n` +
    `/trashlist\n` +
    `/trashmovie ID confirm\n` +
    `/trashepisode ID confirm\n\n` +
    `Wiederherstellen:\n\n` +
    `/restoremovie ID\n` +
    `/restoreepisode ID`
  );
}

function buildAdminUsersText(stats) {
  return (
    `👥 User-Zentrale\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Aktueller Stand:\n\n` +
    `👥 User gesamt: ${formatAdminCount(stats.usersTotal)}\n` +
    `✅ Freigeschaltet: ${formatAdminCount(stats.usersApproved)}\n` +
    `🕓 Offen: ${formatAdminCount(stats.usersPending)}\n` +
    `⛔ Gesperrt: ${formatAdminCount(stats.usersBlocked)}\n\n` +
    `Befehle:\n\n` +
    `/users\n` +
    `/users pending\n` +
    `/users approved\n` +
    `/users blocked\n\n` +
    `User verwalten:\n\n` +
    `/userinfo USER_ID\n` +
    `/freigeben USER_ID\n` +
    `/sperren USER_ID\n` +
    `/entfernen USER_ID`
  );
}

function buildAdminUsageText(stats) {
  return (
    `📊 Nutzung\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Heute:\n\n` +
    `📦 Hol-Vorgänge: ${formatAdminCount(stats.usageToday)}\n\n` +
    `Befehle:\n\n` +
    `/usage USER_ID\n` +
    `/userverlauf USER_ID\n\n` +
    `User-Limits:\n\n` +
    `/setlimit USER_ID filme 5\n` +
    `/setlimit USER_ID folgen 10\n` +
    `/setlimit USER_ID staffeln 2\n` +
    `/setrole USER_ID member\n` +
    `/setrole USER_ID vip`
  );
}

function buildAdminSystemText(stats) {
  return (
    `🧪 System\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Archiv:\n\n` +
    `🎬 Filme: ${formatAdminCount(stats.movies)}\n` +
    `📺 Serien: ${formatAdminCount(stats.series)}\n` +
    `🎞 Folgen: ${formatAdminCount(stats.episodes)}\n\n` +
    `Wichtige Befehle:\n\n` +
    `/dashboard\n` +
    `/pgstats\n` +
    `/queue\n\n` +
    `Rebuild / Reparatur:\n\n` +
    `/rebuildmovieindex\n` +
    `/rebuildcollections\n` +
    `/repairmovies\n` +
    `/seriesaudit TITEL\n` +
    `/seriesclusters ID`
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

  // =============================
  // NETFLIX HOME / INFO SCREENS
  // =============================

  if (action === "home") {
    await bot.answerCallbackQuery(callback.id, {
      text: "🏠 Startseite"
    });

    await editNetflixHomeMenu(
      bot,
      callback,
      pgPool
    );

    return true;
  }
  
    if (action === "movies_shelf") {
    const user = await getBotUser(pgPool, from.id);

    if (!isAdmin(from.id) && (!user || user.status !== "approved")) {
      await bot.answerCallbackQuery(callback.id, {
        text: "⛔ Du bist noch nicht freigeschaltet.",
        show_alert: true
      });
      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: "🎬 Film-Regal"
    });

    const stats =
      await getMovieShelfStats(pgPool);

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildMovieShelfText(stats),
      buildShelfKeyboard("movies")
    );

    return true;
  }

  if (action === "series_shelf") {
    const user = await getBotUser(pgPool, from.id);

    if (!isAdmin(from.id) && (!user || user.status !== "approved")) {
      await bot.answerCallbackQuery(callback.id, {
        text: "⛔ Du bist noch nicht freigeschaltet.",
        show_alert: true
      });
      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: "📺 Serien-Regal"
    });

    const stats =
      await getSeriesShelfStats(pgPool);

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildSeriesShelfText(stats),
      buildShelfKeyboard("series")
    );

    return true;
  }
  
    // =============================
  // COLLECTIONS / UNIVERSES
  // =============================

  if (action === "collections_shelf") {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    await bot.answerCallbackQuery(callback.id, {
      text: "🏛 Sammlungen"
    });

    const rows =
      await getCollectionsOverview(pgPool);

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildCollectionsShelfText(rows),
      buildCollectionsShelfKeyboard(rows)
    );

    return true;
  }

  if (action.startsWith("col_")) {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    const collectionId =
      action.replace(/^col_/, "").trim();

    const collection =
      getCollectionDefinition(collectionId);

    if (!collection) {
      await bot.answerCallbackQuery(callback.id, {
        text: "❌ Sammlung nicht gefunden.",
        show_alert: true
      });

      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: `${collection.emoji} ${collection.title}`
    });

    const [movies, series] = await Promise.all([
      getCollectionMovieRows(pgPool, collection, 8),
      getCollectionSeriesRows(pgPool, collection, 8)
    ]);

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildCollectionDetailText(collection, movies, series).slice(0, 3900),
      buildCollectionDetailKeyboard(collection, movies, series)
    );

    return true;
  }
  
    // =============================
  // COLLECTION DETAIL PAGES
  // colmv = collection movies
  // colsr = collection series
  // =============================

  if (action.startsWith("colmv_")) {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    const parts =
      action.split("_");

    const collectionId =
      parts[1];

    const page =
      normalizePage(parts[2] || 1);

    const collection =
      getCollectionDefinition(collectionId);

    if (!collection) {
      await bot.answerCallbackQuery(callback.id, {
        text: "❌ Sammlung nicht gefunden.",
        show_alert: true
      });

      return true;
    }

    const result =
      await getCollectionMoviePage(pgPool, collection, page);

    await bot.answerCallbackQuery(callback.id, {
      text: `${collection.emoji} ${collection.title} · Filme · Seite ${result.pageInfo.page}`
    });

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildMovieListScreen(
        `${collection.emoji} ${collection.title} · Filme`,
        result.rows,
        result.pageInfo
      ),
      buildMovieResultKeyboard(
        result.rows,
        buildBackToCollectionKeyboard(collection.id),
        result.pageInfo
      )
    );

    return true;
  }

  if (action.startsWith("colsr_")) {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    const parts =
      action.split("_");

    const collectionId =
      parts[1];

    const page =
      normalizePage(parts[2] || 1);

    const collection =
      getCollectionDefinition(collectionId);

    if (!collection) {
      await bot.answerCallbackQuery(callback.id, {
        text: "❌ Sammlung nicht gefunden.",
        show_alert: true
      });

      return true;
    }

    const result =
      await getCollectionSeriesPage(pgPool, collection, page);

    await bot.answerCallbackQuery(callback.id, {
      text: `${collection.emoji} ${collection.title} · Serien · Seite ${result.pageInfo.page}`
    });

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildSeriesListScreen(
        `${collection.emoji} ${collection.title} · Serien`,
        result.rows,
        result.pageInfo
      ),
      buildSeriesResultKeyboard(
        result.rows,
        buildBackToCollectionKeyboard(collection.id),
        result.pageInfo
      )
    );

    return true;
  }
  
    // =============================
  // MOVIE / SERIES SHELF SUBPAGES
  // =============================

  if (action === "new_movies") {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    await bot.answerCallbackQuery(callback.id, {
      text: "▶️ Neue Filme"
    });

        const result =
      await getLatestMovieMenuPage(pgPool, 1);

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildMovieListScreen("▶️ Neue Filme", result.rows, result.pageInfo),
      buildMovieResultKeyboard(
        result.rows,
        buildBackToShelfKeyboard("movies"),
        result.pageInfo
      )
    );

    return true;
  }

  if (action === "uhd_movies") {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    await bot.answerCallbackQuery(callback.id, {
      text: "💎 4K / UHD"
    });

        const result =
      await getUhdMovieMenuPage(pgPool, 1);

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildMovieListScreen("💎 4K / UHD Filme", result.rows, result.pageInfo),
      buildMovieResultKeyboard(
        result.rows,
        buildBackToShelfKeyboard("movies"),
        result.pageInfo
      )
    );

    return true;
  }

  if (action === "az_movies") {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    await bot.answerCallbackQuery(callback.id, {
      text: "🔤 Filme A–Z"
    });

    const rows =
      await getMovieAzMenuRows(pgPool);

        await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildAzScreen("🔤 Filme A–Z", rows, "movies"),
      buildAzButtonsKeyboard("movies")
    );

    return true;
  }

  if (action === "genres_movies") {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    await bot.answerCallbackQuery(callback.id, {
      text: "📂 Film-Kategorien"
    });

    const rows =
      await getMovieGenreMenuRows(pgPool, 20);

        await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildGenreScreen("📂 Film-Kategorien", rows, "movies"),
      buildGenreButtonsKeyboard("movies", rows)
    );

    return true;
  }

  if (action === "years_movies") {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    await bot.answerCallbackQuery(callback.id, {
      text: "📅 Film-Jahre"
    });

    const rows =
      await getMovieYearMenuRows(pgPool, 20);

        await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildYearScreen("📅 Filme nach Jahren", rows, "movies"),
      buildYearButtonsKeyboard("movies", rows)
    );

    return true;
  }

  if (action === "random_movies") {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    await bot.answerCallbackQuery(callback.id, {
      text: "🎲 Film-Zufall"
    });

    await sendRandomLibraryMessage(
      bot,
      chatId,
      messageId,
      pgPool,
      "movie"
    );

    return true;
  }

  if (action === "search_movies_help") {
    await bot.answerCallbackQuery(callback.id, {
      text: "🔎 Filme suchen"
    });

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildMovieSearchHelpText(),
      buildBackToShelfKeyboard("movies")
    );

    return true;
  }
  
    // =============================
  // PAGINATION BUTTONS
  // =============================

  if (action === "noop") {
    await bot.answerCallbackQuery(callback.id, {
      text: "📄 Seitenanzeige"
    });

    return true;
  }

  if (action.startsWith("pg_")) {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    const parts =
      action.split("_");

    const type =
      parts[1];

    if (type === "newm") {
      const page =
        normalizePage(parts[2]);

      const result =
        await getLatestMovieMenuPage(pgPool, page);

      await bot.answerCallbackQuery(callback.id, {
        text: `▶️ Neue Filme · Seite ${result.pageInfo.page}`
      });

      await editPublicScreenWithKeyboard(
        bot,
        callback,
        buildMovieListScreen("▶️ Neue Filme", result.rows, result.pageInfo),
        buildMovieResultKeyboard(
          result.rows,
          buildBackToShelfKeyboard("movies"),
          result.pageInfo
        )
      );

      return true;
    }

    if (type === "uhd") {
      const page =
        normalizePage(parts[2]);

      const result =
        await getUhdMovieMenuPage(pgPool, page);

      await bot.answerCallbackQuery(callback.id, {
        text: `💎 4K / UHD · Seite ${result.pageInfo.page}`
      });

      await editPublicScreenWithKeyboard(
        bot,
        callback,
        buildMovieListScreen("💎 4K / UHD Filme", result.rows, result.pageInfo),
        buildMovieResultKeyboard(
          result.rows,
          buildBackToShelfKeyboard("movies"),
          result.pageInfo
        )
      );

      return true;
    }

    if (type === "news") {
      const page =
        normalizePage(parts[2]);

      const result =
        await getLatestSeriesMenuPage(pgPool, page);

      await bot.answerCallbackQuery(callback.id, {
        text: `▶️ Neue Serien · Seite ${result.pageInfo.page}`
      });

      await editPublicScreenWithKeyboard(
        bot,
        callback,
        buildSeriesListScreen("▶️ Neue Serienbereiche", result.rows, result.pageInfo),
        buildSeriesResultKeyboard(
          result.rows,
          buildBackToShelfKeyboard("series"),
          result.pageInfo
        )
      );

      return true;
    }

    if (type === "gm") {
      const index =
        Number(parts[2]);

      const page =
        normalizePage(parts[3]);

      const genres =
        await getMovieGenreMenuRows(pgPool, 20);

      const selected =
        genres[index];

      if (!selected) {
        await bot.answerCallbackQuery(callback.id, {
          text: "❌ Kategorie nicht gefunden.",
          show_alert: true
        });
        return true;
      }

      const result =
        await getMoviesByGenreButtonPage(pgPool, selected.genre, page);

      result.pageInfo.baseAction = `pg_gm_${index}`;

      await bot.answerCallbackQuery(callback.id, {
        text: `📂 ${selected.genre} · Seite ${result.pageInfo.page}`
      });

      await editPublicScreenWithKeyboard(
        bot,
        callback,
        buildMovieListScreen(`📂 Filme: ${selected.genre}`, result.rows, result.pageInfo),
        buildMovieResultKeyboard(
          result.rows,
          buildBackToCategoryKeyboard("movies"),
          result.pageInfo
        )
      );

      return true;
    }

    if (type === "gs") {
      const index =
        Number(parts[2]);

      const page =
        normalizePage(parts[3]);

      const genres =
        await getSeriesGenreMenuRows(pgPool, 20);

      const selected =
        genres[index];

      if (!selected) {
        await bot.answerCallbackQuery(callback.id, {
          text: "❌ Kategorie nicht gefunden.",
          show_alert: true
        });
        return true;
      }

      const result =
        await getSeriesByGenreButtonPage(pgPool, selected.genre, page);

      result.pageInfo.baseAction = `pg_gs_${index}`;

      await bot.answerCallbackQuery(callback.id, {
        text: `📂 ${selected.genre} · Seite ${result.pageInfo.page}`
      });

      await editPublicScreenWithKeyboard(
        bot,
        callback,
        buildSeriesListScreen(`📂 Serien: ${selected.genre}`, result.rows, result.pageInfo),
        buildSeriesResultKeyboard(
          result.rows,
          buildBackToCategoryKeyboard("series"),
          result.pageInfo
        )
      );

      return true;
    }

    if (type === "am") {
      const rawLetter =
        parts[2];

      const page =
        normalizePage(parts[3]);

      const letter =
        rawLetter === "HASH"
          ? "#"
          : rawLetter.toUpperCase();

      const result =
        await getMoviesByAzButtonPage(pgPool, letter, page);

      result.pageInfo.baseAction = `pg_am_${rawLetter}`;

      await bot.answerCallbackQuery(callback.id, {
        text: `🔤 Filme ${letter} · Seite ${result.pageInfo.page}`
      });

      await editPublicScreenWithKeyboard(
        bot,
        callback,
        buildMovieListScreen(`🔤 Filme: ${letter}`, result.rows, result.pageInfo),
        buildMovieResultKeyboard(
          result.rows,
          buildBackToAzKeyboard("movies"),
          result.pageInfo
        )
      );

      return true;
    }

    if (type === "as") {
      const rawLetter =
        parts[2];

      const page =
        normalizePage(parts[3]);

      const letter =
        rawLetter === "HASH"
          ? "#"
          : rawLetter.toUpperCase();

      const result =
        await getSeriesByAzButtonPage(pgPool, letter, page);

      result.pageInfo.baseAction = `pg_as_${rawLetter}`;

      await bot.answerCallbackQuery(callback.id, {
        text: `🔤 Serien ${letter} · Seite ${result.pageInfo.page}`
      });

      await editPublicScreenWithKeyboard(
        bot,
        callback,
        buildSeriesListScreen(`🔤 Serien: ${letter}`, result.rows, result.pageInfo),
        buildSeriesResultKeyboard(
          result.rows,
          buildBackToAzKeyboard("series"),
          result.pageInfo
        )
      );

      return true;
    }

    if (type === "ym") {
      const year =
        parts[2];

      const page =
        normalizePage(parts[3]);

      const result =
        await getMoviesByYearButtonPage(pgPool, year, page);

      result.pageInfo.baseAction = `pg_ym_${year}`;

      await bot.answerCallbackQuery(callback.id, {
        text: `📅 Filme ${year} · Seite ${result.pageInfo.page}`
      });

      await editPublicScreenWithKeyboard(
        bot,
        callback,
        buildMovieListScreen(`📅 Filme: ${year}`, result.rows, result.pageInfo),
        buildMovieResultKeyboard(
          result.rows,
          buildBackToYearKeyboard("movies"),
          result.pageInfo
        )
      );

      return true;
    }

    if (type === "ys") {
      const year =
        parts[2];

      const page =
        normalizePage(parts[3]);

      const result =
        await getSeriesByYearButtonPage(pgPool, year, page);

      result.pageInfo.baseAction = `pg_ys_${year}`;

      await bot.answerCallbackQuery(callback.id, {
        text: `📅 Serien ${year} · Seite ${result.pageInfo.page}`
      });

      await editPublicScreenWithKeyboard(
        bot,
        callback,
        buildSeriesListScreen(`📅 Serien: ${year}`, result.rows, result.pageInfo),
        buildSeriesResultKeyboard(
          result.rows,
          buildBackToYearKeyboard("series"),
          result.pageInfo
        )
      );

      return true;
    }
  }

  if (action === "hol_movies_help") {
    await bot.answerCallbackQuery(callback.id, {
      text: "📦 Film holen"
    });

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildMovieHolHelpText(),
      buildBackToShelfKeyboard("movies")
    );

    return true;
  }

  if (action === "new_series") {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    await bot.answerCallbackQuery(callback.id, {
      text: "▶️ Neue Serien"
    });

        const result =
      await getLatestSeriesMenuPage(pgPool, 1);

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildSeriesListScreen("▶️ Neue Serienbereiche", result.rows, result.pageInfo),
      buildSeriesResultKeyboard(
        result.rows,
        buildBackToShelfKeyboard("series"),
        result.pageInfo
      )
    );

    return true;
  }

  if (action === "az_series") {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    await bot.answerCallbackQuery(callback.id, {
      text: "🔤 Serien A–Z"
    });

    const rows =
      await getSeriesAzMenuRows(pgPool);

        await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildAzScreen("🔤 Serien A–Z", rows, "series"),
      buildAzButtonsKeyboard("series")
    );

    return true;
  }

  if (action === "genres_series") {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    await bot.answerCallbackQuery(callback.id, {
      text: "📂 Serien-Kategorien"
    });

    const rows =
      await getSeriesGenreMenuRows(pgPool, 20);

        await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildGenreScreen("📂 Serien-Kategorien", rows, "series"),
      buildGenreButtonsKeyboard("series", rows)
    );

    return true;
  }

  if (action === "years_series") {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    await bot.answerCallbackQuery(callback.id, {
      text: "📅 Serien-Jahre"
    });

    const rows =
      await getSeriesYearMenuRows(pgPool, 20);

        await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildYearScreen("📅 Serien nach Jahren", rows, "series"),
      buildYearButtonsKeyboard("series", rows)
    );

    return true;
  }

  if (action === "random_series") {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    await bot.answerCallbackQuery(callback.id, {
      text: "🎲 Serien-Zufall"
    });

    await sendRandomLibraryMessage(
      bot,
      chatId,
      messageId,
      pgPool,
      "series"
    );

    return true;
  }

  if (action === "search_series_help") {
    await bot.answerCallbackQuery(callback.id, {
      text: "🔎 Serien suchen"
    });

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildSeriesSearchHelpText(),
      buildBackToShelfKeyboard("series")
    );

    return true;
  }

  if (action === "hol_series_help") {
    await bot.answerCallbackQuery(callback.id, {
      text: "📦 Serie holen"
    });

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildSeriesHolHelpText(),
      buildBackToShelfKeyboard("series")
    );

    return true;
  }
  
    // =============================
  // BUTTON DETAIL PAGES
  // gm = genre movies, gs = genre series
  // am = A-Z movies, as = A-Z series
  // ym = year movies, ys = year series
  // =============================

  if (action.startsWith("gm_")) {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    const index =
      Number(action.replace(/^gm_/, ""));

    const genres =
      await getMovieGenreMenuRows(pgPool, 20);

    const selected =
      genres[index];

    if (!selected) {
      await bot.answerCallbackQuery(callback.id, {
        text: "❌ Kategorie nicht gefunden.",
        show_alert: true
      });
      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: `📂 ${selected.genre}`
    });

    const result =
  await getMoviesByGenreButtonPage(pgPool, selected.genre, 1);

result.pageInfo.baseAction = `pg_gm_${index}`;

    await editPublicScreenWithKeyboard(
  bot,
  callback,
  buildMovieListScreen(`📂 Filme: ${selected.genre}`, result.rows, result.pageInfo),
  buildMovieResultKeyboard(
    result.rows,
    buildBackToCategoryKeyboard("movies"),
    result.pageInfo
  )
);

    return true;
  }

  if (action.startsWith("gs_")) {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    const index =
      Number(action.replace(/^gs_/, ""));

    const genres =
      await getSeriesGenreMenuRows(pgPool, 20);

    const selected =
      genres[index];

    if (!selected) {
      await bot.answerCallbackQuery(callback.id, {
        text: "❌ Kategorie nicht gefunden.",
        show_alert: true
      });
      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: `📂 ${selected.genre}`
    });

    const result =
  await getSeriesByGenreButtonPage(pgPool, selected.genre, 1);

result.pageInfo.baseAction = `pg_gs_${index}`;

await editPublicScreenWithKeyboard(
  bot,
  callback,
  buildSeriesListScreen(`📂 Serien: ${selected.genre}`, result.rows, result.pageInfo),
  buildSeriesResultKeyboard(
    result.rows,
    buildBackToCategoryKeyboard("series"),
    result.pageInfo
  )
);

    return true;
  }

  if (action.startsWith("am_")) {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    const rawLetter =
      action.replace(/^am_/, "");

    const letter =
      rawLetter === "HASH"
        ? "#"
        : rawLetter.toUpperCase();

    await bot.answerCallbackQuery(callback.id, {
      text: `🔤 Filme ${letter}`
    });

    const result =
  await getMoviesByAzButtonPage(pgPool, letter, 1);

result.pageInfo.baseAction = `pg_am_${rawLetter}`;

await editPublicScreenWithKeyboard(
  bot,
  callback,
  buildMovieListScreen(`🔤 Filme: ${letter}`, result.rows, result.pageInfo),
  buildMovieResultKeyboard(
    result.rows,
    buildBackToAzKeyboard("movies"),
    result.pageInfo
  )
);

    return true;
  }

  if (action.startsWith("as_")) {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    const rawLetter =
      action.replace(/^as_/, "");

    const letter =
      rawLetter === "HASH"
        ? "#"
        : rawLetter.toUpperCase();

    await bot.answerCallbackQuery(callback.id, {
      text: `🔤 Serien ${letter}`
    });

    const result =
  await getSeriesByAzButtonPage(pgPool, letter, 1);

result.pageInfo.baseAction = `pg_as_${rawLetter}`;

await editPublicScreenWithKeyboard(
  bot,
  callback,
  buildSeriesListScreen(`🔤 Serien: ${letter}`, result.rows, result.pageInfo),
  buildSeriesResultKeyboard(
    result.rows,
    buildBackToAzKeyboard("series"),
    result.pageInfo
  )
);

    return true;
  }

  if (action.startsWith("ym_")) {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    const year =
      action.replace(/^ym_/, "");

    await bot.answerCallbackQuery(callback.id, {
      text: `📅 Filme ${year}`
    });

    const result =
  await getMoviesByYearButtonPage(pgPool, year, 1);

result.pageInfo.baseAction = `pg_ym_${year}`;

await editPublicScreenWithKeyboard(
  bot,
  callback,
  buildMovieListScreen(`📅 Filme: ${year}`, result.rows, result.pageInfo),
  buildMovieResultKeyboard(
    result.rows,
    buildBackToYearKeyboard("movies"),
    result.pageInfo
  )
);

    return true;
  }

  if (action.startsWith("ys_")) {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    const year =
      action.replace(/^ys_/, "");

    await bot.answerCallbackQuery(callback.id, {
      text: `📅 Serien ${year}`
    });

    const result =
  await getSeriesByYearButtonPage(pgPool, year, 1);

result.pageInfo.baseAction = `pg_ys_${year}`;

await editPublicScreenWithKeyboard(
  bot,
  callback,
  buildSeriesListScreen(`📅 Serien: ${year}`, result.rows, result.pageInfo),
  buildSeriesResultKeyboard(
    result.rows,
    buildBackToYearKeyboard("series"),
    result.pageInfo
  )
);

    return true;
  }
  
    // =============================
  // SERIES DETAIL / SEASON PAGES
  // sd = series detail
  // sl = season list
  // he = hol episode
  // hst = hol season
  // =============================

  if (action.startsWith("sd_")) {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    const seriesRef =
      action.replace(/^sd_/, "").trim();

    const rows =
      await getSeriesDetailRows(pgPool, seriesRef, 1000);

    if (!rows.length) {
      await bot.answerCallbackQuery(callback.id, {
        text: "❌ Serie nicht gefunden.",
        show_alert: true
      });

      return true;
    }

    const summary =
      getSeriesDetailSummary(rows, seriesRef);

    await bot.answerCallbackQuery(callback.id, {
      text: `📺 ${summary.title}`
    });

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildSeriesDetailText(summary),
      buildSeriesDetailKeyboard(summary)
    );

    return true;
  }

  if (action.startsWith("sl_")) {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    const parts =
      action.split("_");

    const seriesRef =
      parts[1];

    const season =
      Number(parts[2] || 1);

    const page =
      normalizePage(parts[3] || 1);

    const rows =
      await getSeriesDetailRows(pgPool, seriesRef, 1000);

    if (!rows.length) {
      await bot.answerCallbackQuery(callback.id, {
        text: "❌ Serie nicht gefunden.",
        show_alert: true
      });

      return true;
    }

    const summary =
      getSeriesDetailSummary(rows, seriesRef);

    const seasonRows =
      getSeasonRowsFromSeriesRows(rows, season);

    const pageResult =
      buildSeasonPage(seasonRows, page);

    await bot.answerCallbackQuery(callback.id, {
      text: `📀 Staffel ${season} · Seite ${pageResult.pageInfo.page}`
    });

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildSeasonDetailText(
        summary,
        season,
        pageResult.rows,
        pageResult.pageInfo
      ),
      buildSeasonDetailKeyboard(
        summary,
        season,
        pageResult.rows,
        pageResult.pageInfo
      )
    );

    return true;
  }

  if (action.startsWith("he_")) {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    const parts =
      action.split("_");

    const seriesRef =
      parts[1];

    const season =
      Number(parts[2] || 1);

    const episode =
      Number(parts[3] || 1);

    if (!seriesRef || !season || !episode) {
      await bot.answerCallbackQuery(callback.id, {
        text: "❌ Folge ungültig.",
        show_alert: true
      });

      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: `📺 S${pad2(season)}E${pad2(episode)} wird geholt.`
    });

    const fakeMsg = {
      text: `!hol serie ${seriesRef} s${season}e${episode}`,
      chat: {
        id: chatId
      },
      from,
      message_id: messageId
    };

    await handleLibraryHolCommands(
      bot,
      fakeMsg,
      pgPool
    );

    return true;
  }

  if (action.startsWith("hst_")) {
    const allowed = await ensurePublicCallbackAccess(bot, callback, pgPool);
    if (!allowed) return true;

    const parts =
      action.split("_");

    const seriesRef =
      parts[1];

    const season =
      Number(parts[2] || 1);

    if (!seriesRef || !season) {
      await bot.answerCallbackQuery(callback.id, {
        text: "❌ Staffel ungültig.",
        show_alert: true
      });

      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: `💿 Staffel ${season} wird geholt.`
    });

    const fakeMsg = {
      text: `!hol serie ${seriesRef} staffel ${season}`,
      chat: {
        id: chatId
      },
      from,
      message_id: messageId
    };

    await handleLibraryHolCommands(
      bot,
      fakeMsg,
      pgPool
    );

    return true;
  }
  
    // =============================
  // DIRECT HOL BUTTONS
  // hm = hol movie
  // hs = hol series S01E01
  // =============================

  if (action.startsWith("hm_")) {
    const movieId =
      action.replace(/^hm_/, "").trim();

    if (!movieId || !/^\d+$/.test(movieId)) {
      await bot.answerCallbackQuery(callback.id, {
        text: "❌ Film-ID ungültig.",
        show_alert: true
      });
      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: "🎬 Film wird geholt."
    });

    const fakeMsg = {
      text: `!hol movie ${movieId}`,
      chat: {
        id: chatId
      },
      from,
      message_id: messageId
    };

    await handleLibraryHolCommands(
      bot,
      fakeMsg,
      pgPool
    );

    return true;
  }

  if (action.startsWith("hs_")) {
    const seriesRef =
      action.replace(/^hs_/, "").trim();

    if (!seriesRef) {
      await bot.answerCallbackQuery(callback.id, {
        text: "❌ Serien-ID ungültig.",
        show_alert: true
      });
      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: "📺 Serie wird geöffnet."
    });

    const fakeMsg = {
      text: `!hol serie ${seriesRef} s1e1`,
      chat: {
        id: chatId
      },
      from,
      message_id: messageId
    };

    await handleLibraryHolCommands(
      bot,
      fakeMsg,
      pgPool
    );

    return true;
  }

  if (action === "search_help" || action === "searchhelp") {
    await bot.answerCallbackQuery(callback.id, {
      text: "🔎 Suche"
    });

    await editPublicInfoScreen(
      bot,
      callback,
      buildSearchHelpText()
    );

    return true;
  }

  if (action === "hol_help" || action === "holhelp") {
    await bot.answerCallbackQuery(callback.id, {
      text: "📦 Holen"
    });

    await editPublicInfoScreen(
      bot,
      callback,
      buildHolHelpText()
    );

    return true;
  }

  if (action === "uhd_help") {
    await bot.answerCallbackQuery(callback.id, {
      text: "💎 4K / UHD"
    });

    await editPublicInfoScreen(
      bot,
      callback,
      buildUhdHelpText()
    );

    return true;
  }

  if (action === "access_help") {
    await bot.answerCallbackQuery(callback.id, {
      text: "✅ Freischaltung"
    });

    await editPublicInfoScreen(
      bot,
      callback,
      buildAccessHelpText()
    );

    return true;
  }

  if (action === "id_help") {
    await bot.answerCallbackQuery(callback.id, {
      text: `Deine Telegram-ID: ${from.id}`,
      show_alert: true
    });

    return true;
  }

    if (action === "admin_help" || action === "admin_dashboard") {
    if (!isAdmin(from.id)) {
      await bot.answerCallbackQuery(callback.id, {
        text: "⛔ Nur Admins.",
        show_alert: true
      });

      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: "🛠 Admin-Dashboard"
    });

    const stats =
      await getAdminDashboardStats(pgPool);

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildAdminDashboardText(stats),
      buildAdminDashboardKeyboard()
    );

    return true;
  }
  
    if (
    action === "admin_dupes" ||
    action === "admin_wrong" ||
    action === "admin_trash" ||
    action === "admin_users" ||
    action === "admin_usage" ||
    action === "admin_system"
  ) {
    if (!isAdmin(from.id)) {
      await bot.answerCallbackQuery(callback.id, {
        text: "⛔ Nur Admins.",
        show_alert: true
      });

      return true;
    }

    const stats =
      await getAdminDashboardStats(pgPool);

    let text =
      buildAdminDashboardText(stats);

    let title =
      "🛠 Admin";

    if (action === "admin_dupes") {
      text = buildAdminDupesText(stats);
      title = "🧹 Duplikate";
    }

    if (action === "admin_wrong") {
  const rows =
    await getAdminWrongMovieRows(pgPool, 10);

  await bot.answerCallbackQuery(callback.id, {
    text: "⚠️ Fehlimporte"
  });

  await editPublicScreenWithKeyboard(
    bot,
    callback,
    buildAdminWrongLiveText(rows).slice(0, 3900),
    buildAdminWrongLiveKeyboard(rows)
  );

  return true;
}

    if (action === "admin_trash") {
      text = buildAdminTrashText(stats);
      title = "🗑 Papierkorb";
    }

    if (action === "admin_users") {
      text = buildAdminUsersText(stats);
      title = "👥 User";
    }

    if (action === "admin_usage") {
      text = buildAdminUsageText(stats);
      title = "📊 Nutzung";
    }

    if (action === "admin_system") {
      text = buildAdminSystemText(stats);
      title = "🧪 System";
    }

    await bot.answerCallbackQuery(callback.id, {
      text: title
    });

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      text.slice(0, 3900),
      buildBackToAdminKeyboard()
    );

    return true;
  }
  
    // =============================
  // ADMIN WRONG IMPORT ACTIONS
  // =============================

  if (action.startsWith("adm_wrong_check_")) {
    if (!isAdmin(from.id)) {
      await bot.answerCallbackQuery(callback.id, {
        text: "⛔ Nur Admins.",
        show_alert: true
      });

      return true;
    }

    const movieId =
      action.replace(/^adm_wrong_check_/, "").trim();

    const movie =
      await getAdminWrongMovieById(pgPool, movieId);

    await bot.answerCallbackQuery(callback.id, {
      text: `🔎 Prüfen ${movieId}`
    });

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildAdminWrongCheckText(movie).slice(0, 3900),
      buildAdminWrongCheckKeyboard(movieId)
    );

    return true;
  }

  if (action.startsWith("adm_wrong_ask_")) {
    if (!isAdmin(from.id)) {
      await bot.answerCallbackQuery(callback.id, {
        text: "⛔ Nur Admins.",
        show_alert: true
      });

      return true;
    }

    const movieId =
      action.replace(/^adm_wrong_ask_/, "").trim();

    const movie =
      await getAdminWrongMovieById(pgPool, movieId);

    await bot.answerCallbackQuery(callback.id, {
      text: `🗑 Entfernen ${movieId}`
    });

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildAdminWrongConfirmText(movie).slice(0, 3900),
      buildAdminWrongConfirmKeyboard(movieId)
    );

    return true;
  }

  if (action.startsWith("adm_wrong_confirm_")) {
    if (!isAdmin(from.id)) {
      await bot.answerCallbackQuery(callback.id, {
        text: "⛔ Nur Admins.",
        show_alert: true
      });

      return true;
    }

    const movieId =
      action.replace(/^adm_wrong_confirm_/, "").trim();

    await bot.answerCallbackQuery(callback.id, {
      text: `🗑 Wird entfernt: ${movieId}`
    });

    const fakeMsg = {
      text: `/trashwrong ${movieId} confirm`,
      chat: {
        id: chatId
      },
      from,
      message_id: messageId
    };

    await handleCleanupCommands(
      bot,
      fakeMsg,
      pgPool
    );

    const rows =
      await getAdminWrongMovieRows(pgPool, 10);

    await editPublicScreenWithKeyboard(
      bot,
      callback,
      buildAdminWrongLiveText(rows).slice(0, 3900),
      buildAdminWrongLiveKeyboard(rows)
    );

    return true;
  }

  // =============================
  // STREAMING-BUTTONS
  // =============================

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
      text: "▶️ Neu im Archiv wird angezeigt."
    });

    await sendLatestLibraryMessage(
      bot,
      chatId,
      messageId,
      pgPool
    );

    return true;
  }

  if (action === "popular") {
    const user = await getBotUser(pgPool, from.id);

    if (!isAdmin(from.id) && (!user || user.status !== "approved")) {
      await bot.answerCallbackQuery(callback.id, {
        text: "⛔ Du bist noch nicht freigeschaltet.",
        show_alert: true
      });
      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: "🔥 Beliebt wird angezeigt."
    });

    await sendPopularLibraryMessage(
      bot,
      chatId,
      messageId,
      pgPool
    );

    return true;
  }

  if (action === "random") {
    const user = await getBotUser(pgPool, from.id);

    if (!isAdmin(from.id) && (!user || user.status !== "approved")) {
      await bot.answerCallbackQuery(callback.id, {
        text: "⛔ Du bist noch nicht freigeschaltet.",
        show_alert: true
      });
      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: "🎲 Zufall wird angezeigt."
    });

    await sendRandomLibraryMessage(
      bot,
      chatId,
      messageId,
      pgPool,
      "mixed"
    );

    return true;
  }

  if (action === "genres") {
    const user = await getBotUser(pgPool, from.id);

    if (!isAdmin(from.id) && (!user || user.status !== "approved")) {
      await bot.answerCallbackQuery(callback.id, {
        text: "⛔ Du bist noch nicht freigeschaltet.",
        show_alert: true
      });
      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: "📂 Kategorien werden angezeigt."
    });

    await sendGenreListMessage(
      bot,
      chatId,
      messageId,
      pgPool
    );

    return true;
  }

  if (action === "years") {
    const user = await getBotUser(pgPool, from.id);

    if (!isAdmin(from.id) && (!user || user.status !== "approved")) {
      await bot.answerCallbackQuery(callback.id, {
        text: "⛔ Du bist noch nicht freigeschaltet.",
        show_alert: true
      });
      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: "📅 Jahre werden angezeigt."
    });

    await sendYearOverviewMessage(
      bot,
      chatId,
      messageId,
      pgPool
    );

    return true;
  }

  if (action === "az") {
    const user = await getBotUser(pgPool, from.id);

    if (!isAdmin(from.id) && (!user || user.status !== "approved")) {
      await bot.answerCallbackQuery(callback.id, {
        text: "⛔ Du bist noch nicht freigeschaltet.",
        show_alert: true
      });
      return true;
    }

    await bot.answerCallbackQuery(callback.id, {
      text: "🔤 A–Z wird angezeigt."
    });

    await sendAzOverviewMessage(
      bot,
      chatId,
      messageId,
      pgPool
    );

    return true;
  }

  // =============================
  // FAVORITES / HISTORY / LIMIT
  // =============================

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

  // =============================
  // OLD BUTTON COMPATIBILITY
  // =============================

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

    await upsertPendingUser(pgPool, from);

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