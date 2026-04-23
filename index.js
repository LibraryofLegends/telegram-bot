const fetch = global.fetch || require("node-fetch");
const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const TMDB_KEY = process.env.TMDB_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_USERNAME = process.env.BOT_USERNAME || "LIBRARY_OF_LEGENDS_Bot";

const DB_FILE = "films.json";
const HISTORY_FILE = "history.json";
const SERIES_DB_FILE = "series.json";

// ================= STATE =================
const USER_STATE = {};

// ================= DB =================
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8") || "[]");
  } catch {
    return [];
  }
}

let CACHE = loadDB();

function saveDB(data) {
  CACHE = data;
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ================= SERIES =================
function loadSeriesDB() {
  if (!fs.existsSync(SERIES_DB_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(SERIES_DB_FILE, "utf8") || "{}");
  } catch {
    return {};
  }
}

let SERIES_DB = loadSeriesDB();

function saveSeriesDB(data) {
  SERIES_DB = data;
  fs.writeFileSync(SERIES_DB_FILE, JSON.stringify(data, null, 2));
}

// ================= HISTORY =================
function saveHistory(userId, entry) {
  let h = {};
  if (fs.existsSync(HISTORY_FILE)) {
    try { h = JSON.parse(fs.readFileSync(HISTORY_FILE)); } catch {}
  }

  if (!h[userId]) h[userId] = [];

  h[userId] = [entry, ...h[userId].filter(x => x.id !== entry.id)].slice(0, 15);

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(h, null, 2));
}

function readHistory(userId) {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  return JSON.parse(fs.readFileSync(HISTORY_FILE))[userId] || [];
}

// ================= TELEGRAM =================
async function tg(method, body) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch {
    return { ok: false };
  }
}

// ================= HELPERS =================
function getCover(data = {}) {
  if (data.poster_path)
    return `https://image.tmdb.org/t/p/w500${data.poster_path}`;
  return "https://via.placeholder.com/500x750?text=No+Image";
}

// ================= TMDB =================
async function tmdbFetch(url) {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch {
    return null;
  }
}

async function searchTMDB(title) {
  const data = await tmdbFetch(
    `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=de-DE`
  );
  return data?.results?.[0] || null;
}

async function getDetails(id, type) {
  return await tmdbFetch(
    `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_KEY}&language=de-DE`
  );
}

async function getTrending() {
  const data = await tmdbFetch(
    `https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_KEY}&language=de-DE`
  );
  return data?.results?.slice(0, 10) || [];
}

async function getPopular() {
  const data = await tmdbFetch(
    `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=de-DE`
  );
  return data?.results?.slice(0, 10) || [];
}

async function getSimilar(id, type) {
  const data = await tmdbFetch(
    `https://api.themoviedb.org/3/${type}/${id}/similar?api_key=${TMDB_KEY}`
  );
  return data?.results?.slice(0, 10) || [];
}

// ================= UI =================
function showMenu(chatId) {
  return tg("sendMessage", {
    chat_id: chatId,
    text: "🎬 LIBRARY OF LEGENDS",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔥 Trending", callback_data: "net_trending" }],
        [{ text: "📈 Popular", callback_data: "net_popular" }],
        [{ text: "▶️ Weiter schauen", callback_data: "continue" }]
      ]
    }
  });
}

async function sendResultsList(chatId, heading, list, page = 0) {
  const perPage = 4;
  const start = page * perPage;
  const slice = list.slice(start, start + perPage);

  USER_STATE[chatId] = { list, heading };

  for (const m of slice) {
    await tg("sendPhoto", {
      chat_id: chatId,
      photo: getCover(m),
      caption: `🎬 ${m.title || m.name}`,
      reply_markup: {
        inline_keyboard: [[
          { text: "▶️ Öffnen", callback_data: `search_${m.id}_${m.media_type}` }
        ]]
      }
    });
  }

  return tg("sendMessage", {
    chat_id: chatId,
    text: heading
  });
}

// ================= FILE =================
async function sendFileById(chatId, item) {
  if (!item) return;

  saveHistory(chatId, { id: item.display_id, type: item.media_type });

  return tg("sendVideo", {
    chat_id: chatId,
    video: item.file_id,
    supports_streaming: true
  });
}

// ================= UPLOAD =================
async function handleUpload(msg) {
  const file = msg.document || msg.video;
  if (!file) return;

  const title = file.file_name || "Unknown";

  const result = await searchTMDB(title);

  const id = String(Date.now()).slice(-4);

  const item = {
    display_id: id,
    file_id: file.file_id,
    media_type: result?.media_type || "movie"
  };

  CACHE.unshift(item);
  saveDB(CACHE);

  return tg("sendMessage", {
    chat_id: msg.chat.id,
    text: "✅ Upload verarbeitet"
  });
}

// ================= WEBHOOK =================
app.post(`/bot${TOKEN}`, async (req, res) => {
  res.sendStatus(200);

  const body = req.body;
  const msg = body.message;

  try {

    // CALLBACK
    if (body.callback_query) {
      const data = body.callback_query.data;
      const chatId = body.callback_query.message.chat.id;

      if (data === "net_trending") {
        const list = await getTrending();
        return sendResultsList(chatId, "🔥 Trending", list);
      }

      if (data === "net_popular") {
        const list = await getPopular();
        return sendResultsList(chatId, "📈 Popular", list);
      }

      if (data.startsWith("search_")) {
        const [, id, type] = data.split("_");
        const details = await getDetails(id, type);

        return tg("sendPhoto", {
          chat_id: chatId,
          photo: getCover(details),
          caption: details.title || details.name,
          reply_markup: {
            inline_keyboard: [[
              { text: "▶️ Stream", callback_data: `play_${id}` }
            ]]
          }
        });
      }

      if (data.startsWith("play_")) {
        const id = data.replace("play_", "");
        const item = CACHE.find(x => x.display_id === id);
        return sendFileById(chatId, item);
      }

      return;
    }

    // START
    if (msg.text === "/start") {
      return showMenu(msg.chat.id);
    }

    // UPLOAD
    if (msg.document || msg.video) {
      return handleUpload(msg);
    }

  } catch (err) {
    console.error(err);
  }
});

// ================= START =================
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 FULL SYSTEM RESTORED");
});