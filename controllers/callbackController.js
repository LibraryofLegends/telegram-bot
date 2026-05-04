const { tg, sendFileById, answerCallback } = require("../services/telegramService");
const { getRecommendations } = require("../services/recommendationAI");
const { loadDB } = require("../db/database");
const { loadSeriesDB, getNextEpisode } = require("../db/seriesDB");
const { setContinue } = require("../db/continueDB");
const { playerUrl } = require("../services/telegramService");

// ================= MAIN HANDLER =================

async function handleCallback(callback) {
  try {

    const data = callback.data;
    const chatId = callback.message.chat.id;
    const messageId = callback.message.message_id;
    const userId = callback.from.id;

    await answerCallback(callback.id);

    // ================= PLAY =================

    if (data.startsWith("play_")) {
      const id = data.replace("play_", "");

      const db = loadDB();
      const item = db.find(x => x.display_id === id);

      if (!item) {
        return tg("sendMessage", {
          chat_id: chatId,
          text: "❌ Film nicht gefunden"
        });
      }

      await sendFileById(chatId, item);

      setContinue(userId, {
        id: item.display_id,
        type: item.media_type
      });

      return;
    }

    // ================= NEXT =================

    if (data.startsWith("next_")) {

      const [, id] = data.split("_");

      const seriesDB = loadSeriesDB();

      let found = null;

      outer:
      for (const [key, seasons] of Object.entries(seriesDB)) {
        for (const [season, episodes] of Object.entries(seasons)) {
          for (const [ep, epData] of Object.entries(episodes)) {
            if (epData.display_id === id) {
              found = { key, season, episode: parseInt(ep), data: epData };
              break outer;
            }
          }
        }
      }

      if (!found) {
        return tg("sendMessage", {
          chat_id: chatId,
          text: "❌ Folge nicht gefunden"
        });
      }

      const next = getNextEpisode(found.key, found.season, found.episode);

      if (!next) {
        return tg("sendMessage", {
          chat_id: chatId,
          text: "✅ Ende der Staffel"
        });
      }

      const item = next.data;

      await sendFileById(chatId, item);

      return;
    }

    // ================= PREV =================

    if (data.startsWith("prev_")) {
      return tg("sendMessage", {
        chat_id: chatId,
        text: "⏪ Zurück-Funktion (optional erweiterbar)"
      });
    }

    // ================= SIMILAR =================

    if (data.startsWith("sim_")) {

      const id = data.split("_")[1];

      const db = loadDB();
      const item = db.find(x => x.display_id === id);

      if (!item) return;

      const recs = getRecommendations(userId, 5);

      const text = recs.map(r => `🎬 ${r.title}`).join("\n");

      return tg("sendMessage", {
        chat_id: chatId,
        text: `🔥 Ähnliche Inhalte:\n\n${text}`
      });
    }

    // ================= FAVORITE =================

    if (data.startsWith("fav_")) {
      return tg("sendMessage", {
        chat_id: chatId,
        text: "⭐ Favorit gespeichert (Feature Hook)"
      });
    }

    // ================= MENU =================

    if (data === "menu") {
      return tg("sendMessage", {
        chat_id: chatId,
        text: "🏠 Hauptmenü"
      });
    }

    // ================= TOP PICKS (AI) =================

    if (data === "top_picks") {

      const recs = getRecommendations(userId, 10);

      const text = recs.map(r => `🎬 ${r.title}`).join("\n");

      return tg("sendMessage", {
        chat_id: chatId,
        text: `🧠 Für dich empfohlen:\n\n${text}`
      });
    }

    // ================= UNKNOWN =================

    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Unbekannte Aktion"
    });

  } catch (err) {
    console.error("❌ CALLBACK ERROR:", err.message);
  }
}

// ================= EXPORT =================

module.exports = handleCallback;