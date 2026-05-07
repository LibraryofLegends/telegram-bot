const express = require("express");
const axios = require("axios");
const Database = require("better-sqlite3");

const app = express();
app.use(express.json({ limit: "50mb" }));

// =============================
// ENV VARIABLEN
// =============================
const TOKEN = process.env.TOKEN;
const TMDB_KEY = process.env.TMDB_KEY;
const OMDB_KEY = process.env.OMDB_KEY || "";

const MOVIE_GROUP_ID = process.env.MOVIE_GROUP_ID;
const SERIES_GROUP_ID = process.env.SERIES_GROUP_ID;

const ADMIN_ID = String(process.env.ADMIN_ID || "");
const BOT_USERNAME = process.env.BOT_USERNAME || "";

const BASE_URL = `https://api.telegram.org/bot${TOKEN}`;

// =============================
// CHECK
// =============================
if (!TOKEN) console.error("❌ TOKEN fehlt");
if (!TMDB_KEY) console.error("❌ TMDB_KEY fehlt");
if (!MOVIE_GROUP_ID) console.error("❌ MOVIE_GROUP_ID fehlt");
if (!SERIES_GROUP_ID) console.error("❌ SERIES_GROUP_ID fehlt");
if (!ADMIN_ID) console.error("❌ ADMIN_ID fehlt");

// =============================
// DATABASE
// =============================
const db = new Database("library.db");

db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  year TEXT,
  genre TEXT,
  rating TEXT,
  runtime TEXT,
  overview TEXT,
  poster_url TEXT,
  file_name TEXT,
  file_id TEXT,
  unique_key TEXT UNIQUE,
  telegram_message_id INTEGER,
  topic_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  series_title TEXT NOT NULL,
  season INTEGER,
  episode INTEGER,
  episode_title TEXT,
  genre TEXT,
  rating TEXT,
  overview TEXT,
  poster_url TEXT,
  file_name TEXT,
  file_id TEXT,
  unique_key TEXT UNIQUE,
  telegram_message_id INTEGER,
  topic_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  topic_id INTEGER NOT NULL,
  unique_key TEXT UNIQUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

console.log("✅ Datenbank bereit");

// =============================
// DATABASE HELPER
// =============================
function logToDb(type, message) {
  try {
    db.prepare(`
      INSERT INTO logs (type, message)
      VALUES (?, ?)
    `).run(type, message);
  } catch (err) {
    console.error("❌ DB Log Fehler:", err.message);
  }
}

function getTopic(uniqueKey) {
  return db.prepare(`
    SELECT * FROM topics
    WHERE unique_key = ?
  `).get(uniqueKey);
}

function saveTopic({ name, type, chatId, topicId, uniqueKey }) {
  return db.prepare(`
    INSERT OR IGNORE INTO topics
    (name, type, chat_id, topic_id, unique_key)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, type, String(chatId), topicId, uniqueKey);
}

function movieExists(uniqueKey) {
  return db.prepare(`
    SELECT * FROM movies
    WHERE unique_key = ?
  `).get(uniqueKey);
}

function seriesExists(uniqueKey) {
  return db.prepare(`
    SELECT * FROM series
    WHERE unique_key = ?
  `).get(uniqueKey);
}

function saveMovie(data) {
  return db.prepare(`
    INSERT OR IGNORE INTO movies
    (
      title, year, genre, rating, runtime, overview,
      poster_url, file_name, file_id, unique_key,
      telegram_message_id, topic_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.title,
    data.year,
    data.genre,
    data.rating,
    data.runtime,
    data.overview,
    data.posterUrl,
    data.fileName,
    data.fileId,
    data.uniqueKey,
    data.telegramMessageId,
    data.topicId
  );
}

function saveSeries(data) {
  return db.prepare(`
    INSERT OR IGNORE INTO series
    (
      series_title, season, episode, episode_title,
      genre, rating, overview, poster_url,
      file_name, file_id, unique_key,
      telegram_message_id, topic_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.seriesTitle,
    data.season,
    data.episode,
    data.episodeTitle,
    data.genre,
    data.rating,
    data.overview,
    data.posterUrl,
    data.fileName,
    data.fileId,
    data.uniqueKey,
    data.telegramMessageId,
    data.topicId
  );
}

// =============================
// PARSER / ERKENNUNG
// =============================

function cleanFileName(fileName = "") {
  return String(fileName)
    .replace(/\.[a-z0-9]{2,5}$/i, "") // Endung entfernen
    .replace(/@[\w\d_]+/gi, "") // Telegram Tags entfernen
    .replace(/\b(german|deutsch|english|eng|multi|dubbed|subbed|dl|dts|ddp|aac|ac3|x264|x265|h264|h265|hevc|bluray|brrip|webrip|webdl|web-dl|hdrip|dvdrip|remux|uhd|4k|2160p|1080p|720p|480p)\b/gi, "")
    .replace(/\b(amzn|nf|netflix|disney|hulu|apple|itunes|max|sky|paramount)\b/gi, "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitle(title = "") {
  return String(title)
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function makeKey(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractYear(text = "") {
  const match = String(text).match(/\b(19\d{2}|20\d{2})\b/);
  return match ? match[1] : "";
}

function detectSeries(fileName = "") {
  const raw = String(fileName);

  const patterns = [
    /\bS(\d{1,2})E(\d{1,3})\b/i,
    /\bS(\d{1,2})\.?E(\d{1,3})\b/i,
    /\b(\d{1,2})x(\d{1,3})\b/i,
    /\bStaffel\s*(\d{1,2})\s*Folge\s*(\d{1,3})\b/i,
    /\bSeason\s*(\d{1,2})\s*Episode\s*(\d{1,3})\b/i
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (!match) continue;

    const season = parseInt(match[1], 10);
    const episode = parseInt(match[2], 10);

    const beforeCode = raw.slice(0, match.index);
    const titleClean = cleanFileName(beforeCode);

    return {
      isSeries: true,
      seriesTitle: normalizeTitle(titleClean),
      season,
      episode,
      seasonText: String(season).padStart(2, "0"),
      episodeText: String(episode).padStart(2, "0")
    };
  }

  return {
    isSeries: false
  };
}

function detectMovie(fileName = "") {
  const cleaned = cleanFileName(fileName);
  const year = extractYear(cleaned);

  let title = cleaned;

  if (year) {
    title = cleaned.replace(new RegExp(`\\b${year}\\b`, "g"), "");
  }

  title = title
    .replace(/\bPart\s*\d+\b/gi, "")
    .replace(/\bCD\s*\d+\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    isMovie: true,
    title: normalizeTitle(title),
    year
  };
}

function parseMedia(fileName = "") {
  const series = detectSeries(fileName);

  if (series.isSeries) {
    const uniqueKey = makeKey(
      `${series.seriesTitle}-s${series.seasonText}-e${series.episodeText}`
    );

    return {
      type: "series",
      ...series,
      uniqueKey
    };
  }

  const movie = detectMovie(fileName);
  const uniqueKey = makeKey(`${movie.title}-${movie.year || "unknown"}`);

  return {
    type: "movie",
    ...movie,
    uniqueKey
  };
}

// =============================
// TELEGRAM API HELPER
// =============================
async function tg(method, data = {}) {
  try {
    const res = await axios.post(`${BASE_URL}/${method}`, data);
    return res.data.result;
  } catch (err) {
    console.error(`❌ Telegram API Fehler bei ${method}:`);
    console.error(err.response?.data || err.message);
    return null;
  }
}

// =============================
// STARTSEITE
// =============================
app.get("/", (req, res) => {
  res.send("✅ Telegram Movie & Series Bot V2 läuft");
});

// =============================
// WEBHOOK ENDPOINT
// =============================
app.post(`/webhook/${TOKEN}`, async (req, res) => {
  try {
    const update = req.body;

    console.log("📩 Incoming Update");

    await handleUpdate(update);

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook Fehler:", err);
    res.sendStatus(200);
  }
});

// =============================
// UPDATE HANDLER
// =============================
async function handleUpdate(update) {
  const msg = update.message || update.edited_message;
  if (!msg) return;

  const userId = String(msg.from?.id || "");

  console.log("USER ID:", userId);

  if (userId !== ADMIN_ID) {
    console.log("⛔ Ignored - nicht Admin");
    return;
  }

  if (msg.text) {
    await handleCommand(msg);
    return;
  }

  if (msg.video || msg.document) {
    console.log("🎥 Video/Datei erkannt");
    await handleUpload(msg);
    return;
  }

  console.log("⚠️ Unbekannter Nachrichtentyp");
}

// =============================
// COMMAND HANDLER
// =============================
async function handleCommand(msg) {
  const text = msg.text || "";

  if (text === "/start") {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "🔥 Movie & Series Bot V2 ist aktiv!\n\n" +
        "Sende oder leite mir Filme/Serien weiter.\n\n" +
        "Befehle:\n" +
        "/help\n" +
        "/stats\n" +
        "/search titel\n" +
        "/admin"
    });
    return;
  }

  if (text === "/help") {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "📌 Hilfe\n\n" +
        "➡️ Leite Filme oder Serien an mich weiter.\n" +
        "➡️ Serien erkennt der Bot über S01E01 oder 1x01.\n" +
        "➡️ Filme werden automatisch per Genre sortiert.\n" +
        "➡️ Serien bekommen automatisch eigene Themen."
    });
    return;
  }
  
  if (text === "/stats") {
  const movieCount = db.prepare("SELECT COUNT(*) AS count FROM movies").get().count;
  const seriesCount = db.prepare("SELECT COUNT(*) AS count FROM series").get().count;
  const topicCount = db.prepare("SELECT COUNT(*) AS count FROM topics").get().count;

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "📊 𝐒𝐓𝐀𝐓𝐈𝐒𝐓𝐈𝐊\n\n" +
      `🎬 Filme: ${movieCount}\n` +
      `📺 Serien-Episoden: ${seriesCount}\n` +
      `🧵 Themen gespeichert: ${topicCount}`
  });

  return;
}

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: "⚠️ Befehl noch nicht eingebaut. Kommt in späteren Blöcken."
  });
}

// =============================
// UPLOAD HANDLER PLACEHOLDER
// =============================
async function handleUpload(msg) {
  const fileName =
    msg.document?.file_name ||
    msg.video?.file_name ||
    msg.caption ||
    "Unbekannte Datei";

  const fileId =
    msg.video?.file_id ||
    msg.document?.file_id ||
    "";

  console.log("🚀 HANDLE UPLOAD TRIGGERED");
  console.log("📁 Datei:", fileName);

  const media = parseMedia(fileName);

  console.log("🧠 Parsed:", media);

  if (media.type === "series") {
    const exists = seriesExists(media.uniqueKey);

    if (exists) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "⚠️ Serie/Episode ist bereits gespeichert:\n\n" +
          `📺 ${media.seriesTitle} S${media.seasonText}E${media.episodeText}`
      });
      return;
    }

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "📺 Serie erkannt:\n\n" +
        `Titel: ${media.seriesTitle}\n` +
        `Staffel: ${media.seasonText}\n` +
        `Episode: ${media.episodeText}\n\n` +
        `Key: ${media.uniqueKey}\n\n` +
        "➡️ TMDB-Daten & Themen kommen ab BLOCK 4/5."
    });

    logToDb(
      "series_detected",
      `${media.seriesTitle} S${media.seasonText}E${media.episodeText}`
    );

    return;
  }

  if (media.type === "movie") {
    const exists = movieExists(media.uniqueKey);

    if (exists) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "⚠️ Film ist bereits gespeichert:\n\n" +
          `🎬 ${media.title} ${media.year || ""}`
      });
      return;
    }

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "🎬 Film erkannt:\n\n" +
        `Titel: ${media.title}\n` +
        `Jahr: ${media.year || "Unbekannt"}\n\n` +
        `Key: ${media.uniqueKey}\n\n` +
        "➡️ TMDB-Daten & Genre-Themen kommen ab BLOCK 4/5."
    });

    logToDb("movie_detected", `${media.title} ${media.year || ""}`);

    return;
  }
}

// =============================
// SERVER START
// =============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});