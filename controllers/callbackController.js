const { tg, answerCallback } = require("../services/telegramService");
const { handlePlay } = require("./playController");
const { getRecommendations } = require("../services/recommendationService");
const { loadDB } = require("../db/database");

// ================= MAIN =================

async function handleCallback(query) {

  try {

    const data = query.data;
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    console.log("⚡ CALLBACK:", data);

    // ✅ Telegram Loading entfernen
    await answerCallback(query.id);

    // ================= PLAY =================

    if (data.startsWith("play_")) {

      const id = data.replace("play_", "");

      return handlePlay(chatId, id);
    }

    // ================= NEXT / PREV (optional Navigation) =================

    if (data.startsWith("next_") || data.startsWith("prev_")) {

      // 👉 kannst du später erweitern
      return tg("sendMessage", {
        chat_id: chatId,
        text: "⚠️ Navigation kommt bald"
      });
    }

    // ================= SIMILAR (Placeholder) =================

    if (data.startsWith("sim_")) {

      return tg("sendMessage", {
        chat_id: chatId,
        text: "🔥 Ähnliche Inhalte kommen bald"
      });
    }

    // ================= FAVORITE (Placeholder) =================

    if (data.startsWith("fav_")) {

      return tg("sendMessage", {
        chat_id: chatId,
        text: "⭐ Favoriten Feature kommt bald"
      });
    }

    // ================= TOP PICKS (AI) =================

    if (data === "top_picks") {

      const recommendations = getRecommendations(chatId, 10);

      if (!recommendations.length) {
        return tg("sendMessage", {
          chat_id: chatId,
          text: "🤖 Noch keine Empfehlungen verfügbar"
        });
      }

      let text = "🧠 Empfehlungen für dich:\n\n";

      recommendations.forEach((item, i) => {
        text += `${i + 1}. ${item.title}\n`;
      });

      return tg("sendMessage", {
        chat_id: chatId,
        text
      });
    }

    // ================= MENU =================

    if (data === "menu") {

      return tg("sendMessage", {
        chat_id: chatId,
        text: "🏠 Hauptmenü",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🧠 Für dich", callback_data: "top_picks" }],
            [{ text: "🔥 Trending", callback_data: "trending" }]
          ]
        }
      });
    }

    // ================= TRENDING =================

    if (data === "trending") {

      const db = loadDB();

      if (!db.length) {
        return tg("sendMessage", {
          chat_id: chatId,
          text: "❌ Keine Inhalte vorhanden"
        });
      }

      const top = db.slice(0, 10);

      let text = "🔥 Trending:\n\n";

      top.forEach((item, i) => {
        text += `${i + 1}. ${item.title}\n`;
      });

      return tg("sendMessage", {
        chat_id: chatId,
        text
      });
    }

    // ================= UNKNOWN =================

    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Unbekannte Aktion"
    });

  } catch (err) {

    console.error("❌ CALLBACK ERROR:", err);

    return tg("sendMessage", {
      chat_id: query.message.chat.id,
      text: "❌ Fehler bei der Verarbeitung"
    });
  }
}

// ================= EXPORT =================

module.exports = handleCallback;