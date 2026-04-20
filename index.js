const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const TMDB_KEY = process.env.TMDB_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;

const DB_FILE = "films.json";

// ===== DB =====
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE));
}
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ===== CLEAN =====
function cleanName(name) {
  return name
    .replace(/\.(mp4|mkv|avi)$/i, "")
    .replace(/@\w+/g, "")
    .replace(/[._\-]+/g, " ")
    .replace(/\b(1080p|720p|2160p|x264|x265|bluray|web|dl|german|aac|hdrip|hdtv|originale|orginale|tonspur|extended|cut|remastered)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ===== PARSER =====
function parseFileName(name) {
  name = cleanName(name);
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

// ===== SEARCH =====
async function searchTMDB(title) {

  if (title.toLowerCase().includes("pate")) {
    const res = await fetch(`https://api.themoviedb.org/3/movie/238?api_key=${TMDB_KEY}&language=de-DE`);
    return await res.json();
  }

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=de-DE`
  );
  const data = await res.json();

  if (!data.results?.length) return null;

  const id = data.results[0].id;

  const details = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}&language=de-DE`
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

  const title = (data.title || "").toUpperCase();
  const year = (data.release_date || "").slice(0,4);

  const genres = data.genres
    ?.slice(0,2)
    .map(g => `${genreEmoji(g.name)} ${g.name}`)
    .join(" • ");

  const audio = detectAudio(fileName);

  const id = "#" + idNum.toString().padStart(4,"0");

  let story = data.overview || "";
  if (story.length > 300) {
    story = story.slice(0, story.lastIndexOf(".")) + "...";
  }

  return `
━━━━━━━━━━━━━━━
🎬 ${title} (${year})
━━━━━━━━━━━━━━━
${getStars(data.vote_average)}
${genres || "-"}

⏱ ${data.runtime || "-"} Min • 🔞 FSK -
🎧 ${audio}

━━━━━━━━━━━━━━━
📝 STORY
${story}
━━━━━━━━━━━━━━━
▶️ ${id}
#${title.split(" ")[0]}
@LibraryOfLegends`;
}

// ===== NAVIGATION CARD =====
async function sendMovie(chatId, index) {
  const db = loadDB();
  const item = db[index];
  if (!item) return;

  const data = await searchTMDB(item.title);

  const text = buildCard(data, item.title, index + 1);

  await tg("sendPhoto", {
    chat_id: chatId,
    photo: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
    caption: text,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "⬅️", callback_data: `nav_${index - 1}` },
          { text: "▶️", url: `https://t.me/LIBRARY_OF_LEGENDS_Bot?start=${item.file_id}` },
          { text: "➡️", callback_data: `nav_${index + 1}` }
        ]
      ]
    }
  });
}

// ===== FEED =====
async function sendFeed(chatId) {

  await tg("sendMessage", {
    chat_id: chatId,
    text: "🎬 Library of Legends",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔥 Neu", callback_data: "cat_new" }],
        [{ text: "⭐ Top", callback_data: "cat_top" }],
        [{ text: "🎬 Alle Filme", callback_data: "cat_all" }]
      ]
    }
  });
}

// ===== CATEGORY =====
async function sendCategory(chatId, type) {
  const db = loadDB();

  let list = [];

  if (type === "new") list = db.slice(0,10);
  if (type === "top") list = [...db].sort((a,b)=>b.rating-a.rating).slice(0,10);
  if (type === "all") list = db;

  if (!list.length) return;

  await sendMovie(chatId, 0);
}

// ===== WEBHOOK =====
app.post(`/bot${TOKEN}`, async (req, res) => {

  const body = req.body;

  // CALLBACKS
  if (body.callback_query) {
    const data = body.callback_query.data;
    const chatId = body.callback_query.message.chat.id;

    if (data.startsWith("nav_")) {
      const index = parseInt(data.replace("nav_", ""));
      if (index >= 0) await sendMovie(chatId, index);
    }

    if (data === "cat_new") await sendCategory(chatId, "new");
    if (data === "cat_top") await sendCategory(chatId, "top");
    if (data === "cat_all") await sendCategory(chatId, "all");

    return res.sendStatus(200);
  }

  const msg = body.message || body.channel_post;
  if (!msg) return res.sendStatus(200);

  if (msg.text?.startsWith("/start")) {
    await sendFeed(msg.chat.id);
    return res.sendStatus(200);
  }

  if (msg.document || msg.video) {

    const file = msg.document || msg.video;
    const fileId = file.file_id;
    const fileName = file.file_name || "";

    const parsed = parseFileName(fileName);
    const data = await searchTMDB(parsed.title);

    if (!data) {
      await tg("sendMessage", { chat_id: msg.chat.id, text: "❌ Nichts gefunden" });
      return res.sendStatus(200);
    }

    const db = loadDB();

    db.unshift({
      title: data.title,
      rating: data.vote_average,
      file_id: fileId,
      added: Date.now()
    });

    saveDB(db);

    const text = buildCard(data, fileName, db.length);

    // CHANNEL POST
    await tg("sendPhoto", {
      chat_id: CHANNEL_ID,
      photo: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
      caption: text
    });

    return res.sendStatus(200);
  }

  res.sendStatus(200);
});

// ===== START =====
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 NEXT LEVEL SYSTEM AKTIV");
});