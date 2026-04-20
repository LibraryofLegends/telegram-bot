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
    .replace(/\b(1080p|720p|2160p|x264|x265|bluray|web|dl|german|extended|cut)\b/gi, "")
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

// ===== 🎧 AUDIO =====
function detectAudio(name) {
  name = name.toLowerCase();
  if (name.includes("german")) return "DE";
  if (name.includes("english")) return "EN";
  return "DE/EN";
}

// ===== ⭐ STARS =====
function getStars(r) {
  const stars = Math.round((r || 0) / 2);
  return "⭐".repeat(stars) + "☆".repeat(5 - stars) + ` (${r?.toFixed(1) || "-"})`;
}

// ===== 🏷 HASHTAGS =====
function generateTags(data) {
  const tags = [];

  if (data.genres) {
    data.genres.forEach(g => {
      tags.push(`#${g.name.replace(/\s/g,"")}`);
    });
  }

  const titleTag = "#" + (data.title || data.name || "")
    .split(" ")[0]
    .toUpperCase();

  tags.unshift(titleTag);

  return tags.join(" ");
}

// ===== 🧠 AI SEARCH =====
async function smartSearch(title, type="movie") {

  const url = type === "series" ? "tv" : "movie";

  const variants = [
    title,
    title.split(" ").slice(0,2).join(" "),
    title.split(" ")[0]
  ];

  for (const q of variants) {

    if (!q) continue;

    // 🇩🇪
    let res = await fetch(
      `https://api.themoviedb.org/3/search/${url}?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&language=de-DE`
    );
    let data = await res.json();

    if (data.results?.length) {
      return data.results[0];
    }

    // 🇺🇸
    res = await fetch(
      `https://api.themoviedb.org/3/search/${url}?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&language=en-US`
    );
    data = await res.json();

    if (data.results?.length) {
      return data.results[0];
    }
  }

  return null;
}

// ===== DETAILS =====
async function fetchDetails(id, type="movie") {
  const url = type === "series" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/${url}/${id}?api_key=${TMDB_KEY}&language=de-DE`
  );

  return res.json();
}

// ===== TELEGRAM =====
async function tg(method, body) {
  return fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

// ===== 🎴 CARD =====
function buildCard(data, fileName, idNum) {

  const title = (data.title || data.name || "").toUpperCase();
  const year = (data.release_date || data.first_air_date || "").slice(0,4);

  const audio = detectAudio(fileName);
  const tags = generateTags(data);

  let story = data.overview || "";
  if (story.length > 250) {
    story = story.slice(0, story.lastIndexOf(".")) + "...";
  }

  const id = "#" + idNum.toString().padStart(4,"0");

  return `
━━━━━━━━━━━━━━━
🎬 ${title} (${year})
━━━━━━━━━━━━━━━
${getStars(data.vote_average)}

⏱ ${data.runtime || "-"} Min
🎧 ${audio}

━━━━━━━━━━━━━━━
📝 STORY
${story}
━━━━━━━━━━━━━━━
▶️ ${id}
${tags}
@LibraryOfLegends`;
}

// ===== WEBHOOK =====
app.post(`/bot${TOKEN}`, async (req, res) => {

  const msg = req.body.message || req.body.channel_post;
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

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "🎬 ULTRA AI SYSTEM READY"
    });

    return res.sendStatus(200);
  }

  // UPLOAD
  if (msg.document || msg.video) {

    const file = msg.document || msg.video;
    const fileId = file.file_id;
    const fileName = file.file_name || "";

    const parsed = parseFileName(fileName);

    const result = await smartSearch(parsed.title, parsed.type);

    if (!result) {
      await tg("sendMessage", { chat_id: msg.chat.id, text: "❌ Nichts gefunden" });
      return res.sendStatus(200);
    }

    const data = await fetchDetails(result.id, parsed.type);

    const db = loadDB();

    db.unshift({
      title: data.title || data.name,
      rating: data.vote_average,
      file_id: fileId,
      type: parsed.type,
      added: Date.now()
    });

    saveDB(db);

    await tg("sendPhoto", {
      chat_id: CHANNEL_ID,
      photo: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
      caption: buildCard(data, fileName, db.length),
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
  console.log("🔥 AI SEARCH + AUTO TAGS AKTIV");
});