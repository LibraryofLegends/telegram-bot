const express = require("express");
// ❌ node-fetch entfernen
// const fetch = require("node-fetch");
const fs = require("fs");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const TMDB_KEY = process.env.TMDB_KEY;

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
    .replace(/\b(1080p|720p|x264|x265|bluray|web|dl|german)\b/gi, "")
    .trim();
}

// ===== PARSER (FIXED) =====
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

// ===== TELEGRAM =====
async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!data.ok) {
    console.error("❌ Telegram Fehler:", data);
  }

  return data;
}

async function sendMessage(chatId, text) {
  return tg("sendMessage", { chat_id: chatId, text });
}

async function playMovie(chatId, fileId) {
  return tg("sendVideo", {
    chat_id: chatId,
    video: fileId,
    supports_streaming: true
  });
}

// ===== TMDB =====
async function searchMulti(title, type) {
  const url = type === "series" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/search/${url}?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=de-DE`
  );

  const data = await res.json();
  return data.results || [];
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

// ===== API =====
app.get("/api/films", (req, res) => {
  res.json(loadDB());
});

// ===== WEBHOOK =====
app.post(`/bot${TOKEN}`, async (req, res) => {
  try {
    const body = req.body;

    const msg = body.message || body.channel_post;
    if (!msg) return res.sendStatus(200);

    if (msg.document || msg.video) {
      const file = msg.document || msg.video;

      const fileId = file.file_id;
      const fileName = file.file_name || msg.caption || "video";

      const parsed = parseFileName(fileName);

      const results = await searchMulti(parsed.title, parsed.type);
      if (!results.length) {
        await sendMessage(msg.chat.id, "❌ Nichts gefunden");
        return res.sendStatus(200);
      }

      const best = results[0];
      const details = await fetchDetails(best.id, parsed.type);

      let save = {
        title: details.title || details.name,
        rating: details.vote_average,
        overview: details.overview,
        cover: `https://image.tmdb.org/t/p/w500${details.poster_path}`,
        genre_ids: details.genre_ids,
        year: (details.release_date || details.first_air_date || "").slice(0,4),
        file_id: fileId,
        type: parsed.type
      };

      const db = loadDB();

      if (!db.find(x => x.file_id === fileId)) {
        db.unshift(save);
        saveDB(db);
      }

      await sendMessage(msg.chat.id, `✅ Gespeichert: ${save.title}`);

      return res.sendStatus(200);
    }

    res.sendStatus(200);

  } catch (err) {
    console.error("❌ Fehler:", err);
    res.sendStatus(200);
  }
});

// ===== START =====
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 Server läuft sauber");
});