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
    .replace(/[._\-]+/g, " ")
    .replace(/\b(1080p|720p|2160p|x264|x265|bluray|web|dl|german)\b/gi, "")
    .trim();
}

// ===== PARSER =====
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

// ===== STARS =====
function getStars(r) {
  const stars = Math.round((r || 0) / 2);
  return "⭐".repeat(stars) + "☆".repeat(5 - stars) + ` (${r?.toFixed(1) || "-"})`;
}

// ===== SEARCH =====
async function searchTMDB(title, type="movie") {

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
  return fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

// ===== CARD =====
function buildCard(data, id) {

  const title = (data.title || data.name || "").toUpperCase();
  const year = (data.release_date || data.first_air_date || "").slice(0,4);

  return `
━━━━━━━━━━━━━━━
🎬 ${title} (${year})
━━━━━━━━━━━━━━━
${getStars(data.vote_average)}

⏱ ${data.runtime || "-"} Min
━━━━━━━━━━━━━━━
▶️ #${id.toString().padStart(4,"0")}
@LibraryOfLegends`;
}

// ===== NAVIGATION =====
async function sendItem(chatId, list, index) {

  const item = list[index];
  if (!item) return;

  const data = await searchTMDB(item.title, item.type);

  await tg("sendPhoto", {
    chat_id: chatId,
    photo: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
    caption: buildCard(data, index+1),
    reply_markup: {
      inline_keyboard: [[
        { text: "⬅️", callback_data: `nav_${index-1}` },
        { text: "▶️", url: `https://t.me/LIBRARY_OF_LEGENDS_Bot?start=${item.file_id}` },
        { text: "➡️", callback_data: `nav_${index+1}` }
      ]]
    }
  });
}

// ===== FEED =====
async function sendFeed(chatId) {
  await tg("sendMessage", {
    chat_id: chatId,
    text: "🎬 NETFLIX UI",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔥 Trending", callback_data: "cat_trending" }],
        [{ text: "🆕 Neu", callback_data: "cat_new" }],
        [{ text: "⭐ Top", callback_data: "cat_top" }],
        [{ text: "🎬 Filme", callback_data: "cat_movies" }],
        [{ text: "📺 Serien", callback_data: "cat_series" }],
        [{ text: "▶️ Weiter", callback_data: "continue" }]
      ]
    }
  });
}

// ===== CATEGORY =====
function getCategory(type) {
  const db = loadDB();

  if (type === "trending") return db.slice(0,10);
  if (type === "new") return db.slice(0,10);
  if (type === "top") return [...db].sort((a,b)=>b.rating-a.rating).slice(0,10);
  if (type === "movies") return db.filter(x=>x.type==="movie");
  if (type === "series") return db.filter(x=>x.type==="series");

  return db;
}

// ===== WEBHOOK =====
app.post(`/bot${TOKEN}`, async (req, res) => {

  const body = req.body;

  // CALLBACK
  if (body.callback_query) {
    const data = body.callback_query.data;
    const chatId = body.callback_query.message.chat.id;

    if (data.startsWith("nav_")) {
      const index = parseInt(data.replace("nav_",""));
      const list = loadDB();
      if (index >= 0) await sendItem(chatId, list, index);
    }

    if (data.startsWith("cat_")) {
      const type = data.replace("cat_","");
      const list = getCategory(type);
      await sendItem(chatId, list, 0);
    }

    if (data === "continue") {
      const history = loadHistory();
      const last = history[chatId];
      if (last) {
        await tg("sendVideo", {
          chat_id: chatId,
          video: last
        });
      }
    }

    return res.sendStatus(200);
  }

  const msg = body.message || body.channel_post;
  if (!msg) return res.sendStatus(200);

  // START
  if (msg.text?.startsWith("/start")) {

    const param = msg.text.split(" ")[1];

    if (param) {
      const history = loadHistory();
      history[msg.chat.id] = param;
      saveHistory(history);

      return tg("sendVideo", {
        chat_id: msg.chat.id,
        video: param
      });
    }

    await sendFeed(msg.chat.id);
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
      rating: data.vote_average,
      file_id: fileId,
      type: parsed.type,
      group: parsed.group,
      season: parsed.season,
      episode: parsed.episode,
      added: Date.now()
    });

    saveDB(db);

    await tg("sendPhoto", {
      chat_id: CHANNEL_ID,
      photo: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
      caption: buildCard(data, db.length),
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
  console.log("🔥 ULTRA UI NETFLIX SYSTEM AKTIV");
});