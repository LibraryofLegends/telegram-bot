const { tg } = require("../services/telegramService");

const {
  loadSeriesDB,
  getNextEpisode
} = require("../db/seriesDB");

const {
  setContinue
} = require("../db/continueDB");

const {
  saveHistory
} = require("../db/historyDB");

// ================= FIND EPISODE =================

function findEpisodeById(seriesDB, id) {

  for (const [seriesKey, seasons] of Object.entries(seriesDB)) {

    for (const [season, episodes] of Object.entries(seasons)) {

      for (const [episode, data] of Object.entries(episodes)) {

        // 🔥 kompatibel alt + neu
        if ((data.display_id || data.id) == id) {
          return {
            seriesKey,
            season: parseInt(season),
            episode: parseInt(episode),
            data
          };
        }
      }
    }
  }

  return null;
}

// ================= MAIN =================

async function handlePlay(chatId, id) {

  try {

    console.log("▶️ PLAY REQUEST:", id);

    const seriesDB = loadSeriesDB();

    const found = findEpisodeById(seriesDB, id);

    // ================= NOT FOUND =================

    if (!found) {

      console.log("❌ EPISODE NOT FOUND:", id);

      return tg("sendMessage", {
        chat_id: chatId,
        text: "❌ Episode nicht gefunden"
      });
    }

    console.log("✅ FOUND:", found.seriesKey, "S", found.season, "E", found.episode);

    // ================= PLAY =================

    await tg("sendVideo", {
      chat_id: chatId,
      video: found.data.file_id,
      supports_streaming: true
    });

    // ================= SAVE HISTORY =================

    saveHistory(chatId, {
      id: found.data.display_id || id,
      type: "episode",
      seriesKey: found.seriesKey,
      season: found.season,
      episode: found.episode
    });

    // ================= SAVE CONTINUE =================

    setContinue(chatId, {
      seriesKey: found.seriesKey,
      season: found.season,
      episode: found.episode,
      id: found.data.display_id || id
    });

    // ================= NEXT EPISODE =================

    const next = getNextEpisode(
      found.seriesKey,
      found.season,
      found.episode
    );

    if (next) {

      const nextId = next.data.display_id || next.data.id;

      await tg("sendMessage", {
        chat_id: chatId,
        text: `➡️ Nächste Folge: S${next.season}E${next.episode}`,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "▶️ Weiter",
                callback_data: `play_${nextId}`
              }
            ]
          ]
        }
      });

    } else {

      await tg("sendMessage", {
        chat_id: chatId,
        text: "✅ Staffel abgeschlossen"
      });
    }

  } catch (err) {
    console.error("❌ PLAY ERROR:", err);
  }
}

// ================= EXPORT =================

module.exports = {
  handlePlay
};