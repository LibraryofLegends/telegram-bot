const { sendMoviePost, sendEpisodePost } = require("../services/telegramService");

const ADMIN_ID = Number(process.env.ADMIN_ID);

// ================= HELPERS =================

// 📺 Serie erkennen (S01E01 oder 1x01)
function detectSeries(fileName = "") {

  const lower = fileName.toLowerCase();

  // S01E01
  let match = lower.match(/s(\d{1,2})e(\d{1,2})/);
  if (match) {
    return {
      season: match[1].padStart(2, "0"),
      episode: match[2].padStart(2, "0")
    };
  }

  // 1x01
  match = lower.match(/(\d{1,2})x(\d{1,2})/);
  if (match) {
    return {
      season: match[1].padStart(2, "0"),
      episode: match[2].padStart(2, "0")
    };
  }

  return null;
}

// 🎬 Titel bereinigen
function cleanTitle(fileName = "") {
  return fileName
    .replace(/\.(mp4|mkv|avi)$/i, "")
    .replace(/\b(1080p|720p|4k|bluray|web|dl|x264|x265|hevc)\b/gi, "")
    .replace(/[._-]+/g, " ")
    .trim();
}

// ================= MAIN =================

async function handleUpload(msg) {

  try {

    console.log("🚀 HANDLE UPLOAD TRIGGERED");

    // 🔒 ADMIN CHECK
    const userId = msg.from?.id;
    if (userId !== ADMIN_ID) {
      console.log("⛔ Not Admin:", userId);
      return;
    }

    // 📦 FILE CHECK
    const file = msg.video || msg.document;

    if (!file) {
      console.log("❌ Keine Datei");
      return;
    }

    const file_id = file.file_id;
    const fileName = file.file_name || "unknown.mp4";

    // 🎯 NUR MP4
    if (!fileName.toLowerCase().endsWith(".mp4")) {
      console.log("⛔ Kein MP4:", fileName);
      return;
    }

    console.log("📁 Datei:", fileName);

    // 📺 SERIE?
    const seriesData = detectSeries(fileName);

    // ================= SERIES =================
    if (seriesData) {

      const title = cleanTitle(fileName)
        .replace(/s\d{1,2}e\d{1,2}/i, "")
        .replace(/\d{1,2}x\d{1,2}/i, "")
        .trim();

      console.log("📺 Serie erkannt:", title);

      await sendEpisodePost({
        file_id,
        series: title,
        season: seriesData.season,
        episode: seriesData.episode
      });

      // 📩 Feedback an dich
      if (msg.chat?.id) {
        await sendMessage(msg.chat.id, `✅ Episode erkannt:\n${title} S${seriesData.season}E${seriesData.episode}`);
      }

      return;
    }

    // ================= MOVIE =================

    const title = cleanTitle(fileName);

    console.log("🎬 Film erkannt:", title);

    await sendMoviePost({
      file_id,
      title,
      year: new Date().getFullYear()
    });

    // 📩 Feedback an dich
    if (msg.chat?.id) {
      await sendMessage(msg.chat.id, `✅ Film erkannt:\n${title}`);
    }

  } catch (err) {
    console.error("❌ Upload Fehler:", err.message);
  }
}

// ================= TELEGRAM MESSAGE =================

async function sendMessage(chatId, text) {
  try {
    const fetch = require("node-fetch");

    await fetch(`https://api.telegram.org/bot${process.env.TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text
      })
    });
  } catch (err) {
    console.error("❌ SendMessage Fehler:", err.message);
  }
}

// ================= EXPORT =================

module.exports = {
  handleUpload
};