const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

// ⚠️ Node <18 → npm install node-fetch
// const fetch = require("node-fetch");

const TOKEN = process.env.TOKEN;
const TMDB_KEY = process.env.TMDB_KEY;
const OMDB_KEY = process.env.OMDB_KEY || "";
const CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_USERNAME = process.env.BOT_USERNAME || "LIBRARY_OF_LEGENDS_Bot";

const DB_FILE = "films.json";
const HISTORY_FILE = "history.json";

const sessions = {};

// ================= TRENDING =================
async function fetchTrending(type = "movie") {
  const url = type === "series" ? "tv" : "movie";

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/trending/${url}/day?api_key=${TMDB_KEY}`
    );
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error("Trending Error:", e);
    return [];
  }
}

async function sendTrendingRow(chatId) {
  const movies = await fetchTrending("movie");

  if (!movies.length) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Keine Trending-Daten"
    });
  }

  const buttons = movies.slice(0, 10).map(m => ([
    { text: `🎬 ${m.title}`, callback_data: `trend_${m.id}` }
  ]));

  await tg("sendMessage", {
    chat_id: chatId,
    text: "🔥 Trending jetzt",
    reply_markup: { inline_keyboard: buttons }
  });
}

// ================= DB =================
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return [];
  const raw = fs.readFileSync(DB_FILE, "utf8");
  const db = raw ? JSON.parse(raw) : [];

  let changed = false;
  db.forEach((item, idx) => {
    if (!item.display_id) {
      item.display_id = String(idx + 1).padStart(4, "0");
      changed = true;
    }
  });

  if (changed) saveDB(db);
  return db;
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ================= HISTORY =================
function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return {};
  const raw = fs.readFileSync(HISTORY_FILE, "utf8");
  return raw ? JSON.parse(raw) : {};
}

function saveHistory(data) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
}

// ================= CLEAN =================
function cleanName(name) {
  return name
    .replace(/\.(mp4|mkv|avi)$/i, "")
    .replace(/@\w+/g, "")
    .replace(/[._\-]+/g, " ")
    .replace(/\b(1080p|720p|2160p|4k|x264|x265|bluray|web|dl|german|aac|hdrip|hdtv)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ================= PARSER =================
function parseFileName(name) {
  name = cleanName(name);

  const match = name.match(/S(\d+)E(\d+)/i);

  if (match) {
    return {
      type: "series",
      title: name.replace(match[0], "").trim(),
      season: parseInt(match[1]),
      episode: parseInt(match[2])
    };
  }

  return { type: "movie", title: name };
}

// ================= TELEGRAM =================
async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res.json();
}

function playerUrl(mode, id) {
  return `https://t.me/${BOT_USERNAME}?start=${mode}_${id}`;
}

// ================= TMDB =================
async function fetchDetailsById(id, type = "movie") {
  const url = type === "series" ? "tv" : "movie";

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${url}/${id}?api_key=${TMDB_KEY}&language=de-DE`
    );
    return await res.json();
  } catch {
    return null;
  }
}

// ================= COVER =================
function getBestCover(data) {
  if (data.poster_path)
    return `https://image.tmdb.org/t/p/w500${data.poster_path}`;
  if (data.backdrop_path)
    return `https://image.tmdb.org/t/p/w500${data.backdrop_path}`;
  return "https://via.placeholder.com/500x750?text=No+Image";
}

// ================= CARD =================
async function buildCard(data) {
  const title = (data.title || data.name || "").toUpperCase();
  const year = (data.release_date || data.first_air_date || "").slice(0, 4);
  const rating = data.vote_average || "-";

  return `🎬 ${title} (${year})\n⭐ ${rating}`;
}

// ================= FEED =================
async function sendFeed(chatId) {
  await tg("sendMessage", {
    chat_id: chatId,
    text: "🎬 ULTRA PRO MAX",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔥 Trending", callback_data: "show_trending" }],
        [{ text: "🎬 Alle Inhalte", callback_data: "cat_all" }],
        [{ text: "▶️ Weiter schauen", callback_data: "continue" }]
      ]
    }
  });
}

// ================= PLAYER =================
async function sendPlayer(chatId, item) {
  if (!item) return;

  const payload = {
    chat_id: chatId,
    video: item.file_id,
    supports_streaming: true
  };

  await tg("sendVideo", payload);
}

// ================= WEBHOOK =================
app.post(`/bot${TOKEN}`, async (req, res) => {
  try {
    const body = req.body;

    if (body.callback_query) {
      const data = body.callback_query.data;
      const chatId = body.callback_query.message.chat.id;

      // TRENDING
      if (data === "show_trending") {
        await sendTrendingRow(chatId);
        return res.sendStatus(200);
      }

      if (data.startsWith("trend_")) {
        const id = data.replace("trend_", "");
        const movie = await fetchDetailsById(id);

        const caption = await buildCard(movie);

        await tg("sendPhoto", {
          chat_id: chatId,
          photo: getBestCover(movie),
          caption
        });

        return res.sendStatus(200);
      }

      return res.sendStatus(200);
    }

    const msg = body.message || body.channel_post;
    if (!msg) return res.sendStatus(200);

    if (msg.text?.startsWith("/start")) {
      await sendFeed(msg.chat.id);
      return res.sendStatus(200);
    }

    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.sendStatus(200);
  }
});

// ================= START =================
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 FULL MERGE BOT AKTIV");
});