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

// ================= DB =================
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8") || "[]");
}

let CACHE = loadDB();

function saveDB(data) {
  CACHE = data;
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ================= TELEGRAM =================
async function tg(method, body) {
  try {
    const safeBody = JSON.parse(JSON.stringify(body)); // 🔥 UTF FIX

    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(safeBody)
    });

    const data = await res.json();
    if (!data.ok) console.error("TG ERROR:", data);

    return data;
  } catch (err) {
    console.error("TG FETCH ERROR:", err);
    return { ok: false };
  }
}

// ================= PARSER =================
function parseFileName(name = "") {
  const clean = name.replace(/\.(mp4|mkv|avi)$/i, "").replace(/[._\-]+/g, " ");
  const series = clean.match(/S(\d+)E(\d+)/i);

  if (series) {
    return {
      type: "tv",
      title: clean.replace(series[0], "").trim(),
      season: parseInt(series[1]),
      episode: parseInt(series[2])
    };
  }

  return { type: "movie", title: clean };
}

function cleanTitleAdvanced(name = "") {
  return name
    .replace(/\.(mp4|mkv|avi)$/i, "")
    .replace(/\b(1080p|720p|2160p|4k|uhd)\b/gi, "")
    .replace(/\b(x264|x265|h264|h265)\b/gi, "")
    .replace(/\b(bluray|web|webdl|webrip|hdrip|brrip)\b/gi, "")
    .replace(/\b(german|deutsch|dl|dual|ac3|eac3|aac)\b/gi, "")
    .replace(/[._\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ================= TMDB =================
async function searchMultiTMDB(query) {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&language=de-DE`
  );
  const data = await res.json();
  return data.results?.slice(0, 5) || [];
}

async function getDetails(id, type = "movie") {
  const res = await fetch(
    `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_KEY}&append_to_response=credits,release_dates&language=de-DE`
  );
  return await res.json();
}

async function getTrending() {
  const res = await fetch(
    `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}&language=de-DE`
  );
  const data = await res.json();
  return data.results?.slice(0, 10) || [];
}

// ================= HELPERS =================
function getCover(data) {
  return data.poster_path
    ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";
}

function stars(r) {
  const s = Math.round((r || 0) / 2);
  return "⭐".repeat(s) + "☆".repeat(5 - s);
}

// ================= CARD =================
function buildCard(data, fileName = "", id = "0001") {
  return `
━━━━━━━━━━━━━━━━━━
🎬 ${(data.title || data.name || "").toUpperCase()}
━━━━━━━━━━━━━━━━━━
⭐ ${stars(data.vote_average)}
⏱ ${data.runtime || "-"} Min
━━━━━━━━━━━━━━━━━━
${data.overview || "Keine Beschreibung"}
━━━━━━━━━━━━━━━━━━
▶️ #${id}
@LibraryOfLegends
`.trim();
}

// ================= PLAYER =================
function playerUrl(mode, id) {
  return `https://t.me/${BOT_USERNAME}?start=${mode}_${id}`;
}

// ================= HISTORY =================
function saveHistory(userId, filmId) {
  let h = {};
  if (fs.existsSync(HISTORY_FILE)) {
    h = JSON.parse(fs.readFileSync(HISTORY_FILE));
  }
  if (!h[userId]) h[userId] = [];
  h[userId].unshift(filmId);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(h, null, 2));
}

// ================= UPLOAD =================
async function handleUpload(msg) {
  const file = msg.document || msg.video;
  const name = file.file_name || msg.caption || "";

  const parsed = parseFileName(name);
  const results = await searchMultiTMDB(cleanTitleAdvanced(name));
  const result = results[0];

  if (!result) {
    return tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Kein Match"
    });
  }

  const details = await getDetails(result.id, parsed.type);

  const id = String(Date.now()).slice(-4);

  CACHE.unshift({
    display_id: id,
    file_id: file.file_id
  });

  saveDB(CACHE);

  await tg("sendPhoto", {
    chat_id: CHANNEL_ID,
    photo: getCover(details),
    caption: buildCard(details, name, id),
    reply_markup: {
      inline_keyboard: [[
        { text: "▶️ Stream", url: playerUrl("str", id) }
      ]]
    }
  });
}

// ================= WEBHOOK =================
app.post(`/bot${TOKEN}`, async (req, res) => {
  res.sendStatus(200);

  const body = req.body;
  const msg = body.message || body.channel_post;

  try {

    // CALLBACK
    if (body.callback_query) {
      const data = body.callback_query.data;
      const chatId = body.callback_query.message.chat.id;

      await tg("answerCallbackQuery", {
        callback_query_id: body.callback_query.id
      });

      if (data === "trending") {
        const list = await getTrending();

        const buttons = list.map(m => ([
          {
            text: `🔥 ${m.title}`,
            callback_data: `search_${m.id}_movie`
          }
        ]));

        return tg("sendMessage", {
          chat_id: chatId,
          text: "🔥 Trending",
          reply_markup: { inline_keyboard: buttons }
        });
      }

      return;
    }

    if (!msg || msg.from?.is_bot) return;

    if (msg.text === "/start") {
      return tg("sendMessage", {
        chat_id: msg.chat.id,
        text: "🎬 ULTRA SYSTEM",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔥 Trending", callback_data: "trending" }]
          ]
        }
      });
    }

    if (msg.document || msg.video) {
      await handleUpload(msg);
    }

  } catch (err) {
    console.error("❌ Fehler:", err);
  }
});

// ================= START =================
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 ULTRA FINAL SYSTEM RUNNING");
});