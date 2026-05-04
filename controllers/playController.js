const { tg, sendFileById } = require("../services/telegramService");

const { loadDB } = require("../db/database");
const { loadSeriesDB, getNextEpisode } = require("../db/seriesDB");
const { setContinue } = require("../db/continueDB");

// ================= PLAY CONTROLLER =================

async function handlePlay(chatId, id, userId = null) {

  try {

    const db = loadDB();
    const seriesDB = loadSeriesDB();

    // ================= FIND ITEM (MOVIE OR EPISODE) =================

    let found = null;
    let type = "movie";

    // 🔍 MOVIE SEARCH
    const movie = db.find(x => x.display_id === id);

    if (movie) {
      found = movie;
      type = "movie";
    }

    // 🔍 SERIES SEARCH (fallback)
    if (!found) {

      outer:
      for (const [seriesKey, seasons] of Object.entries(seriesDB)) {
        for (const [season, episodes] of Object.entries(seasons)) {
          for (const [episode, data] of Object.entries(episodes)) {

            if (data.display_id === id || data.id === id) {
              found = {
                ...data,
                seriesKey,
                season: parseInt(season),
                episode: parseInt(episode)
              };
              type = "series";
              break outer;
            }
          }
        }
      }
    }

    // ================= NOT FOUND =================

    if (!found) {
      return tg("sendMessage", {
        chat_id: chatId,
        text: "❌ Inhalt nicht gefunden"
      });
    }

    // ================= SEND VIDEO =================

    await sendFileById(chatId, found);

    // ================= CONTINUE SAVE =================

    if (userId) {
      setContinue(userId, {
        id,
        type
      });
    }

    // ================= AUTO NEXT (SERIES ONLY) =================

    if (type === "series") {

      const next = getNextEpisode(
        found.seriesKey,
        found.season,
        found.episode
      );

      if (next) {

        return tg("sendMessage", {
          chat_id: chatId,
          text: `➡️ Nächste Folge verfügbar: S${next.season}E${next.episode}`,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "▶️ Weiter",
                  callback_data: `play_${next.data.display_id}`
                }
              ]
            ]
          }
        });

      } else {

        return tg("sendMessage", {
          chat_id: chatId,
          text: "✅ Staffel abgeschlossen"
        });
      }
    }

    // ================= MOVIE RESPONSE =================

    return tg("sendMessage", {
      chat_id: chatId,
      text: `🎬 Film gestartet`
    });

  } catch (err) {
    console.error("❌ PLAY CONTROLLER ERROR:", err.message);
  }
}

// ================= EXPORT =================

module.exports = {
  handlePlay
};