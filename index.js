const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const TMDB_KEY = process.env.TMDB_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;

const DB_FILE = "films.json";
const HISTORY_FILE = "history.json";

// ===== DB =====
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE));
}
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ===== HISTORY =====
function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return {};
  return JSON.parse(fs.readFileSync(HISTORY_FILE));
}
function saveHistory(data) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
}

// ===== CLEAN =====
function cleanName(name) {
  return name
    .replace(/\.(mp4|mkv|avi)$/i, "")
    .replace(/@\w+/g, "")
    .replace(/[._\-]+/g, " ")
    .replace(/\b(1080p|720p|2160p|x264|x265|bluray|web|dl|german|aac|hdrip|hdtv)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ===== PARSER (SERIES SUPPORT) =====
function parseFileName(name) {
  name = cleanName(name);

  const seriesMatch =
    name.match(/S(\d{1,2})E(\d{1,2})/i) ||
    name.match(/(\d{1,2})x(\d{1,2})/i);

  if (seriesMatch) {
    const cleanTitle = name.replace(seriesMatch[0], "").trim();

    return {
      type: "series",
      title: cleanTitle,
      group: cleanTitle,
      season: parseInt(seriesMatch[1]),
      episode: parseInt(seriesMatch[2])
    };
  }

  const year = name.match(/\d{4}/)?.[0];

  return {
    type: "movie",
    title: name.replace(year, "").trim(),
    year
  };
}

// ===== AUDIO =====
function detectAudio(name) {
  name = name.toLowerCase();
  if (name.includes("german")) return "DE";
  if (name.includes("english")) return "EN";
  return "DE/EN";
}

// ===== GENRE =====
function genreEmoji(name) {
  const map = {
    Action: "🔥",
    Horror: "👻",
    Comedy: "😂",
    Drama: "🎭",
    Thriller: "🔪",
    Adventure: "🗺",
    "Science Fiction": "🚀"
  };
  return map[name] || "🎬";
}

// ===== STARS =====
function getStars(r) {
  const stars = Math.round((r || 0) / 2);
  return "⭐".repeat(stars) + "☆".repeat(5 - stars) + ` (${r?.toFixed(1) || "-"})`;
}

// ===== TMDB SEARCH =====
async function searchTMDB(title, type = "movie") {
  const url = type === "series" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/search/${url}?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=de-DE`
  );

  const data = await res.json();
  if (!data.results?.length) return null;

  const id = data.results[0].id;

  const details = await fetch(
    `https://api.themoviedb.org/3/${url}/${id}?api_key=${TMDB_KEY}&language=de-DE`
  );

  return await details.json();
}

// ===== TELEGRAM =====
async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  return res.json();
}

// ===== CARD =====
function buildCard(data, fileName, idNum) {

  const title = (data.title || data.name || "").toUpperCase();
  const year = (data.release_date || data.first_air_date || "").slice(0,4);

  const genres = data.genres
    ?.slice(0,2)
    .map(g => `${genreEmoji(g.name)} ${g.name}`)
    .join(" • ");

  const audio = detectAudio(fileName);

  const id = "#" + idNum.toString().padStart(4,"0");

  return `
━━━━━━━━━━━━━━━
🎬 ${title} (${year})
━━━━━━━━━━━━━━━
${getStars(data.vote_average)}
${genres || "-"}

⏱ ${data.runtime || "-"} Min • 🔞 FSK -
🎧 ${audio}
━━━━━━━━━━━━━━━
▶️ ${id}
@LibraryOfLegends`;
}

// ===== SERIES MENUS =====
async function sendSeriesMenu(chatId) {
  const db = loadDB();
  const groups = [...new Set(db.filter(x => x.type==="series").map(x => x.group))];

  await tg("sendMessage", {
    chat_id: chatId,
    text: "📺 Serien auswählen:",
    reply_markup: {
      inline_keyboard: groups.map(g => [{
        text: g,
        callback_data: `series_${g}`
      }])
    }
  });
}

async function sendSeasonMenu(chatId, group) {
  const db = loadDB();
  const seasons = [...new Set(db.filter(x => x.group===group).map(x => x.season))];

  await tg("sendMessage", {
    chat_id: chatId,
    text: `📦 ${group}`,
    reply_markup: {
      inline_keyboard: seasons.map(s => [{
        text: `Staffel ${s}`,
        callback_data: `season_${group}_${s}`
      }])
    }
  });
}

async function sendEpisodeMenu(chatId, group, season) {
  const db = loadDB();
  const eps = db.filter(x => x.group===group && x.season==season);

  await tg("sendMessage", {
    chat_id: chatId,
    text: `📺 ${group} • Staffel ${season}`,
    reply_markup: {
      inline_keyboard: eps.map(e => [{
        text: `▶️ Folge ${e.episode}`,
        url: `https://t.me/LIBRARY_OF_LEGENDS_Bot?start=${e.file_id}`
      }])
    }
  });
}

// ===== WEBHOOK =====
app.post(`/bot${TOKEN}`, async (req, res) => {

  const body = req.body;

  if (body.callback_query) {
    const data = body.callback_query.data;
    const chatId = body.callback_query.message.chat.id;

    if (data === "series") await sendSeriesMenu(chatId);

    if (data.startsWith("series_")) {
      await sendSeasonMenu(chatId, data.replace("series_", ""));
    }

    if (data.startsWith("season_")) {
      const [, group, season] = data.split("_");
      await sendEpisodeMenu(chatId, group, season);
    }

    return res.sendStatus(200);
  }

  const msg = body.message || body.channel_post;
  if (!msg) return res.sendStatus(200);

  // START PLAYER
  if (msg.text?.startsWith("/start")) {
    const param = msg.text.split(" ")[1];

    if (param) {
      return tg("sendVideo", {
        chat_id: msg.chat.id,
        video: param
      });
    }

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "🎬 Library of Legends",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎬 Filme", callback_data: "movies" }],
          [{ text: "📺 Serien", callback_data: "series" }]
        ]
      }
    });

    return res.sendStatus(200);
  }

  // UPLOAD
  if (msg.document || msg.video) {

    const file = msg.document || msg.video;
    const fileId = file.file_id;
    const fileName = file.file_name || "";

    const parsed = parseFileName(fileName);
    const data = await searchTMDB(parsed.title, parsed.type);

    if (!data) {
      await tg("sendMessage", { chat_id: msg.chat.id, text: "❌ Nichts gefunden" });
      return res.sendStatus(200);
    }

    const db = loadDB();

    db.unshift({
      title: data.title || data.name,
      file_id: fileId,
      type: parsed.type,
      group: parsed.group,
      season: parsed.season,
      episode: parsed.episode,
      added: Date.now()
    });

    saveDB(db);

    const text = buildCard(data, fileName, db.length);

    await tg("sendPhoto", {
      chat_id: CHANNEL_ID,
      photo: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
      caption: text,
      reply_markup: {
        inline_keyboard: [[
          {
            text: "▶️ Abspielen",
            url: `https://t.me/LIBRARY_OF_LEGENDS_Bot?start=${fileId}`
          }
        ]]
      }
    });

    return res.sendStatus(200);
  }

  res.sendStatus(200);
});

// ===== START =====
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 NEXT LEVEL + SERIEN AKTIV");
});