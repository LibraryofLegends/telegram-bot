const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const TMDB_KEY = process.env.TMDB_KEY;

const DB_FILE = "films.json";
const LEARN_FILE = "learning.json";

// ===== DB =====
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE));
}
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ===== LEARNING =====
function loadLearning() {
  if (!fs.existsSync(LEARN_FILE)) return {};
  return JSON.parse(fs.readFileSync(LEARN_FILE));
}
function saveLearning(data) {
  fs.writeFileSync(LEARN_FILE, JSON.stringify(data, null, 2));
}
function normalizeKey(title) {
  return title.toLowerCase().replace(/\s+/g, "").trim();
}

// ===== CLEAN =====
function cleanName(name) {
  return name
    .replace(/\.(mp4|mkv|avi)$/i, "")
    .replace(/@\w+/g, "")
    .replace(/[._\-]+/g, " ")
    .replace(/\b(1080p|720p|x264|x265|bluray|web|dl|german)\b/gi, "")
    .trim();
}

// ===== PARSER =====
function parseFileName(name) {
  name = cleanName(name);

  const seriesMatch =
    name.match(/S(\d{1,2})E(\d{1,2})/i) ||
    name.match(/(\d{1,2})x(\d{1,2})/i);

  if (seriesMatch) {
    return {
      type: "series",
      title: name.replace(seriesMatch[0], "").trim(),
      group: name.replace(seriesMatch[0], "").trim(),
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

// ===== TELEGRAM =====
async function tg(method, body) {
  return fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function sendMessage(chatId, text, extra = {}) {
  return tg("sendMessage", { chat_id: chatId, text, ...extra });
}

async function playMovie(chatId, fileId) {
  return tg("sendVideo", {
    chat_id: chatId,
    video: fileId,
    supports_streaming: true
  });
}

// ===== STARS =====
function getStars(rating) {
  const stars = Math.round((rating || 0) / 2);
  return "⭐".repeat(stars) + "☆".repeat(5 - stars);
}

// ===== TMDB =====
async function searchMulti(title, type) {
  const url = type === "series" ? "tv" : "movie";
  const res = await fetch(
    `https://api.themoviedb.org/3/search/${url}?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=de-DE`
  );
  const data = await res.json();
  return data.results.slice(0, 5);
}

async function fetchDetails(id, type) {
  const url = type === "series" ? "tv" : "movie";
  const res = await fetch(
    `https://api.themoviedb.org/3/${url}/${id}?api_key=${TMDB_KEY}&language=de-DE`
  );
  return res.json();
}

async function fetchEpisode(tvId, season, episode) {
  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${tvId}/season/${season}/episode/${episode}?api_key=${TMDB_KEY}&language=de-DE`
  );
  return res.json();
}

// ===== UI CARD =====
async function sendMovieCard(chatId, data, fileId, extra = {}) {
  const isSeries = extra.type === "series";

  const title = isSeries
    ? `📺 ${data.name}`
    : `🎬 ${data.title}`;

  const year = (data.release_date || data.first_air_date || "").slice(0,4);
  const stars = getStars(data.vote_average);

  const episodeInfo = isSeries
    ? `\n📦 Staffel ${extra.season} • Folge ${extra.episode}\n📖 ${extra.episode_title || ""}`
    : "";

  const text =
`━━━━━━━━━━━━━━━
${title} (${year})

${stars}
${episodeInfo}

📝 ${(extra.overview || data.overview || "").slice(0,140)}...
━━━━━━━━━━━━━━━`;

  await tg("sendPhoto", {
    chat_id: chatId,
    photo: data.poster_path
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
      : "https://via.placeholder.com/300x450",
    caption: text,
    reply_markup: {
      inline_keyboard: [[
        { text: "▶️ Abspielen", url: `https://t.me/LIBRARY_OF_LEGENDS_Bot?start=${fileId}` }
      ]]
    }
  });
}

// ===== SERIES MENU =====
async function sendSeasonMenu(chatId, group) {
  const db = loadDB();
  const seasons = [...new Set(db.filter(x => x.group === group).map(x => x.season))];

  const buttons = seasons.map(s => [{
    text: `📦 Staffel ${s}`,
    callback_data: `season_${group}_${s}`
  }]);

  await tg("sendMessage", {
    chat_id: chatId,
    text: `📺 ${group}\n\nWähle eine Staffel:`,
    reply_markup: { inline_keyboard: buttons }
  });
}

async function sendEpisodeMenu(chatId, group, season) {
  const db = loadDB();
  const eps = db.filter(x => x.group === group && x.season == season);

  const buttons = eps.map(ep => [{
    text: `▶️ Folge ${ep.episode}`,
    callback_data: `play_${ep.file_id}`
  }]);

  await tg("sendMessage", {
    chat_id: chatId,
    text: `📦 Staffel ${season}`,
    reply_markup: { inline_keyboard: buttons }
  });
}

// ===== MAIN MENU =====
async function sendMenu(chatId) {
  await tg("sendMessage", {
    chat_id: chatId,
    text: "🎬 Library of Legends",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔥 Neu", callback_data: "new" }],
        [{ text: "🎬 Filme", callback_data: "movies" }],
        [{ text: "📺 Serien", callback_data: "series" }]
      ]
    }
  });
}

// ===== WEBHOOK =====
app.post(`/bot${TOKEN}`, async (req, res) => {
  try {
    const body = req.body;

    // CALLBACK
    if (body.callback_query) {
      const cb = body.callback_query;
      const data = cb.data;
      const chatId = cb.message.chat.id;

      if (data.startsWith("play_")) {
        const id = data.replace("play_", "");
        await playMovie(chatId, id);
      }

      if (data.startsWith("season_")) {
        const [, group, season] = data.split("_");
        await sendEpisodeMenu(chatId, group, season);
      }

      if (data.startsWith("open_")) {
        const group = data.replace("open_", "");
        await sendSeasonMenu(chatId, group);
      }

      if (data === "series") {
        const db = loadDB();
        const groups = [...new Set(db.map(x => x.group).filter(Boolean))];

        const buttons = groups.map(g => [{
          text: `📺 ${g}`,
          callback_data: `open_${g}`
        }]);

        await tg("sendMessage", {
          chat_id: chatId,
          text: "📺 Serien",
          reply_markup: { inline_keyboard: buttons }
        });
      }

      return res.sendStatus(200);
    }

    const msg = body.message;
    if (!msg) return res.sendStatus(200);

    // START
    if (msg.text?.startsWith("/start")) {
      const fileId = msg.text.split(" ")[1];

      if (fileId) {
        await playMovie(msg.chat.id, fileId);
      } else {
        await sendMenu(msg.chat.id);
      }

      return res.sendStatus(200);
    }

    // FILE
    if (msg.document || msg.video) {
      const file = msg.document || msg.video;
      const parsed = parseFileName(file.file_name || "");
      const fileId = file.file_id;

      const results = await searchMulti(parsed.title, parsed.type);

      if (!results.length) {
        await sendMessage(msg.chat.id, "❌ Nichts gefunden");
        return res.sendStatus(200);
      }

      const best = results[0];
      const details = await fetchDetails(best.id, parsed.type);

      let extra = {};

      if (parsed.type === "series") {
        const ep = await fetchEpisode(details.id, parsed.season, parsed.episode);

        extra = {
          type: "series",
          season: parsed.season,
          episode: parsed.episode,
          episode_title: ep.name,
          overview: ep.overview
        };

        const db = loadDB();
        db.unshift({
          group: parsed.group,
          season: parsed.season,
          episode: parsed.episode,
          file_id: fileId
        });
        saveDB(db);
      }

      await sendMovieCard(msg.chat.id, details, fileId, extra);

      return res.sendStatus(200);
    }

    res.sendStatus(200);

  } catch (e) {
    console.error(e);
    res.sendStatus(200);
  }
});

// ===== START =====
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 Server läuft");
});