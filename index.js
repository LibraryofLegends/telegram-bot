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
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!data.ok) console.error("TG ERROR:", data);
    return data || { ok: false };

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
      type: "series",
      title: clean.replace(series[0], "").trim(),
      season: parseInt(series[1], 10),
      episode: parseInt(series[2], 10)
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
    .replace(/- ?[a-z0-9]+$/i, "")
    .replace(/[._\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function smartTitleSplit(title) {
  if (title.includes(" - ")) return title.split(" - ")[0].trim();
  return title;
}

// ================= TMDB =================
async function searchTMDB(title, type = "movie") {
  const url = type === "series" || type === "tv" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/search/${url}?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=de-DE`
  );

  const data = await res.json();
  return data.results?.[0] || null;
}

async function multiSearch(title, type) {
  const variants = [
    title,
    title.split(" ").slice(0, 3).join(" "),
    title.split(" ").slice(0, 2).join(" "),
    title.split(" ")[0]
  ];

  for (const v of variants) {
    if (!v || v.length < 2) continue;
    const res = await searchTMDB(v, type);
    if (res) return res;
  }

  return null;
}

async function getDetails(id, type = "movie") {
  const url = type === "series" || type === "tv" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/${url}/${id}?api_key=${TMDB_KEY}&append_to_response=credits,release_dates&language=de-DE`
  );

  return await res.json();
}

// ================= PLAYER =================
function playerUrl(mode, id) {
  return `https://t.me/${BOT_USERNAME}?start=${mode}_${id}`;
}

// ================= START HANDLER =================
async function handleStart(msg, param) {
  if (param.startsWith("sim_")) {
    const [, id, typeRaw] = param.split("_");
    const type = (typeRaw === "series" || typeRaw === "tv") ? "tv" : "movie";

    const list = await getSimilar(id, type);

    if (!list.length) {
      return tg("sendMessage", {
        chat_id: msg.chat.id,
        text: "❌ Keine Ergebnisse gefunden"
      });
    }

    const buttons = list.map(m => ([{
      text: `🎬 ${m.title || m.name}`,
      callback_data: `search_${m.id}_${type}`
    }]));

    return tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "🎬 Ähnliche Filme:",
      reply_markup: { inline_keyboard: buttons }
    });
  }

  const id = param.replace(/str_|dl_/, "");
  const item = CACHE.find(x => x.display_id === id);

  if (!item) {
    return tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Datei nicht gefunden"
    });
  }

  return tg("sendVideo", {
    chat_id: msg.chat.id,
    video: item.file_id,
    supports_streaming: true
  });
}

// ================= WEBHOOK =================
app.post(`/bot${TOKEN}`, async (req, res) => {
  res.sendStatus(200);

  const body = req.body;
  const msg = body.message || body.channel_post;

  try {
    // CALLBACK FIX (war broken)
    if (body.callback_query) {
      const data = body.callback_query.data;
      const chatId = body.callback_query.message.chat.id;

      await tg("answerCallbackQuery", {
        callback_query_id: body.callback_query.id
      });

      if (data.startsWith("search_")) {
        const [, id, typeRaw] = data.split("_");
        const type = typeRaw === "tv" ? "tv" : "movie";

        const details = await getDetails(id, type);

        return tg("sendPhoto", {
          chat_id: chatId,
          photo: `https://image.tmdb.org/t/p/w500${details.poster_path}`,
          caption: details.title || details.name
        });
      }

      return;
    }

    if (!msg || msg.from?.is_bot) return;

    if (msg.text?.startsWith("/start ")) {
      const param = msg.text.split(" ")[1];
      return handleStart(msg, param);
    }

    if (msg.text === "/start") {
      return tg("sendMessage", {
        chat_id: msg.chat.id,
        text: "🔥 ULTRA SYSTEM"
      });
    }

  } catch (err) {
    console.error("❌ Fehler:", err);
  }
});

// ================= START =================
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 ULTRA FINAL SYSTEM RUNNING");
});