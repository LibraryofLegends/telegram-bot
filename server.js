const express = require("express");
const axios = require("axios");
const Database = require("better-sqlite3");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const Parser = require("rss-parser");
const rssParser = new Parser();

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
// POSTGRES / SUPABASE
// =============================
const DATABASE_URL = process.env.DATABASE_URL || "";

const pgPool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })
  : null;

async function testPostgresConnection() {
  if (!pgPool) {
    console.log("⚠️ Keine DATABASE_URL gesetzt — nutze SQLite");
    return;
  }

  try {
    const result = await pgPool.query("SELECT NOW() AS now");
    console.log("✅ Supabase verbunden:", result.rows[0].now);
  } catch (err) {
    console.error("❌ Supabase Verbindung Fehler:", err.message);
  }
}

async function ensurePostgresTables() {
  if (!pgPool) return;

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      chat_id TEXT NOT NULL,
      topic_id INTEGER NOT NULL,
      unique_key TEXT UNIQUE,
      hub_message_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  await pgPool.query(`
  CREATE TABLE IF NOT EXISTS series_news (
    id SERIAL PRIMARY KEY,
    series_title TEXT NOT NULL,
    headline TEXT NOT NULL,
    body TEXT,
    tag TEXT,
    news_date TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS knowledge (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    related_movie TEXT,
    related_series TEXT,
    related_person TEXT,
    library_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);
  
  await pgPool.query(`
  ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS movie_hub_message_id INTEGER;
`);

await pgPool.query(`
  ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS movie_banner_message_id INTEGER;
`);

await pgPool.query(`
  ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS series_banner_message_id INTEGER;
`);

await pgPool.query(`
  ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS episode_list_message_id INTEGER;
`);

await pgPool.query(`
  ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS season_separators TEXT DEFAULT '{}';
`);

await pgPool.query(`
  ALTER TABLE series_news
  ADD COLUMN IF NOT EXISTS category TEXT;
`);
  
  await pgPool.query(`
  CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    title TEXT,
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
    collection TEXT,
    quality TEXT,
    audio TEXT,
    source TEXT,
    fsk TEXT,
    director TEXT,
    cast_list TEXT,
    library_id TEXT,
    resolution TEXT,
    file_size TEXT,
    file_size_bytes BIGINT,
    video_codec TEXT,
    audio_codec TEXT,
    audio_channels TEXT,
    hdr TEXT,
    universe TEXT,
    universe_phase TEXT,
    starwars_era TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

await pgPool.query(`
  ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;
`);

await pgPool.query(`
  ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS starwars_era TEXT;
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS series (
    id SERIAL PRIMARY KEY,
    series_title TEXT,
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
    series_library_id INTEGER,
    universe TEXT,
    universe_phase TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS series_library (
    id SERIAL PRIMARY KEY,

    title TEXT UNIQUE NOT NULL,
    tmdb_id INTEGER,

    first_air_date TEXT,
    last_air_date TEXT,

    genres TEXT,
    rating TEXT,

    overview TEXT,
    poster_url TEXT,

    total_seasons INTEGER,
    total_episodes INTEGER,

    status TEXT,

    created_at TIMESTAMP DEFAULT NOW()
  );
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS series_topics (
    id SERIAL PRIMARY KEY,

    series_name TEXT UNIQUE NOT NULL,

    topic_id BIGINT,
    topic_title TEXT,

    created_at TIMESTAMP DEFAULT NOW()
  );
`);

await pgPool.query(`
  ALTER TABLE series_topics
  ADD COLUMN IF NOT EXISTS hub_message_id INTEGER;
`);

await pgPool.query(`
  ALTER TABLE series
  ADD COLUMN IF NOT EXISTS starwars_era TEXT;
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    collection_name TEXT,
    tmdb_collection_id INTEGER UNIQUE,
    topic_id INTEGER,
    poster_url TEXT,
    hub_message_id INTEGER,
    banner_message_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS universes (
    id SERIAL PRIMARY KEY,
    universe_name TEXT UNIQUE,
    topic_id INTEGER,
    hub_message_id INTEGER,
    banner_message_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

  console.log("✅ Supabase Tabellen bereit");
}

let CURRENT_SERIES_NAME = "";

let LAST_RESTORE_FILE_ID = "";

let REBUILD_COMMAND_CENTERS_RUNNING = false;

const PENDING_MOVIE_UPLOADS = new Map();

// =============================
// DUPLICATE SHIELD
// =============================
const ACTIVE_UPLOADS = new Set();

// =============================
// MEMORY CLEANUP
// =============================
setInterval(() => {

  if (PENDING_MOVIE_UPLOADS.size > 50) {

    console.log(
      "🧹 PENDING_MOVIE_UPLOADS Reset"
    );

    PENDING_MOVIE_UPLOADS.clear();
  }

}, 1000 * 60 * 30);

// =============================
// ACTIVE UPLOAD CLEANUP
// =============================
setInterval(() => {

  if (ACTIVE_UPLOADS.size > 1000) {

    console.log(
      "⚠️ ACTIVE_UPLOADS Reset Schutz aktiviert"
    );

    ACTIVE_UPLOADS.clear();
  }

}, 1000 * 60 * 30);

// =============================
// TMDB CACHE CLEANUP
// =============================
setInterval(() => {

  const now = Date.now();

  for (const [key, value] of TMDB_CACHE.entries()) {

    if (now - value.time > TMDB_CACHE_TTL) {

      TMDB_CACHE.delete(key);
    }
  }

}, 1000 * 60 * 30);

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
const DB_FILE_PATH = path.join(__dirname, "library.db");

const db = new Database(DB_FILE_PATH);

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

  series_library_id INTEGER,

  universe TEXT,
  universe_phase TEXT,
  starwars_era TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS series_library (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  title TEXT UNIQUE NOT NULL,
  tmdb_id INTEGER,

  first_air_date TEXT,
  last_air_date TEXT,

  genres TEXT,
  rating TEXT,

  overview TEXT,
  poster_url TEXT,

  total_seasons INTEGER,
  total_episodes INTEGER,

  status TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS series_topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  series_name TEXT UNIQUE NOT NULL,

  topic_id INTEGER,
  topic_title TEXT,

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

CREATE TABLE IF NOT EXISTS knowledge (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  related_movie TEXT,
  related_series TEXT,
  related_person TEXT,
  library_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_name TEXT,
  tmdb_collection_id INTEGER UNIQUE,
  topic_id INTEGER,
  poster_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS universes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  universe_name TEXT UNIQUE,
  topic_id INTEGER,
  hub_message_id INTEGER,
  banner_message_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS series_news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  series_title TEXT NOT NULL,
  headline TEXT NOT NULL,
  body TEXT,
  tag TEXT,
  news_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

function addColumnIfMissing(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();

  if (!cols.some((c) => c.name === column)) {
    db.prepare(
      `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`
    ).run();
  }
}

// =============================
// SQLITE MIGRATIONS
// =============================

// Movies
addColumnIfMissing("movies", "collection", "TEXT");
addColumnIfMissing("movies", "quality", "TEXT");
addColumnIfMissing("movies", "audio", "TEXT");
addColumnIfMissing("movies", "source", "TEXT");
addColumnIfMissing("movies", "fsk", "TEXT");
addColumnIfMissing("movies", "director", "TEXT");
addColumnIfMissing("movies", "cast", "TEXT");
addColumnIfMissing("movies", "library_id", "TEXT");
addColumnIfMissing("movies", "resolution", "TEXT");
addColumnIfMissing("movies", "file_size", "TEXT");
addColumnIfMissing("movies", "file_size_bytes", "INTEGER");
addColumnIfMissing("movies", "video_codec", "TEXT");
addColumnIfMissing("movies", "audio_codec", "TEXT");
addColumnIfMissing("movies", "audio_channels", "TEXT");
addColumnIfMissing("movies", "hdr", "TEXT");
addColumnIfMissing("movies", "universe", "TEXT");
addColumnIfMissing("movies", "universe_phase", "TEXT");
addColumnIfMissing("movies", "universe_order", "INTEGER");
addColumnIfMissing("movies", "starwars_era", "TEXT");

// Series
addColumnIfMissing("series", "series_library_id", "INTEGER");
addColumnIfMissing("series", "universe", "TEXT");
addColumnIfMissing("series", "universe_phase", "TEXT");
addColumnIfMissing("series", "universe_order", "INTEGER");
addColumnIfMissing("series", "starwars_era", "TEXT");
addColumnIfMissing("series_news", "category", "TEXT");

// Series Library
addColumnIfMissing("series_library", "tmdb_id", "INTEGER");
addColumnIfMissing("series_library", "first_air_date", "TEXT");
addColumnIfMissing("series_library", "last_air_date", "TEXT");
addColumnIfMissing("series_library", "genres", "TEXT");
addColumnIfMissing("series_library", "rating", "TEXT");
addColumnIfMissing("series_library", "overview", "TEXT");
addColumnIfMissing("series_library", "poster_url", "TEXT");
addColumnIfMissing("series_library", "total_seasons", "INTEGER");
addColumnIfMissing("series_library", "total_episodes", "INTEGER");
addColumnIfMissing("series_library", "status", "TEXT");

// Series Topics
addColumnIfMissing("series_topics", "hub_message_id", "INTEGER");
addColumnIfMissing("series_topics", "banner_message_id", "INTEGER");

// Topics
addColumnIfMissing("topics", "hub_message_id", "INTEGER");
addColumnIfMissing("topics", "season_separators", "TEXT DEFAULT '{}'");
addColumnIfMissing("topics", "series_banner_message_id", "INTEGER");
addColumnIfMissing("topics", "episode_list_message_id", "INTEGER");
addColumnIfMissing("topics", "movie_hub_message_id", "INTEGER");
addColumnIfMissing("topics", "movie_banner_message_id", "INTEGER");
addColumnIfMissing("topics", "universe_hub_message_id", "INTEGER");
addColumnIfMissing("topics", "universe_banner_message_id", "INTEGER");

// Collections
addColumnIfMissing("collections", "hub_message_id", "INTEGER");
addColumnIfMissing("collections", "banner_message_id", "INTEGER");

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
    SELECT *
    FROM topics
    WHERE unique_key = ?
    LIMIT 1
  `).get(uniqueKey);

}

async function saveKnowledge({
  title,
  category,
  content,
  relatedMovie = null,
  relatedSeries = null,
  relatedPerson = null,
  libraryId = null
}) {
  if (pgPool) {
    return await pgPool.query(
      `
      INSERT INTO knowledge
      (
        title,
        category,
        content,
        related_movie,
        related_series,
        related_person,
        library_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        title,
        category,
        content,
        relatedMovie,
        relatedSeries,
        relatedPerson,
        libraryId
      ]
    );
  }

  return db.prepare(`
    INSERT INTO knowledge
    (
      title,
      category,
      content,
      related_movie,
      related_series,
      related_person,
      library_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    category,
    content,
    relatedMovie,
    relatedSeries,
    relatedPerson,
    libraryId
  );
}

function knowledgeCaption({
  title = "Unbekannt",
  category = "Filmwissen",
  content = "",
  relatedMovie = "",
  relatedSeries = "",
  relatedPerson = "",
  libraryId = ""
}) {
  const relation =
    relatedMovie
      ? `🎬 Film • ${escapeHtml(relatedMovie)}\n`
      : relatedSeries
        ? `📺 Serie • ${escapeHtml(relatedSeries)}\n`
        : relatedPerson
          ? `🎭 Person • ${escapeHtml(relatedPerson)}\n`
          : "";

  return (
    "███ KNOWLEDGE DOSSIER ███\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    `<b>📚 ${escapeHtml(title).toUpperCase()}</b>\n` +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    `🏷 ${escapeHtml(libraryId || "KNOWLEDGE ENTRY")}\n` +
    `📂 ${escapeHtml(category)}\n` +
    relation +
    "\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "<b>📖 ARCHIVE INTEL</b>\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    `${escapeHtml(content || "Keine Informationen verfügbar.")}\n\n` +

    "🛰 ARCHIV VERIFIZIERT ✅\n\n" +
    "@LibraryOfLegends"
  ).slice(0, 4000);
}

function saveTopic({ name, type, chatId, topicId, uniqueKey }) {
  return db.prepare(`
    INSERT OR IGNORE INTO topics
    (name, type, chat_id, topic_id, unique_key)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, type, String(chatId), topicId, uniqueKey);
}

async function movieExists(uniqueKey) {

  if (pgPool) {

    const result = await pgPool.query(
      `
      SELECT *
      FROM movies
      WHERE unique_key = $1
      LIMIT 1
      `,
      [uniqueKey]
    );

    return result.rows[0] || null;
  }

  return db.prepare(`
    SELECT *
    FROM movies
    WHERE unique_key = ?
  `).get(uniqueKey);
}

async function seriesExists(uniqueKey) {
  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT *
      FROM series
      WHERE unique_key = $1
      LIMIT 1
      `,
      [uniqueKey]
    );

    return result.rows[0] || null;
  }

  return db.prepare(`
    SELECT *
    FROM series
    WHERE unique_key = ?
  `).get(uniqueKey);
}

async function saveMovie(data) {

  if (pgPool) {

    return await pgPool.query(
      `
      INSERT INTO movies
      (
        title,
        year,
        genre,
        rating,
        runtime,
        overview,

        poster_url,

        file_name,
        file_id,
        unique_key,

        telegram_message_id,
        topic_id,

        collection,
        quality,
        audio,
        source,

        fsk,
        director,
        cast_list,

        library_id,

        resolution,
        file_size,
        file_size_bytes,

        video_codec,
        audio_codec,
        audio_channels,

        hdr,

        universe,
        universe_phase,
        starwars_era
      )
      VALUES (
  $1, $2, $3, $4, $5, $6,
  $7,
  $8, $9, $10,
  $11, $12,
  $13, $14, $15, $16,
  $17, $18, $19,
  $20,
  $21, $22, $23,
  $24, $25, $26,
  $27,
  $28, $29, $30
)
      ON CONFLICT (unique_key)
      DO NOTHING
      `,
      [
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
        data.topicId,

        data.collection,
        data.quality,
        data.audio,
        data.source,

        data.fsk,
        data.director,
        data.cast,

        data.libraryId,

        data.resolution,
data.fileSize,
data.fileSizeBytes,

data.videoCodec,
data.audioCodec,
data.audioChannels,

data.hdr,

data.universe,
data.universePhase,
data.starWarsEra
      ]
    );
  }

  return db.prepare(`
    INSERT OR IGNORE INTO movies
    (
      title, year, genre, rating, runtime, overview,
      poster_url, file_name, file_id, unique_key,
      telegram_message_id, topic_id,
      collection, quality, audio, source, fsk, director, cast, library_id,
      resolution, file_size, file_size_bytes, video_codec, audio_codec, audio_channels, hdr,
      universe, universe_phase, starwars_era
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    data.topicId,

    data.collection,
    data.quality,
    data.audio,
    data.source,
    data.fsk,
    data.director,
    data.cast,
    data.libraryId,

    data.resolution,
    data.fileSize,
    data.fileSizeBytes,
    data.videoCodec,
    data.audioCodec,
    data.audioChannels,
    data.hdr,

    data.universe,
    data.universePhase,
    data.starWarsEra
  );
}

async function saveSeries(data) {
  if (pgPool) {
    return await pgPool.query(
      `
      INSERT INTO series
      (
        series_title,
        season,
        episode,
        episode_title,
        genre,
        rating,
        overview,
        poster_url,
        file_name,
        file_id,
        unique_key,
        telegram_message_id,
        topic_id,
        series_library_id,
        universe,
        universe_phase,
        starwars_era
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11,
        $12, $13,
        $14,
        $15, $16, $17
      )
      ON CONFLICT (unique_key)
      DO NOTHING
      `,
      [
        data.seriesTitle || null,
        data.season || null,
        data.episode || null,
        data.episodeTitle || null,
        data.genre || null,
        data.rating || null,
        data.overview || null,
        data.posterUrl || null,
        data.fileName || null,
        data.fileId || null,
        data.uniqueKey || null,
        data.telegramMessageId || null,
        data.topicId || null,
        data.seriesLibraryId || null,
        data.universe || null,
        data.universePhase || null,
        data.starWarsEra || null
      ]
    );
  }

  return db.prepare(`
    INSERT OR IGNORE INTO series
    (
      series_title,
      season,
      episode,
      episode_title,
      genre,
      rating,
      overview,
      poster_url,
      file_name,
      file_id,
      unique_key,
      telegram_message_id,
      topic_id,
      series_library_id,
      universe,
      universe_phase,
      starwars_era
    )
    VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      ?,
      ?, ?, ?
    )
  `).run(
    data.seriesTitle || null,
    data.season || null,
    data.episode || null,
    data.episodeTitle || null,
    data.genre || null,
    data.rating || null,
    data.overview || null,
    data.posterUrl || null,
    data.fileName || null,
    data.fileId || null,
    data.uniqueKey || null,
    data.telegramMessageId || null,
    data.topicId || null,
    data.seriesLibraryId || null,
    data.universe || null,
    data.universePhase || null,
    data.starWarsEra || null
  );
}

async function saveSeriesNews(data) {
  if (pgPool) {
    return await pgPool.query(
      `
      INSERT INTO series_news
      (
        series_title,
        headline,
        body,
        tag,
        news_date,
        category
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        data.seriesTitle,
        data.headline,
        data.body || null,
        data.tag || null,
        data.newsDate || null,
        data.category || "news"
      ]
    );
  }

  return db.prepare(`
    INSERT INTO series_news
    (
      series_title,
      headline,
      body,
      tag,
      news_date,
      category
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    data.seriesTitle,
    data.headline,
    data.body || null,
    data.tag || null,
    data.newsDate || null,
    data.category || "news"
  );
}

async function seriesNewsExists(seriesTitle, headline) {
  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT id
      FROM series_news
      WHERE LOWER(series_title) = LOWER($1)
      AND LOWER(headline) = LOWER($2)
      LIMIT 1
      `,
      [seriesTitle, headline]
    );

    return !!result.rows[0];
  }

  const row = db.prepare(`
    SELECT id
    FROM series_news
    WHERE LOWER(series_title) = LOWER(?)
    AND LOWER(headline) = LOWER(?)
    LIMIT 1
  `).get(seriesTitle, headline);

  return !!row;
}

async function getSeriesNewsByCategory(category = "news") {
  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT *
      FROM series_news
      WHERE category = $1
      ORDER BY created_at DESC
      LIMIT 10
      `,
      [category]
    );

    return result.rows;
  }

  return db.prepare(`
    SELECT *
    FROM series_news
    WHERE category = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(category);
}

function buildSeriesNewsList(rows) {
  if (!rows.length) {
    return "Noch keine Einträge.\n";
  }

  return rows
    .map((n) => {
      let text =
        `📺 ${String(n.series_title || "Unbekannt").toUpperCase()}\n` +
        `🚨 ${n.headline || "Update"}\n`;

      if (n.news_date) {
        text += `📅 ${n.news_date}\n`;
      }

      if (n.body) {
        text += `\n${String(n.body).slice(0, 500)}\n`;
      }

      if (n.tag) {
        text += `\n#${String(n.tag).replace(/\s+/g, "")}\n`;
      }

      return text;
    })
    .join("\n━━━━━━━━━━━━━━━━━━\n\n");
}

function detectNewsCategory(title = "") {
  const text =
    String(title || "").toLowerCase();

  if (
    text.includes("filming") ||
    text.includes("shooting") ||
    text.includes("production") ||
    text.includes("production update") ||
    text.includes("production begins") ||
    text.includes("begins filming") ||
    text.includes("starts filming") ||
    text.includes("filming progress")
  ) {
    return "production";
  }

  if (
    text.includes("release date") ||
    text.includes("premiere") ||
    text.includes("coming soon") ||
    text.includes("launch")
  ) {
    return "coming_soon";
  }

  if (
    text.includes("renewed") ||
    text.includes("confirmed") ||
    text.includes("officially renewed") ||
    text.includes("new season") ||
    text.includes("season 2 update") ||
    text.includes("season 3 update") ||
    text.includes("season 4 update")
  ) {
    return "new_season";
  }

  return "news";
}

async function repairSeriesNewsCategories() {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT id, headline
      FROM series_news
    `);

    rows = result.rows;

    for (const row of rows) {
      const category =
        detectNewsCategory(row.headline);

      await pgPool.query(
        `
        UPDATE series_news
        SET category = $1
        WHERE id = $2
        `,
        [category, row.id]
      );
    }

    return rows.length;
  }

  rows = db.prepare(`
    SELECT id, headline
    FROM series_news
  `).all();

  for (const row of rows) {
    const category =
      detectNewsCategory(row.headline);

    db.prepare(`
      UPDATE series_news
      SET category = ?
      WHERE id = ?
    `).run(category, row.id);
  }

  return rows.length;
}

async function scanSeriesNews(seriesTitle) {
  const query =
    encodeURIComponent(`${seriesTitle} season release date production renewed`);

  const url =
    `https://news.google.com/rss/search?q=${query}&hl=de&gl=DE&ceid=DE:de`;

  const feed =
    await rssParser.parseURL(url);

  return (feed.items || [])
    .slice(0, 5)
    .map((item) => ({
      title: item.title || "",
      link: item.link || "",
      date: item.pubDate || "",
      source: item.source?.title || "Google News"
    }));
}

async function importSeriesNews(seriesTitle) {
  const results =
    await scanSeriesNews(seriesTitle);

  let imported = 0;
  let skipped = 0;

  for (const item of results) {
    const exists =
      await seriesNewsExists(seriesTitle, item.title);

    if (exists) {
      skipped++;
      continue;
    }

    const category =
      detectNewsCategory(item.title);

    await saveSeriesNews({
      category,
      seriesTitle,
      headline: item.title,
      body: item.link,
      tag: seriesTitle,
      newsDate: item.date
    });

    imported++;
  }

  return { imported, skipped };
}

async function saveSeriesLibrary(data) {
  if (pgPool) {
    const result = await pgPool.query(
      `
      INSERT INTO series_library
      (
        title,
        tmdb_id,
        first_air_date,
        last_air_date,
        genres,
        rating,
        overview,
        poster_url,
        total_seasons,
        total_episodes,
        status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11
      )
      ON CONFLICT (title)
      DO UPDATE SET
        tmdb_id = EXCLUDED.tmdb_id,
        first_air_date = EXCLUDED.first_air_date,
        last_air_date = EXCLUDED.last_air_date,
        genres = EXCLUDED.genres,
        rating = EXCLUDED.rating,
        overview = EXCLUDED.overview,
        poster_url = EXCLUDED.poster_url,
        total_seasons = EXCLUDED.total_seasons,
        total_episodes = EXCLUDED.total_episodes,
        status = EXCLUDED.status
      RETURNING id
      `,
      [
        data.title || null,
        data.tmdbId || null,
        data.firstAirDate || null,
        data.lastAirDate || null,
        data.genres || null,
        data.rating || null,
        data.overview || null,
        data.posterUrl || null,
        data.totalSeasons || null,
        data.totalEpisodes || null,
        data.status || null
      ]
    );

    return result.rows[0].id;
  }

  const existing = db.prepare(`
    SELECT id FROM series_library
    WHERE title = ?
  `).get(data.title);

  if (existing) {
    db.prepare(`
      UPDATE series_library
      SET
        tmdb_id = ?,
        first_air_date = ?,
        last_air_date = ?,
        genres = ?,
        rating = ?,
        overview = ?,
        poster_url = ?,
        total_seasons = ?,
        total_episodes = ?,
        status = ?
      WHERE title = ?
    `).run(
      data.tmdbId || null,
      data.firstAirDate || null,
      data.lastAirDate || null,
      data.genres || null,
      data.rating || null,
      data.overview || null,
      data.posterUrl || null,
      data.totalSeasons || null,
      data.totalEpisodes || null,
      data.status || null,
      data.title
    );

    return existing.id;
  }

  const result = db.prepare(`
    INSERT INTO series_library
    (
      title,
      tmdb_id,
      first_air_date,
      last_air_date,
      genres,
      rating,
      overview,
      poster_url,
      total_seasons,
      total_episodes,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.title || null,
    data.tmdbId || null,
    data.firstAirDate || null,
    data.lastAirDate || null,
    data.genres || null,
    data.rating || null,
    data.overview || null,
    data.posterUrl || null,
    data.totalSeasons || null,
    data.totalEpisodes || null,
    data.status || null
  );

  return result.lastInsertRowid;
}

async function saveSeriesTopic(seriesName, topicId) {
  if (pgPool) {
    return await pgPool.query(
      `
      INSERT INTO series_topics
      (
        series_name,
        topic_id,
        topic_title
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (series_name)
      DO UPDATE SET
        topic_id = EXCLUDED.topic_id,
        topic_title = EXCLUDED.topic_title
      `,
      [
        seriesName,
        topicId,
        seriesName
      ]
    );
  }

  return db.prepare(`
    INSERT INTO series_topics
    (
      series_name,
      topic_id,
      topic_title
    )
    VALUES (?, ?, ?)
    ON CONFLICT(series_name)
    DO UPDATE SET
      topic_id = excluded.topic_id,
      topic_title = excluded.topic_title
  `).run(
    seriesName,
    topicId,
    seriesName
  );
}

async function getSeriesTopic(seriesName) {
  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT topic_id
      FROM series_topics
      WHERE series_name = $1
      LIMIT 1
      `,
      [seriesName]
    );

    return result.rows[0]?.topic_id || null;
  }

  const row = db.prepare(`
    SELECT topic_id
    FROM series_topics
    WHERE series_name = ?
    LIMIT 1
  `).get(seriesName);

  return row?.topic_id || null;
}

async function getMissingEpisodes(seriesTitle, season) {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT episode
      FROM series
      WHERE series_title = $1
      AND season = $2
      ORDER BY episode ASC
      `,
      [seriesTitle, season]
    );

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT episode
      FROM series
      WHERE series_title = ?
      AND season = ?
      ORDER BY episode ASC
    `).all(seriesTitle, season);
  }

  const episodes = rows
    .map(row => Number(row.episode))
    .filter(n => Number.isInteger(n) && n > 0);

  if (!episodes.length) {
    return [];
  }

  const maxEpisode = Math.max(...episodes);
  const existing = new Set(episodes);

  const missing = [];

  for (let i = 1; i <= maxEpisode; i++) {
    if (!existing.has(i)) {
      missing.push(i);
    }
  }

  return missing;
}

async function handleMissingCommand(msg, text) {
  const parts = text.replace("/missing", "").trim().split(" ");

  if (parts.length < 2) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/missing Serienname Staffel\n\n" +
        "Beispiel:\n" +
        "/missing Tulsa King 1"
    });
    return;
  }

  const season = Number(parts.pop());
  const seriesTitle = parts.join(" ").trim();

  if (!seriesTitle || !Number.isInteger(season)) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Ungültiger Befehl.\n\n" +
        "Beispiel:\n" +
        "/missing Tulsa King 1"
    });
    return;
  }

  const missing = await getMissingEpisodes(seriesTitle, season);

  if (!missing.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "✅ Keine fehlenden Episoden gefunden:\n\n" +
        `📺 ${seriesTitle}\n` +
        `📀 Staffel ${String(season).padStart(2, "0")}`
    });
    return;
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "⚠️ Fehlende Episoden:\n\n" +
      `📺 ${seriesTitle}\n` +
      `📀 Staffel ${String(season).padStart(2, "0")}\n\n` +
      missing
        .map(ep => `• S${String(season).padStart(2, "0")}E${String(ep).padStart(2, "0")}`)
        .join("\n")
  });
}

async function getCollection(tmdbCollectionId) {

  if (pgPool) {

    const result = await pgPool.query(
      `
      SELECT *
      FROM collections
      WHERE tmdb_collection_id = $1
      LIMIT 1
      `,
      [tmdbCollectionId]
    );

    return result.rows[0] || null;
  }

  return db.prepare(`
    SELECT * FROM collections
    WHERE tmdb_collection_id = ?
  `).get(tmdbCollectionId);
}

async function saveCollection(data) {
  if (pgPool) {
    return await pgPool.query(
      `
      INSERT INTO collections
      (
        collection_name,
        tmdb_collection_id,
        topic_id,
        poster_url
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tmdb_collection_id)
      DO UPDATE SET
        collection_name = EXCLUDED.collection_name,
        topic_id = EXCLUDED.topic_id,
        poster_url = EXCLUDED.poster_url
      `,
      [
        data.collectionName,
        data.tmdbCollectionId,
        data.topicId,
        data.posterUrl
      ]
    );
  }

  return db.prepare(`
    INSERT INTO collections
    (
      collection_name,
      tmdb_collection_id,
      topic_id,
      poster_url
    )
    VALUES (?, ?, ?, ?)
    ON CONFLICT(tmdb_collection_id)
    DO UPDATE SET
      collection_name = excluded.collection_name,
      topic_id = excluded.topic_id,
      poster_url = excluded.poster_url
  `).run(
    data.collectionName,
    data.tmdbCollectionId,
    data.topicId,
    data.posterUrl
  );
}

async function getCollectionById(tmdbCollectionId) {

  if (pgPool) {

    const result = await pgPool.query(
      `
      SELECT *
      FROM collections
      WHERE tmdb_collection_id = $1
      LIMIT 1
      `,
      [tmdbCollectionId]
    );

    return result.rows[0] || null;
  }

  return db.prepare(`
    SELECT * FROM collections
    WHERE tmdb_collection_id = ?
  `).get(tmdbCollectionId);
}

async function saveCollectionHubMessageId(
  tmdbCollectionId,
  messageId
) {

  if (pgPool) {

    return await pgPool.query(
      `
      UPDATE collections
      SET hub_message_id = $1
      WHERE tmdb_collection_id = $2
      `,
      [messageId, tmdbCollectionId]
    );
  }

  return db.prepare(`
    UPDATE collections
    SET hub_message_id = ?
    WHERE tmdb_collection_id = ?
  `).run(messageId, tmdbCollectionId);
}

// =============================
// SERIES DB HELPERS
// =============================
async function getSavedSeasonEpisodeCount(seriesTitle, season) {
  const targetKey = makeKey(seriesTitle);

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT series_title
      FROM series
      WHERE season = $1
      `,
      [season]
    );

    return result.rows.filter((row) =>
      makeKey(row.series_title) === targetKey
    ).length;
  }

  const rows = db.prepare(`
    SELECT series_title
    FROM series
    WHERE season = ?
  `).all(season);

  return rows.filter((row) =>
    makeKey(row.series_title) === targetKey
  ).length;
}

async function getSavedEpisode(
  seriesTitle,
  season,
  episode
) {
  const targetKey =
    makeKey(seriesTitle);

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT
        *
      FROM series
      WHERE season = $1
      AND episode = $2
      `,
      [season, episode]
    );

    return (
      result.rows.find(
        (row) =>
          makeKey(row.series_title) ===
          targetKey
      ) || null
    );
  }

  const rows = db.prepare(`
    SELECT *
    FROM series
    WHERE season = ?
    AND episode = ?
  `).all(
    season,
    episode
  );

  return (
    rows.find(
      (row) =>
        makeKey(row.series_title) ===
        targetKey
    ) || null
  );
}

// =============================
// SERIES SMART INDEXES
// =============================
async function getSeriesOverviewRows() {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT
        series_title,
        genre,
        universe,
        COUNT(*) AS episode_count,
        COUNT(DISTINCT season) AS season_count,
        MAX(rating) AS rating
      FROM series
      GROUP BY series_title, genre, universe
      ORDER BY series_title ASC
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT
        series_title,
        genre,
        universe,
        COUNT(*) AS episode_count,
        COUNT(DISTINCT season) AS season_count,
        MAX(rating) AS rating
      FROM series
      GROUP BY series_title, genre, universe
      ORDER BY series_title ASC
    `).all();
  }

  return rows;
}

async function getSeriesLibraryInfo(seriesTitle) {
  const targetKey = makeKey(seriesTitle);

  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT *
      FROM series_library
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT *
      FROM series_library
    `).all();
  }

  return rows.find((row) =>
    makeKey(row.title) === targetKey
  ) || null;
}

async function getOfficialSeriesTotal(seriesTitle, savedEpisodes = 0) {
  const library =
    await getSeriesLibraryInfo(seriesTitle);

  const libraryTotal =
    Number(library?.total_episodes || 0);

  if (libraryTotal > 0) {
    return libraryTotal;
  }

  const seasonCount =
    getKnownSeasonCount(seriesTitle);

  if (!seasonCount) {
    return null;
  }

  let total = 0;

  for (let season = 1; season <= seasonCount; season++) {
    total +=
      getKnownSeasonEpisodeCount(
        seriesTitle,
        season
      ) || 0;
  }

  return total || null;
}

async function buildSeriesSmartLine(row) {
  const saved =
    Number(row.episode_count || 0);

  const official =
    await getOfficialSeriesTotal(
      row.series_title,
      saved
    );

  const percent =
  official && official > 0
    ? Math.min(100, Math.round((saved / official) * 100))
    : 0;

  const bar =
    official
      ? buildSeriesProgressBar(row.series_title, saved, official)
      : "□□□□□□□□□□";

  return (
    `📺 ${String(row.series_title || "Unbekannt").toUpperCase()}\n` +
    `└ ${bar} ${saved}/${official || "??"} • ${official ? percent + "%" : "UNKNOWN"}\n`
  );
}

async function buildSeriesLibraryCaption() {
  const rows = await getSeriesOverviewRows();

  let text =
    "███ SERIES LIBRARY ███\n\n" +
    `📺 TOTAL SERIES • ${rows.length}\n\n` +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!rows.length) {
    text += "Noch keine Serien gespeichert.\n";
  } else {
    for (const row of rows) {
      text += await buildSeriesSmartLine(row) + "\n";
    }
  }

  text +=
    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return text.slice(0, 4000);
}

async function buildTrendingSeriesCaption() {
  const rows = await getSeriesOverviewRows();

  const filtered = [];

  for (const row of rows) {
    const saved = Number(row.episode_count || 0);
    const official = await getOfficialSeriesTotal(row.series_title, saved);

    const percent =
  official && official > 0
    ? Math.min(100, Math.round((saved / official) * 100))
    : 0;

    if (percent >= 35 && percent < 100) {
      filtered.push(row);
    }
  }

  let text =
    "███ TRENDING SERIES ███\n\n" +
    "🔥 ACTIVE / GROWING ARCHIVES\n\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (filtered.length) {
    for (const row of filtered) {
      text += await buildSeriesSmartLine(row) + "\n";
    }
  } else {
    text += "Keine Trending-Serien gefunden.\n";
  }

  text +=
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return text.slice(0, 4000);
}

async function buildIncompleteSeriesCaption() {
  const rows = await getSeriesOverviewRows();

  const filtered = [];

  for (const row of rows) {
    const saved = Number(row.episode_count || 0);
    const official = await getOfficialSeriesTotal(row.series_title, saved);

    if (official > 0 && saved < official) {
      filtered.push(row);
    }
  }

  let text =
    "███ INCOMPLETE SERIES ███\n\n" +
    "🧩 FEHLENDE / UNVOLLSTÄNDIGE SERIEN\n\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (filtered.length) {
    for (const row of filtered) {
      text += await buildSeriesSmartLine(row) + "\n";
    }
  } else {
    text += "Alle bekannten Serien sind vollständig.\n";
  }

  text +=
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return text.slice(0, 4000);
}

async function buildMasteredSeriesCaption() {
  const rows = await getSeriesOverviewRows();

  const filtered = [];

  for (const row of rows) {
    const saved = Number(row.episode_count || 0);
    const official = await getOfficialSeriesTotal(row.series_title, saved);

    if (official > 0 && saved >= official) {
      filtered.push(row);
    }
  }

  let text =
    "███ MASTERED SERIES ███\n\n" +
    "🏆 COMPLETE SERIES ARCHIVES\n\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (filtered.length) {
    for (const row of filtered) {
      text += await buildSeriesSmartLine(row) + "\n";
    }
  } else {
    text += "Noch keine Serie vollständig archiviert.\n";
  }

  text +=
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return text.slice(0, 4000);
}

async function seriesNewsCenterCaption() {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT *
      FROM series_news
      ORDER BY created_at DESC
      LIMIT 10
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT *
      FROM series_news
      ORDER BY created_at DESC
      LIMIT 10
    `).all();
  }

  let text =
    "███ NEWS CENTER ███\n\n" +
    "🚨 AKTUELLE SERIEN NEWS\n\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!rows.length) {
    text += "Noch keine News gespeichert.\n\n";
  } else {
    for (const n of rows) {
      text +=
        `📺 ${String(n.series_title || "Unbekannt").toUpperCase()}\n` +
        `🚨 ${n.headline || "Update"}\n`;

      if (n.news_date) {
        text += `📅 ${n.news_date}\n`;
      }

      if (n.body) {
        text += `\n${String(n.body).slice(0, 500)}\n`;
      }

      if (n.tag) {
        text += `\n#${String(n.tag).replace(/\s+/g, "")}\n`;
      }

      text += "\n━━━━━━━━━━━━━━━━━━\n\n";
    }
  }

  text += "@LibraryOfLegends";

  return cleanTelegramText(text).slice(0, 4000);
}

async function seriesComingSoonCaption() {
  const rows =
    await getSeriesNewsByCategory("coming_soon");

  return (
    "███ COMING SOON ███\n\n" +
    "📅 KOMMENDE SERIEN\n\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    buildSeriesNewsList(rows) +
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends"
  );
}

async function seriesProductionStatusCaption() {
  const rows =
    await getSeriesNewsByCategory("production");

  return (
    "███ PRODUKTIONSSTATUS ███\n\n" +
    "🎬 SERIEN IN PRODUKTION\n\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    buildSeriesNewsList(rows) +
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends"
  );
}

async function seriesNewSeasonsCaption() {
  const rows =
    await getSeriesNewsByCategory("new_season");

  return (
    "███ NEUE STAFFELN ███\n\n" +
    "🆕 BESTÄTIGTE STAFFELN\n\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    buildSeriesNewsList(rows) +
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends"
  );
}

async function miniSeriesHubCaption() {
  const rows =
    (await getSeriesLibraryRows())
      .filter(isMiniSeriesLibraryRow);

  return (
    "███ MINI SERIES ███\n\n" +
    "🎭 ABGESCHLOSSENE MINI-SERIEN\n\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    buildSimpleSeriesList(rows) +
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends"
  );
}

async function kidsSeriesHubCaption() {
  const rows =
    (await getSeriesLibraryRows())
      .filter(isKidsSeriesLibraryRow);

  return (
    "███ KIDS SERIES ███\n\n" +
    "👶 KINDERSERIEN ARCHIV\n\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    buildSimpleSeriesList(rows) +
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends"
  );
}

async function animeSeriesHubCaption() {
  const rows =
    (await getSeriesLibraryRows())
      .filter(isAnimeSeriesLibraryRow);

  return (
    "███ ANIME HUB ███\n\n" +
    "🌸 ANIME ARCHIV\n\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    buildSimpleSeriesList(rows) +
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends"
  );
}

async function documentarySeriesHubCaption() {
  const rows =
    (await getSeriesLibraryRows())
      .filter(isDocumentarySeriesLibraryRow);

  return (
    "███ DOCUMENTARY SERIES ███\n\n" +
    "🌍 DOKUMENTATIONS ARCHIV\n\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    buildSimpleSeriesList(rows) +
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends"
  );
}

async function starWarsSeriesHubCaption() {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT
        sl.*
      FROM series_library sl
      JOIN (
        SELECT DISTINCT series_title
        FROM series
        WHERE universe ILIKE '%Star Wars%'
      ) s
      ON LOWER(sl.title) = LOWER(s.series_title)
      ORDER BY sl.title ASC
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT
        sl.*
      FROM series_library sl
      JOIN (
        SELECT DISTINCT series_title
        FROM series
        WHERE LOWER(universe) LIKE '%star wars%'
      ) s
      ON LOWER(sl.title) = LOWER(s.series_title)
      ORDER BY sl.title ASC
    `).all();
  }

  return (
    "███ STAR WARS SERIES ███\n\n" +
    "⭐ STAR WARS ARCHIV\n\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    buildSimpleSeriesList(rows) +
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends"
  );
}

async function marvelSeriesHubCaption() {
  const rows =
    (await getSeriesLibraryRows())
      .filter(isMarvelSeries);

  return (
    "███ MARVEL SERIES ███\n\n" +
    "🧬 MARVEL ARCHIV\n\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    buildSimpleSeriesList(rows) +
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends"
  );
}

async function dcSeriesHubCaption() {
  const rows =
    (await getSeriesLibraryRows())
      .filter(isDCSeries);

  return (
    "███ DC SERIES ███\n\n" +
    "🦇 DC ARCHIV\n\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    buildSimpleSeriesList(rows) +
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends"
  );
}

async function disneySeriesHubCaption() {
  const rows =
    (await getSeriesLibraryRows())
      .filter(isDisneySeries);

  return (
    "███ DISNEY SERIES ███\n\n" +
    "🏰 DISNEY ARCHIV\n\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    buildSimpleSeriesList(rows) +
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends"
  );
}

async function getSeriesLibraryRows() {
  if (pgPool) {
    const result = await pgPool.query(`
      SELECT *
      FROM series_library
      ORDER BY title ASC
    `);

    return result.rows;
  }

  return db.prepare(`
    SELECT *
    FROM series_library
    ORDER BY title ASC
  `).all();
}

const SERIES_STATUS_OVERRIDES = {
  "the-mandalorian": "returning"
};

function getSeriesStatus(row) {
  const key = makeKey(row.title || "");

  return (
    SERIES_STATUS_OVERRIDES[key] ||
    row.status ||
    ""
  );
}

function formatSeriesStatus(status = "") {
  const s = String(status || "").toLowerCase();

  if (s.includes("returning")) {
    return "🔄 Fortlaufend";
  }

  if (s.includes("ended")) {
    return "🏆 Abgeschlossen";
  }

  if (s.includes("cancel")) {
    return "❌ Abgesetzt";
  }

  if (s.includes("planned")) {
    return "📅 Geplant";
  }

  if (s.includes("production")) {
    return "🎬 In Produktion";
  }

  return "❔ Status unbekannt";
}

function buildSimpleSeriesList(rows) {
  if (!rows.length) {
    return "Noch keine Serien gefunden.\n";
  }

  return rows
    .slice(0, 30)
    .map((row) => {
      const totalEpisodes =
        Number(row.total_episodes || 0);

      const total =
        totalEpisodes > 0
          ? `📀 ${totalEpisodes} Episoden`
          : "📀 Episoden unbekannt";

      const status =
  formatSeriesStatus(getSeriesStatus(row));

      const rating =
        row.rating
          ? `⭐ ${row.rating}`
          : "⭐ Keine Bewertung";

      return (
        `📺 ${String(row.title || "Unbekannt").toUpperCase()}\n` +
        `└ ${total} • ${status} • ${rating}\n`
      );
    })
    .join("\n");
}

function isMiniSeriesLibraryRow(row) {
  const seasons = Number(row.total_seasons || 0);
  const episodes = Number(row.total_episodes || 0);
  const status = String(row.status || "").toLowerCase();

  return (
    seasons === 1 &&
    episodes > 0 &&
    episodes <= 12 &&
    status.includes("ended")
  );
}

function isKidsSeriesLibraryRow(row) {
  const title = String(row.title || "").toLowerCase();
  const genres = String(row.genres || "").toLowerCase();
  const text = `${title} ${genres}`;

  const allowed = [
    "timon",
    "pumbaa",
    "jungen jedi",
    "galaxy of adventures",
    "darkwing",
    "ducktales",
    "bluey",
    "paw patrol"
  ];

  const blocked = [
    "harley quinn",
    "rebels",
    "clone wars",
    "bad batch",
    "resistance",
    "visionen",
    "geschichten der jedi",
    "geschichten des imperiums",
    "geschichten der unterwelt"
  ];

  if (blocked.some((name) => text.includes(name))) return false;

  return (
    allowed.some((name) => text.includes(name)) ||
    text.includes("kids") ||
    text.includes("children") ||
    text.includes("kinder")
  );
}

function isAnimeSeriesLibraryRow(row) {
  const title = String(row.title || "").toLowerCase();
  const genres = String(row.genres || "").toLowerCase();
  const text = `${title} ${genres}`;

  return (
    text.includes("anime") ||
    text.includes("visionen") ||
    text.includes("visions")
  );
}

function isDocumentarySeriesLibraryRow(row) {
  const text =
    `${row.title || ""} ${row.genres || ""}`
      .toLowerCase();

  return (
    text.includes("documentary") ||
    text.includes("dokumentation") ||
    text.includes("doku")
  );
}

function isStarWarsSeries(row) {
  const text =
    `${row.title || ""} ${row.universe || ""}`
      .toLowerCase();

  return text.includes("star wars");
}

function isMarvelSeries(row) {
  const text =
    `${row.title || ""} ${row.universe || ""}`
      .toLowerCase();

  return (
    text.includes("marvel") ||
    text.includes("mcu")
  );
}

function isDCSeries(row) {
  const text =
    `${row.title || ""} ${row.universe || ""}`
      .toLowerCase();

  return (
    text.includes("dc") ||
    text.includes("harley quinn") ||
    text.includes("penguin")
  );
}

function isDisneySeries(row) {
  const text =
    `${row.title || ""} ${row.universe || ""}`
      .toLowerCase();

  return (
    text.includes("disney") ||
    text.includes("timon") ||
    text.includes("pumbaa")
  );
}

// =============================
// UPDATE SERIES SMART TOPICS
// =============================
async function updateSeriesSmartTopics() {
  const smartTopics = [
  {
    topic: "📺 SERIES LIBRARY",
    builder: buildSeriesLibraryCaption
  },
  {
    topic: "🔥 TRENDING",
    builder: buildTrendingSeriesCaption
  },
  {
    topic: "🧩 INCOMPLETE",
    builder: buildIncompleteSeriesCaption
  },
  {
    topic: "🏆 MASTERED",
    builder: buildMasteredSeriesCaption
  },
  {
    topic: "🚨 NEWS CENTER",
    builder: seriesNewsCenterCaption
  },
  {
    topic: "📅 COMING SOON",
    builder: seriesComingSoonCaption
  },
  {
    topic: "🎬 PRODUKTIONSSTATUS",
    builder: seriesProductionStatusCaption
  },
  {
    topic: "🆕 NEUE STAFFELN",
    builder: seriesNewSeasonsCaption
  },
  {
    topic: "🎭 MINI SERIES",
    builder: miniSeriesHubCaption
  },
  {
    topic: "👶 KIDS SERIES",
    builder: kidsSeriesHubCaption
  },
  {
    topic: "🌸 ANIME HUB",
    builder: animeSeriesHubCaption
  },
  {
  topic: "🌍 DOCUMENTARY SERIES",
  builder: documentarySeriesHubCaption
},
{
  topic: "⭐ STAR WARS SERIES",
  builder: starWarsSeriesHubCaption
},
{
  topic: "🧬 MARVEL SERIES",
  builder: marvelSeriesHubCaption
},
{
  topic: "🦇 DC SERIES",
  builder: dcSeriesHubCaption
},
{
  topic: "🏰 DISNEY SERIES",
  builder: disneySeriesHubCaption
},
];

  for (const item of smartTopics) {
    let topic = null;

    if (pgPool) {
      const result = await pgPool.query(
        `
        SELECT *
        FROM topics
        WHERE name = $1
        LIMIT 1
        `,
        [item.topic]
      );

      topic = result.rows[0] || null;
    } else {
      topic = db.prepare(`
        SELECT *
        FROM topics
        WHERE name = ?
        LIMIT 1
      `).get(item.topic);
    }

    console.log("🧪 SMART TOPIC CHECK:", {
      gesucht: item.topic,
      gefunden: topic?.name,
      topicId: topic?.topic_id,
      hubMessageId: topic?.hub_message_id
    });

    if (!topic?.topic_id) {
  console.log("⚠️ Smart Topic fehlt, erstelle:", item.topic);

  const topicId = await createOrGetTopic({
    chatId: SERIES_GROUP_ID,
    name: item.topic,
    type: "series_smart"
  });

  if (!topicId) {
    console.log("❌ Smart Topic konnte nicht erstellt werden:", item.topic);
    continue;
  }

  topic = {
    name: item.topic,
    topic_id: topicId,
    hub_message_id: null
  };
}

    const text = await item.builder();

    if (topic.hub_message_id) {
  const edited = await tg("editMessageText", {
    chat_id: SERIES_GROUP_ID,
    message_id: topic.hub_message_id,
    text,
    parse_mode: "HTML"
  });

  if (!edited?.__error) {
    console.log("✅ Smart Topic aktualisiert:", item.topic);
    continue;
  }

  const editError =
    edited?.error?.description ||
    edited?.description ||
    "";

  if (editError.includes("message is not modified")) {
    console.log("ℹ️ Smart Topic unverändert:", item.topic);
    continue;
  }

  console.log(
    "⚠️ Smart Topic Edit fehlgeschlagen, erstelle neu:",
    editError || edited
  );
}

    const msg = await tg("sendMessage", {
      chat_id: SERIES_GROUP_ID,
      message_thread_id: Number(topic.topic_id),
      text
    });

    if (msg?.message_id) {
      if (pgPool) {
        await pgPool.query(
          `
          UPDATE topics
          SET hub_message_id = $1
          WHERE topic_id = $2
          `,
          [msg.message_id, topic.topic_id]
        );
      } else {
        db.prepare(`
          UPDATE topics
          SET hub_message_id = ?
          WHERE topic_id = ?
        `).run(
          msg.message_id,
          topic.topic_id
        );
      }

      console.log("✅ Smart Topic erstellt:", item.topic);
    }
  }
}

// =============================
// COLLECTION REGISTRY
// =============================
const chronologyRegistry = {
  "Terminator Filmreihe": [
    "1984",
    "1991",
    "2003",
    "2009",
    "2015",
    "2019"
  ],

  "Matrix Filmreihe": [
    "1999",
    "2003",
    "2021"
  ]
};

const collectionRegistry = {
  "Terminator Filmreihe": [
    { title: "Terminator", year: "1984" },
    { title: "Terminator 2 - Tag der Abrechnung", year: "1991" },
    { title: "Terminator 3 - Rebellion der Maschinen", year: "2003" },
    { title: "Terminator: Die Erlösung", year: "2009" },
    { title: "Terminator: Genisys", year: "2015" },
    { title: "Terminator: Dark Fate", year: "2019" }
  ],

  "Matrix Filmreihe": [
    { title: "Matrix", year: "1999" },
    { title: "Matrix Reloaded", year: "2003" },
    { title: "Matrix Revolutions", year: "2003" },
    { title: "Matrix Resurrections", year: "2021" }
  ]
};

// =============================
// COLLECTION THEMES
// =============================
const collectionThemes = {
  "Hangover Filmreihe": {
    emoji: "🍻",
    subline: "VEGAS • CHAOS • BLACKOUT"
  },

  "Terminator Filmreihe": {
    emoji: "🤖",
    subline: "SKYNET • JUDGMENT DAY • RESISTANCE"
  },

  "Matrix Filmreihe": {
    emoji: "💊",
    subline: "ZION • THE ONE • MACHINE WAR"
  },

  "John Wick Filmreihe": {
    emoji: "🩸",
    subline: "HIGH TABLE • EXCOMMUNICADO • REVENGE"
  },

  "Mission: Impossible Filmreihe": {
    emoji: "🎯",
    subline: "IMF • CLASSIFIED OPS • FIELD MISSION"
  },

  "Fast & Furious Filmreihe": {
    emoji: "🏎",
    subline: "SPEED • FAMILY • HEISTS"
  }
};

// =============================
// UNIVERSE CONFIGS
// =============================
const universeConfigs = {
  Marvel: {
  topicName: "🧬 Marvel Cinematic Universe",
  icon: "🧬",
  archive: "MARVEL MULTIVERSE ARCHIVE",
  subline: "PHASES • TIMELINE • SACRED CONTINUITY",
  status: "🔴 MULTIVERSE STATUS ACTIVE",

  aliases: [
    "marvel",
    "mcu",
    "avengers",
    "iron man",
    "captain america",
    "thor",
    "guardians of the galaxy",
    "black panther",
    "doctor strange",
    "spider man",
    "spider-man",
    "ant-man",
    "loki",
    "wanda",
    "wandavision",
    "moon knight",
    "daredevil",
    "punisher",
    "shang-chi",
    "eternals",
    "deadpool",
    "fantastic four",
    "thunderbolts"
  ],

  phases: {

    "PHASE 1": [
      "Iron Man",
      "Der unglaubliche Hulk",
      "Iron Man 2",
      "Thor",
      "Captain America: The First Avenger",
      "Marvel's The Avengers"
    ],

    "PHASE 2": [
      "Iron Man 3",
      "Thor: The Dark Kingdom",
      "The Return of the First Avenger",
      "Guardians of the Galaxy",
      "Avengers: Age of Ultron",
      "Ant-Man"
    ],

    "PHASE 3": [
      "The First Avenger: Civil War",
      "Doctor Strange",
      "Guardians of the Galaxy Vol. 2",
      "Spider-Man: Homecoming",
      "Thor: Tag der Entscheidung",
      "Black Panther",
      "Avengers: Infinity War",
      "Ant-Man and the Wasp",
      "Captain Marvel",
      "Avengers: Endgame",
      "Spider-Man: Far From Home"
    ],

    "PHASE 4": [
      "Black Widow",
      "Shang-Chi and the Legend of the Ten Rings",
      "Eternals",
      "Spider-Man: No Way Home",
      "Doctor Strange in the Multiverse of Madness",
      "Thor: Love and Thunder",
      "Black Panther: Wakanda Forever"
    ],

    "PHASE 5": [
      "Ant-Man and the Wasp: Quantumania",
      "Guardians of the Galaxy Vol. 3",
      "The Marvels",
      "Deadpool & Wolverine",
      "Captain America: Brave New World",
      "Thunderbolts*"
    ],

    "PHASE 6": [
      "The Fantastic Four: First Steps",
      "Avengers: Doomsday",
      "Avengers: Secret Wars"
    ]
  },

  series: [
    "WandaVision",
    "The Falcon and the Winter Soldier",
    "Loki",
    "What If...?",
    "Hawkeye",
    "Moon Knight",
    "Ms. Marvel",
    "She-Hulk",
    "Secret Invasion",
    "Echo",
    "Agatha All Along",
    "Ironheart",
    "Daredevil: Born Again",
    "Wonder Man",
    "Vision Quest",
    "Daredevil",
    "The Punisher"
  ]
},

    DCEU: {
    topicName: "🦇 DC Extended Universe",
    icon: "🦇",
    archive: "DC EXTENDED UNIVERSE ARCHIVE",
    subline: "GOTHAM • METROPOLIS • JUSTICE LEAGUE",
    status: "⚡ DCEU CONTINUITY ACTIVE",

    aliases: [
      "dc extended universe",
      "dceu",
      "man of steel",
      "batman v superman",
      "suicide squad",
      "wonder woman",
      "aquaman",
      "shazam",
      "birds of prey",
      "black adam",
      "blue beetle",
      "peacemaker"
    ],

    phases: {
      "DCEU TIMELINE": [
        "Man of Steel",
        "Batman v Superman: Dawn of Justice",
        "Suicide Squad",
        "Wonder Woman",
        "Justice League",
        "Aquaman",
        "Shazam!",
        "Birds of Prey",
        "Wonder Woman 1984",
        "Zack Snyder's Justice League",
        "The Suicide Squad",
        "Black Adam",
        "Shazam! Fury of the Gods",
        "The Flash",
        "Blue Beetle",
        "Aquaman and the Lost Kingdom"
      ]
    },

    series: [
      "Peacemaker"
    ]
  },

  DCU_GodsAndMonsters: {
    topicName: "🦸 DCU: Gods and Monsters",
    icon: "🦸",
    archive: "DCU GODS AND MONSTERS ARCHIVE",
    subline: "CHAPTER ONE • NEW DC CONTINUITY",
    status: "⚡ DCU TIMELINE ACTIVE",

    aliases: [
      "dcu",
      "gods and monsters",
      "superman",
      "supergirl",
      "clayface",
      "the authority",
      "brave and the bold",
      "swamp thing",
      "creature commandos",
      "lanterns",
      "waller",
      "paradise lost",
      "booster gold"
    ],

    phases: {
      "GODS AND MONSTERS FILMS": [
        "Superman",
        "Supergirl: Woman of Tomorrow",
        "Clayface",
        "The Authority",
        "The Brave and the Bold",
        "Swamp Thing"
      ]
    },

    series: [
      "Creature Commandos",
      "Peacemaker",
      "Lanterns",
      "Waller",
      "Paradise Lost",
      "Booster Gold",
      "Blue Beetle"
    ]
  },

  DC_Elseworlds: {
    topicName: "🃏 DC Elseworlds",
    icon: "🃏",
    archive: "DC ELSEWORLDS ARCHIVE",
    subline: "JOKER • THE BATMAN • ALTERNATE WORLDS",
    status: "🃏 ELSEWORLDS FILE ACTIVE",

    aliases: [
      "elseworlds",
      "joker",
      "the batman",
      "penguin",
      "constantine",
      "harley quinn",
      "teen titans go",
      "merry little batman"
    ],

    phases: {
      "JOKER FILES": [
        "Joker",
        "Joker: Folie à Deux"
      ],

      "THE BATMAN SAGA": [
        "The Batman",
        "The Batman Part II"
      ],

      "ELSEWORLDS MOVIES": [
        "Merry Little Batman",
        "Constantine",
        "Constantine 2"
      ]
    },

    series: [
      "The Penguin",
      "Harley Quinn",
      "Teen Titans Go!"
    ]
  },

  Arrowverse: {
    topicName: "🌍 Arrowverse",
    icon: "🌍",
    archive: "ARROWVERSE MULTIVERSE ARCHIVE",
    subline: "EARTHS • CROSSOVERS • CRISIS FILES",
    status: "🌍 MULTIVERSE SIGNAL ACTIVE",

    aliases: [
      "arrowverse",
      "arrow",
      "the flash",
      "supergirl",
      "legends of tomorrow",
      "black lightning",
      "batwoman",
      "smallville",
      "lucifer",
      "titans",
      "doom patrol",
      "stargirl",
      "swamp thing"
    ],

    phases: {},

    series: [
      "Smallville",
      "Arrow",
      "The Flash",
      "Supergirl",
      "Legends of Tomorrow",
      "Black Lightning",
      "Batwoman",
      "Lucifer",
      "Titans",
      "Doom Patrol",
      "Swamp Thing",
      "Stargirl"
    ]
  },

  DCAMU: {
    topicName: "🎞 DC Animated Movie Universe",
    icon: "🎞",
    archive: "DCAMU ANIMATED CONTINUITY ARCHIVE",
    subline: "FLASHPOINT • NEW 52 • APOKOLIPS WAR",
    status: "🎞 ANIMATED MOVIE TIMELINE ACTIVE",

    aliases: [
      "dcamu",
      "flashpoint paradox",
      "justice league war",
      "son of batman",
      "batman vs robin",
      "justice league dark",
      "apokolips war",
      "teen titans"
    ],

    phases: {
      "DCAMU TIMELINE": [
        "Justice League: The Flashpoint Paradox",
        "Justice League: War",
        "Son of Batman",
        "Justice League: Throne of Atlantis",
        "Batman vs. Robin",
        "Batman: Bad Blood",
        "Justice League vs. Teen Titans",
        "Justice League Dark",
        "Teen Titans: Der Judas-Auftrag",
        "Suicide Squad: Hell to Pay",
        "The Death and Return of Superman",
        "Batman: Hush",
        "Wonder Woman: Bloodlines",
        "Justice League Dark: Apokolips War",
        "Constantine: The House of Mystery"
      ]
    },

    series: []
  },

  DCAU: {
    topicName: "📺 DC Animated Universe",
    icon: "📺",
    archive: "DCAU LEGACY ANIMATION ARCHIVE",
    subline: "BATMAN TAS • SUPERMAN TAS • JUSTICE LEAGUE",
    status: "📺 LEGACY ANIMATION FILE ACTIVE",

    aliases: [
      "dcau",
      "batman tas",
      "superman tas",
      "batman beyond",
      "justice league unlimited",
      "static shock",
      "zeta project",
      "phantasm"
    ],

    phases: {
      "DCAU MOVIES": [
        "Batman und das Phantom",
        "Batman & Mr. Freeze – Eiszeit",
        "Batman – Rätsel um Batwoman",
        "Batman und Harley Quinn",
        "Justice League vs. the Fatal Five"
      ]
    },

    series: [
      "Batman",
      "Superman",
      "Batman of the Future",
      "Die Liga der Gerechten",
      "Justice League Unlimited",
      "Static Shock",
      "The Zeta Project"
    ]
  },

  StarWars: {
    topicName: "🌌 Star Wars Universe",
    icon: "🌌",
    archive: "GALACTIC REPUBLIC ARCHIVE",
    subline: "JEDI • SITH • GALACTIC TIMELINE",
    status: "🛰 FORCE SIGNAL DETECTED",

    aliases: [
      "star wars",
      "jedi",
      "sith",
      "mandalorian",
      "obi wan",
      "obi-wan",
      "andor",
      "ahsoka",
      "boba fett",
      "clone wars",
      "bad batch"
    ],

    phases: {
      "SKYWALKER SAGA": [
        "Star Wars: Episode I",
        "Star Wars: Episode II",
        "Star Wars: Episode III",
        "Krieg der Sterne",
        "Das Imperium schlägt zurück",
        "Die Rückkehr der Jedi-Ritter",
        "Das Erwachen der Macht",
        "Die letzten Jedi",
        "Der Aufstieg Skywalkers"
      ],

      "STANDALONE": [
        "Rogue One",
        "Solo"
      ],

      "ANIMATED MOVIES": [
        "Star Wars: The Clone Wars"
      ]
    },

    series: [
  "Star Wars: The Clone Wars",
  "Star Wars Rebels",
  "Star Wars Resistance",
  "Star Wars: The Bad Batch",
  "Star Wars Galaxy of Adventures",
  "The Mandalorian",
  "Andor",
  "Ahsoka",
  "Obi-Wan Kenobi",
  "The Book of Boba Fett",
  "Die Ewoks"
]
  },

  Disney: {
  topicName: "🏰 Disney Universe",
  icon: "🏰",
  archive: "DISNEY MAGIC ARCHIVE",
  subline: "CLASSICS • PIXAR • FAIRYTALES",
  status: "✨ MAGIC KINGDOM ACTIVE",

  aliases: [
    "disney",
    "pixar",
    "toy story",
    "cars",
    "findet nemo",
    "finding nemo",
    "frozen",
    "die eiskönigin",
    "könig der löwen",
    "lion king",
    "aladdin",
    "mulan",
    "moana",
    "vaiana",
    "encanto",
    "coco",
    "zootopia",
    "zoomania",
    "rapunzel",
    "tangled",
    "monster ag",
    "monsters inc",
    "inside out",
    "alles steht kopf",
    "baymax",
    "lilo stitch",
    "winnie puuh"
  ],

  phases: {
    "GOLDENE KLASSIKER": [
      "Schneewittchen und die sieben Zwerge",
      "Pinocchio",
      "Fantasia",
      "Dumbo",
      "Bambi",
      "Cinderella",
      "Alice im Wunderland",
      "Peter Pan",
      "Susi und Strolch",
      "Dornröschen"
    ],

    "BRONZE ÄRA": [
      "101 Dalmatiner",
      "Die Hexe und der Zauberer",
      "Das Dschungelbuch",
      "Aristocats",
      "Robin Hood",
      "Die vielen Abenteuer von Winnie Puuh",
      "Bernard und Bianca",
      "Cap und Capper",
      "Taran und der Zauberkessel",
      "Basil, der große Mäusedetektiv",
      "Oliver & Co."
    ],

    "DISNEY RENAISSANCE": [
      "Arielle, die Meerjungfrau",
      "Die Schöne und das Biest",
      "Aladdin",
      "Der König der Löwen",
      "Pocahontas",
      "Der Glöckner von Notre Dame",
      "Hercules",
      "Mulan",
      "Tarzan"
    ],

    "POST RENAISSANCE": [
      "Fantasia 2000",
      "Ein Königreich für ein Lama",
      "Atlantis – Das Geheimnis der verlorenen Stadt",
      "Lilo & Stitch",
      "Der Schatzplanet",
      "Bärenbrüder",
      "Die Kühe sind los",
      "Himmel und Huhn",
      "Triff die Robinsons",
      "Bolt – Ein Hund für alle Fälle"
    ],

    "MODERNE CGI ÄRA": [
      "Rapunzel – Neu verföhnt",
      "Winnie Puuh",
      "Ralph reichts",
      "Die Eiskönigin – Völlig unverfroren",
      "Baymax – Riesiges Robowabohu",
      "Zoomania",
      "Vaiana",
      "Ralph reichts 2: Chaos im Netz",
      "Die Eiskönigin 2",
      "Raya und der letzte Drache",
      "Encanto",
      "Strange World",
      "Wish",
      "Vaiana 2",
      "Zoomania 2"
    ],

    "PIXAR": [
      "Toy Story",
      "Das große Krabbeln",
      "Toy Story 2",
      "Monster AG",
      "Findet Nemo",
      "Die Unglaublichen",
      "Cars",
      "Ratatouille",
      "WALL·E",
      "Oben",
      "Toy Story 3",
      "Cars 2",
      "Merida",
      "Die Monster Uni",
      "Alles steht Kopf",
      "Arlo & Spot",
      "Findet Dorie",
      "Cars 3",
      "Coco",
      "Die Unglaublichen 2",
      "Toy Story 4",
      "Onward",
      "Soul",
      "Luca",
      "Rot",
      "Lightyear",
      "Elemental",
      "Alles steht Kopf 2",
      "Elio"
    ]
  },

    series: []
}
};

  // =============================
// STAR WARS ERA REGISTRY
// =============================
const STAR_WARS_ERAS = [

  {
    key: "high_republic",
    topicName: "🌌 High Republic",
    title: "THE HIGH REPUBLIC",
    subtitle: "✨ GOLDEN AGE OF THE JEDI",
    banner: "https://image.tmdb.org/t/p/w1280/PLACEHOLDER.jpg",

    entries: [
      "Star Wars: Die Abenteuer der jungen Jedi",
      "The Acolyte"
    ]
  },

  {
    key: "fall_of_jedi",
    topicName: "⚔️ Fall of the Jedi",
    title: "FALL OF THE JEDI",
    subtitle: "🩸 THE CLONE WARS ERA",
    banner: "https://via.placeholder.com/1280x720.png?text=Star+Wars+Era",

    entries: [
      "Star Wars: Episode I - Die dunkle Bedrohung",
      "Star Wars: Episode II - Angriff der Klonkrieger",
      "Star Wars: The Clone Wars",
      "Star Wars: Episode III - Die Rache der Sith",
      "Star Wars: The Bad Batch"
    ]
  },

  {
    key: "imperial_era",
    topicName: "🛡 Imperial Era",
    title: "IMPERIAL ERA",
    subtitle: "⚫ RISE OF THE EMPIRE",
    banner: "https://via.placeholder.com/1280x720.png?text=Star+Wars+Era",

    entries: [
      "Solo: A Star Wars Story",
      "Obi-Wan Kenobi"
    ]
  },

  {
    key: "rebellion_era",
    topicName: "🔥 Age of Rebellion",
    title: "AGE OF REBELLION",
    subtitle: "🚀 THE GALACTIC CIVIL WAR",
    banner: "https://via.placeholder.com/1280x720.png?text=Star+Wars+Era",

    entries: [
      "Star Wars Rebels",
      "Andor",
      "Rogue One: A Star Wars Story",
      "Krieg Der Sterne",
      "Star Wars: Episode V - Das Imperium schlägt zurück",
      "Star Wars: Episode VI - Die Rückkehr der Jedi-Ritter"
    ]
  },

  {
    key: "new_republic",
    topicName: "🛰 New Republic",
    title: "THE NEW REPUBLIC",
    subtitle: "🌠 THE MANDOVERSE",
    banner: "https://via.placeholder.com/1280x720.png?text=Star+Wars+Era",

    entries: [
      "The Mandalorian",
      "Das Buch von Boba Fett",
      "Skeleton Crew",
      "Ahsoka",
      "The Mandalorian & Grogu"
    ]
  },

  {
    key: "first_order",
    topicName: "☠️ First Order Era",
    title: "RISE OF THE FIRST ORDER",
    subtitle: "⚡ THE RESISTANCE ERA",
    banner: "https://via.placeholder.com/1280x720.png?text=Star+Wars+Era",

    entries: [
  "Star Wars Resistance",
  "Star Wars: Das Erwachen der Macht",
  "Star Wars: Die letzten Jedi",
  "Star Wars: Der Aufstieg Skywalkers"
]
  }

];

function detectStarWarsEra(title = "") {
  const titleKey = makeKey(title);

  for (const era of STAR_WARS_ERAS) {
    const found = era.entries.some((entry) => {
      const entryKey = makeKey(entry);

      return (
        titleKey.includes(entryKey) ||
        entryKey.includes(titleKey)
      );
    });

    if (found) return era;
  }

  return null;
}

// =============================
// STAR WARS ERA TOPICS
// =============================
async function ensureStarWarsEraTopics() {
  for (const era of STAR_WARS_ERAS) {
    await createOrGetTopic({
      chatId: MOVIE_GROUP_ID,
      name: era.topicName,
      type: "starwars_era"
    });

    await sleep(1200);
  }
}

// =============================
// STAR WARS ERA HUB CAPTION — NEXUS BLACK EDITION
// =============================
async function starWarsEraHubCaption(era) {
  const entries = era.entries || [];

  let savedCount = 0;
  let matrixText = "";

  let movieRows = [];
  let seriesRows = [];

  if (pgPool) {
    const movieResult = await pgPool.query(
      `
      SELECT id, title, starwars_era
      FROM movies
      `
    );

    movieRows = movieResult.rows;

    const seriesResult = await pgPool.query(
      `
      SELECT id, series_title, starwars_era
      FROM series
      `
    );

    seriesRows = seriesResult.rows;
  } else {
    movieRows = db.prepare(`
      SELECT id, title, starwars_era
      FROM movies
    `).all();

    seriesRows = db.prepare(`
      SELECT id, series_title, starwars_era
      FROM series
    `).all();
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    const prefix =
      i === entries.length - 1
        ? "┗"
        : "┠";

    const entryKey = makeKey(entry);

    const existsMovie =
      movieRows.some((m) => {
        if (m.starwars_era === era.key) {
          const movieKey = makeKey(m.title);

          return (
            movieKey.includes(entryKey) ||
            entryKey.includes(movieKey)
          );
        }

        return false;
      });

    const existsSeries =
      seriesRows.some((s) => {
        if (s.starwars_era === era.key) {
          const seriesKey = makeKey(s.series_title);

          return (
            seriesKey.includes(entryKey) ||
            entryKey.includes(seriesKey)
          );
        }

        return false;
      });

    const fallbackMovie =
      movieRows.some((m) => {
        const movieKey = makeKey(m.title);

        return (
          movieKey.includes(entryKey) ||
          entryKey.includes(movieKey)
        );
      });

    const fallbackSeries =
      seriesRows.some((s) => {
        const seriesKey = makeKey(s.series_title);

        return (
          seriesKey.includes(entryKey) ||
          entryKey.includes(seriesKey)
        );
      });

    const exists =
      existsMovie ||
      existsSeries ||
      fallbackMovie ||
      fallbackSeries;

    if (exists) savedCount++;

    matrixText +=
      `${prefix} ${exists ? "✅" : "⬜"} ${entry}\n`;
  }

  const totalCount = entries.length;

  const percent =
    totalCount > 0
      ? Math.round((savedCount / totalCount) * 100)
      : 0;

  const progressBar =
    "█".repeat(Math.floor(percent / 10)) +
    "░".repeat(10 - Math.floor(percent / 10));

  const archiveStatus =
    savedCount >= totalCount && totalCount > 0
      ? "ARCHIVE VERIFIED"
      : "ARCHIVE INCOMPLETE";

  const eraStatus =
    savedCount >= totalCount && totalCount > 0
      ? "MASTERED ERA"
      : "ACTIVE ERA";

  const text =
    "███ STAR WARS ERA NEXUS ███\n\n" +

    `${String(era.topicName || "").toUpperCase()}\n\n` +
    `${era.subtitle || ""}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🏛 ERA CLASSIFICATION\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `🧭 ERA CODE • ${String(era.key || "").toUpperCase()}\n` +
    `📚 TIMELINE ENTRIES • ${totalCount}\n` +
    `📊 ARCHIVE • ${savedCount}/${totalCount}\n\n` +
    `${progressBar} ${percent}%\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🛰 TIMELINE MATRIX\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    matrixText +
    "\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🛰 ERA STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `📡 ${archiveStatus}\n` +
    `🏆 ${eraStatus}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return cleanTelegramText(text).slice(0, 4000);
}

// =============================
// STAR WARS COMMAND CENTER CAPTION
// =============================
async function starWarsCommandCenterCaption() {
  let totalEntries = 0;
  let totalSaved = 0;
  let eraLines = "";

  for (const era of STAR_WARS_ERAS) {
    const entries = era.entries || [];
    let savedCount = 0;

    let movieRows = [];
    let seriesRows = [];

    if (pgPool) {
      const movieResult = await pgPool.query(
        `
        SELECT title, starwars_era
        FROM movies
        WHERE starwars_era = $1
        `,
        [era.key]
      );

      movieRows = movieResult.rows;

      const seriesResult = await pgPool.query(
        `
        SELECT series_title, starwars_era
        FROM series
        WHERE starwars_era = $1
        `,
        [era.key]
      );

      seriesRows = seriesResult.rows;
    } else {
      movieRows = db.prepare(`
        SELECT title, starwars_era
        FROM movies
        WHERE starwars_era = ?
      `).all(era.key);

      seriesRows = db.prepare(`
        SELECT series_title, starwars_era
        FROM series
        WHERE starwars_era = ?
      `).all(era.key);
    }

    for (const entry of entries) {
      const entryKey = makeKey(entry);

      const existsMovie = movieRows.some((m) => {
        const movieKey = makeKey(m.title);

        return (
          movieKey.includes(entryKey) ||
          entryKey.includes(movieKey)
        );
      });

      const existsSeries = seriesRows.some((s) => {
        const seriesKey = makeKey(s.series_title);

        return (
          seriesKey.includes(entryKey) ||
          entryKey.includes(seriesKey)
        );
      });

      if (existsMovie || existsSeries) {
        savedCount++;
      }
    }

    totalEntries += entries.length;
    totalSaved += savedCount;

    const status =
      savedCount >= entries.length && entries.length > 0
        ? "MASTERED"
        : "ACTIVE";

    eraLines +=
      `${era.topicName} • ${savedCount}/${entries.length} • ${status}\n`;
  }

  const percent =
    totalEntries > 0
      ? Math.round((totalSaved / totalEntries) * 100)
      : 0;

  const progressBar =
    "█".repeat(Math.floor(percent / 10)) +
    "░".repeat(10 - Math.floor(percent / 10));

  const archiveStatus =
    totalSaved >= totalEntries && totalEntries > 0
      ? "ARCHIVE VERIFIED"
      : "ARCHIVE ACTIVE";

  const text =
    "███ STAR WARS COMMAND CENTER ███\n\n" +

    "🌌 GALACTIC ARCHIVE SYSTEM\n" +
    "JEDI • SITH • REPUBLIC • EMPIRE\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🏛 GALACTIC STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `📚 Eras • ${STAR_WARS_ERAS.length}\n` +
    `🎬 Inhalte • ${totalSaved}/${totalEntries}\n` +
    `📊 Fortschritt • ${progressBar} ${percent}%\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🧭 ERA MATRIX\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `${eraLines}\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🛰 GALACTIC STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `📡 ${archiveStatus}\n` +
    "🏆 TIMELINE SYSTEM VERIFIED\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return cleanTelegramText(text).slice(0, 4000);
}

// =============================
// CREATE OR UPDATE STAR WARS COMMAND CENTER
// =============================
async function createOrUpdateStarWarsCommandCenter() {
  return await createOrUpdateCommandTopicHub({
    name: "🌌 Star Wars Command Center",
    type: "starwars_command_center",
    captionBuilder: starWarsCommandCenterCaption
  });
}

// =============================
// CREATE OR UPDATE STAR WARS ERA HUBS
// =============================
async function createOrUpdateStarWarsEraHubs() {
  for (const era of STAR_WARS_ERAS) {
    await createOrUpdateCommandTopicHub({
      name: era.topicName,
      type: "starwars_era",
      captionBuilder: async () => {
        return await starWarsEraHubCaption(era);
      }
    });

    await sleep(1200);
  }
}

// =============================
// COLLECTION TOPIC ALLOWLIST
// =============================
const collectionTopicAllowlist = [
  "Hangover Filmreihe",
  "Harry Potter Filmreihe",
  "Fast & Furious Filmreihe",
  "John Wick Filmreihe",
  "Matrix Filmreihe",
  "Terminator Filmreihe"
];

function shouldCreateCollectionTopic(collectionName = "") {
  return collectionTopicAllowlist.some((name) =>
    String(collectionName || "")
      .toLowerCase()
      .includes(name.toLowerCase())
  );
}

// =============================
// MOVIE TOPIC BUCKETS
// =============================
const movieTopicBuckets = [
  {
    name: "🎬 Action & Abenteuer",
    type: "movie_bucket",
    keywords: ["action", "abenteuer", "adventure"]
  },
  {
    name: "👻 Horror & Thriller",
    type: "movie_bucket",
    keywords: ["horror", "thriller"]
  },
  {
    name: "🤖 Sci-Fi & Fantasy",
    type: "movie_bucket",
    keywords: ["science fiction", "sci-fi", "fantasy"]
  },
  {
    name: "🎭 Drama & Romantik",
    type: "movie_bucket",
    keywords: ["drama", "romantik", "liebesfilm", "romance"]
  },
  {
    name: "😂 Komödie & Familienfilme",
    type: "movie_bucket",
    keywords: ["komödie", "comedy", "familie", "family"]
  },
  {
    name: "🏆 Top100 / Awards",
    type: "movie_bucket",
    keywords: ["top100", "award", "oscar"]
  },
  {
    name: "🔥 Neuerscheinungen / Trending",
    type: "movie_bucket",
    keywords: ["trending", "neuerscheinung"]
  },
  {
    name: "🌍 Internationale Filme",
    type: "movie_bucket",
    keywords: ["international", "foreign"]
  },
  {
    name: "🎨 Animation & Anime",
    type: "movie_bucket",
    keywords: ["animation", "anime"]
  },
  {
    name: "🕵️ Mystery / Krimi",
    type: "movie_bucket",
    keywords: ["mystery", "krimi", "crime"]
  },
  {
    name: "🏞️ Dokumentationen / Biografien",
    type: "movie_bucket",
    keywords: ["dokumentar", "dokumentation", "biografie", "biography"]
  },
  {
    name: "🦸 Marvel",
    type: "movie_bucket",
    keywords: ["marvel", "mcu", "avengers", "iron man", "thor", "captain america"]
  },
  {
    name: "🏰 Disney",
    type: "movie_bucket",
    keywords: ["disney", "pixar", "frozen", "toy story", "lion king", "aladdin"]
  },
  {
    name: "⚡ Harry Potter",
    type: "movie_bucket",
    keywords: ["harry potter", "fantastic beasts", "hogwarts"]
  },
  {
    name: "📝 Filmographien",
    type: "movie_bucket",
    keywords: ["filmographie"]
  },
  {
    name: "🚀 FAST & FURIOUS ACTION-UNIVERSUM",
    type: "movie_bucket",
    keywords: ["fast & furious", "fast and furious", "fast furious"]
  },
  {
    name: "🧸 Kinderfilme",
    type: "movie_bucket",
    keywords: ["kinderfilm", "kids", "familie", "family"]
  },
  {
    name: "🖍️ Zeichentrickfilme",
    type: "movie_bucket",
    keywords: ["zeichentrick", "cartoon", "animation"]
  }
];

// =============================
// DETECT MOVIE BUCKET
// =============================
function detectMovieBucket(tmdb = {}) {

  const search =
    `
    ${tmdb.title || ""}
    ${tmdb.collection || ""}
    ${tmdb.genre || ""}
    ${tmdb.mainGenre || ""}
    `
      .toLowerCase();

  for (const bucket of movieTopicBuckets) {

    const matched =
      bucket.keywords.some((keyword) =>
        search.includes(
          String(keyword).toLowerCase()
        )
      );

    if (matched) {
      return bucket;
    }

  }

  return null;
}

// =============================
// GET OR CREATE MOVIE BUCKET TOPIC
// =============================
async function getOrCreateMovieBucketTopic(tmdb = {}) {

  const bucket =
    detectMovieBucket(tmdb);

  if (!bucket) {
    return null;
  }

  const topicId =
    await createOrGetTopic({
      chatId: MOVIE_GROUP_ID,
      name: bucket.name,
      type: bucket.type
    });

  return {
    topicId,
    topicName: bucket.name,
    bucket
  };
}

function detectCollection(title = "") {
  const t = String(title || "").toLowerCase();

  if (t.includes("james bond") || t.includes("007")) {
    return "James Bond Filmreihe";
  }

  if (t.includes("jurassic")) {
    return "Jurassic Park Filmreihe";
  }

  if (t.includes("fast") || t.includes("furious")) {
    return "Fast & Furious Filmreihe";
  }

  if (t.includes("mission impossible")) {
    return "Mission: Impossible Filmreihe";
  }

  if (t.includes("bourne")) {
    return "Bourne Filmreihe";
  }

  if (t.includes("john wick")) {
    return "John Wick Filmreihe";
  }

  if (t.includes("final destination")) {
    return "Final Destination Filmreihe";
  }

  return "";
}

// =============================
// UNIVERSE DETECTION
// =============================
function detectUniverse(title = "", collection = "") {
  const rawSearch =
    `${title} ${collection}`.trim();

  const searchKey =
    makeKey(rawSearch);

  // =============================
  // DC PRIORITY DETECTION
  // =============================
  const dcPriority = [
  "DCAMU",
  "DCAU",
  "DC_Elseworlds",
  "Arrowverse",
  "DCEU",
  "DCU_GodsAndMonsters"
];

  for (const key of dcPriority) {
    const config = universeConfigs[key];
    if (!config) continue;

    const aliasMatch =
      (config.aliases || []).some((alias) => {
        const aliasKey = makeKey(alias);

        return (
          aliasKey.length >= 4 &&
          searchKey.includes(aliasKey)
        );
      });

    const seriesMatch =
      (config.series || []).some((seriesTitle) => {
        const seriesKey = makeKey(seriesTitle);

        return (
          seriesKey.length >= 4 &&
          searchKey.includes(seriesKey)
        );
      });

    const phaseMatchFound =
      Object.values(config.phases || {})
        .flat()
        .some((movieTitle) => {
          const movieKey = makeKey(movieTitle);

          return (
            movieKey.length >= 4 &&
            searchKey.includes(movieKey)
          );
        });

    if (aliasMatch || seriesMatch || phaseMatchFound) {
      let detectedPhase = null;

      for (const [phase, movies] of Object.entries(config.phases || {})) {
        const phaseMatch =
          movies.some((movieTitle) => {
            const movieKey = makeKey(movieTitle);

            return (
              movieKey.length >= 4 &&
              searchKey.includes(movieKey)
            );
          });

        if (phaseMatch) {
          detectedPhase = phase;
          break;
        }
      }

      return {
  universeKey: key,
  universeName: config.topicName,
  universeArchive: config.archive,
  universeStatus: config.status,
  phase: detectedPhase
};
    }
  }

  // =============================
  // NORMAL UNIVERSE DETECTION
  // =============================
  for (const [key, config] of Object.entries(universeConfigs)) {
    if (dcPriority.includes(key)) continue;

    const aliasMatch =
      (config.aliases || []).some((alias) => {
        const aliasKey = makeKey(alias);

        return (
          aliasKey.length >= 4 &&
          searchKey.includes(aliasKey)
        );
      });

    const seriesMatch =
      (config.series || []).some((seriesTitle) => {
        const seriesKey = makeKey(seriesTitle);

        return (
          seriesKey.length >= 4 &&
          searchKey.includes(seriesKey)
        );
      });

    const phaseMatchFound =
      Object.values(config.phases || {})
        .flat()
        .some((movieTitle) => {
          const movieKey = makeKey(movieTitle);

          return (
            movieKey.length >= 4 &&
            searchKey.includes(movieKey)
          );
        });

    if (aliasMatch || seriesMatch || phaseMatchFound) {
      let detectedPhase = null;

      for (const [phase, movies] of Object.entries(config.phases || {})) {
        const phaseMatch =
          movies.some((movieTitle) => {
            const movieKey = makeKey(movieTitle);

            return (
              movieKey.length >= 4 &&
              searchKey.includes(movieKey)
            );
          });

        if (phaseMatch) {
          detectedPhase = phase;
          break;
        }
      }

      return {
        universeKey: key,
        universeName: config.topicName,
        phase: detectedPhase
      };
    }
  }

  return null;
}

// =============================
// DC UNIVERSE HELPER
// =============================
function isDcUniverse(universeKey = "") {
  return [
    "DCEU",
    "DCU_GodsAndMonsters",
    "DC_Elseworlds",
    "Arrowverse",
    "DCAMU",
    "DCAU"
  ].includes(universeKey);
}

function isMarvelUniverse(universeKey = "") {
  return universeKey === "Marvel";
}

function isDisneyUniverse(universeKey = "") {
  return universeKey === "Disney";
}

// =============================
// COLLECTION BANNERS
// =============================
const collectionBanners = {

  "Hangover Filmreihe":
    "https://image.tmdb.org/t/p/original/dGPy6Q0ao8huXCreyiWnJJQTVgU.jpg",

  "John Wick Filmreihe":
    "https://image.tmdb.org/t/p/original/7dzngS8pLkGJpyeskCFcjPO9qLF.jpg",

  "Fast & Furious Filmreihe":
    "https://image.tmdb.org/t/p/original/jNoDUINh7ABjv7mmc8SccN3bA05.jpg",

  "Harry Potter Filmreihe":
    "https://image.tmdb.org/t/p/original/n5A7brJCjejceZmHyujwUTVgQNC.jpg",

  "Terminator Filmreihe":
    "https://image.tmdb.org/t/p/original/9pkZesKMnblFfKxEhQx45YQ2kIe.jpg",

  "Matrix Filmreihe":
    "https://image.tmdb.org/t/p/original/7u3pxc0K1wx32IleAkLv78MKgrw.jpg",

  "Marvel Collection":
    "https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",

  "DC Collection":
    "https://image.tmdb.org/t/p/original/uFh3OrBvkwKSU3N5y0XnXOhqBJz.jpg",

  "Star Wars Collection":
    "https://image.tmdb.org/t/p/original/4iJfYYoQzZcONB9hNzg0J0wWyPH.jpg",

  "Disney Collection":
    "https://image.tmdb.org/t/p/original/6ELJEzQJ3Y45HczvreC3dg0GV5R.jpg"

};

// =============================
// UNIVERSE BANNERS
// =============================
const universeBanners = {
  "🧬 Marvel Cinematic Universe":
    "https://image.tmdb.org/t/p/original/yFuKvT4Vm3sKHdFY4eG6I4ldAnn.jpg",

  "🦇 DC Universe":
    "https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",

  "🌌 Star Wars Universe":
    "https://image.tmdb.org/t/p/original/4iJfYYoQzZcONB9hNzg0J0wWyPH.jpg",

  "🏰 Disney Universe":
    "https://image.tmdb.org/t/p/original/6ELJEzQJ3Y45HczvreC3dg0GV5R.jpg"
};

// =============================
// GET COLLECTION BANNER
// =============================
function getCollectionBanner(collectionName = "") {
  const name = String(collectionName || "").toLowerCase();

  for (const [key, url] of Object.entries(collectionBanners)) {
    const cleanKey = key.toLowerCase();

    if (
      name === cleanKey ||
      name.includes(cleanKey) ||
      cleanKey.includes(name)
    ) {
      return url;
    }
  }

  return null;
}

// =============================
// COLLECTION CINEMA CARDS
// =============================
const collectionCinemaCards = {
  "Hangover Filmreihe": []
};

// =============================
// COLLECTION DATA BUILDER
// =============================
async function buildCollectionData(collectionName = "") {

  // =============================
  // LOAD COLLECTION MOVIES
  // =============================
  let rows = [];

  if (pgPool) {

    const result = await pgPool.query(
      `
      SELECT title, year, library_id, collection, universe, rating
FROM movies
      WHERE collection = $1
      ORDER BY year ASC, title ASC
      `,
      [collectionName]
    );

    rows = result.rows;

  } else {

    rows = db.prepare(`
      SELECT title, year, library_id, collection, universe, rating
FROM movies
      WHERE collection = ?
      ORDER BY year ASC, title ASC
    `).all(collectionName);

  }

  // =============================
  // BASIC COUNTS
  // =============================
  const requiredMovies =
    collectionRegistry[collectionName] || [];

  const officialTotal =
    requiredMovies.length || rows.length;

  const savedMovies =
    rows.length;

  // =============================
  // RATING STATS
  // =============================
  const ratingValues = rows
    .map((m) => {
      const match =
        String(m.rating || "").match(/(\d+(\.\d+)?)/g);

      return match
        ? Number(match[match.length - 1])
        : null;
    })
    .filter((n) => Number.isFinite(n));

  const franchiseRating =
    ratingValues.length
      ? (
          ratingValues.reduce((sum, n) => sum + n, 0) /
          ratingValues.length
        ).toFixed(1)
      : "Unbekannt";

  const bestMovie =
    ratingValues.length
      ? rows
          .filter((m) =>
            String(m.rating || "").match(/(\d+(\.\d+)?)/g)
          )
          .sort((a, b) => {
            const ar =
              Number(String(a.rating).match(/(\d+(\.\d+)?)/g).pop());

            const br =
              Number(String(b.rating).match(/(\d+(\.\d+)?)/g).pop());

            return br - ar;
          })[0]
      : null;

  // =============================
  // RUNTIME STATS
  // =============================
  const totalRuntimeMinutes = rows.reduce((sum, m) => {
    const match =
      String(m.runtime || "").match(/\d+/);

    return sum + (match ? Number(match[0]) : 0);
  }, 0);

  const totalRuntimeText =
    totalRuntimeMinutes > 0
      ? `${Math.floor(totalRuntimeMinutes / 60)}h ${totalRuntimeMinutes % 60}m`
      : "Unbekannt";

  // =============================
  // FILE SIZE STATS
  // =============================
  const fileSizes = rows
    .map((m) =>
      parseFloat(String(m.file_size || "0"))
    )
    .filter((n) => Number.isFinite(n));

  const largestFile =
    fileSizes.length
      ? `${Math.max(...fileSizes).toFixed(2)} GB`
      : "Unbekannt";

  // =============================
  // YEAR RANGE
  // =============================
  const years = rows
    .map((m) => Number(m.year))
    .filter((y) => Number.isFinite(y));

  const universePeriod =
    years.length
      ? `${Math.min(...years)} → ${Math.max(...years)}`
      : "Unbekannt";

  // =============================
  // COMPLETION PROGRESS
  // =============================
  const missingSlots =
    Math.max(officialTotal - savedMovies, 0);

  const progressBlocks =
    "■".repeat(savedMovies) +
    "□".repeat(missingSlots);

  const storedYears =
    rows.map((m) => String(m.year || ""));

  const missingMovies =
    requiredMovies.filter((m) => {
      return !storedYears.includes(String(m.year));
    });

  // =============================
  // CHRONOLOGY / TIMELINE
  // =============================
  const chronology =
    chronologyRegistry[collectionName] || [];

  const sortedRows =
    chronology.length
      ? rows.sort((a, b) => {
          const aIndex =
            chronology.indexOf(String(a.year));

          const bIndex =
            chronology.indexOf(String(b.year));

          return aIndex - bIndex;
        })
      : rows;

  const timeline =
    sortedRows.length
      ? sortedRows
          .map(
            (m, index) =>
              `${String(index + 1).padStart(2, "0")}•${m.year || "????"}`
          )
          .join(" ══▶ ")
      : "Keine Filme";

  // =============================
  // FINAL DATA OBJECT
  // =============================
  return {
    rows: sortedRows,
    savedMovies,
    officialTotal,
    progressBlocks,
    timeline,
    missingMovies,
    franchiseRating,
    bestMovie,
    totalRuntimeText,
    largestFile,
    universePeriod
  };
}

async function collectionHubCaption(collectionName) {
  const data = await buildCollectionData(collectionName);

  const themeRaw =
  collectionThemes[collectionName] || {};

const theme = {
  icon:
    themeRaw.icon ||
    themeRaw.emoji ||
    "🎞",

  archive:
    themeRaw.archive ||
    "COLLECTION ARCHIVE",

  subline:
    themeRaw.subline ||
    "PREMIUM FILM COLLECTION",

  status:
    themeRaw.status ||
    "🎬 FILMREIHE"
};

  const cinemaCard =
  collectionCinemaCards[collectionName] || [];

  let result =
  "━━━━━━━━━━━━━━━━━━\n" +
  `${theme.icon} ${String(collectionName || "").toUpperCase()}\n` +
  "━━━━━━━━━━━━━━━━━━\n\n" +
  `📁 ${theme.archive}\n` +
  `${theme.subline}\n` +
  `${theme.status}\n` +
(cinemaCard.length
  ? "\n" + cinemaCard.join("\n") + "\n\n"
  : "\n") +
  "━━━━━━━━━━━━━━━━━━\n" +
  "📀 FILMREIHENFOLGE\n" +
  "━━━━━━━━━━━━━━━━━━\n\n";

  if (!data.rows.length) {
    result += "Noch keine Filme gespeichert.\n";
  } else {
    data.rows.forEach((m, index) => {
      result += `${String(index + 1).padStart(2, "0")} • ${m.title} (${m.year || "Unbekannt"})\n`;
      if (m.library_id) result += `     🏷 ${m.library_id}\n`;
    });
  }

  result +=
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "🛰️ TIMELINE\n" +
    `${data.timeline}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    `🧩 Sammlung: ${data.progressBlocks} ${data.savedMovies}/${data.officialTotal}\n` +
    `🎬 Filme im Archiv: ${data.savedMovies}\n` +
    `🏆 Franchise Rating: ${data.franchiseRating}\n` +
(data.bestMovie ? `👑 Bester Film: ${data.bestMovie.title}\n` : "") +
"\n🌍 UNIVERSUM-STATS\n" +
`⏱ Laufzeit: ${data.totalRuntimeText}\n` +
`📀 Größte Datei: ${data.largestFile}\n` +
`📅 Zeitraum: ${data.universePeriod}\n` +
    (data.savedMovies >= data.officialTotal
  ? "🏆 ARCHIV VOLLSTÄNDIG\n"
  : "⚠️ ARCHIV UNVOLLSTÄNDIG\n") +
    ((data.missingMovies || []).length
  ? "\n🧩 FEHLENDE FILME\n" +
    (data.missingMovies || [])
      .map((m) => `• ${m.title} (${m.year})`)
      .join("\n") +
    "\n"
  : "") +
`🕒 UPDATE: ${new Date().toLocaleString("de-DE")}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return result.slice(0, 4000);
}

function buildUniverseProgressBar(current = 0, total = 0) {
  const size = 10;

  if (!total || total <= 0) {
    return "□□□□□□□□□□";
  }

  const percent = Math.max(0, Math.min(1, current / total));
  const filled = Math.round(percent * size);

  return "■".repeat(filled) + "□".repeat(size - filled);
}

// =============================
// UNIVERSE HUB CAPTION — UNIVERSE NEXUS BLACK EDITION
// =============================
async function universeHubCaption(universeName = "") {
  const config =
    Object.values(universeConfigs)
      .find((u) => u.topicName === universeName);

  if (!config) {
    return "❌ Universe nicht gefunden";
  }

  let movies = [];
  let series = [];

  if (pgPool) {
    const movieResult = await pgPool.query(
      `
      SELECT title, year, rating, universe_phase
      FROM movies
      WHERE universe = $1
      ORDER BY year ASC, title ASC
      `,
      [universeName]
    );

    movies = movieResult.rows;

    const seriesResult = await pgPool.query(
      `
      SELECT DISTINCT series_title
      FROM series
      WHERE universe = $1
      ORDER BY series_title ASC
      `,
      [universeName]
    );

    series = seriesResult.rows;
  } else {
    movies = db.prepare(`
      SELECT title, year, rating, universe_phase
      FROM movies
      WHERE universe = ?
      ORDER BY year ASC, title ASC
    `).all(universeName);

    series = db.prepare(`
      SELECT DISTINCT series_title
      FROM series
      WHERE universe = ?
      ORDER BY series_title ASC
    `).all(universeName);
  }

  const movieCount = movies.length;
  const seriesCount = series.length;

  const officialMovieTotal =
    Object.values(config.phases || {})
      .reduce((sum, entries) => sum + entries.length, 0);

  const officialSeriesTotal =
    config.series?.length || 0;

  const officialTotal =
    (officialMovieTotal || movieCount) +
    (officialSeriesTotal || seriesCount);

  const savedTotal =
    movieCount + seriesCount;

  const percent =
    officialTotal > 0
      ? Math.min(100, Math.round((savedTotal / officialTotal) * 100))
      : 0;

  const progress =
    buildUniverseProgressBar(savedTotal, officialTotal)
      .replace(/■/g, "█")
      .replace(/□/g, "░");

  const years = movies
    .map((m) => Number(m.year))
    .filter((y) => Number.isFinite(y));

  const period =
    years.length
      ? `${Math.min(...years)}–${Math.max(...years)}`
      : "Unbekannt";

  const cleanUniverseName =
    String(universeName)
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .trim();

  const hubHeader =
    getCollectionHubHeader(cleanUniverseName);

  let result =
    `${hubHeader}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    `<b>${String(universeName).toUpperCase()}</b>\n` +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    `🎬 Filme • ${movieCount}/${officialMovieTotal || movieCount}\n` +
    `📺 Serien • ${seriesCount}/${officialSeriesTotal || seriesCount}\n` +
    `📅 Timeline • ${period}\n` +
    `📊 Fortschritt • ${progress} ${percent}%\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "<b>📚 UNIVERSE INDEX</b>\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  const visibleMovies = movies.slice(0, 15);

  if (!visibleMovies.length) {
    result += "Noch keine Filme gespeichert.\n\n";
  } else {
    visibleMovies.forEach((movie, index) => {
      result +=
        `${String(index + 1).padStart(2, "0")} • ${movie.title || "Unbekannt"}${movie.year ? ` (${movie.year})` : ""}\n` +
        `     ⭐ ${movie.rating || "?"}\n\n`;
    });

    if (movies.length > visibleMovies.length) {
      result += `… +${movies.length - visibleMovies.length} weitere Filme\n\n`;
    }
  }

  if (series.length) {
    result +=
      "━━━━━━━━━━━━━━━━━━\n" +
      "<b>📺 SERIES INDEX</b>\n" +
      "━━━━━━━━━━━━━━━━━━\n\n";

    series.slice(0, 10).forEach((item, index) => {
      result +=
        `${String(index + 1).padStart(2, "0")} • ${item.series_title || "Unbekannt"}\n`;
    });

    if (series.length > 10) {
      result += `… +${series.length - 10} weitere Serien\n`;
    }

    result += "\n";
  }

  result +=
    "🛰 ARCHIV VERIFIZIERT ✅\n\n" +
    "@LibraryOfLegends";

  return cleanTelegramText(result).slice(0, 4000);
}

// =============================
// UNIVERSE DATABASE HELPERS
// =============================
async function getUniverseByName(universeName = "") {

  if (pgPool) {

    const result = await pgPool.query(
      `
      SELECT *
      FROM universes
      WHERE universe_name = $1
      LIMIT 1
      `,
      [universeName]
    );

    return result.rows[0] || null;
  }

  return db.prepare(`
    SELECT *
    FROM universes
    WHERE universe_name = ?
    LIMIT 1
  `).get(universeName);
}

async function saveUniverseHubMessageId(
  universeName,
  messageId
) {

  if (pgPool) {

    return await pgPool.query(
      `
      UPDATE universes
      SET hub_message_id = $1
      WHERE universe_name = $2
      `,
      [messageId, universeName]
    );

  }

  return db.prepare(`
    UPDATE universes
    SET hub_message_id = ?
    WHERE universe_name = ?
  `).run(messageId, universeName);
}

// =============================
// MULTIVERSE COMMAND CENTER
// =============================
async function multiverseCommandCenterCaption() {

  let universeLines = "";

  let totalMovies = 0;
  let totalSeries = 0;

  let masteredCount = 0;
  let activeCount = 0;

  for (const config of Object.values(universeConfigs)) {

    let movies = [];
    let series = [];

    if (pgPool) {

      const movieResult = await pgPool.query(
        `
        SELECT id
        FROM movies
        WHERE universe = $1
        `,
        [config.topicName]
      );

      movies = movieResult.rows;

      const seriesResult = await pgPool.query(
        `
        SELECT DISTINCT series_title
        FROM series
        WHERE universe = $1
        `,
        [config.topicName]
      );

      series = seriesResult.rows;

    } else {

      movies = db.prepare(`
        SELECT id
        FROM movies
        WHERE universe = ?
      `).all(config.topicName);

      series = db.prepare(`
        SELECT DISTINCT series_title
        FROM series
        WHERE universe = ?
      `).all(config.topicName);
    }

    const movieCount = movies.length;
    const seriesCount = series.length;

    totalMovies += movieCount;
    totalSeries += seriesCount;

    const officialMovies =
      Object.values(config.phases || {})
        .flat()
        .length;

    const officialSeries =
      (config.series || []).length;

    const savedTotal =
  movieCount + seriesCount;

const officialTotal =
  Math.max(
    officialMovies + officialSeries,
    savedTotal
  );

    const percent =
      officialTotal > 0
        ? Math.min(
            100,
            Math.round(
              (savedTotal / officialTotal) * 100
            )
          )
        : 100;

    const status =
      percent >= 100
        ? "MASTERED"
        : "ACTIVE";

    if (status === "MASTERED") {
      masteredCount++;
    } else {
      activeCount++;
    }

    universeLines +=
      `${config.icon} ${config.topicName.replace(config.icon, "").trim()} • ${savedTotal}/${officialTotal || savedTotal} • ${status}\n`;
  }

  const totalUniverses =
    Object.keys(universeConfigs).length;

  const progress =
    masteredCount + activeCount > 0
      ? Math.round(
          (masteredCount / totalUniverses) * 100
        )
      : 0;

  const progressBar =
    "█".repeat(Math.floor(progress / 10)) +
    "░".repeat(10 - Math.floor(progress / 10));

  let text =
    "███ MULTIVERSE COMMAND CENTER ███\n\n" +

    "🌌 LIBRARY OF LEGENDS\n" +
    "UNIVERSE ARCHIVE NETWORK\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🏛 MULTIVERSE STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    `📚 Universes • ${totalUniverses}\n` +
    `🎬 Filme • ${totalMovies}\n` +
    `📺 Serien • ${totalSeries}\n` +
    `🏆 Mastered • ${masteredCount}\n` +
    `⚠️ Active • ${activeCount}\n\n` +

    `${progressBar} ${progress}%\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🧭 UNIVERSE MATRIX\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    universeLines +

    "\n━━━━━━━━━━━━━━━━━━\n" +
    "🛰 MULTIVERSE STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "📡 ARCHIVE NETWORK ACTIVE\n" +
    "🏆 COMMAND CENTER VERIFIED\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return cleanTelegramText(text).slice(0, 4000);
}

// =============================
// DC COMMAND CENTER CAPTION
// =============================
async function dcCommandCenterCaption() {
  const dcKeys = [
    "DCEU",
    "DCU_GodsAndMonsters",
    "DC_Elseworlds",
    "Arrowverse",
    "DCAMU",
    "DCAU"
  ];

  let universeLines = "";

  let totalMovies = 0;
  let totalSeries = 0;
  let masteredCount = 0;
  let activeCount = 0;

  for (const key of dcKeys) {
    const config = universeConfigs[key];

    if (!config) continue;

    let movies = [];
    let series = [];

    if (pgPool) {
      const movieResult = await pgPool.query(
        `
        SELECT id
        FROM movies
        WHERE universe = $1
        `,
        [config.topicName]
      );

      movies = movieResult.rows;

      const seriesResult = await pgPool.query(
        `
        SELECT DISTINCT series_title
        FROM series
        WHERE universe = $1
        `,
        [config.topicName]
      );

      series = seriesResult.rows;
    } else {
      movies = db.prepare(`
        SELECT id
        FROM movies
        WHERE universe = ?
      `).all(config.topicName);

      series = db.prepare(`
        SELECT DISTINCT series_title
        FROM series
        WHERE universe = ?
      `).all(config.topicName);
    }

    const movieCount = movies.length;
    const seriesCount = series.length;

    totalMovies += movieCount;
    totalSeries += seriesCount;

    const officialMovies =
      Object.values(config.phases || {})
        .flat()
        .length;

    const officialSeries =
      (config.series || []).length;

    const savedTotal =
      movieCount + seriesCount;

    const officialTotal =
      Math.max(
        officialMovies + officialSeries,
        savedTotal
      );

    const percent =
      officialTotal > 0
        ? Math.min(
            100,
            Math.round((savedTotal / officialTotal) * 100)
          )
        : 100;

    const status =
      percent >= 100
        ? "MASTERED"
        : "ACTIVE";

    if (status === "MASTERED") {
      masteredCount++;
    } else {
      activeCount++;
    }

    universeLines +=
      `${config.icon} ${config.topicName.replace(config.icon, "").trim()} • ${savedTotal}/${officialTotal || savedTotal} • ${status}\n`;
  }

  const totalUniverses = dcKeys.length;

  const progress =
    totalUniverses > 0
      ? Math.round((masteredCount / totalUniverses) * 100)
      : 0;

  const progressBar =
    "█".repeat(Math.floor(progress / 10)) +
    "░".repeat(10 - Math.floor(progress / 10));

  const text =
    "███ DC COMMAND CENTER ███\n\n" +

    "🦇 DC MULTIVERSE ARCHIVE\n" +
    "GOTHAM • METROPOLIS • ELSEWORLDS\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🏛 DC STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `📚 Universes • ${totalUniverses}\n` +
    `🎬 Filme • ${totalMovies}\n` +
    `📺 Serien • ${totalSeries}\n` +
    `🏆 Mastered • ${masteredCount}\n` +
    `⚠️ Active • ${activeCount}\n\n` +
    `${progressBar} ${progress}%\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🧭 DC MATRIX\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    universeLines +
    "\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🛰 DC STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    "📡 DC ARCHIVE NETWORK ACTIVE\n" +
    "🏆 COMMAND CENTER VERIFIED\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return cleanTelegramText(text).slice(0, 4000);
}

// =============================
// CREATE OR UPDATE DC COMMAND CENTER
// =============================
async function createOrUpdateDcCommandCenter() {
  return await createOrUpdateCommandTopicHub({
    name: "🦇 DC Command Center",
    type: "dc_command_center",
    captionBuilder: dcCommandCenterCaption
  });
}

// =============================
// MARVEL COMMAND CENTER CAPTION
// =============================
async function marvelCommandCenterCaption() {
  const config = universeConfigs.Marvel;

  if (!config) {
    return "❌ Marvel Config nicht gefunden";
  }

  let movies = [];
  let series = [];

  if (pgPool) {
    const movieResult = await pgPool.query(
      `
      SELECT title, universe_phase
      FROM movies
      WHERE universe = $1
      `,
      [config.topicName]
    );

    movies = movieResult.rows;

    const seriesResult = await pgPool.query(
      `
      SELECT DISTINCT series_title
      FROM series
      WHERE universe = $1
      `,
      [config.topicName]
    );

    series = seriesResult.rows;
  } else {
    movies = db.prepare(`
      SELECT title, universe_phase
      FROM movies
      WHERE universe = ?
    `).all(config.topicName);

    series = db.prepare(`
      SELECT DISTINCT series_title
      FROM series
      WHERE universe = ?
    `).all(config.topicName);
  }

  const movieCount = movies.length;
  const seriesCount = series.length;

  const officialMovies =
    Object.values(config.phases || {}).flat().length;

  const officialSeries =
    (config.series || []).length;

  const savedTotal =
    movieCount + seriesCount;

  const officialTotal =
    Math.max(
      officialMovies + officialSeries,
      savedTotal
    );

  const percent =
    officialTotal > 0
      ? Math.min(
          100,
          Math.round((savedTotal / officialTotal) * 100)
        )
      : 0;

  const progressBar =
    "█".repeat(Math.floor(percent / 10)) +
    "░".repeat(10 - Math.floor(percent / 10));

  let phaseLines = "";

  for (const [phase, entries] of Object.entries(config.phases || {})) {
    const savedInPhase =
      entries.filter((title) =>
        movies.some((m) => {
          const savedKey = makeKey(m.title);
          const targetKey = makeKey(title);

          return (
            savedKey.includes(targetKey) ||
            targetKey.includes(savedKey)
          );
        })
      ).length;

    const status =
      savedInPhase >= entries.length
        ? "MASTERED"
        : "ACTIVE";

    phaseLines +=
      `${phase} • ${savedInPhase}/${entries.length} • ${status}\n`;
  }

  let seriesLines = "";

  for (const seriesTitle of config.series || []) {
    const exists =
      series.some((s) => {
        const savedKey = makeKey(s.series_title);
        const targetKey = makeKey(seriesTitle);

        return (
          savedKey.includes(targetKey) ||
          targetKey.includes(savedKey)
        );
      });

    seriesLines +=
      `${exists ? "✅" : "⬜"} ${seriesTitle}\n`;
  }

  const archiveStatus =
    percent >= 100
      ? "ARCHIVE VERIFIED"
      : "ARCHIVE ACTIVE";

  const text =
    "███ MARVEL COMMAND CENTER ███\n\n" +

    "🧬 MARVEL MULTIVERSE ARCHIVE\n" +
    "PHASES • TIMELINE • SACRED CONTINUITY\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🏛 MARVEL STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `🎬 Filme • ${movieCount}/${Math.max(officialMovies, movieCount)}\n` +
    `📺 Serien • ${seriesCount}/${officialSeries || seriesCount}\n` +
    `🎞 Inhalte • ${savedTotal}/${officialTotal || savedTotal}\n` +
    `📊 Fortschritt • ${progressBar} ${percent}%\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🧭 PHASE MATRIX\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `${phaseLines || "Noch keine Phasen definiert.\n"}\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "📺 SERIES MATRIX\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `${seriesLines || "Keine Serien definiert.\n"}\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🛰 MARVEL STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `📡 ${archiveStatus}\n` +
    "🏆 COMMAND CENTER VERIFIED\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return cleanTelegramText(text).slice(0, 4000);
}

// =============================
// CREATE OR UPDATE MARVEL COMMAND CENTER
// =============================
async function createOrUpdateMarvelCommandCenter() {
  return await createOrUpdateCommandTopicHub({
    name: "🧬 Marvel Command Center",
    type: "marvel_command_center",
    captionBuilder: marvelCommandCenterCaption
  });
}

// =============================
// DISNEY COMMAND CENTER CAPTION
// =============================
async function disneyCommandCenterCaption() {
  const config = universeConfigs.Disney;

  if (!config) {
    return "❌ Disney Config nicht gefunden";
  }

  let movies = [];
  let series = [];

  if (pgPool) {
    const movieResult = await pgPool.query(
      `
      SELECT title, universe_phase
      FROM movies
      WHERE universe = $1
      `,
      [config.topicName]
    );

    movies = movieResult.rows;

    const seriesResult = await pgPool.query(
      `
      SELECT DISTINCT series_title
      FROM series
      WHERE universe = $1
      `,
      [config.topicName]
    );

    series = seriesResult.rows;
  } else {
    movies = db.prepare(`
      SELECT title, universe_phase
      FROM movies
      WHERE universe = ?
    `).all(config.topicName);

    series = db.prepare(`
      SELECT DISTINCT series_title
      FROM series
      WHERE universe = ?
    `).all(config.topicName);
  }

  const movieCount = movies.length;
  const seriesCount = series.length;

  const officialMovies =
    Object.values(config.phases || {}).flat().length;

  const officialSeries =
    (config.series || []).length;

  const savedTotal =
    movieCount + seriesCount;

  const officialTotal =
    Math.max(
      officialMovies + officialSeries,
      savedTotal
    );

  const percent =
    officialTotal > 0
      ? Math.min(
          100,
          Math.round((savedTotal / officialTotal) * 100)
        )
      : 0;

  const progressBar =
    "█".repeat(Math.floor(percent / 10)) +
    "░".repeat(10 - Math.floor(percent / 10));

  let phaseLines = "";

  for (const [phase, entries] of Object.entries(config.phases || {})) {
    const savedInPhase =
      entries.filter((title) =>
        movies.some((m) => {
          const savedKey = makeKey(m.title);
          const targetKey = makeKey(title);

          return (
            savedKey.includes(targetKey) ||
            targetKey.includes(savedKey)
          );
        })
      ).length;

    const status =
      savedInPhase >= entries.length
        ? "MASTERED"
        : "ACTIVE";

    phaseLines +=
      `${phase} • ${savedInPhase}/${entries.length} • ${status}\n`;
  }

  const archiveStatus =
    percent >= 100
      ? "ARCHIVE VERIFIED"
      : "ARCHIVE ACTIVE";

  const text =
    "███ DISNEY COMMAND CENTER ███\n\n" +

    "🏰 DISNEY MAGIC ARCHIVE\n" +
    "CLASSICS • PIXAR • FAIRYTALES\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🏛 DISNEY STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `🎬 Filme • ${movieCount}/${Math.max(officialMovies, movieCount)}\n` +
    `📺 Serien • ${seriesCount}/${officialSeries || seriesCount}\n` +
    `🎞 Inhalte • ${savedTotal}/${officialTotal || savedTotal}\n` +
    `📊 Fortschritt • ${progressBar} ${percent}%\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🧭 ERA MATRIX\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `${phaseLines || "Noch keine Disney-Eras definiert.\n"}\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🛰 DISNEY STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `📡 ${archiveStatus}\n` +
    "🏆 COMMAND CENTER VERIFIED\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return cleanTelegramText(text).slice(0, 4000);
}

// =============================
// CREATE OR UPDATE DISNEY COMMAND CENTER
// =============================
async function createOrUpdateDisneyCommandCenter() {
  return await createOrUpdateCommandTopicHub({
    name: "🏰 Disney Command Center",
    type: "disney_command_center",
    captionBuilder: disneyCommandCenterCaption
  });
}

// =============================
// CREATE OR UPDATE MULTIVERSE COMMAND CENTER
// =============================
async function createOrUpdateMultiverseCommandCenter() {
  return await createOrUpdateCommandTopicHub({
    name: "🌌 Multiverse Command Center",
    type: "multiverse_command_center",
    captionBuilder: multiverseCommandCenterCaption
  });
}

// =============================
// UNIVERSE HUB SYSTEM
// =============================
async function createOrUpdateUniverseHub(universeName = "") {
  if (!universeName) return null;

  const config =
    Object.values(universeConfigs)
      .find((u) => u.topicName === universeName);

  if (!config) return null;

  let universe = await getUniverseByName(universeName);

  if (!universe) {
    if (pgPool) {
      await pgPool.query(
        `
        INSERT INTO universes
        (universe_name)
        VALUES ($1)
        ON CONFLICT (universe_name)
        DO NOTHING
        `,
        [universeName]
      );
    } else {
      db.prepare(`
        INSERT OR IGNORE INTO universes
        (universe_name)
        VALUES (?)
      `).run(universeName);
    }

    universe = await getUniverseByName(universeName);
  }

  const topicId = await createOrGetTopic({
    chatId: MOVIE_GROUP_ID,
    name: config.topicName,
    type: "universe"
  });

  if (!topicId) {
    console.error("❌ Universe Topic konnte nicht erstellt werden:", universeName);
    return null;
  }

  if (pgPool) {
    await pgPool.query(
      `
      UPDATE universes
      SET topic_id = $1
      WHERE universe_name = $2
      `,
      [topicId, universeName]
    );
  } else {
    db.prepare(`
      UPDATE universes
      SET topic_id = ?
      WHERE universe_name = ?
    `).run(topicId, universeName);
  }

  const text = await universeHubCaption(universeName);

  if (universe?.hub_message_id) {
    const edited = await tg("editMessageText", {
  chat_id: MOVIE_GROUP_ID,
  message_id: universe.hub_message_id,
  text,
  parse_mode: "HTML"
});

    if (!edited?.__error) {
      console.log("✅ Universe Hub aktualisiert:", universeName);
      return edited;
    }

    const editError =
      edited?.error?.description ||
      edited?.description ||
      "";

    if (editError.includes("message is not modified")) {
      console.log("ℹ️ Universe Hub unverändert:", universeName);
      return universe.hub_message_id;
    }

    if (editError.includes("message to edit not found")) {
      console.log("⚠️ Universe Hub Message fehlt, erstelle neu:", universeName);

      if (pgPool) {
        await pgPool.query(
          `
          UPDATE universes
          SET hub_message_id = NULL
          WHERE universe_name = $1
          `,
          [universeName]
        );
      } else {
        db.prepare(`
          UPDATE universes
          SET hub_message_id = NULL
          WHERE universe_name = ?
        `).run(universeName);
      }
    } else {
      console.error(
        "⚠️ Universe Hub Edit Fehler:",
        universeName,
        editError || edited
      );
    }
  }

  const hub = await tg("sendMessage", {
  chat_id: MOVIE_GROUP_ID,
  message_thread_id: Number(topicId),
  text,
  parse_mode: "HTML"
});

  if (hub?.message_id) {
    await saveUniverseHubMessageId(
      universeName,
      hub.message_id
    );

    console.log("✅ Universe Hub erstellt:", universeName);
  }

  return hub;
}

// =============================
// MOVIE INDEX HUB
// =============================
async function getMovieIndexStats() {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT
        title,
        year,
        quality,
        collection,
        universe,
        created_at
      FROM movies
      ORDER BY created_at DESC
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT
        title,
        year,
        quality,
        collection,
        universe,
        created_at
      FROM movies
      ORDER BY created_at DESC
    `).all();
  }

  return rows;
}

function countWhere(rows, fn) {
  return rows.filter(fn).length;
}

async function buildMovieIndexHubCaption() {
  const movies = await getMovieIndexStats();

  const total = movies.length;
  
  const nextMilestone =
  total < 500
    ? 500
    : Math.ceil(total / 500) * 500;

const missingToMilestone =
  Math.max(0, nextMilestone - total);

const milestonePercent =
  nextMilestone > 0
    ? Math.round((total / nextMilestone) * 100)
    : 0;

const archiveLevel =
  total >= 10000
    ? "LEVEL 10 • LEGENDARY ARCHIVE"
    : total >= 5000
      ? "LEVEL 9 • MYTHIC ARCHIVE"
      : total >= 2500
        ? "LEVEL 8 • TITAN ARCHIVE"
        : total >= 1000
          ? "LEVEL 7 • MASTER ARCHIVE"
          : total >= 500
            ? "LEVEL 6 • ELITE ARCHIVE"
            : "LEVEL 5 • RISING ARCHIVE";

  const uhd = countWhere(movies, (m) =>
    String(m.quality || "").toUpperCase().includes("UHD") ||
    String(m.quality || "").includes("2160")
  );

  const fhd = countWhere(movies, (m) =>
    String(m.quality || "").toUpperCase().includes("FHD") ||
    String(m.quality || "").includes("1080")
  );

  const hd = countWhere(movies, (m) =>
    String(m.quality || "").toUpperCase() === "HD" ||
    String(m.quality || "").includes("720")
  );

  const sd = countWhere(movies, (m) =>
    String(m.quality || "").toUpperCase() === "SD" ||
    String(m.quality || "").includes("480")
  );

  const starWars = countWhere(movies, (m) =>
    m.universe === "🌌 Star Wars Universe"
  );

  const marvel = countWhere(movies, (m) =>
    m.universe === "🧬 Marvel Cinematic Universe"
  );

  const dc = countWhere(movies, (m) =>
    m.universe === "🦇 DC Universe"
  );

  const disney = countWhere(movies, (m) =>
    m.universe === "🏰 Disney Universe"
  );

  const collections = countWhere(movies, (m) =>
  Boolean(m.collection) && !m.universe
);

  const standalone = countWhere(movies, (m) =>
    !m.collection && !m.universe
  );

  const newest = movies.slice(0, 8);

  let text =
    "███ MOVIE INDEX HUB ███\n\n" +

    "📚 CINEMATIC ARCHIVE OVERVIEW\n" +
    "AUTOMATED MOVIE DATABASE\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    `🎬 TOTAL MOVIES • ${total}\n` +
    `🏛 ARCHIVE LEVEL • ${archiveLevel}\n` +
    `🎯 NEXT MILESTONE • ${nextMilestone} MOVIES\n` +
    `🚀 MISSING • ${missingToMilestone}\n` +
    `📈 PROGRESS • ${milestonePercent}%\n` +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "📀 QUALITY MATRIX\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    `💎 UHD / 2160p • ${uhd}\n` +
    `📀 FHD / 1080p • ${fhd}\n` +
    `📼 HD / 720p • ${hd}\n` +
    `📱 SD / 480p • ${sd}\n\n` +

    "🧭 ARCHIVE AREAS\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    `🌌 Star Wars Universe • ${starWars}\n` +
    `🧬 Marvel Cinematic Universe • ${marvel}\n` +
    `🦇 DC Universe • ${dc}\n` +
    `🏰 Disney Universe • ${disney}\n` +
    `🧩 Collections • ${collections}\n` +
    `🎬 Standalone Movies • ${standalone}\n\n` +

    "🔥 NEWEST ENTRIES\n" +
    "━━━━━━━━━━━━━━━━━━\n";

  if (!newest.length) {
    text += "Noch keine Filme gespeichert.\n";
  } else {
    newest.forEach((m, index) => {
      const prefix =
        index === newest.length - 1
          ? "┗"
          : "┠";

      text +=
        `${prefix} ${m.title || "Unbekannt"}` +
        `${m.year ? ` (${m.year})` : ""}\n`;
    });
  }

  text +=
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return text.slice(0, 4000);
}

// =============================
// COLLECTIONS INDEX HUB
// =============================
async function getCollectionOverviewRows() {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT
        collection,
        COUNT(*) AS movie_count,
        MIN(year) AS first_year,
        MAX(year) AS last_year,
        STRING_AGG(DISTINCT quality, ' • ') AS qualities
      FROM movies
      WHERE collection IS NOT NULL
        AND TRIM(collection) <> ''
        AND universe IS NULL
      GROUP BY collection
      HAVING COUNT(*) >= 2
      ORDER BY collection ASC
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT
        collection,
        COUNT(*) AS movie_count,
        MIN(year) AS first_year,
        MAX(year) AS last_year,
        GROUP_CONCAT(DISTINCT quality) AS qualities
      FROM movies
      WHERE collection IS NOT NULL
        AND TRIM(collection) <> ''
        AND universe IS NULL
      GROUP BY collection
      HAVING COUNT(*) >= 2
      ORDER BY Collection ASC
    `).all();
  }

  return rows;
}

async function buildCollectionsIndexHubCaption() {
  const rows = await getCollectionOverviewRows();

  const totalCollections = rows.length;
  const totalMovies = rows.reduce(
    (sum, row) => sum + Number(row.movie_count || 0),
    0
  );

  let text =
    "███ COLLECTIONS NEXUS HUB ███\n\n" +
    "🧩 COLLECTION DATABASE\n" +
    "COLLECTION ARCHIVE • ACTIVE\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🏛 COLLECTION STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    `🎞 Collections • ${totalCollections}\n` +
    `🎬 Movies in Collections • ${totalMovies}\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "📚 COLLECTION INDEX\n" +
    "━━━━━━━━━━━━━━━━━━\n";

  if (!rows.length) {
    text += "Noch keine Collections gespeichert.\n";
  } else {
    rows.slice(0, 40).forEach((row, index) => {
      const years =
        row.first_year && row.last_year
          ? `${row.first_year}–${row.last_year}`
          : "Unbekannt";

      const qualities =
        String(row.qualities || "Unbekannt")
          .replace(/,/g, " • ");

      text +=
        `${String(index + 1).padStart(2, "0")} • ${row.collection}\n` +
        `     ${row.movie_count} ${Number(row.movie_count) === 1 ? "Film" : "Filme"} • ${years} • ${qualities}\n\n`;
    });

    if (rows.length > 40) {
      text += `… +${rows.length - 40} weitere Collections\n`;
    }
  }

  text +=
    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return text.slice(0, 4000);
}

// =============================
// UNIVERSES INDEX HUB
// =============================
async function getUniverseOverviewRows() {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT
        universe,
        COUNT(*) AS movie_count,
        MIN(year) AS first_year,
        MAX(year) AS last_year,
        STRING_AGG(DISTINCT quality, ' • ') AS qualities
      FROM movies
      WHERE universe IS NOT NULL
        AND TRIM(universe) <> ''
      GROUP BY universe
      ORDER BY universe ASC
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT
        universe,
        COUNT(*) AS movie_count,
        MIN(year) AS first_year,
        MAX(year) AS last_year,
        GROUP_CONCAT(DISTINCT quality) AS qualities
      FROM movies
      WHERE universe IS NOT NULL
        AND TRIM(universe) <> ''
      GROUP BY universe
      ORDER BY universe ASC
    `).all();
  }

  return rows;
}

async function buildUniversesIndexHubCaption() {
  const rows = await getUniverseOverviewRows();

  const totalUniverses = rows.length;
  const totalMovies = rows.reduce(
    (sum, row) => sum + Number(row.movie_count || 0),
    0
  );

  let text =
    "███ UNIVERSES NEXUS HUB ███\n\n" +
    "🌌 CINEMATIC UNIVERSE DATABASE\n" +
    "MULTIVERSE ARCHIVE • ACTIVE\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🏛 UNIVERSE STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    `🌌 Universes • ${totalUniverses}\n` +
    `🎬 Movies in Universes • ${totalMovies}\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🧭 UNIVERSE INDEX\n" +
    "━━━━━━━━━━━━━━━━━━\n";

  if (!rows.length) {
    text += "Noch keine Universen gespeichert.\n";
  } else {
    rows.forEach((row, index) => {
      const years =
        row.first_year && row.last_year
          ? `${row.first_year}–${row.last_year}`
          : "Unbekannt";

      const qualities =
        String(row.qualities || "Unbekannt")
          .replace(/,/g, " • ");

      text +=
        `${String(index + 1).padStart(2, "0")} • ${row.universe}\n` +
        `     ${row.movie_count} ${Number(row.movie_count) === 1 ? "Film" : "Filme"} • ${years} • ${qualities}\n\n`;
    });
  }

  text +=
    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return text.slice(0, 4000);
}

// =============================
// PREMIUM QUALITY HUB
// =============================
async function getPremiumQualityRows() {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT
        title,
        year,
        rating,
        quality,
        resolution,
        file_size,
        created_at
      FROM movies
      ORDER BY created_at DESC
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT
        title,
        year,
        rating,
        quality,
        resolution,
        file_size,
        created_at
      FROM movies
      ORDER BY created_at DESC
    `).all();
  }

  return rows;
}

function isUHDMovie(movie) {
  return (
    String(movie.quality || "").toUpperCase().includes("UHD") ||
    String(movie.resolution || "").includes("2160") ||
    String(movie.resolution || "").includes("3840")
  );
}

function isFHDMovie(movie) {
  return (
    String(movie.quality || "").toUpperCase().includes("FHD") ||
    String(movie.resolution || "").includes("1080") ||
    String(movie.resolution || "").includes("1920")
  );
}

function isHDMovie(movie) {
  return (
    String(movie.quality || "").toUpperCase() === "HD" ||
    String(movie.resolution || "").includes("720")
  );
}

function isSDMovie(movie) {
  return (
    String(movie.quality || "").toUpperCase() === "SD" ||
    String(movie.resolution || "").includes("480")
  );
}

function parseSizeToMB(sizeText = "") {
  const size = String(sizeText || "").toUpperCase();

  const gb = size.match(/([\d.]+)\s*GB/);
  const mb = size.match(/([\d.]+)\s*MB/);

  if (gb) return parseFloat(gb[1]) * 1024;
  if (mb) return parseFloat(mb[1]);

  return 0;
}

function formatMB(totalMB = 0) {
  return totalMB >= 1024
    ? `${(totalMB / 1024).toFixed(1)} GB`
    : `${Math.round(totalMB)} MB`;
}

async function buildPremiumQualityHubCaption() {

  const movies = await getPremiumQualityRows();

  const uhdMovies = movies.filter(isUHDMovie);
  const fhdMovies = movies.filter(isFHDMovie);
  const hdMovies = movies.filter(isHDMovie);
  const sdMovies = movies.filter(isSDMovie);

  const premiumStorage = uhdMovies.reduce(
    (sum, movie) => sum + parseSizeToMB(movie.file_size),
    0
  );

  const newestPremium = uhdMovies.slice(0, 10);

  const premiumHighlights =
    [...uhdMovies]
      .map(movie => {

        const match =
          String(movie.rating || "")
            .match(/(\d+(\.\d+)?)/);

        return {
          ...movie,
          ratingValue:
            match
              ? Number(match[1])
              : 0
        };

      })
      .sort((a, b) => b.ratingValue - a.ratingValue)
      .slice(0, 3);

  const eliteMovies =
    movies.filter(movie => {

      const match =
        String(movie.rating || "")
          .match(/(\d+(\.\d+)?)/);

      return match &&
        Number(match[1]) >= 7;

    });

  let text =
    "███ PREMIUM QUALITY HUB ███\n\n" +
    "💎 CINEMA MASTER ARCHIVE\n" +
    "ULTRA HIGH RESOLUTION DATABASE\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🏛 QUALITY STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    `💎 UHD • ${uhdMovies.length}\n` +
    `📀 FHD • ${fhdMovies.length}\n` +
    `📼 HD • ${hdMovies.length}\n` +
    `📱 SD • ${sdMovies.length}\n\n` +

    `💾 Premium Storage • ${formatMB(premiumStorage)}\n` +
    `🎬 Premium Movies • ${movies.length}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🏆 CINEMA ELITE\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!premiumHighlights.length) {

    text +=
      "Noch keine Elite Titel vorhanden.\n\n";

  } else {

    premiumHighlights.forEach((m, index) => {

      const medal =
        index === 0 ? "🥇" :
        index === 1 ? "🥈" :
        "🥉";

      text +=
        `${medal} ${m.title || "Unbekannt"}\n` +
        `⭐ ${m.ratingValue || "?"} IMDb • ${m.quality || "UHD"}\n\n`;

    });

  }

  text +=
    "🎯 ARCHIVE ACHIEVEMENTS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    `🏆 UHD Movies • ${uhdMovies.length}\n` +
    `⭐ Elite Movies • ${eliteMovies.length}\n` +
    `🌌 Universes • 4\n` +
    `🧩 Collections • 40\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🔥 LATEST UHD ENTRIES\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!newestPremium.length) {

    text +=
      "Noch keine UHD-Filme gespeichert.\n";

  } else {

    newestPremium
      .slice(0, 5)
      .forEach((m, index) => {

        const prefix =
          index === Math.min(newestPremium.length, 5) - 1
            ? "┗"
            : "┠";

        text +=
          `${prefix} ${m.title || "Unbekannt"}${m.year ? ` (${m.year})` : ""}\n`;

      });

  }

  text +=
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return text.slice(0, 4000);

}

// =============================
// ELITE ARCHIVE HUB
// =============================
async function getEliteArchiveRows() {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT
        title,
        year,
        rating,
        quality,
        genre,
        library_id
      FROM movies
      WHERE rating IS NOT NULL
      ORDER BY title ASC
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT
        title,
        year,
        rating,
        quality,
        genre,
        library_id
      FROM movies
      WHERE rating IS NOT NULL
      ORDER BY title ASC
    `).all();
  }

  return rows;
}

function getRatingValue(rating = "") {
  const match =
    String(rating || "").match(/(\d+(\.\d+)?)/);

  return match ? Number(match[1]) : 0;
}

async function buildEliteArchiveHubCaption() {
  const movies = await getEliteArchiveRows();

  const rankedMovies =
    movies
      .map((movie) => ({
        ...movie,
        ratingValue: getRatingValue(movie.rating)
      }))
      .filter((movie) => movie.ratingValue > 0)
      .sort((a, b) => b.ratingValue - a.ratingValue);

  const legendaryMovies =
    rankedMovies.filter((m) => m.ratingValue >= 8);

  const eliteMovies =
    rankedMovies.filter((m) =>
      m.ratingValue >= 7 && m.ratingValue < 8
    );

  const topMovies =
    rankedMovies.slice(0, 10);

  const averageRating =
    rankedMovies.length
      ? (
          rankedMovies.reduce((sum, m) => sum + m.ratingValue, 0) /
          rankedMovies.length
        ).toFixed(1)
      : "Unbekannt";

  let text =
    "███ ELITE ARCHIVE HUB ███\n\n" +
    "🏆 CINEMATIC MASTERPIECES\n" +
    "LEGENDS RANKING DATABASE • ACTIVE\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🏛 ELITE STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    `👑 Legendary Titles • ${legendaryMovies.length}\n` +
    `⭐ Elite Titles • ${eliteMovies.length}\n` +
    `📊 Ø Archive Rating • ${averageRating}\n` +
    `🎬 Rated Movies • ${rankedMovies.length}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🥇 TOP 10 LEGENDS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!topMovies.length) {
    text += "Noch keine bewerteten Filme gespeichert.\n";
  } else {
    topMovies.forEach((movie, index) => {
      const place =
        index === 0 ? "🥇" :
        index === 1 ? "🥈" :
        index === 2 ? "🥉" :
        `#${index + 1}`;

      text +=
        `${place} ${movie.title || "Unbekannt"}${movie.year ? ` (${movie.year})` : ""}\n` +
        `⭐ ${movie.ratingValue} IMDb • ${movie.quality || "?"}\n\n`;
    });
  }

  text +=
    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return text.slice(0, 4000);
}

async function buildHallOfFameHubCaption() {
  const movies = await getEliteArchiveRows();

  const hallMovies = movies
    .map((m) => ({
      ...m,
      ratingValue: getRatingValue(m.rating)
    }))
    .filter((m) => m.ratingValue >= 8)
    .sort((a, b) => b.ratingValue - a.ratingValue)
    .slice(0, 50);

  let text =
    "███ HALL OF FAME DOSSIER ███\n\n" +
    `🏆 HALL OF FAME • ${hallMovies.length}\n\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    "🏆 HALL OF FAME INDEX\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!hallMovies.length) {
    text += "Noch keine Einträge\n";
  } else {
    hallMovies.forEach((m, index) => {
      const medal =
        index === 0 ? "🥇" :
        index === 1 ? "🥈" :
        index === 2 ? "🥉" :
        `${String(index + 1).padStart(2, "0")} •`;

      text +=
        `${medal} ${m.title}${m.year ? ` (${m.year})` : ""}\n` +
        `   ⭐ ${m.ratingValue}/10 • ${m.library_id || "NO-ID"}\n\n`;
    });
  }

  text +=
    "━━━━━━━━━━━━━━━━━━\n" +
    "🛰 ARCHIV VERIFIZIERT ✅\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    "@LibraryOfLegends";

  return text.slice(0, 4000);
}

async function createOrUpdateHallOfFameHub() {
  return await createOrUpdateSystemHub({
    name: "🏆 Hall of Fame",
    captionBuilder: buildHallOfFameHubCaption
  });
}

async function createOrUpdateEliteArchiveHub() {
  return await createOrUpdateSystemHub({
    name: "🏆 Elite Archive",
    captionBuilder: buildEliteArchiveHubCaption
  });
}

async function getNewReleaseRows() {

  let rows = [];

  if (pgPool) {

    const result = await pgPool.query(`
      SELECT
        title,
        year,
        quality,
        created_at
      FROM movies
      ORDER BY created_at DESC
    `);

    rows = result.rows;

  } else {

    rows = db.prepare(`
      SELECT
        title,
        year,
        quality,
        created_at
      FROM movies
      ORDER BY created_at DESC
    `).all();

  }

  return rows;
}

async function getActorMovies(actorName = "") {
  if (!actorName) return [];

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT
        title,
        year,
        rating,
        quality,
        cast_list AS cast
      FROM movies
      WHERE LOWER(COALESCE(cast_list, '')) LIKE LOWER($1)
      ORDER BY year ASC
      `,
      [`%${actorName}%`]
    );

    return result.rows;
  }

  return db.prepare(`
    SELECT
      title,
      year,
      rating,
      quality,
      cast
    FROM movies
    WHERE LOWER(COALESCE(cast, '')) LIKE LOWER(?)
    ORDER BY year ASC
  `).all(`%${actorName.toLowerCase()}%`);
}

async function getKnowledgeByPerson(personName = "") {
  if (!personName) return [];

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT title, category, content, library_id
      FROM knowledge
      WHERE LOWER(COALESCE(related_person, '')) LIKE LOWER($1)
         OR LOWER(COALESCE(title, '')) LIKE LOWER($1)
      ORDER BY created_at DESC
      LIMIT 5
      `,
      [`%${personName}%`]
    );

    return result.rows;
  }

  return db.prepare(`
    SELECT title, category, content, library_id
    FROM knowledge
    WHERE LOWER(COALESCE(related_person, '')) LIKE LOWER(?)
       OR LOWER(COALESCE(title, '')) LIKE LOWER(?)
    ORDER BY created_at DESC
    LIMIT 5
  `).all(`%${personName.toLowerCase()}%`, `%${personName.toLowerCase()}%`);
}

async function getKnowledgeByMovie(movieTitle = "") {
  if (!movieTitle) return [];

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT
        title,
        category,
        content,
        library_id
      FROM knowledge
      WHERE LOWER(COALESCE(related_movie, ''))
        LIKE LOWER($1)
      ORDER BY created_at DESC
      LIMIT 10
      `,
      [`%${movieTitle}%`]
    );

    return result.rows;
  }

  return db.prepare(`
    SELECT
      title,
      category,
      content,
      library_id
    FROM knowledge
    WHERE LOWER(COALESCE(related_movie, ''))
      LIKE LOWER(?)
    ORDER BY created_at DESC
    LIMIT 10
  `).all(`%${movieTitle.toLowerCase()}%`);
}

async function getKnowledgeBySeries(seriesTitle = "") {
  if (!seriesTitle) return [];

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT title, category, content, library_id
      FROM knowledge
      WHERE LOWER(COALESCE(related_series, '')) LIKE LOWER($1)
      ORDER BY created_at DESC
      LIMIT 10
      `,
      [`%${seriesTitle}%`]
    );

    return result.rows;
  }

  return db.prepare(`
    SELECT title, category, content, library_id
    FROM knowledge
    WHERE LOWER(COALESCE(related_series, '')) LIKE LOWER(?)
    ORDER BY created_at DESC
    LIMIT 10
  `).all(`%${seriesTitle.toLowerCase()}%`);
}

async function findSeriesForInfo(query = "") {
  if (!query) return null;

  const key = makeKey(query);
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT
        series_title,
        MAX(genre) AS genre,
        MAX(rating) AS rating,
        COUNT(*) AS episode_count
      FROM series
      GROUP BY series_title
      ORDER BY series_title ASC
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT
        series_title,
        genre,
        rating,
        COUNT(*) AS episode_count
      FROM series
      GROUP BY series_title
      ORDER BY series_title ASC
    `).all();
  }

  return rows.find((series) => {
    const seriesKey = makeKey(series.series_title || "");

    return (
      seriesKey === key ||
      seriesKey.includes(key) ||
      key.includes(seriesKey)
    );
  }) || null;
}

async function seriesInfoCaption(query = "") {
  const series =
    await findSeriesForInfo(query);

  if (!series) {
    return null;
  }

  const facts =
    await getKnowledgeBySeries(series.series_title);

  let text =
    "███ SERIES INTEL DOSSIER ███\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    `<b>📺 ${escapeHtml(String(series.series_title || "Unbekannt").toUpperCase())}</b>\n` +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    `🎭 ${escapeHtml(series.genre || "Unbekannt")}\n` +
    `⭐ IMDb • ${escapeHtml(series.rating || "Unbekannt")}${String(series.rating || "").includes("/10") ? "" : "/10"}\n` +
    `🎞 Episoden im Archiv • ${series.episode_count || 0}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "<b>📚 KNOWLEDGE FILES</b>\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!facts.length) {
    text += "Noch keine Knowledge-Fakten für diese Serie gespeichert.\n\n";
  } else {
    facts.forEach((fact, index) => {
      text +=
        `${String(index + 1).padStart(2, "0")} • ${escapeHtml(fact.content)}\n`;
    });

    text += "\n";
  }

  text +=
    "🛰 ARCHIV VERIFIZIERT ✅\n\n" +
    "@LibraryOfLegends";

  return text.slice(0, 4000);
}

async function findMovieForInfo(query = "") {
  if (!query) return null;

  const key = makeKey(query);

  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT *
      FROM movies
      ORDER BY title ASC
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT *
      FROM movies
      ORDER BY title ASC
    `).all();
  }

  return rows.find((movie) => {
    const movieKey = makeKey(movie.title || "");

    return (
      movieKey === key ||
      movieKey.includes(key) ||
      key.includes(movieKey)
    );
  }) || null;
}

async function movieInfoCaption(query = "") {
  const movie = await findMovieForInfo(query);

  if (!movie) {
    return null;
  }

  const facts =
    await getKnowledgeByMovie(movie.title);

  let text =
    "███ MOVIE INTEL DOSSIER ███\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    `<b>🎬 ${escapeHtml(String(movie.title || "Unbekannt").toUpperCase())}${movie.year ? ` (${escapeHtml(movie.year)})` : ""}</b>\n` +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    `🏷 ${escapeHtml(movie.library_id || "NO-ID")}\n` +
    `🎭 ${escapeHtml(movie.genre || "Unbekannt")}\n` +
    `⭐ IMDb • ${escapeHtml(movie.rating || "Unbekannt")}${String(movie.rating || "").includes("/10") ? "" : "/10"}\n\n` +

    `📀 ${escapeHtml(movie.quality || "Unbekannt")} • ${escapeHtml(movie.resolution || "Unbekannt")}\n` +
    `💾 ${escapeHtml(movie.file_size || "Unbekannt")} • ⏱ ${escapeHtml(movie.runtime || "Unbekannt")}\n\n` +

    `🎬 Regie • ${escapeHtml(movie.director || "Unbekannt")}\n` +
    `👥 Cast • ${escapeHtml(movie.cast || movie.cast_list || "Unbekannt")}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "<b>📚 KNOWLEDGE FILES</b>\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!facts.length) {
    text += "Noch keine Knowledge-Fakten für diesen Film gespeichert.\n\n";
  } else {
    facts.forEach((fact, index) => {
      text +=
        `${String(index + 1).padStart(2, "0")} • ${escapeHtml(fact.content)}\n`;
    });

    text += "\n";
  }

  text +=
    "🛰 ARCHIV VERIFIZIERT ✅\n\n" +
    "@LibraryOfLegends";

  return text.slice(0, 4000);
}

async function actorDossierCaption(actorName = "") {

  const movies =
    await getActorMovies(actorName);
    
    const facts =
  await getKnowledgeByPerson(actorName);

  const bestMovie =
    [...movies].sort((a, b) =>
      getRatingValue(b.rating) -
      getRatingValue(a.rating)
    )[0];

  let text =
    "███ ACTOR DOSSIER ███\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    `<b>🎭 ${escapeHtml(actorName.toUpperCase())}</b>\n` +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    `🎬 Filme im Archiv • ${movies.length}\n`;

  if (bestMovie) {
    text +=
      `👑 Höchstbewertet • ${bestMovie.title}\n` +
      `⭐ IMDb • ${bestMovie.rating}${String(bestMovie.rating || "").includes("/10") ? "" : "/10"}\n`;
  }

  text +=
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "<b>🎞 FILMOGRAFIE</b>\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!movies.length) {

    text +=
      "Keine Filme im Archiv gefunden.\n\n";

  } else {

    movies.slice(0, 30).forEach((movie, index) => {
  const ratingText =
    movie.rating
      ? `⭐ ${movie.rating}${String(movie.rating).includes("/10") ? "" : "/10"}`
      : "⭐ ?";

  text +=
    `${String(index + 1).padStart(2, "0")} • ${movie.title}` +
    `${movie.year ? ` (${movie.year})` : ""}\n` +
    `     ${ratingText} • ${movie.quality || "?"}\n\n`;
});

    text += "\n";
  }

    if (facts.length) {
    text +=
      "━━━━━━━━━━━━━━━━━━\n" +
      "<b>📚 ARCHIVE FACTS</b>\n" +
      "━━━━━━━━━━━━━━━━━━\n\n";

    facts.forEach((fact, index) => {
      text +=
        `${String(index + 1).padStart(2, "0")} • ${fact.content}\n`;
    });

    text += "\n";
  }

  text +=
    "🛰 ARCHIV VERIFIZIERT ✅\n\n" +
    "@LibraryOfLegends";

  return text.slice(0, 4000);
}

async function buildNewReleasesHubCaption() {

  const movies =
    await getNewReleaseRows();

  const newest =
    movies.slice(0, 15);

  const movies2025 =
    movies.filter(
      m => Number(m.year) === 2025
    );

  const movies2024 =
    movies.filter(
      m => Number(m.year) === 2024
    );

  const movies2023 =
    movies.filter(
      m => Number(m.year) === 2023
    );

  let text =
    "███ NEW RELEASES HUB ███\n\n" +

    "🔥 TRENDING ARCHIVE\n" +
    "LATEST ADDITIONS DATABASE\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "📊 RELEASE STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n" +

    `🎬 Neue Filme • ${newest.length}\n` +
    `📅 Neuester Film • ${Math.max(...movies.map(m => Number(m.year) || 0))}\n` +
    `🚀 Archivbestand • ${movies.length}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🎥 LATEST ADDITIONS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  newest.slice(0, 8).forEach((movie, index) => {

    const prefix =
      index === 7
        ? "┗"
        : "┠";

    text +=
      `${prefix} ${movie.title}` +
      `${movie.year ? ` (${movie.year})` : ""}\n`;

  });

  text +=
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "🆕 UPCOMING GENERATION\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    `🎬 Filme aus 2025 • ${movies2025.length}\n` +
    `🎬 Filme aus 2024 • ${movies2024.length}\n` +
    `🎬 Filme aus 2023 • ${movies2023.length}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return text.slice(0, 4000);
}

async function createOrUpdateNewReleasesHub() {
  return await createOrUpdateSystemHub({
    name: "🔥 New Releases",
    captionBuilder: buildNewReleasesHubCaption
  });
}

// =============================
// SYSTEM HUB UPSERT HELPER
// =============================
async function createOrUpdateSystemHub({
  name,
  captionBuilder,
  pin = false
}) {
  const topicId = await createOrGetTopic({
    chatId: MOVIE_GROUP_ID,
    name,
    type: "system_hub"
  });

  if (!topicId) {
    console.error("❌ System Hub Topic konnte nicht erstellt werden:", name);
    return null;
  }

  const text = await captionBuilder();

  const topicKey =
    makeKey(`system_hub-${MOVIE_GROUP_ID}-${name}`);

  let topic = null;

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT *
      FROM topics
      WHERE unique_key = $1
      LIMIT 1
      `,
      [topicKey]
    );

    topic = result.rows[0] || null;
  } else {
    topic = getTopic(topicKey);
  }

  if (topic?.hub_message_id) {
  const edited = await tg("editMessageText", {
    chat_id: MOVIE_GROUP_ID,
    message_id: topic.hub_message_id,
    text,
    parse_mode: "HTML"
  });

    if (!edited?.__error) {
      console.log("✅ System Hub aktualisiert:", name);
      return edited;
    }

    const editError =
      edited?.error?.description ||
      edited?.description ||
      "";

    if (editError.includes("message is not modified")) {
      console.log("ℹ️ System Hub unverändert:", name);
      return topic.hub_message_id;
    }

    if (editError.includes("message to edit not found")) {
      console.log(
        "⚠️ Hub Message fehlt, lösche alte Message-ID:",
        name
      );

      if (pgPool) {
        await pgPool.query(
          `
          UPDATE topics
          SET hub_message_id = NULL
          WHERE unique_key = $1
          `,
          [topicKey]
        );
      } else {
        db.prepare(`
          UPDATE topics
          SET hub_message_id = NULL
          WHERE unique_key = ?
        `).run(topicKey);
      }
    } else {
      console.log(
        "⚠️ System Hub Edit fehlgeschlagen, erstelle neu:",
        name,
        editError || edited
      );
    }
  }

  const msg = await tg("sendMessage", {
    chat_id: MOVIE_GROUP_ID,
    message_thread_id: Number(topicId),
    text
  });

  if (msg?.message_id) {
    if (pgPool) {
      await pgPool.query(
        `
        UPDATE topics
        SET hub_message_id = $1
        WHERE unique_key = $2
        `,
        [msg.message_id, topicKey]
      );
    } else {
      db.prepare(`
        UPDATE topics
        SET hub_message_id = ?
        WHERE unique_key = ?
      `).run(
        msg.message_id,
        topicKey
      );
    }

    if (pin) {
      try {
        await tg("pinChatMessage", {
          chat_id: MOVIE_GROUP_ID,
          message_id: msg.message_id,
          disable_notification: true
        });
      } catch (err) {
        console.error(
          "⚠️ System Hub Pin Fehler:",
          name,
          err.message
        );
      }
    }

    console.log("✅ System Hub erstellt:", name);
  }

  return msg;
}

// =============================
// COMMAND TOPIC HUB UPSERT HELPER
// =============================
async function createOrUpdateCommandTopicHub({
  name,
  type,
  captionBuilder
}) {
  const topicId = await createOrGetTopic({
    chatId: MOVIE_GROUP_ID,
    name,
    type
  });

  if (!topicId) {
    console.error("❌ Command Topic konnte nicht erstellt werden:", name);
    return null;
  }

  const text = await captionBuilder();

  const topicKey =
    makeKey(`${type}-${MOVIE_GROUP_ID}-${name}`);

  let topic = null;

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT *
      FROM topics
      WHERE unique_key = $1
      LIMIT 1
      `,
      [topicKey]
    );

    topic = result.rows[0] || null;
  } else {
    topic = getTopic(topicKey);
  }

  if (topic?.hub_message_id) {
  const edited = await tg("editMessageText", {
    chat_id: MOVIE_GROUP_ID,
    message_id: topic.hub_message_id,
    text,
    parse_mode: "HTML"
  });

    if (!edited?.__error) {
      console.log("✅ Command Topic aktualisiert:", name);
      return edited;
    }

    const editError =
      edited?.error?.description ||
      edited?.description ||
      "";

    if (editError.includes("message is not modified")) {
      console.log("ℹ️ Command Topic unverändert:", name);
      return topic.hub_message_id;
    }

    if (editError.includes("message to edit not found")) {
      console.log("⚠️ Alte Command Message fehlt, erstelle neu:", name);
    } else {
      console.log("⚠️ Command Topic Edit Fehler:", name, editError);
    }
  }

  const msg = await tg("sendMessage", {
  chat_id: MOVIE_GROUP_ID,
  message_thread_id: Number(topicId),
  text,
  parse_mode: "HTML"
});

  if (msg?.message_id) {
    if (pgPool) {
      await pgPool.query(
        `
        UPDATE topics
        SET hub_message_id = $1
        WHERE unique_key = $2
        `,
        [msg.message_id, topicKey]
      );
    } else {
      db.prepare(`
        UPDATE topics
        SET hub_message_id = ?
        WHERE unique_key = ?
      `).run(
        msg.message_id,
        topicKey
      );
    }

    console.log("✅ Command Topic erstellt:", name);
  }

  return msg;
}

// =============================
// MOVIE LIBRARY HUB
// =============================
async function getMovieLibraryRows() {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT
        title,
        year,
        rating,
        quality,
        file_size,
        created_at
      FROM movies
      WHERE (collection IS NULL OR TRIM(collection) = '')
        AND (universe IS NULL OR TRIM(universe) = '')
      ORDER BY created_at DESC
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT
        title,
        year,
        rating,
        quality,
        file_size,
        created_at
      FROM movies
      WHERE (collection IS NULL OR TRIM(collection) = '')
        AND (universe IS NULL OR TRIM(universe) = '')
      ORDER BY created_at DESC
    `).all();
  }

  return rows;
}

async function buildMovieLibraryHubCaption() {
  const movies = await getMovieLibraryRows();

  const years = movies
    .map((m) => Number(m.year))
    .filter((y) => Number.isFinite(y));

  const yearRange =
    years.length
      ? `${Math.min(...years)}–${Math.max(...years)}`
      : "Unbekannt";

  const ratings = movies
    .map((m) => getRatingValue(m.rating))
    .filter((r) => r > 0);

  const averageRating =
    ratings.length
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : "Unbekannt";

  const totalStorageMB = movies.reduce(
    (sum, movie) => sum + parseSizeToMB(movie.file_size),
    0
  );

  const qualityLine =
    [...new Set(movies.map((m) => m.quality).filter(Boolean))]
      .slice(0, 5)
      .join(" • ") || "Unbekannt";

  const latestMovies = movies.slice(0, 8);

  const topMovies =
    [...movies]
      .map((movie) => ({
        ...movie,
        ratingValue: getRatingValue(movie.rating)
      }))
      .filter((movie) => movie.ratingValue > 0)
      .sort((a, b) => b.ratingValue - a.ratingValue)
      .slice(0, 5);

  let text =
    "███ MOVIE LIBRARY HUB ███\n\n" +
    "🎬 STANDALONE CINEMA DATABASE\n" +
    "MAIN MOVIE ARCHIVE • ACTIVE\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🏛 LIBRARY STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    `🎬 Standalone Movies • ${movies.length}\n` +
    `📅 Timeline • ${yearRange}\n` +
    `⭐ Ø Rating • ${averageRating}\n` +
    `💾 Storage • ${formatMB(totalStorageMB)}\n` +
    `📀 Quality • ${qualityLine}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🎥 LATEST LIBRARY ENTRIES\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!latestMovies.length) {
    text += "Noch keine Standalone-Filme gespeichert.\n";
  } else {
    latestMovies.forEach((movie, index) => {
      const prefix =
        index === latestMovies.length - 1
          ? "┗"
          : "┠";

      text +=
        `${prefix} ${movie.title || "Unbekannt"}${movie.year ? ` (${movie.year})` : ""}\n`;
    });
  }

  text +=
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "🏆 TOP STANDALONE MOVIES\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!topMovies.length) {
    text += "Noch keine bewerteten Standalone-Filme.\n";
  } else {
    topMovies.forEach((movie, index) => {
      const medal =
        index === 0 ? "🥇" :
        index === 1 ? "🥈" :
        index === 2 ? "🥉" :
        `#${index + 1}`;

      text +=
        `${medal} ${movie.title || "Unbekannt"}${movie.year ? ` (${movie.year})` : ""}\n` +
        `⭐ ${movie.ratingValue} IMDb • ${movie.quality || "?"}\n\n`;
    });
  }

  text +=
    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return text.slice(0, 4000);
}

async function createOrUpdateMovieLibraryHub() {
  return await createOrUpdateSystemHub({
    name: "🎬 Movie Library",
    captionBuilder: buildMovieLibraryHubCaption
  });
}

async function createOrUpdatePremiumQualityHub() {
  return await createOrUpdateSystemHub({
    name: "💎 Premium Quality",
    captionBuilder: buildPremiumQualityHubCaption
  });
}

async function createOrUpdateUniversesIndexHub() {
  return await createOrUpdateSystemHub({
    name: "🌌 Universes",
    captionBuilder: buildUniversesIndexHubCaption
  });
}

async function createOrUpdateCollectionsIndexHub() {
  return await createOrUpdateSystemHub({
    name: "🧩 Collections",
    captionBuilder: buildCollectionsIndexHubCaption
  });
}

async function createOrUpdateMovieIndexHub() {
  return await createOrUpdateSystemHub({
    name: "📚 Movie Index",
    captionBuilder: buildMovieIndexHubCaption,
    pin: true
  });
}

async function createOrUpdateCollectionHub(tmdb, topicId) {
  if (!tmdb.collection || !tmdb.collectionId) return null;

  const collection = await getCollectionById(tmdb.collectionId);
  if (!collection) return null;

  const hubText = await collectionHubCaption(tmdb.collection);

  if (collection.hub_message_id) {
    const edited = await tg("editMessageText", {
      chat_id: MOVIE_GROUP_ID,
      message_id: collection.hub_message_id,
      text: hubText
    });

    if (!edited?.__error) {
      console.log("✅ Collection Hub aktualisiert:", tmdb.collection);
      return edited;
    }

    const editError =
      edited?.error?.description ||
      edited?.description ||
      "";

    if (editError.includes("message is not modified")) {
      console.log("ℹ️ Collection Hub unverändert:", tmdb.collection);
      return collection.hub_message_id;
    }

    if (editError.includes("message to edit not found")) {
      console.log("⚠️ Collection Hub Message fehlt, erstelle neu:", tmdb.collection);
    } else {
      console.log("⚠️ Collection Hub Edit Fehler:", tmdb.collection, editError);
    }
  }

  const hub = await tg("sendMessage", {
  chat_id: MOVIE_GROUP_ID,
  message_thread_id: Number(topicId),
  text: hubText,
  parse_mode: "HTML"
});

  if (hub?.message_id) {
    saveCollectionHubMessageId(
      tmdb.collectionId,
      hub.message_id
    );

    try {
      await tg("pinChatMessage", {
        chat_id: MOVIE_GROUP_ID,
        message_id: hub.message_id,
        disable_notification: true
      });
    } catch (err) {
      console.error(
        "⚠️ Collection Hub Pin Fehler:",
        err.message
      );
    }

    console.log("✅ Collection Hub erstellt:", tmdb.collection);
  }

  return hub;
}

// =============================
// PARSER / ERKENNUNG
// =============================

function cleanFileName(fileName = "") {
  return String(fileName)
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/@[\w\d_]+/gi, "")
    .replace(/\b(german|deutsch|ger|english|englisch|eng|multi|dubbed|subbed|dl|dual|dts|ddp|aac|ac3|x264|x265|h264|h265|hevc|av1|bluray|brrip|webrip|web|webdl|web-dl|hdrip|dvdrip|remux|hdr|hdr10|hdr10plus|dolby|vision|uhd|fhd|fullhd|hd|sd|4k|2160p|1080p|720p|576p|480p|original|orginal|originale|orginale|alte|tonspur|line|mic|md|proper|repack)\b/gi, "")
    .replace(/\b(amzn|nf|netflix|disney|hulu|apple|itunes|max|sky|paramount)\b/gi, "")
    .replace(/[()[\]{}]/g, " ")
    .replace(/[._-]+/g, " ")
    .replace(/\b\d\s+\d\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fixKnownMovieTitle(title = "") {
  return String(title)
    // Datum vorne: 2013.02.06 Parker -> Parker
    .replace(/^\s*\d{4}\s+\d{1,2}\s+\d{1,2}\s+/g, "")

    // Mission Impossible
    .replace(/Mission\s+Impossible/gi, "Mission Impossible")
    .replace(/MissionImpossible/gi, "Mission Impossible")

    // Guardians
    .replace(/GuardiansoftheGalaxyVol\s*2/gi, "Guardians of the Galaxy Vol. 2")
    .replace(/GuardiansoftheGalaxyVol\.?\s*2/gi, "Guardians of the Galaxy Vol. 2")
    .replace(/Guardians\s+of\s+the\s+Galaxy\s+3/gi, "Guardians of the Galaxy Vol. 3")
    .replace(/GuardiansoftheGalaxy3/gi, "Guardians of the Galaxy Vol. 3")

    // Kill Bill
    .replace(/KillBillTheWholeBloodyAffairTeil1/gi, "Kill Bill The Whole Bloody Affair")
    .replace(/KillBillTheWholeBloodyAffair/gi, "Kill Bill The Whole Bloody Affair")

    // Disney / Deutsch
    .replace(/Die\s*EisköniginVölligunverfroren/gi, "Die Eiskönigin Völlig unverfroren")
    .replace(/DieEisköniginVölligunverfroren/gi, "Die Eiskönigin Völlig unverfroren")

    // Renegade
    .replace(/Renegade(\d{4})/gi, "Renegade $1")

    // Star Wars Stories
    .replace(/SoloAStarWarsStory/gi, "Solo A Star Wars Story")
    .replace(/RogueOneAStarWarsStory/gi, "Rogue One A Star Wars Story")

    // Star Wars Episoden
    .replace(/StarWarsEpisodeIX/gi, "Star Wars Episode IX ")
    .replace(/StarWarsEpisodeVIII/gi, "Star Wars Episode VIII ")
    .replace(/StarWarsEpisodeVII/gi, "Star Wars Episode VII ")
    .replace(/StarWarsEpisodeVI/gi, "Star Wars Episode VI ")
    .replace(/StarWarsEpisodeV/gi, "Star Wars Episode V ")
    .replace(/StarWarsEpisodeIV/gi, "Star Wars Episode IV ")
    .replace(/StarWarsEpisodeIII/gi, "Star Wars Episode III ")
    .replace(/StarWarsEpisodeII/gi, "Star Wars Episode II ")
    .replace(/StarWarsEpisodeI/gi, "Star Wars Episode I ")

    .replace(/EinenneueHoffnung/gi, "Eine neue Hoffnung")
    .replace(/EineineueHoffnung/gi, "Eine neue Hoffnung")
    .replace(/EineNeueHoffnung/gi, "Eine neue Hoffnung")
    .replace(/DasImperiumschlägtzurück/gi, "Das Imperium schlägt zurück")
    .replace(/DieRükkehrderJediRitter/gi, "Die Rückkehr der Jedi Ritter")
    .replace(/DieRueckkehrderJediRitter/gi, "Die Rückkehr der Jedi Ritter")
    .replace(/DieRückkehrderJediRitter/gi, "Die Rückkehr der Jedi Ritter")
    .replace(/DasErwachenderMacht/gi, "Das Erwachen der Macht")
    .replace(/DieletztenJedi/gi, "Die letzten Jedi")
    .replace(/DerAufstiegSkywalkers/gi, "Der Aufstieg Skywalkers")
    .replace(/DiedunkleBedrohung/gi, "Die dunkle Bedrohung")
    .replace(/AngriffderKlonkrieger/gi, "Angriff der Klonkrieger")
    .replace(/DieRachederSith/gi, "Die Rache der Sith")

    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitle(title = "") {
  return String(title)
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeGenreName(genre = "") {

  const g =
    String(genre || "")
      .trim()
      .toLowerCase();

  const map = {

    "science fiction": "Sci-Fi",
    "sci-fi": "Sci-Fi",
    "sci fi": "Sci-Fi",

    "action & adventure": "Action",
    "action-adventure": "Action",

    "animation": "Animation",

    "comedy": "Comedy",

    "crime": "Crime",

    "documentary": "Documentary",

    "drama": "Drama",

    "fantasy": "Fantasy",

    "history": "History",

    "horror": "Horror",

    "music": "Music",

    "mystery": "Mystery",

    "romance": "Romance",

    "thriller": "Thriller",

    "war": "War",

    "western": "Western"

  };

  return map[g] || genre;
}

function getDecadeLabel(year) {

  const y = Number(year || 0);

  if (!y) {
    return "Unknown";
  }

  const decade =
    Math.floor(y / 10) * 10;

  return `${decade}s`;
}

function isEliteMovie(movie) {
  const ratingMatch =
    String(movie.rating || "").match(/(\d+(\.\d+)?)/g);

  const rating =
    ratingMatch ? Number(ratingMatch.pop()) : 0;

  const isHighRated = rating >= 8.0;
  const isUHD =
    String(movie.quality || "")
      .toUpperCase()
      .includes("UHD");

  return isHighRated || isUHD;
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

function expandEpisodeRange(start, end) {
  const a = Number(start);
  const b = Number(end);

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return [];
  }

  const from = Math.min(a, b);
  const to = Math.max(a, b);

  return Array.from(
    { length: to - from + 1 },
    (_, i) => from + i
  );
}

function normalizeSeriesTitle(title = "") {
  const key = String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const fixes = {
    theboys: "The Boys",
    theboy: "The Boys",

    dermandalorianer: "The Mandalorian",
    mandalorianer: "The Mandalorian",
    themandalorian: "The Mandalorian",
    mandalorian: "The Mandalorian",

    strangerthings: "Stranger Things",

    gameofthrones: "Game of Thrones",
    got: "Game of Thrones",

    breakingbad: "Breaking Bad",

    thewalkingdead: "The Walking Dead",
    twd: "The Walking Dead",

    houseofthedragon: "House of the Dragon",
    hotd: "House of the Dragon"
  };

  return fixes[key] || title;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================
// UPLOAD QUEUE V2
// =============================
const UPLOAD_QUEUE = [];
let UPLOAD_QUEUE_RUNNING = false;
let UPLOAD_QUEUE_COUNTER = 0;

async function enqueueUpload(job, label = "Upload") {
  const id = ++UPLOAD_QUEUE_COUNTER;

  UPLOAD_QUEUE.push({
    id,
    label,
    job,
    createdAt: Date.now()
  });

  console.log(
    `📥 Queue #${id} hinzugefügt: ${label} | Wartend: ${UPLOAD_QUEUE.length}`
  );

  if (!UPLOAD_QUEUE_RUNNING) {
    runUploadQueue();
  }

  return id;
}

async function runUploadQueue() {
  if (UPLOAD_QUEUE_RUNNING) return;

  UPLOAD_QUEUE_RUNNING = true;

  while (UPLOAD_QUEUE.length > 0) {
    const item = UPLOAD_QUEUE.shift();

    console.log(
      `🚀 Queue #${item.id} startet: ${item.label} | Rest: ${UPLOAD_QUEUE.length}`
    );

    try {

  await item.job();

  console.log(
    `✅ Queue #${item.id} fertig`
  );

} catch (err) {

  console.error(
    `❌ Queue #${item.id} Fehler:`,
    err.message
  );

  // =============================
  // AUTO RECOVERY
  // =============================
  try {

    await tg("sendMessage", {
      chat_id: ADMIN_ID,
      text:
        "⚠️ Upload Fehler erkannt\n\n" +
        `📥 Queue ID: ${item.id}\n` +
        `📁 Datei: ${item.label}\n\n` +
        `❌ ${String(err.message).slice(0, 1000)}`
    });

  } catch (notifyErr) {

    console.error(
      "❌ Fehler-Notification fehlgeschlagen:",
      notifyErr.message
    );
  }
}

    const waitTime =
  UPLOAD_QUEUE.length > 5
    ? 8000
    : 5000;

await sleep(waitTime);
  }

  UPLOAD_QUEUE_RUNNING = false;

  console.log("🏁 Upload Queue leer");
}

function extractYear(text = "") {
  const match = String(text).match(/\b(19\d{2}|20\d{2})\b|(?:^|[^0-9])(19\d{2}|20\d{2})(?:[^0-9]|$)/);
  return match ? (match[1] || match[2]) : "";
}

function detectSeries(fileName = "") {
  const raw = String(fileName);
  const normalized = raw
    .replace(/@[\w\d_]+/gi, "")
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[._]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const patterns = [
  /\bS\s?(\d{1,2})\s?E\s?(\d{1,3})\b/i,
  /\bS\s?(\d{1,2})\s*[- ]\s?E\s?(\d{1,3})\b/i,
  /\b(\d{1,2})x(\d{1,3})\b/i,
  /\bStaffel\s*(\d{1,2})\s*Folge\s*(\d{1,3})\b/i,
  /\bSeason\s*(\d{1,2})\s*Episode\s*(\d{1,3})\b/i
];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;

    const season = parseInt(match[1], 10);
    const episode = parseInt(match[2], 10);

    const beforeCode = normalized.slice(0, match.index).trim();
    const afterCode = normalized.slice(match.index + match[0].length).trim();

    let titleClean = cleanFileName(beforeCode);
    let episodeTitleFromFile = "";

    if (titleClean) {
      episodeTitleFromFile = cleanFileName(afterCode);
    }

    if (!titleClean && afterCode) {
      const parts = afterCode.split(/\s+-\s+/);

      if (parts.length >= 2) {
        titleClean = cleanFileName(parts[0]);
        episodeTitleFromFile = cleanFileName(parts.slice(1).join(" - "));
      } else {
        const words = cleanFileName(afterCode).split(/\s+/).filter(Boolean);

        if (words.length >= 3) {
          titleClean = words.slice(0, 3).join(" ");
          episodeTitleFromFile = words.slice(3).join(" ");
        } else {
          titleClean = cleanFileName(afterCode);
        }
      }
    }

    if (!titleClean && CURRENT_SERIES_NAME) {
      titleClean = CURRENT_SERIES_NAME;
    }

    titleClean = String(titleClean || "")
      .replace(/\b(19\d{2}|20\d{2})\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

    episodeTitleFromFile = String(episodeTitleFromFile || "")
      .replace(/^\s*[-–—]\s*/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return {
      isSeries: true,
      seriesTitle: normalizeSeriesTitle(normalizeTitle(titleClean)),
      season,
      episode,
      seasonText: String(season).padStart(2, "0"),
      episodeText: String(episode).padStart(2, "0"),
      episodeTitleFromFile
    };
  }

  return { isSeries: false };
}

function detectMovie(fileName = "") {
  const cleaned = cleanFileName(fileName);
  const fixedCleaned = fixKnownMovieTitle(cleaned);
  const year = extractYear(fixedCleaned);

  let title = fixedCleaned;

if (year) {
  title = fixedCleaned.replace(new RegExp(`\\b${year}\\b`, "g"), "");
}

title = fixKnownMovieTitle(title);

title = title
  .replace(/\bPart\s*\d+\b/gi, "")
  .replace(/\bCD\s*\d+\b/gi, "")
  .replace(/[()[\]{}]/g, " ")
  .replace(/\b(FHD|HD|SD|UHD|WEB|DL|AC3|AAC|DTS)\b/gi, "")
  .replace(/\b(Original|Orginal|Originale|Orginale|Alte|Tonspur)\b/gi, "")
  .replace(/\s+/g, " ")
  .trim();

  return {
    isMovie: true,
    title: normalizeTitle(title),
    year
  };
}

function buildMovieSearchVariants(title = "") {
  const base = String(title || "").trim();

  const variants = [
    base,
    fixKnownMovieTitle(base),
    base.replace(/([a-z])([A-Z])/g, "$1 $2"),
    base.replace(/([A-ZÄÖÜ][a-zäöüß]+)([A-ZÄÖÜ])/g, "$1 $2")
  ];

  return [...new Set(
    variants
      .map((v) => String(v || "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
  )];
}

function parseManualSeriesCommand(text = "") {
  const raw = String(text || "")
    .replace(/^\/series/i, "")
    .trim();

  if (!raw) return null;

  const doublePipeMatch = raw.match(
    /^(.+?)\s*\|\s*S?(\d{1,2})E?(\d{1,3})\s*\+\s*S?\d{0,2}E?(\d{1,3})$/i
  );

  if (doublePipeMatch) {
    let title = normalizeSeriesTitle(
      doublePipeMatch[1].trim()
    );

    const season = Number(doublePipeMatch[2]);
    const episodeStart = Number(doublePipeMatch[3]);
    const episodeEnd = Number(doublePipeMatch[4]);

    const episodes =
      expandEpisodeRange(episodeStart, episodeEnd);

    const seasonText =
      String(season).padStart(2, "0");

    const episodeText =
      `${String(episodeStart).padStart(2, "0")}+${String(episodeEnd).padStart(2, "0")}`;

    return {
      type: "series",
      isSeries: true,
      seriesTitle: title,
      season,
      episode: episodeStart,
      episodeEnd,
      episodes,
      isDoubleEpisode: episodes.length > 1,
      seasonText,
      episodeText,
      episodeTitleFromFile: "",
      uniqueKey:
        makeKey(`${title}-s${seasonText}-e${String(episodeStart).padStart(2, "0")}-e${String(episodeEnd).padStart(2, "0")}`)
    };
  }

  const specialDoubleMatch = raw.match(
    /^(.+?)\s*\|\s*S?(\d{1,2})\s*E?(\d{1,3})a\s*&\s*E?\d{1,3}b\s*-\s*(.+)$/i
  );

  if (specialDoubleMatch) {
    const title = normalizeSeriesTitle(
      normalizeTitle(specialDoubleMatch[1].trim())
    );

    const season = Number(specialDoubleMatch[2]);
    const episode = Number(specialDoubleMatch[3]);

    const seasonText = String(season).padStart(2, "0");
    const episodeText = String(episode).padStart(2, "0");

    return {
      type: "series",
      isSeries: true,
      seriesTitle: title,
      season,
      episode,
      episodeEnd: episode,
      episodes: [episode],
      seasonText,
      episodeText,
      episodeEndText: episodeText,
      isDoubleEpisode: true,
      isSplitEpisode: true,
      episodeTitleFromFile: specialDoubleMatch[4].trim(),
      uniqueKey: makeKey(`${title}-s${seasonText}-e${episodeText}-ab`)
    };
  }

  const pipeMatch = raw.match(/^(.+?)\s*\|\s*S?(\d{1,2})E?(\d{1,3})$/i);
  const normalMatch = raw.match(/^(.+?)\s+S(\d{1,2})E(\d{1,3})$/i);

  let title = "";
  let season = null;
  let episode = null;

  if (pipeMatch) {
    title = pipeMatch[1].trim();
    season = Number(pipeMatch[2]);
    episode = Number(pipeMatch[3]);
  } else if (normalMatch) {
    title = normalMatch[1].trim();
    season = Number(normalMatch[2]);
    episode = Number(normalMatch[3]);
  }

  if (!title || !season || !episode) {
    return null;
  }

  title = normalizeSeriesTitle(title);

  const seasonText = String(season).padStart(2, "0");
  const episodeText = String(episode).padStart(2, "0");

  return {
    type: "series",
    isSeries: true,
    seriesTitle: title,
    season,
    episode,
    episodeEnd: episode,
    episodes: [episode],
    seasonText,
    episodeText,
    episodeTitleFromFile: "",
    uniqueKey: makeKey(`${title}-s${seasonText}-e${episodeText}`)
  };
}

function parseManualMovieCaption(caption = "") {
  const text = String(caption || "").trim();

  if (!text.toLowerCase().startsWith("/movie")) {
    return null;
  }

  const query = text.replace(/^\/movie/i, "").trim();

  if (!query) return null;

  const parts = query
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);

  const title = parts[0] || "";
  const year = parts[1] || extractYear(query) || "";

  if (!title) return null;

  return {
    type: "movie",
    isMovie: true,
    title: normalizeTitle(title),
    year,
    uniqueKey: makeKey(`${title}-${year || "unknown"}`),
    manual: true
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

function detectQuality(fileName = "", video = null) {
  const f = String(fileName).toLowerCase();

  // =============================
  // TELEGRAM VIDEO METADATA
  // =============================
  const width = video?.width || 0;
  const height = video?.height || 0;

  if (width >= 3800 || height >= 2100) return "UHD";
  if (width >= 1900 || height >= 1000) return "FHD";
  if (width >= 1200 || height >= 700) return "HD";

  // =============================
  // FALLBACK FILE NAME
  // =============================
  if (/\b(2160p|4k|uhd)\b/.test(f)) return "UHD";
  if (/\b(1080p|fhd|fullhd)\b/.test(f)) return "FHD";
  if (/\b(720p|hd)\b/.test(f)) return "HD";
  if (/\b(480p|576p|sd)\b/.test(f)) return "SD";

  return "Unbekannt";
}

function detectSource(fileName = "") {
  const f = fileName.toLowerCase();

  if (f.includes("bluray") || f.includes("brrip")) return "BluRay";
  if (f.includes("web-dl") || f.includes("webdl")) return "WEB-DL";
  if (f.includes("webrip")) return "WEBRip";
  if (f.includes("hdrip")) return "HDRip";
  if (f.includes("dvdrip")) return "DVDRip";
  if (f.includes("remux")) return "REMUX";

  return "Unbekannt";
}

function detectAudio(fileName = "") {
  const f = fileName.toLowerCase();
  const langs = [];

  if (/\b(german|deutsch|ger)\b/.test(f)) langs.push("Deutsch");
  if (/\b(english|englisch|eng)\b/.test(f)) langs.push("Englisch");
  if (/\b(french|franz|fr)\b/.test(f)) langs.push("Französisch");
  if (/\b(spanish|spanisch|es)\b/.test(f)) langs.push("Spanisch");
  if (/\b(italian|italienisch|ita)\b/.test(f)) langs.push("Italienisch");

  if (/\b(dl|dual)\b/.test(f)) {
    if (!langs.includes("Deutsch")) langs.push("Deutsch");
    if (!langs.includes("Englisch")) langs.push("Englisch");
  }

  return [...new Set(langs)].join(" • ") || "Unbekannt";
}

// =============================
// ALLOWED MOVIE TOPICS
// =============================
const ALLOWED_MOVIE_TOPICS = [
  "🔥 Neuerscheinungen",
  "🌌 Star Wars Universe",
  "🏰 Disney Universe",
  "🧬 Marvel Universe",
  "🦇 DC Universe",
  "🎞 Filmreihen",
  "🎬 Klassische Filme",
  "📼 Filme der 80er",
  "📀 Filme der 90er",
  "🎥 Filme der 2000er",
  "🚀 Neuere Filme",
  "🌍 Internationale Filme",
  "📚 Dokumentationen",
  "🎨 Animation",
  "🍿 Familienfilme",
  "🧸 Kinderfilme",
  "⛩ Anime"
];

function normalizeAllowedMovieTopic(topicName = "") {
  return ALLOWED_MOVIE_TOPICS.includes(topicName)
    ? topicName
    : "🚀 Neuere Filme";
}

function getSmartMovieTopic(tmdb = {}) {
  const title = String(tmdb.title || "").toLowerCase();
  const genre = String(tmdb.genre || "").toLowerCase();
  const collection = String(tmdb.collection || "").toLowerCase();
  const universe = String(tmdb.universe || "").toLowerCase();
  const country = String(tmdb.country || tmdb.land || "").toLowerCase();
  const year = Number(tmdb.year || 0);

  // =============================
  // NEUERSCHEINUNGEN
  // =============================
  if (year >= 2024) {
    return "🔥 Neuerscheinungen";
  }

  // =============================
  // UNIVERSES
  // =============================
  if (
    universe.includes("star wars") ||
    title.includes("star wars") ||
    collection.includes("star wars")
  ) {
    return "🌌 Star Wars Universe";
  }

  if (
    universe.includes("disney") ||
    collection.includes("disney") ||
    title.includes("frozen") ||
    title.includes("vaiana") ||
    title.includes("encanto") ||
    title.includes("aladdin") ||
    title.includes("lion king")
  ) {
    return "🏰 Disney Universe";
  }

  if (
    universe.includes("marvel") ||
    collection.includes("marvel") ||
    title.includes("avengers") ||
    title.includes("iron man") ||
    title.includes("thor") ||
    title.includes("captain america")
  ) {
    return "🧬 Marvel Universe";
  }

  if (
    universe.includes("dc") ||
    title.includes("batman") ||
    title.includes("joker") ||
    title.includes("superman") ||
    title.includes("wonder woman") ||
    title.includes("aquaman") ||
    title.includes("flash")
  ) {
    return "🦇 DC Universe";
  }

  // =============================
  // FILMREIHEN
  // =============================
  if (tmdb.collection) {
    return "🎞 Filmreihen";
  }

  // =============================
  // SPECIAL CATEGORIES
  // =============================
  if (
    genre.includes("dokumentation") ||
    genre.includes("doku") ||
    genre.includes("documentary")
  ) {
    return "📚 Dokumentationen";
  }

  if (
    genre.includes("anime") ||
    title.includes("anime")
  ) {
    return "⛩ Anime";
  }

  if (
    genre.includes("animation") ||
    genre.includes("animationsfilm")
  ) {
    return "🎨 Animation";
  }

  if (
    genre.includes("familie") ||
    genre.includes("family") ||
    genre.includes("kinder")
  ) {
    return "🧸 Kinderfilme";
  }

  if (
    genre.includes("komödie") ||
    genre.includes("comedy")
  ) {
    return "🍿 Familienfilme";
  }

  if (
    country &&
    !country.includes("usa") &&
    !country.includes("united states") &&
    !country.includes("deutschland") &&
    !country.includes("germany")
  ) {
    return "🌍 Internationale Filme";
  }

  // =============================
  // JAHRGANG
  // =============================
  if (year > 0 && year < 1980) {
    return "🎬 Klassische Filme";
  }

  if (year >= 1980 && year <= 1989) {
    return "📼 Filme der 80er";
  }

  if (year >= 1990 && year <= 1999) {
    return "📀 Filme der 90er";
  }

  if (year >= 2000 && year <= 2009) {
    return "🎥 Filme der 2000er";
  }

  return "🚀 Neuere Filme";
}

function formatFileSize(bytes = 0) {
  const size = Number(bytes || 0);
  if (!size) return "Unbekannt";

  const gb = size / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;

  const mb = size / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

function detectResolution(video = null) {
  const width = video?.width || 0;
  const height = video?.height || 0;

  if (!width || !height) return "Unbekannt";
  return `${width}x${height}`;
}

function detectVideoCodec(fileName = "") {
  const f = String(fileName).toLowerCase();

  if (/\b(x265|h265|h\.265|hevc)\b/.test(f)) return "HEVC / H.265";
  if (/\b(x264|h264|h\.264|avc)\b/.test(f)) return "AVC / H.264";
  if (/\b(av1)\b/.test(f)) return "AV1";

  return "Unbekannt";
}

function detectAudioCodec(fileName = "") {
  const f = String(fileName).toLowerCase();

  if (/\b(truehd|atmos)\b/.test(f)) return "TrueHD Atmos";
  if (/\b(eac3|e-ac3|ddp|dd\+)\b/.test(f)) return "E-AC3 / DDP";
  if (/\b(ac3|dolby digital)\b/.test(f)) return "AC3";
  if (/\b(dts-hd|dtshd)\b/.test(f)) return "DTS-HD";
  if (/\b(dts)\b/.test(f)) return "DTS";
  if (/\b(aac)\b/.test(f)) return "AAC";

  return "Unbekannt";
}

function detectAudioChannels(fileName = "") {
  const f = String(fileName).toLowerCase();

  if (/\b(7\.1|7ch)\b/.test(f)) return "7.1";
  if (/\b(5\.1|6ch)\b/.test(f)) return "5.1";
  if (/\b(2\.0|stereo)\b/.test(f)) return "2.0";

  return "Unbekannt";
}

function detectHDR(fileName = "") {
  const f = String(fileName).toLowerCase();

  if (/\b(dv|dolby vision)\b/.test(f)) return "Dolby Vision";
  if (/\b(hdr10\+|hdr10plus)\b/.test(f)) return "HDR10+";
  if (/\b(hdr10|hdr)\b/.test(f)) return "HDR";

  return "";
}

function getMediaExtras(fileName, msg) {
  const resolution = detectResolution(msg.video);
  const detectedQuality = detectQuality(fileName, msg.video);

  const fileBytes =
    msg.video?.file_size ||
    msg.document?.file_size ||
    0;

  let autoQuality = "SD";

  const width =
    parseInt(String(resolution || "").split("x")[0]) || 0;

  if (width >= 3800) {
    autoQuality = "UHD";
  } else if (width >= 1900) {
    autoQuality = "FHD";
  } else if (width >= 1200) {
    autoQuality = "HD";
  }

  return {
    quality:
      detectedQuality && detectedQuality !== "Unbekannt"
        ? detectedQuality
        : autoQuality,

    resolution,

    fileSize: formatFileSize(fileBytes),
    fileSizeBytes: fileBytes,

    audio: detectAudio(fileName),
    source: detectSource(fileName),

    videoCodec: detectVideoCodec(fileName),
    audioCodec: detectAudioCodec(fileName),
    audioChannels: detectAudioChannels(fileName),

    hdr: detectHDR(fileName)
  };
}

function makeLibraryId(id) {
  return `#${String(id || 0).padStart(4, "0")}`;
}

function makeGenreCode(genre = "") {
  const g = String(genre).split("/")[0].trim().toUpperCase();
  return `#${g.slice(0, 3)}001`;
}

async function makeLibraryCode(genre = "") {
  const map = {
    Action: "ACT",
    Abenteuer: "ADV",
    Animation: "ANI",
    Komödie: "COM",
    Krimi: "CRI",
    Drama: "DRA",
    Fantasy: "FAN",
    Horror: "HOR",
    Mystery: "MYS",
    Romanze: "ROM",
    Sciencefiction: "SCI",
    Thriller: "THR",
    Familie: "FAM"
  };

  const firstGenre = String(genre).split("/")[0].trim();
  const prefix = map[firstGenre] || "MOV";

  let count = 0;

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT COUNT(*) AS count
      FROM movies
      WHERE library_id LIKE $1
      `,
      [`LIB-${prefix}-%`]
    );

    count = Number(result.rows[0]?.count || 0);
  } else {
    const row = db.prepare(`
      SELECT COUNT(*) AS count
      FROM movies
      WHERE library_id LIKE ?
    `).get(`LIB-${prefix}-%`);

    count = Number(row.count || 0);
  }

  const nextNumber = count + 1;

  return `LIB-${prefix}-${String(nextNumber).padStart(4, "0")}`;
}

function makeSeriesLibraryCode(genre = "") {
  const map = {
    Action: "ACT",
    Abenteuer: "ADV",
    Animation: "ANI",
    Komödie: "COM",
    Krimi: "KRI",
    Drama: "DRA",
    Fantasy: "FAN",
    Horror: "HOR",
    Mystery: "MYS",
    Romanze: "ROM",
    Sciencefiction: "SCI",
    Thriller: "THR",
    Familie: "FAM"
  };

  const firstGenre = String(genre).split("/")[0].trim();
  const prefix = map[firstGenre] || "SER";

  const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM series
    WHERE series_library_id LIKE ?
  `).get(`SER-${prefix}-%`);

  const nextNumber = Number(row.count || 0) + 1;

  return `SER-${prefix}-${String(nextNumber).padStart(4, "0")}`;
}

// =============================
// TMDB API + CACHE
// =============================
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const TMDB_IMAGE_ORIGINAL = "https://image.tmdb.org/t/p/original";

const TMDB_CACHE = new Map();
const TMDB_CACHE_TTL = 1000 * 60 * 60 * 6; // 6 Stunden

async function tmdbGet(path, params = {}) {
  const cacheKey = JSON.stringify({ path, params });

  const cached = TMDB_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.time < TMDB_CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await axios.get(`${TMDB_BASE}${path}`, {
      params: {
        api_key: TMDB_KEY,
        language: "de-DE",
        ...params
      }
    });

    TMDB_CACHE.set(cacheKey, {
      time: Date.now(),
      data: res.data
    });

    return res.data;
  } catch (err) {
    console.error("❌ TMDB Fehler:", err.response?.data || err.message);
    return null;
  }
}

setInterval(() => {
  const now = Date.now();

  for (const [key, value] of TMDB_CACHE.entries()) {
    if (now - value.time > TMDB_CACHE_TTL) {
      TMDB_CACHE.delete(key);
    }
  }
}, 1000 * 60 * 30);

// =============================
// TMDB FORMAT HELPERS
// =============================
function formatGenres(genres = []) {
  if (!Array.isArray(genres) || !genres.length) return "Sonstige";
  return genres.map((g) => g.name).filter(Boolean).join(" / ");
}

function getMainGenre(genres = []) {
  if (!Array.isArray(genres) || !genres.length) return "Sonstige";
  return genres[0]?.name || "Sonstige";
}

function formatRating(vote = 0) {
  const rating = Number(vote || 0).toFixed(1);
  const stars = Math.max(0, Math.min(5, Math.round(Number(vote || 0) / 2)));

  return "★".repeat(stars) + "☆".repeat(5 - stars) + ` • ${rating}`;
}

function posterUrl(path) {
  return path ? `${TMDB_IMAGE_BASE}${path}` : "";
}

function backdropUrl(path) {
  return path ? `${TMDB_IMAGE_ORIGINAL}${path}` : "";
}

// =============================
// MOVIE DETAILS FORMATTER
// =============================
function buildMovieTmdbObject(details, fallbackTitle = "", fallbackYear = "") {
  if (!details) return null;

  const director =
    details.credits?.crew?.find((p) => p.job === "Director")?.name ||
    "Unbekannt";

  const cast =
    details.credits?.cast
      ?.slice(0, 3)
      .map((p) => p.name)
      .filter(Boolean)
      .join(" • ") || "Unbekannt";

  const deRelease = details.release_dates?.results?.find(
    (r) => r.iso_3166_1 === "DE"
  );

  const cert =
    deRelease?.release_dates?.find((r) => r.certification)?.certification || "";

  return {
    tmdbId: details.id,
    title: details.title || details.original_title || fallbackTitle || "Unbekannt",
    year: details.release_date ? details.release_date.slice(0, 4) : fallbackYear,
    genre: formatGenres(details.genres),
    mainGenre: getMainGenre(details.genres),
    rating: formatRating(details.vote_average),
    runtime: details.runtime ? `${details.runtime} Min.` : "Unbekannt",
    overview: details.overview || "Keine Beschreibung verfügbar.",
    posterUrl: posterUrl(details.poster_path),
    backdropUrl: backdropUrl(details.backdrop_path),
    collection: details.belongs_to_collection?.name || "",
    collectionId: details.belongs_to_collection?.id || null,
    collectionPoster: details.belongs_to_collection?.poster_path
      ? posterUrl(details.belongs_to_collection.poster_path)
      : "",
    collectionBackdrop: details.backdrop_path
      ? backdropUrl(details.backdrop_path)
      : "",
    director,
    cast,
    fsk: cert ? `FSK ${cert}` : "FSK Unbekannt"
  };
}

// =============================
// TMDB COLLECTION MOVIES
// =============================
async function getTMDBCollectionMovies(collectionId) {
  if (!collectionId) return [];

  const data = await tmdbGet(`/collection/${collectionId}`);

  if (!data?.parts?.length) return [];

  return data.parts
    .filter((m) => m.media_type !== "tv")
    .map((m) => ({
  id: m.id,
  title: m.title || m.original_title || "",
  year: m.release_date ? m.release_date.slice(0, 4) : "",
  releaseDate: m.release_date || ""
}))
    .filter((m) => m.title)
    .sort((a, b) =>
      String(a.releaseDate || "").localeCompare(String(b.releaseDate || ""))
    );
}

// =============================
// MOVIE SEARCH
// =============================
async function searchMovieTMDBChoices(title, year = "") {
  const variants = buildMovieSearchVariants(title);

  for (const queryTitle of variants) {
    const search = await tmdbGet("/search/movie", {
      query: queryTitle,
      year: year || undefined,
      include_adult: false
    });

    if (search?.results?.length) {
      return search.results.slice(0, 5).map((m) => ({
        id: m.id,
        title: m.title || m.original_title || queryTitle,
        year: m.release_date ? m.release_date.slice(0, 4) : "Unbekannt"
      }));
    }
  }

  if (year) return await searchMovieTMDBChoices(title, "");

  return [];
}

async function getMovieDetailsById(tmdbId) {
  const details = await tmdbGet(`/movie/${tmdbId}`, {
    append_to_response: "credits,release_dates"
  });

  return buildMovieTmdbObject(details);
}

async function searchMovieTMDB(title, year = "") {
  const variants = buildMovieSearchVariants(title);

  for (const queryTitle of variants) {
    console.log("🔎 TMDB Movie Search:", queryTitle, year || "");

    const search = await tmdbGet("/search/movie", {
      query: queryTitle,
      year: year || undefined,
      include_adult: false
    });

    if (!search?.results?.length) continue;

    const best = search.results[0];

    const details = await tmdbGet(`/movie/${best.id}`, {
      append_to_response: "credits,release_dates"
    });

    const movie = buildMovieTmdbObject(details, queryTitle, year);

if (movie?.collectionId) {
  movie.collectionMovies =
    await getTMDBCollectionMovies(movie.collectionId);
}

if (movie) return movie;
  }

  if (year) return await searchMovieTMDB(title, "");

  return null;
}

// =============================
// SERIES SEARCH
// =============================
const SERIES_TMDB_OVERRIDES = {
  "robin hood": 258918
};

async function searchSeriesTMDB(title, season, episode) {
  const titleKey =
    String(title || "")
      .toLowerCase()
      .trim();

  const overrideId =
    SERIES_TMDB_OVERRIDES[titleKey];

  let best = null;

  if (overrideId) {
    best = { id: overrideId };
  } else {
    const search = await tmdbGet("/search/tv", {
      query: title,
      include_adult: false
    });

    if (!search?.results?.length) {
      return null;
    }

    best = search.results[0];
  }

  const details = await tmdbGet(`/tv/${best.id}`, {
    append_to_response: "credits,content_ratings"
  });

  if (!details) {
    return null;
  }

  const seasonDetails =
    await getSeasonTMDB(best.id, season);

  const episodeDetails =
    await tmdbGet(
      `/tv/${best.id}/season/${season}/episode/${episode}`
    );

  const createdBy =
    details.created_by
      ?.map((p) => p.name)
      .filter(Boolean)
      .join(" • ") || "Unbekannt";

  const cast =
    details.credits?.cast
      ?.slice(0, 5)
      .map((p) => p.name)
      .filter(Boolean)
      .join(" • ") || "Unbekannt";

  const deRating =
    details.content_ratings?.results?.find(
      (r) => r.iso_3166_1 === "DE"
    );

  const usRating =
    details.content_ratings?.results?.find(
      (r) => r.iso_3166_1 === "US"
    );

  const fsk =
    deRating?.rating
      ? `FSK ${deRating.rating}`
      : usRating?.rating || "FSK Unbekannt";

  return {
    tmdbId: details.id,

    seriesTitle:
      details.name || title,

    seasonNumber:
      Number(season),

    episodeNumber:
      Number(episode),

    seasonEpisodeCount:
      seasonDetails?.episodes?.length || episode,

    episodeTitle:
      episodeDetails?.name || "",

    episodeRuntime:
      episodeDetails?.runtime
        ? `${episodeDetails.runtime} Min.`
        : "Unbekannt",

    genre:
      formatGenres(details.genres),

    mainGenre:
      getMainGenre(details.genres),

    rating:
      formatRating(
        episodeDetails?.vote_average ||
        details.vote_average
      ),

    seriesRating:
      formatRating(details.vote_average),

    episodeRating:
      episodeDetails?.vote_average
        ? formatRating(episodeDetails.vote_average)
        : "",

    overview:
      episodeDetails?.overview ||
      details.overview ||
      "Keine Beschreibung verfügbar.",

    posterUrl:
      posterUrl(
        episodeDetails?.still_path ||
        details.poster_path
      ),

    seriesPosterUrl:
      posterUrl(details.poster_path),

    backdropUrl:
      backdropUrl(
        episodeDetails?.still_path ||
        details.backdrop_path
      ),

    seriesBackdropUrl:
      backdropUrl(details.backdrop_path),

    firstAirDate:
  details.first_air_date || null,

lastAirDate:
  details.last_air_date || null,

totalSeasons:
  Number(details.number_of_seasons || 0) || null,

totalEpisodes:
  Number(details.number_of_episodes || 0) || null,

status:
  details.status || null,

createdBy,
cast,
fsk
  };
}

async function getSeasonTMDB(tvId, season) {
  if (!tvId || !season) return null;

  const german =
    await tmdbGet(
      `/tv/${tvId}/season/${season}`,
      {
        language: "de-DE"
      }
    );

  if (
    german?.episodes?.some((ep) =>
      ep?.name &&
      !/^Folge\s+\d+$/i.test(ep.name)
    )
  ) {
    return german;
  }

  const english =
    await tmdbGet(
      `/tv/${tvId}/season/${season}`,
      {
        language: "en-US"
      }
    );

  return german || english;
}

// =============================
// SEASON THEME
// =============================
function getSeasonTheme(season = 1) {
  const themes = {
    1: { name: "ICE BLUE", color: "#4DA6FF", emoji: "❄️" },
    2: { name: "ROYAL GOLD", color: "#D4AF37", emoji: "👑" },
    3: { name: "BLOOD RED", color: "#8B0000", emoji: "🩸" },
    4: { name: "MIDNIGHT PURPLE", color: "#4B0082", emoji: "🌌" },
    5: { name: "FOREST GREEN", color: "#228B22", emoji: "🌲" },
    6: { name: "EMBER ORANGE", color: "#FF6A00", emoji: "🔥" },
    7: { name: "STEEL SILVER", color: "#A9A9A9", emoji: "⚔️" },
    8: { name: "NIGHT BLACK", color: "#111111", emoji: "🌑" }
  };

  return themes[Number(season)] || {
    name: "CLASSIC",
    color: "#000000",
    emoji: "🎬"
  };
}

// =============================
// BRANDED COVER GENERATOR
// =============================
async function createBrandedCover(posterUrlValue, title = "", subtitle = "") {
  try {
    if (!posterUrlValue) return "";

    const imageRes = await axios.get(posterUrlValue, {
      responseType: "arraybuffer"
    });

    const inputBuffer = Buffer.from(imageRes.data);

    const safeTitle = String(title || "")
      .toUpperCase()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .slice(0, 32);

    const safeSubtitle = String(subtitle || "")
      .toUpperCase()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .slice(0, 32);

    const overlay = Buffer.from(`
<svg width="500" height="750" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="360" x2="0" y2="750">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="65%" stop-color="#000000" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.92"/>
    </linearGradient>
  </defs>

  <rect x="0" y="360" width="500" height="390" fill="url(#g)"/>

  <text x="250" y="570" font-size="32" font-weight="900"
        text-anchor="middle" fill="#ffffff"
        font-family="sans-serif">${safeTitle}</text>

  <text x="250" y="615" font-size="24" font-weight="800"
        text-anchor="middle" fill="#D4AF37"
        font-family="sans-serif">${safeSubtitle}</text>
</svg>
`);

    const outputPath = `/tmp/cover-${Date.now()}.jpg`;

    await sharp(inputBuffer)
      .resize(500, 750)
      .composite([{ input: overlay, top: 0, left: 0 }])
      .jpeg({ quality: 95 })
      .toFile(outputPath);

    return outputPath;
  } catch (err) {
    console.error("❌ Branding Cover Fehler:", err.message);
    return posterUrlValue;
  }
}

// =============================
// PREMIUM LAYOUTS
// =============================
function makeHashtags(text = "") {
  return String(text)
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean)
    .map((g) => "#" + g.replace(/\s+/g, ""))
    .join(" ");
}

// =============================
// MOVIE NEXUS META
// =============================
function getMovieNexusMeta(tmdb, extras = {}) {

  const collection =
    String(tmdb.collection || "");

  const universe =
    String(extras.universe || "");

  // =============================
  // COLLECTION ENTRY
  // =============================
  if (collection) {

    const collectionMovies =
  Number(extras.collectionMovies || 1);

let collectionIndex = 1;

if (
  Array.isArray(extras.collectionOrder)
) {

  const currentYear =
    String(tmdb.year || "");

  const foundIndex =
  extras.collectionOrder.findIndex((m) => {

    const item =
      typeof m === "string"
        ? { title: m }
        : m || {};

    const sameId =
      item.id &&
      tmdb.tmdbId &&
      Number(item.id) === Number(tmdb.tmdbId);

    if (sameId) return true;

    const itemTitleKey =
      makeKey(item.title || "");

    const movieTitleKey =
      makeKey(tmdb.title || "");

    const sameTitle =
      itemTitleKey &&
      movieTitleKey &&
      (
        itemTitleKey.includes(movieTitleKey) ||
        movieTitleKey.includes(itemTitleKey)
      );

    const sameYear =
      item.year &&
      tmdb.year &&
      String(item.year) === String(tmdb.year);

    return sameTitle && sameYear;
  });

  if (foundIndex >= 0) {
    collectionIndex = foundIndex + 1;
  }
}

    return {
  header: "███ COLLECTION NEXUS ███",

  line1:
  `🎞 ${collection.toUpperCase()}`,

  line2:
  `🎬 ${String(tmdb.title || "").toUpperCase()}${tmdb.year ? ` (${tmdb.year})` : ""}`,

  line3:
    tmdb.originalTitle &&
    tmdb.originalTitle !== tmdb.title
      ? `┗ ${tmdb.originalTitle.toUpperCase()}`
      : null,

  line4:
    `COLLECTION ENTRY • ${collectionIndex}/${collectionMovies}`
};
  }

  // =============================
  // MARVEL
  // =============================
  if (
    universe.toLowerCase().includes("marvel")
  ) {
    return {
      header: "███ MARVEL NEXUS ███",

      line1:
        `🧬 ${String(tmdb.title || "").toUpperCase()}`,

      line2:
        extras.universePhase || "MULTIVERSE ENTRY"
    };
  }

  // =============================
  // STAR WARS
  // =============================
  if (
    universe.toLowerCase().includes("star wars")
  ) {
    return {
      header: "███ GALACTIC NEXUS ███",

      line1:
        `🌌 ${String(tmdb.title || "").toUpperCase()}`,

      line2:
        "JEDI ARCHIVE ENTRY"
    };
  }

  // =============================
  // DISNEY
  // =============================
  if (
    universe.toLowerCase().includes("disney")
  ) {
    return {
      header: "███ DISNEY NEXUS ███",

      line1:
        `🏰 ${String(tmdb.title || "").toUpperCase()}`,

      line2:
        "MAGIC ARCHIVE ENTRY"
    };
  }

  // =============================
  // DEFAULT
  // =============================
  return {
  header: "███ CINEMA NEXUS ███",

  line1:
    `🎬 ${String(tmdb.title || "").toUpperCase()}${tmdb.year ? ` (${tmdb.year})` : ""}`,

  line2:
    "🎞 CINEMA ENTRY • VERIFIED"
};
}

// =============================
// MOVIE CAPTION — LEGENDS DOSSIER V1.1
// =============================
function trimTextAtSentence(text = "", maxLength = 260) {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  const sliced = clean.slice(0, maxLength);

  const lastSentenceEnd = Math.max(
    sliced.lastIndexOf("."),
    sliced.lastIndexOf("!"),
    sliced.lastIndexOf("?")
  );

  if (lastSentenceEnd > 80) {
    return sliced.slice(0, lastSentenceEnd + 1);
  }

  const lastSpace = sliced.lastIndexOf(" ");

  return (
    sliced.slice(0, lastSpace > 0 ? lastSpace : maxLength) +
    " …"
  );
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getLegendStatusAndRank(rating = "") {
  const match = String(rating).match(/\d+(\.\d+)?/);
  const value = match ? Number(match[0]) : 0;

  if (value >= 8.8) {
    return {
      legend: "Masterpiece",
      rank: "Hall of Fame"
    };
  }

  if (value >= 8.0) {
    return {
      legend: "Legendary",
      rank: "Hall of Fame"
    };
  }

  if (value >= 7.2) {
    return {
      legend: "Legendary",
      rank: "Elite Archive"
    };
  }

  if (value >= 6.0) {
    return {
      legend: "Recommended",
      rank: "Elite Archive"
    };
  }

  return {
    legend: "Standard",
    rank: "Archive Entry"
  };
}

function getRatingStars(value = 0) {
  const rating = Number(value || 0);

  if (rating >= 8.0) return "★★★★☆";
  if (rating >= 7.0) return "★★★★☆";
  if (rating >= 6.0) return "★★★☆☆";
  if (rating >= 4.0) return "★★☆☆☆";
  if (rating >= 2.0) return "★☆☆☆☆";

  return "☆☆☆☆☆";
}

function isHallOfFameMovie(rating = "") {
  const match = String(rating).match(/\d+(\.\d+)?/);
  const value = match ? Number(match[0]) : 0;

  return value >= 8.0;
}

function getMovieDossierHeader(tmdb = {}, extras = {}) {
  const text = `${tmdb.collection || ""} ${extras.universe || ""} ${tmdb.title || ""}`
    .toLowerCase();

  if (text.includes("james bond")) return "███ BOND DOSSIER ███";
  if (text.includes("marvel")) return "███ MARVEL DOSSIER ███";
  if (text.includes("star wars")) return "███ GALACTIC DOSSIER ███";
  if (text.includes("jurassic")) return "███ JURASSIC DOSSIER ███";
  if (text.includes("fast") || text.includes("furious")) return "███ FAST SAGA DOSSIER ███";
  if (text.includes("mission impossible")) return "███ IMF DOSSIER ███";

  return "███ LEGENDS DOSSIER ███";
}

// =============================
// COLLECTION SAGA CAPTION
// =============================
function getCollectionCode(collection = "") {
  const key = makeKey(collection);

  if (key.includes("fast")) return "FAST";
  if (key.includes("john-wick")) return "WICK";
  if (key.includes("hangover")) return "HANG";
  if (key.includes("mission")) return "IMF";
  if (key.includes("bourne")) return "BOUR";
  if (key.includes("final-destination")) return "FD";
  if (key.includes("jurassic")) return "JURA";
  if (key.includes("harry-potter")) return "HP";
  if (key.includes("terminator")) return "TERM";
  if (key.includes("matrix")) return "MTRX";

  const short =
    String(collection || "SAGA")
      .replace(/filmreihe/gi, "")
      .replace(/collection/gi, "")
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 5);

  return short || "SAGA";
}

function getCollectionEntryInfo(tmdb = {}, extras = {}) {
  const order =
    Array.isArray(extras.collectionOrder)
      ? extras.collectionOrder
      : [];

  let index = 1;

  const foundIndex = order.findIndex((item) => {
    const entry =
      typeof item === "string"
        ? { title: item }
        : item || {};

    const sameId =
      entry.id &&
      tmdb.tmdbId &&
      Number(entry.id) === Number(tmdb.tmdbId);

    if (sameId) return true;

    const entryTitleKey = makeKey(entry.title || "");
    const movieTitleKey = makeKey(tmdb.title || "");

    const sameTitle =
      entryTitleKey &&
      movieTitleKey &&
      (
        entryTitleKey.includes(movieTitleKey) ||
        movieTitleKey.includes(entryTitleKey)
      );

    const sameYear =
      entry.year &&
      tmdb.year &&
      String(entry.year) === String(tmdb.year);

    return sameTitle && sameYear;
  });

  if (foundIndex >= 0) {
    index = foundIndex + 1;
  }

  const total =
    Number(extras.collectionMovies || order.length || index || 1);

  return {
    index,
    total: Math.max(total, index),
    indexText: String(index).padStart(2, "0")
  };
}

function buildSagaStatusBar(index = 1, total = 1) {
  const maxSlots =
    Math.min(Math.max(Number(total || 1), Number(index || 1)), 10);

  let result = "";

  for (let i = 1; i <= maxSlots; i++) {
    if (i < index) {
      result += "🟩";
    } else if (i === index) {
      result += "▶️";
    } else {
      result += "🟥";
    }
  }

  return result;
}

function buildSagaIndex(index = 1, total = 1, collection = "") {
  const maxSlots =
    Math.min(Math.max(Number(total || 1), Number(index || 1)), 10);

  const key = makeKey(collection);

  const currentIcon =
    key.includes("fast")
      ? "🚗"
      : key.includes("john-wick")
        ? "🩸"
        : key.includes("jurassic")
          ? "🦖"
          : key.includes("harry-potter")
            ? "⚡"
            : "🎬";

  const doneIcon =
    key.includes("fast")
      ? "👥"
      : "✅";

  const futureIcon =
    key.includes("fast")
      ? "🏁"
      : "⬜";

  const parts = [];

  for (let i = 1; i <= maxSlots; i++) {
    const number = String(i).padStart(2, "0");

    if (i === index) {
      parts.push(`${currentIcon}[${number}]`);
    } else if (i < index) {
      parts.push(`${doneIcon}[${number}]`);
    } else {
      parts.push(`${futureIcon}[${number}]`);
    }
  }

  return parts.join(" ");
}

function collectionSagaCaption(tmdb = {}, extras = {}) {
  const collection =
    tmdb.collection ||
    extras.collection ||
    detectCollection(tmdb.title) ||
    "Saga Collection";

  const info =
    getCollectionEntryInfo(tmdb, extras);

  const code =
    getCollectionCode(collection);

  const ref =
    `#${code}-${info.indexText}`;

  const ratingNumber =
    getRatingValue(tmdb.rating);

  const stars =
    getRatingStars(ratingNumber);

  const ratingText =
    ratingNumber > 0
      ? ratingNumber.toFixed(1)
      : "Unbekannt";

  const quality =
  extras.quality || "HD";

const fileSize =
  extras.fileSize || "Unbekannt";

const source =
  extras.source && extras.source !== "Unbekannt"
    ? extras.source
    : quality === "UHD"
      ? "4K Release"
      : quality === "FHD"
        ? "HD Release"
        : "Release";

const videoCodec =
  extras.videoCodec && extras.videoCodec !== "Unbekannt"
    ? extras.videoCodec.replace("AVC / ", "").replace("HEVC / ", "")
    : quality === "UHD"
      ? "H.265"
      : "x264";

  const runtime =
    tmdb.runtime || "Unbekannt";

  const runtimeText =
    String(runtime).toLowerCase().includes("min")
      ? runtime
      : `${runtime} Min.`;

  const fsk =
    tmdb.fsk || "FSK Unbekannt";

  const director =
    tmdb.director || "Unbekannt";

  const cast =
    String(tmdb.cast || "Unbekannt")
      .split("•")
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(" ∙ ");

  const story =
    trimTextAtSentence(
      tmdb.overview || "Keine Beschreibung verfügbar.",
      210
    );

  const genreTags =
    String(tmdb.genre || "")
      .split("/")
      .map((g) => g.trim())
      .filter(Boolean)
      .slice(0, 2)
      .map((g) => `#${g.replace(/\s+/g, "")}`)
      .join(" ");

  const title =
    String(tmdb.title || "Unbekannt").toUpperCase();

  const year =
    tmdb.year ? ` (${tmdb.year})` : "";

  const totalText =
    info.total >= 10
      ? `${info.total}+`
      : String(info.total);

  const caption =
    "█████████ SAGA COLLECTION █████████\n\n" +

    `🎬 ${escapeHtml(title)}${escapeHtml(year)}\n` +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    `🌀 Reihe   • ${escapeHtml(collection)}\n` +
    `🔢 Chronik • Teil ${info.index} von ${totalText}\n` +
    `📊 Status  • ${buildSagaStatusBar(info.index, info.total)}\n` +
    "──────────────────────────────\n" +
    `⭐ IMDb    • ${stars} ∙ (${escapeHtml(ratingText)}/10)\n` +
    `📌 Ref     • ${escapeHtml(ref)}\n` +
    "──────────────────────────────\n" +
    "⚙️ SPECS\n" +
    `💿 Format  : ${escapeHtml(quality)} ∙ ${escapeHtml(source)}\n` +
    `💾 Speicher: ${escapeHtml(fileSize)} ∙ ${escapeHtml(videoCodec)}\n` +
    `⏱ Laufzeit: ${escapeHtml(runtimeText)} ∙ ${escapeHtml(fsk)}\n` +
    "──────────────────────────────\n" +
    `🎬 Regie   : ${escapeHtml(director)}\n` +
    `👥 Cast    : ${escapeHtml(cast)}\n` +
    "──────────────────────────────\n" +
    "📖 CHRONIK & STORY\n" +
    `${escapeHtml(story)}\n` +
    "──────────────────────────────\n" +
    "🗂️ SAGA INDEX\n" +
    `${buildSagaIndex(info.index, info.total, collection)}\n\n` +
    `(▶️ Aktuell: Teil ${info.indexText})\n` +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    `${genreTags} #${code}${info.indexText}\n\n` +
    "@LibraryOfLegends";

  return cleanTelegramText(caption).slice(0, 1024);
}

function movieCaption(tmdb, extras = {}) {
  const genreText = String(tmdb.genre || "Sonstige")
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" • ");

  const genreTags = String(tmdb.genre || "")
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((g) => `#${g.replace(/\s+/g, "")}`)
    .join(" ");

  const libraryTag =
    extras.libraryId
      ? ` #${String(extras.libraryId).replace(/-/g, "")}`
      : "";

  const castText = String(tmdb.cast || "Unbekannt")
    .split("•")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" • ");

  const safeOverview = trimTextAtSentence(
    tmdb.overview || "Keine Beschreibung verfügbar.",
    230
  );

  const cleanVideoCodec =
    extras.videoCodec && extras.videoCodec !== "Unbekannt"
      ? extras.videoCodec
      : "H.264";

  const rawRating = String(tmdb.rating || "");

const ratingText =
  rawRating.match(/\d+(\.\d+)?/)?.[0] ||
  "Unbekannt";

const { legend, rank } = getLegendStatusAndRank(ratingText);

  const title = escapeHtml(tmdb.title || "Unbekannt");
  const titleUpper = title.toUpperCase();
  const year = tmdb.year ? ` (${escapeHtml(tmdb.year)})` : "";
  const libraryId = escapeHtml(extras.libraryId || "Unbekannt");

  const collectionLine =
    tmdb.collection
      ? `🌌 ${escapeHtml(tmdb.collection)}\n`
      : extras.universe
        ? `🌌 ${escapeHtml(extras.universe)}\n`
        : "";

  const runtime = tmdb.runtime || "Unbekannt";
  const runtimeText =
    String(runtime).toLowerCase().includes("min")
      ? runtime
      : `${runtime} Min.`;

  const resolution =
    extras.resolution &&
    !["320x180", "480x270", "640x360"].includes(String(extras.resolution))
      ? ` • ${escapeHtml(extras.resolution)}`
      : "";
      
      const stars =
  getRatingStars(
    getRatingValue(ratingText)
  );

  return (
    `${getMovieDossierHeader(tmdb, extras)}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    `<b>🎬 ${titleUpper}${year}</b>\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    `🎭 ${escapeHtml(genreText)}\n` +
    collectionLine +
    `🏷 ${libraryId}\n\n` +

    `⭐ IMDb • ${stars} • (${escapeHtml(ratingText)}/10)\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    `📀 ${escapeHtml(extras.quality || "HD")}${resolution}\n` +
    `💾 ${escapeHtml(extras.fileSize || "Unbekannt")} • ⏱ ${escapeHtml(runtimeText)}\n` +
    `🎞 ${escapeHtml(cleanVideoCodec)} • 🔞 ${escapeHtml(tmdb.fsk || "FSK Unbekannt")}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    `<b>🏆 ${escapeHtml(rank)} • ${escapeHtml(legend)}</b>\n\n` +

    `🎬 ${escapeHtml(tmdb.director || "Unbekannt")}\n` +
    `👥 ${escapeHtml(castText || "Unbekannt")}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    "<b>📖 STORY DOSSIER</b>\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    `${escapeHtml(safeOverview)}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    "<b>🛰 ARCHIV VERIFIZIERT ✅</b>\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    `${genreTags}${libraryTag}\n\n` +
    "@LibraryOfLegends"
  ).slice(0, 1024);
}

function movieLiteCaption(tmdb, extras = {}) {
  const nexus = getMovieNexusMeta(tmdb, extras);

  const genreTags = String(tmdb.genre || "")
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((g) => `#${g.replace(/\s+/g, "")}`)
    .join(" ");

    return (
    "███ LEGENDS FILE ███\n\n" +

    `${nexus.line2}\n\n` +
    `${nexus.line1}\n` +
    `${nexus.line4 ? `📚 ${nexus.line4.replace("COLLECTION ENTRY •", "Teil").replace("/", " von ")}\n\n` : "\n"}` +

    `⭐ ${tmdb.rating || "Unbekannt"} IMDb\n` +
    `📀 ${extras.quality || "HD"} • ${extras.fileSize || "Unbekannt"}\n` +
    `🏷 ${extras.libraryId || "Unbekannt"}\n\n` +

    `${genreTags}\n` +
    "@LibraryOfLegends"
  );
}

function buildMovieArchiveProgressBar(movieCount = 0) {
  const size = 10;
  const percent = movieCount >= 100 ? 1 : movieCount / 100;
  const filled = Math.round(percent * size);

  return "■".repeat(filled) + "□".repeat(size - filled);
}

function getCollectionHubHeader(topicName = "") {
  const text = String(topicName || "").toLowerCase();

  if (text.includes("james bond")) return "███ BOND ARCHIVE HUB ███";
  if (text.includes("marvel")) return "███ MARVEL ARCHIVE HUB ███";
  if (text.includes("star wars")) return "███ GALACTIC ARCHIVE HUB ███";
  if (text.includes("jurassic")) return "███ JURASSIC ARCHIVE HUB ███";
  if (text.includes("fast") || text.includes("furious")) return "███ FAST SAGA ARCHIVE HUB ███";
  if (text.includes("mission impossible")) return "███ IMF ARCHIVE HUB ███";

  return "███ LEGENDS COLLECTION HUB ███";
}

// =============================
// MOVIE HUB CAPTION — COLLECTION / LIBRARY V2
// =============================
async function movieHubCaption(topicName = "", topicId = null) {
  const cleanTopic = String(topicName || "Filme")
    .replace(/^[^\w\d]+/g, "")
    .trim();

  const shortName = cleanTopic
    .replace(/filmreihe/gi, "")
    .replace(/collection/gi, "")
    .replace(/archive/gi, "")
    .trim();

  const isCollectionHub =
    /filmreihe|collection/i.test(cleanTopic);

  let movies = [];

  if (pgPool) {
    const result = await pgPool.query(
      isCollectionHub
        ? `
          SELECT title, year, rating, runtime, quality, file_size, collection, library_id, genre
          FROM movies
          WHERE LOWER(collection) LIKE LOWER($1)
          ORDER BY year ASC, title ASC
        `
        : `
          SELECT title, year, rating, runtime, quality, file_size, collection, library_id, genre
          FROM movies
          WHERE topic_id = $1
          ORDER BY year ASC, title ASC
        `,
      isCollectionHub
        ? [`%${shortName}%`]
        : [topicId]
    );

    movies = result.rows;
  } else {
    movies = isCollectionHub
      ? db.prepare(`
          SELECT title, year, rating, runtime, quality, file_size, collection, library_id, genre
          FROM movies
          WHERE LOWER(collection) LIKE LOWER(?)
          ORDER BY year ASC, title ASC
        `).all(`%${shortName}%`)
      : db.prepare(`
          SELECT title, year, rating, runtime, quality, file_size, collection, library_id, genre
          FROM movies
          WHERE topic_id = ?
          ORDER BY year ASC, title ASC
        `).all(topicId);
  }

  const movieCount = movies.length;

  const years = movies
    .map((m) => Number(m.year))
    .filter((y) => Number.isFinite(y));

  const yearRange =
    years.length
      ? `${Math.min(...years)}–${Math.max(...years)}`
      : "Unbekannt";

  let totalSizeMB = 0;

  for (const movie of movies) {
    const size = String(movie.file_size || "").toUpperCase();

    const gb = size.match(/([\d.]+)\s*GB/);
    const mb = size.match(/([\d.]+)\s*MB/);

    if (gb) totalSizeMB += parseFloat(gb[1]) * 1024;
    else if (mb) totalSizeMB += parseFloat(mb[1]);
  }

  const totalStorage =
    totalSizeMB >= 1024
      ? `${(totalSizeMB / 1024).toFixed(1)} GB`
      : `${Math.round(totalSizeMB)} MB`;

  const ratings = movies
    .map((m) => {
      const match = String(m.rating || "").match(/(\d+(\.\d+)?)/g);
      return match ? Number(match.pop()) : null;
    })
    .filter((r) => Number.isFinite(r));

  const averageRating =
    ratings.length
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : "Unbekannt";

  const topMovie = [...movies]
    .sort((a, b) => {
      const ar = String(a.rating || "").match(/(\d+(\.\d+)?)/g);
      const br = String(b.rating || "").match(/(\d+(\.\d+)?)/g);

      return (br ? Number(br.pop()) : 0) - (ar ? Number(ar.pop()) : 0);
    })[0];

  const qualityLine =
    [...new Set(movies.map((m) => m.quality).filter(Boolean))]
      .slice(0, 4)
      .join(" • ") || "Unbekannt";

  const hubTitle =
    isCollectionHub
      ? `🎞 ${shortName.toUpperCase()}`
      : `🎬 ${cleanTopic.toUpperCase()}`;

  let result =
    `${getCollectionHubHeader(topicName)}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    `<b>${hubTitle}</b>\n` +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    `🎬 Filme • ${movieCount}\n` +
    `📅 Timeline • ${yearRange}\n` +
    `⭐ Ø IMDb • ${averageRating}/10\n` +
    `💾 Storage • ${totalStorage}\n` +
    `📀 Quality • ${qualityLine}\n` +
    (topMovie ? `👑 Top Film • ${topMovie.title}\n` : "") +

    "\n━━━━━━━━━━━━━━━━━━\n" +
    "<b>📚 COLLECTION INDEX</b>\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!movies.length) {
    result += "Noch keine Filme gespeichert.\n\n";
  } else {
    const visibleMovies = movies.slice(0, 20);

    visibleMovies.forEach((m, index) => {
      result +=
        `${String(index + 1).padStart(2, "0")} • ${m.title || "Unbekannt"}${m.year ? ` (${m.year})` : ""}\n` +
        `     ⭐ ${m.rating || "?"} • ${m.quality || "?"}${m.runtime ? ` • ⏱ ${m.runtime}` : ""}\n\n`;
    });

    if (movies.length > visibleMovies.length) {
      result += `… +${movies.length - visibleMovies.length} weitere Filme\n\n`;
    }
  }

  result +=
    "🛰 ARCHIV VERIFIZIERT ✅\n\n" +
    "@LibraryOfLegends";

  return result.slice(0, 4000);
}

// =============================
// GET MOVIE HUB TOPIC
// =============================
async function getMovieHubTopic(topicId) {

  if (pgPool) {

    const result = await pgPool.query(
      `
      SELECT *
      FROM topics
      WHERE topic_id = $1
      LIMIT 1
      `,
      [topicId]
    );

    return result.rows[0] || null;

  }

  return db.prepare(`
    SELECT *
    FROM topics
    WHERE topic_id = ?
    LIMIT 1
  `).get(topicId);
}

// =============================
// SAVE MOVIE HUB MESSAGE ID
// =============================
async function saveMovieHubMessageId(
  topicId,
  messageId
) {

  if (pgPool) {

    await pgPool.query(
      `
      UPDATE topics
      SET movie_hub_message_id = $1
      WHERE topic_id = $2
      `,
      [messageId, topicId]
    );

    return;
  }

  db.prepare(`
    UPDATE topics
    SET movie_hub_message_id = ?
    WHERE topic_id = ?
  `).run(messageId, topicId);
}

// =============================
// CREATE MOVIE HUB IF MISSING
// =============================
async function createMovieHubIfMissing({
  topicId,
  topicName,
  banner
}) {

  const topic =
    await getMovieHubTopic(topicId);

  if (topic?.movie_hub_message_id) {
    return topic.movie_hub_message_id;
  }
  
  // =============================
// AUTO LOAD BANNER
// =============================
if (!banner) {
  banner = getCollectionBanner(topicName);
}

console.log("🖼 MOVIE HUB BANNER CHECK:", {
  topicName,
  banner
});

  // =============================
  // CREATE BANNER
  // =============================
  if (banner) {

    const bannerMsg = await tg("sendPhoto", {
      chat_id: MOVIE_GROUP_ID,
      message_thread_id: topicId,
      photo: banner,
      caption:
        "━━━━━━━━━━━━━━━━━━\n" +
        `🎬 ${String(topicName || "").toUpperCase()}\n` +
        "━━━━━━━━━━━━━━━━━━\n\n" +
        "📁 PREMIUM MOVIE ARCHIVE\n" +
        "🎞 CINEMATIC COLLECTION ACTIVE\n\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        "@LibraryOfLegends"
    });

    if (bannerMsg?.message_id) {

      if (pgPool) {
        await pgPool.query(
          `
          UPDATE topics
          SET movie_banner_message_id = $1
          WHERE topic_id = $2
          `,
          [bannerMsg.message_id, topicId]
        );
      } else {
        db.prepare(`
          UPDATE topics
          SET movie_banner_message_id = ?
          WHERE topic_id = ?
        `).run(bannerMsg.message_id, topicId);
      }

    }
  }

  // =============================
  // CREATE HUB
  // =============================
  const hub = await tg("sendMessage", {
  chat_id: MOVIE_GROUP_ID,
  message_thread_id: topicId,
  text: await movieHubCaption(topicName, topicId),
  parse_mode: "HTML"
});

  if (hub?.message_id) {

    try {
      await tg("pinChatMessage", {
        chat_id: MOVIE_GROUP_ID,
        message_id: hub.message_id,
        disable_notification: true
      });
    } catch (err) {
      console.error("⚠️ Movie Hub Pin Fehler:", err.message);
    }

    await saveMovieHubMessageId(
      topicId,
      hub.message_id
    );

    return hub.message_id;
  }

  return null;
}

// =============================
// MOVIE INDEX PAGES
// =============================
async function buildMovieIndexPages() {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT title, year, library_id, collection, universe, rating
      FROM movies
      ORDER BY title ASC, year ASC
    `);

    rows = result.rows;

  } else {

    rows = db.prepare(`
      SELECT title, year, library_id, collection, universe, rating
      FROM movies
      ORDER BY title ASC, year ASC
    `).all();
  }

  const uniqueRows = [];
  const seen = new Set();

  for (const movie of rows) {
    const key =
      `${makeKey(movie.title)}-${movie.year || ""}`;

    if (seen.has(key)) continue;

    seen.add(key);
    uniqueRows.push(movie);
  }

  if (!uniqueRows.length) {
    return [
      "███ NEXUS FILM INDEX ███\n\n" +
      "🎬 TOTAL ENTRIES • 0\n" +
      "🧬 ARCHIVE STATUS • EMPTY\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
    ];
  }

  const groups = {};

  for (const movie of uniqueRows) {
    const letter =
      String(movie.title || "#")
        .trim()
        .charAt(0)
        .toUpperCase();

    const key =
      letter.match(/[A-ZÄÖÜ]/)
        ? letter
        : "#";

    if (!groups[key]) groups[key] = [];

    groups[key].push(movie);
  }

  const letters = Object.keys(groups).sort();

  const pagesRaw = [];
  const pageRanges = [];

  let currentPage = "";
  let currentStart = null;
  let currentEnd = null;

  for (const letter of letters) {

    let section =
      "━━━━━━━━━━━━━━━━━━\n" +
      `🔤 LETTER • ${letter}\n` +
      "━━━━━━━━━━━━━━━━━━\n\n";

    for (const movie of groups[letter]) {

      const ratingNumber =
        Number(
          String(movie.rating || "")
            .match(/(\d+(\.\d+)?)/)?.[0] || 0
        );

      let specialBadge = "";

if (movie.universe) {

  specialBadge +=
    "   🌌 UNIVERSE ENTRY\n";
}

if (ratingNumber >= 8) {

  specialBadge +=
    "   🏆 ELITE ARCHIVE\n";

} else if (
  ratingNumber >= 7.5 &&
  Number(movie.year || 0) < 2010
) {

  specialBadge +=
    "   💎 CULT CLASSIC\n";
}

      section +=
        `🎞 ${String(movie.title || "Unbekannt").toUpperCase()}\n` +
        `└ ${movie.year || "Unbekannt"} • ${movie.library_id || "NO-ID"}\n` +

        (
          movie.collection
            ? `   🎞 ${movie.collection}\n`
            : movie.universe
              ? `   🌌 ${movie.universe}\n`
              : ""
        ) +

        specialBadge +
        "\n";
    }

    if (!currentStart) {
      currentStart = letter;
    }

    if (
      (currentPage + section).length > 2500 &&
      currentPage.length > 0
    ) {

      pagesRaw.push(currentPage);

      pageRanges.push({
        start: currentStart,
        end: currentEnd || currentStart
      });

      currentPage = "";
      currentStart = letter;
    }

    currentPage += section;

    currentEnd = letter;
  }

  if (currentPage.length > 0) {

    pagesRaw.push(currentPage);

    pageRanges.push({
      start: currentStart,
      end: currentEnd || currentStart
    });
  }

  const indexMap =
    pageRanges
      .map((r) => `${r.start}–${r.end}`)
      .join(" • ");

  return pagesRaw.map((body, index) => {

    const range = pageRanges[index];

    return (
      "███ NEXUS FILM INDEX ███\n" +
      `PAGE ${index + 1}/${pagesRaw.length} • ${range.start}–${range.end}\n\n` +

      `🎬 TOTAL ENTRIES • ${uniqueRows.length}\n` +
      "🧬 ARCHIVE STATUS • ACTIVE\n" +
      `📅 LAST UPDATE • ${new Date().toLocaleString("de-DE")}\n\n` +

      "🧭 INDEX MAP\n" +
      `${indexMap}\n\n` +

      body +

      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"

    ).slice(0, 4000);
  });
}

// =============================
// CREATE OR UPDATE MOVIE INDEX — DISABLED IN LIBRARY V3
// =============================
async function createOrUpdateMovieIndex() {
  console.log("ℹ️ Movie A–Z Index in Library V3 deaktiviert");
  return null;
}

// =============================
// UPDATE MOVIE HUB — DISABLED IN LIBRARY V3
// =============================
async function updateMovieHub({
  topicId,
  topicName
}) {
  console.log(
    "ℹ️ Movie Hub Update in Library V3 deaktiviert:",
    topicName
  );

  return null;
}

function getQualityBadge(quality = "") {
  const q = String(quality || "").toUpperCase();

  if (q === "UHD") return "💎 UHD";
  if (q === "FHD") return "🔥 FHD";
  if (q === "HD") return "⚡ HD";
  if (q === "SD") return "📼 SD";

  return "🎞 Qualität unbekannt";
}

// =============================
// SERIES NEXUS META
// =============================
function getSeriesNexusMeta(tmdb, media, extras = {}) {
  const title =
    String(tmdb.seriesTitle || "Serie").toUpperCase();

  return {
    header: "███ SERIES NEXUS ███",
    line1: `📺 ${title}`,
    line2: `EPISODE ENTRY • S${media.seasonText}E${media.episodeText}`
  };
}

// =============================
// SERIES CAPTION — EPISODE NEXUS
// =============================
async function seriesCaption(tmdb, media, extras = {}) {
  const finalEpisodeTitle =
    tmdb.episodeTitle ||
    media.episodeTitleFromFile ||
    "Episode";

  const seriesTitle =
    tmdb.seriesTitle ||
    media.seriesTitle ||
    "Unbekannte Serie";

  const seasonText =
    String(media.season).padStart(2, "0");

  const episodeText =
    String(media.episode).padStart(2, "0");

  const genreText = String(tmdb.genre || "Sonstige")
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" • ");

  const genreTags = String(tmdb.genre || "")
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((g) => `#${g.replace(/\s+/g, "")}`)
    .join(" ");

  const seriesTag =
  "#" + String(seriesTitle)
    .split(/\s+/)
    .filter(Boolean)
    .map(word =>
      word.charAt(0).toUpperCase() +
      word.slice(1).toLowerCase()
    )
    .join("")
    .replace(/[^a-zA-Z0-9ÄÖÜäöüß]/g, "");

  const overviewRaw = String(
    tmdb.overview || "Keine Beschreibung verfügbar."
  )
    .replace(/\s+/g, " ")
    .trim();

  let safeOverview = overviewRaw;

  if (safeOverview.length > 350) {
  safeOverview = safeOverview.slice(0, 260);

  const lastSentenceEnd = Math.max(
    safeOverview.lastIndexOf("."),
    safeOverview.lastIndexOf("!"),
    safeOverview.lastIndexOf("?")
  );

  if (lastSentenceEnd > 150) {
    safeOverview =
      safeOverview.slice(0, lastSentenceEnd + 1);
  } else {
    const lastSpace =
      safeOverview.lastIndexOf(" ");

    if (lastSpace > 150) {
      safeOverview =
        safeOverview.slice(0, lastSpace);
    }

    safeOverview += " …";
  }
}

  const quality =
    extras.quality ||
    "Unbekannt";

  const resolution =
    extras.resolution ||
    extras.videoResolution ||
    "Unbekannt";

  const fileSize =
    extras.fileSize ||
    "Unbekannt";

  const archiveEpisodeCode =
  media.isDoubleEpisode && media.episodeEnd
    ? `S${seasonText}E${String(media.episode).padStart(2, "0")}-E${String(media.episodeEnd).padStart(2, "0")}`
    : `S${seasonText}E${episodeText}`;

const archiveCode =
  `SER-${String(seriesTitle)
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 5)}-${archiveEpisodeCode}`;

const episodeDisplay =
  media.isDoubleEpisode && media.episodeEnd
    ? `S${seasonText}E${String(media.episode).padStart(2, "0")}+E${String(media.episodeEnd).padStart(2, "0")}`
    : `S${seasonText}E${episodeText}`;

  const { legend, rank } =
  getLegendStatusAndRank(tmdb.rating || "");

const caption =
  "███ LEGENDS SERIES DOSSIER ███\n\n" +

  "━━━━━━━━━━━━━━━━━━\n" +
  `<b>📺 ${escapeHtml(String(seriesTitle).toUpperCase())} • ${escapeHtml(episodeDisplay)}</b>\n` +
  "━━━━━━━━━━━━━━━━━━\n\n" +

  `🎬 ${escapeHtml(finalEpisodeTitle || "Unbekannter Episodentitel")}\n` +
`🎭 ${escapeHtml(genreText || "Sonstige")}\n` +
`⭐ IMDb • ${escapeHtml(tmdb.rating || "Unbekannt")}${String(tmdb.rating || "").includes("/10") ? "" : "/10"}\n\n` +

  `📀 ${quality} • ${resolution}\n` +
  `💾 ${fileSize}\n\n` +

  `<b>👑 ${legend} • 🏆 ${rank}</b>\n\n` +

  "━━━━━━━━━━━━━━━━━━\n" +
  "<b>📖 EPISODE DOSSIER</b>\n" +
  "━━━━━━━━━━━━━━━━━━\n\n" +

  `${escapeHtml(safeOverview)}\n\n` +

  "🛰 ARCHIV VERIFIZIERT ✅\n\n" +

  `${seriesTag} #S${seasonText} ${genreTags}\n` +
  "@LibraryOfLegends";

  return cleanTelegramText(caption).slice(0, 1024);
}

// =============================
// SERIES RANK
// =============================
function getSeriesRank(totalEpisodes, officialTotalEpisodes) {
  if (!officialTotalEpisodes || officialTotalEpisodes <= 0) {
    return "⚠️ INCOMPLETE";
  }

  const percent =
    Math.round((totalEpisodes / officialTotalEpisodes) * 100);

  if (percent >= 100) return "💎 FULL COLLECTION";
  if (percent >= 75) return "👑 MASTERED";
  if (percent >= 35) return "🔥 TRENDING";

  return "⚠️ INCOMPLETE";
}

// =============================
// SERIES PROGRESS BAR
// =============================
function buildSeriesProgressBar(seriesTitle, current, total) {
  const safeTotal =
    Math.max(total || 1, 1);

  const percent =
    Math.max(
      0,
      Math.min(1, current / safeTotal)
    );

  const totalBars = 10;

  const filledBars =
    Math.round(percent * totalBars);

  return (
    "■".repeat(filledBars) +
    "□".repeat(totalBars - filledBars)
  );
}

function formatSeasonGenres(genre = "") {
  const items = String(genre || "Sonstige")
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 4);

  const emojiMap = {
    Action: "⚔️",
    Abenteuer: "👑",
    Drama: "🩸",
    Fantasy: "🐉",
    Krimi: "🕵️",
    Thriller: "🔪",
    Horror: "👻",
    Komödie: "😂",
    Animation: "🎨",
    Familie: "👨‍👩‍👧",
    Mystery: "🧩",
    Romanze: "❤️",
    Sciencefiction: "🚀"
  };

  return items
    .map((g) => `${emojiMap[g] || "🎭"} #${g.replace(/\s+/g, "")}`)
    .join(" • ");
}

function formatCastLine(cast = "") {
  const people = String(cast || "")
    .split("•")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 5);

  if (!people.length) return "Unbekannt";

  return people
    .map((p) => `#${p.replace(/\s+/g, "")}`)
    .join(" ");
}

function formatEpisodeMatrixForCaption(lines = [], maxLines = 14) {
  if (!Array.isArray(lines) || !lines.length) {
    return "Keine Episoden gefunden.";
  }

  if (lines.length <= maxLines) {
    return lines.join("\n");
  }

  const visible = lines.slice(0, maxLines);
  const hiddenCount = lines.length - maxLines;

  return (
    visible.join("\n") +
    `\n… ${hiddenCount} weitere Episoden im Thread`
  );
}

async function seasonCaption(tmdb, seasonData, season) {
  const seasonKey = String(season).padStart(2, "0");

  const seriesTitle =
    tmdb.seriesTitle ||
    "Unbekannte Serie";

  const savedEpisodes =
    await getSavedSeasonEpisodeCount(
      seriesTitle,
      season
    );

  const totalEpisodes =
    seasonData?.episodes?.length ||
    savedEpisodes ||
    getKnownSeasonEpisodeCount(seriesTitle, season) ||
    0;

  const episodeLines = [];
  const missingEpisodes = [];
  let ratingSum = 0;
  let ratingCount = 0;

  for (let ep = 1; ep <= totalEpisodes; ep++) {
    const epData =
      seasonData?.episodes?.[ep - 1] || null;

    const exists =
      await getSavedEpisode(
        seriesTitle,
        season,
        ep
      );

    const title =
  exists?.episode_title ||
  epData?.name ||
  "Episode";

    const number =
      String(ep).padStart(2, "0");

    if (exists) {
      episodeLines.push(
        `${number} ▸ ${title}`
      );
    } else {
      episodeLines.push(
        `${number} ▸ FEHLT`
      );

      missingEpisodes.push(
        `S${seasonKey}E${number}`
      );
    }

    const vote =
      Number(epData?.vote_average || 0);

    if (vote > 0) {
      ratingSum += vote;
      ratingCount++;
    }
  }

  const averageRating =
    ratingCount > 0
      ? (ratingSum / ratingCount).toFixed(1)
      : extractRatingNumber(tmdb.rating).toFixed(1);

  const isComplete =
    missingEpisodes.length === 0 &&
    savedEpisodes >= totalEpisodes;

  const archiveCode =
    `SER-${String(seriesTitle)
      .replace(/[^a-z0-9]/gi, "")
      .toUpperCase()
      .slice(0, 5)}-S${seasonKey}`;

  const seriesTag =
    `#${String(seriesTitle)
      .replace(/[^a-zA-Z0-9ÄÖÜäöüß]/g, "")}`;

  let resultText =
    "███ SEASON ARCHIVE ███\n\n" +

    `📺 ${String(seriesTitle).toUpperCase()}\n` +
    `📀 STAFFEL ${seasonKey}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "📊 EPISODE MATRIX\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    formatEpisodeMatrixForCaption(episodeLines) +
    "\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "📈 SEASON STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    `🎞 Episoden • ${savedEpisodes}/${totalEpisodes}\n` +
    `⭐ Durchschnitt • ${averageRating}\n\n`;

  if (isComplete) {
    resultText +=
      "🏆 COMPLETE\n" +
      "📡 ARCHIVE VERIFIED\n\n";
  } else {
    resultText +=
      "⚠️ FEHLENDE EPISODEN\n\n" +
missingEpisodes.join("\n") +
"\n\n" +
"📡 ARCHIVE INCOMPLETE\n\n";
  }

  resultText +=
    "━━━━━━━━━━━━━━━━━━\n" +
    `🧬 ${archiveCode}\n\n` +
    `${seriesTag}\n` +
    "@LibraryOfLegends";

  return cleanTelegramText(resultText).slice(0, 1024);
}

// =============================
// SERIES HUB LAYOUT
// =============================
const seriesThemes = {
  "The Boys": {
    icon: "🩸",
    archive: "VOUGHT INTERNATIONAL ARCHIVE",
    subline: "COMPOUND-V • SUPES CLASSIFIED",
    status: "🔴 VOUGHT SURVEILLANCE ACTIVE",
    divider: "━━━━━━━━━━━━━━━━━━"
  },

  "Stranger Things": {
    icon: "📼",
    archive: "HAWKINS LAB ARCHIVE",
    subline: "UPSIDE DOWN INCIDENT FILE",
    status: "🔴 GATE ACTIVITY DETECTED",
    divider: "━━━━━━━━━━━━━━━━━━"
  },

  "Game of Thrones": {
    icon: "🐉",
    archive: "WESTEROS CHRONICLE",
    subline: "IRON THRONE • HOUSE ARCHIVE",
    status: "👑 REALM STATUS: UNSTABLE",
    divider: "━━━━━━━━━━━━━━━━━━"
  },

  "Breaking Bad": {
    icon: "🧪",
    archive: "ALBUQUERQUE CASE FILE",
    subline: "HEISENBERG • BLUE METH ARCHIVE",
    status: "🟢 COOK STATUS: ACTIVE",
    divider: "━━━━━━━━━━━━━━━━━━"
  },

  "Dark": {
    icon: "🕳",
    archive: "WINDEN TIME ARCHIVE",
    subline: "TIME PARADOX • SIC MUNDUS",
    status: "🟡 TIMELINE INSTABILITY DETECTED",
    divider: "━━━━━━━━━━━━━━━━━━"
  },

  "The Walking Dead": {
    icon: "🧟",
    archive: "SURVIVOR DATABASE",
    subline: "OUTBREAK • WALKER THREAT",
    status: "🔴 HUMANITY COLLAPSED",
    divider: "━━━━━━━━━━━━━━━━━━"
  },

  "Peaky Blinders": {
    icon: "🧢",
    archive: "BIRMINGHAM GANG FILE",
    subline: "SHELBY COMPANY LIMITED",
    status: "⚫ RAZOR GANG ACTIVE",
    divider: "━━━━━━━━━━━━━━━━━━"
  },

  "The Last of Us": {
    icon: "🍄",
    archive: "CORDYCEPS OUTBREAK ARCHIVE",
    subline: "FIREFLIES • INFECTED ZONES",
    status: "🔴 PANDEMIC STATUS ACTIVE",
    divider: "━━━━━━━━━━━━━━━━━━"
  },

  "House of the Dragon": {
    icon: "🐉",
    archive: "TARGARYEN CHRONICLE",
    subline: "DANCE OF DRAGONS",
    status: "🔥 CIVIL WAR ACTIVE",
    divider: "━━━━━━━━━━━━━━━━━━"
  },

  "Robin Hood": {
    icon: "🏹",
    archive: "SHERWOOD FOREST ARCHIVE",
    subline: "OUTLAW RESISTANCE FILE",
    status: "🟢 NOTTINGHAM UNDER WATCH",
    divider: "━━━━━━━━━━━━━━━━━━"
  }
};

const seriesBanners = {
  "The Boys":
    "https://image.tmdb.org/t/p/original/mGVrXeIjyecj6TKmwPVpHlscEmw.jpg",

  "Stranger Things":
    "https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",

  "Game of Thrones":
    "https://image.tmdb.org/t/p/original/suopoADq0k8YZr4dQXcU6pToj6s.jpg",

  "Breaking Bad":
    "https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",

  "Dark":
    "https://image.tmdb.org/t/p/original/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg",

  "The Walking Dead":
    "https://image.tmdb.org/t/p/original/xf9wuDcqlUPWABZNeDKPbZUjWx0.jpg"
};

const genreBanners = {
  Action: null,
  Abenteuer: null,
  Komödie: null,
  Drama: null,
  Familie: null,
  Fantasy: null,
  Krimi: null,
  Horror: null,
  Thriller: null,
  Mystery: null,
  "Science Fiction": null,
  Kriegsfilme: null,
  Dokumentarfilme: null,
  Historie: null,
  Liebesfilme: null
};

const genreThemes = {

  Action: {
    icon: "💥",
    archive: "TACTICAL ACTION ARCHIVE",
    subline: "HIGH RISK • ELITE OPERATIONS",
    status: "🔥 ACTION STATUS ACTIVE"
  },

  Horror: {
    icon: "👻",
    archive: "HORROR VAULT",
    subline: "CLASSIFIED NIGHTMARE FILES",
    status: "🔴 ENTITY DETECTED"
  },

  Thriller: {
    icon: "🔪",
    archive: "SUSPENSE ARCHIVE",
    subline: "PSYCHOLOGICAL CASE FILES",
    status: "⚠️ THREAT LEVEL CRITICAL"
  },

  Fantasy: {
    icon: "🐉",
    archive: "FANTASY REALM ARCHIVE",
    subline: "MAGIC • KINGDOMS • LEGENDS",
    status: "✨ REALM PORTAL ACTIVE"
  },

  Abenteuer: {
    icon: "🗺️",
    archive: "ADVENTURE EXPEDITION ARCHIVE",
    subline: "LOST WORLDS • TREASURE FILES",
    status: "🧭 EXPLORATION ACTIVE"
  },

  Drama: {
    icon: "🎭",
    archive: "DRAMA CINEMA ARCHIVE",
    subline: "EMOTIONAL STORY DATABASE",
    status: "🎬 CINEMATIC STATUS ACTIVE"
  },

  Komödie: {
    icon: "😂",
    archive: "COMEDY CENTRAL ARCHIVE",
    subline: "LAUGHTER • CHAOS • CULT CLASSICS",
    status: "🤣 HUMOR LEVEL MAXIMUM"
  },

  Krimi: {
    icon: "🕵️",
    archive: "CRIME INVESTIGATION ARCHIVE",
    subline: "DETECTIVE • UNDERCOVER FILES",
    status: "🚨 INVESTIGATION ACTIVE"
  }

};

async function createSeriesHubBanner(tmdb) {

  const banner =
    seriesBanners[tmdb.seriesTitle] ||
    tmdb.backdropUrl ||
    tmdb.posterUrl;

  if (!banner) return null;

  const theme =
    seriesThemes[tmdb.seriesTitle] || {
      icon: "📺",
      archive: "SERIES ARCHIVE",
      subline: "PREMIUM EPISODE DATABASE",
      status: "🎞 SERIES HUB ACTIVE",
      divider: "━━━━━━━━━━━━━━━━━━"
    };

  const caption =
    `${theme.divider}\n` +
    `${theme.icon} ${String(tmdb.seriesTitle || "").toUpperCase()}\n` +
    `${theme.divider}\n\n` +

    `📁 ${theme.archive}\n` +
    `${theme.subline}\n` +
    `${theme.status}\n\n` +

    `${theme.divider}\n` +
    "@LibraryOfLegends";

  return {
    photo: banner,
    caption
  };
}

// =============================
// SERIES HUB HELPERS
// =============================
async function getSeriesEpisodes(seriesTitle) {
  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT season, episode, episode_title
      FROM series
      WHERE series_title = $1
      ORDER BY season ASC, episode ASC
      `,
      [seriesTitle]
    );

    return result.rows;
  }

  return db.prepare(`
    SELECT season, episode, episode_title
    FROM series
    WHERE series_title = ?
    ORDER BY season ASC, episode ASC
  `).all(seriesTitle);
}

async function getSeriesHubTopic(topicId) {
  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT *
      FROM topics
      WHERE topic_id = $1
      LIMIT 1
      `,
      [topicId]
    );

    return result.rows[0] || null;
  }

  return db.prepare(`
    SELECT *
    FROM topics
    WHERE topic_id = ?
    LIMIT 1
  `).get(topicId);
}

async function saveHubMessageId(topicId, messageId) {
  if (pgPool) {
    return await pgPool.query(
      `
      UPDATE topics
      SET hub_message_id = $1
      WHERE topic_id = $2
      `,
      [messageId, topicId]
    );
  }

  return db.prepare(`
    UPDATE topics
    SET hub_message_id = ?
    WHERE topic_id = ?
  `).run(messageId, topicId);
}

// =============================
// SERIES PROGRESS
// =============================
function buildSeriesProgressBar(seriesTitle, current, total) {
  const safeTotal = total > 0 ? total : 1;
  const percent = Math.max(0, Math.min(1, current / safeTotal));
  const size = 10;
  const filled = Math.round(percent * size);

  return "■".repeat(filled) + "□".repeat(size - filled);
}

function getSeriesRank(current, total) {
  if (!total || total <= 0) return "📼 ARCHIVED";

  const percent = Math.round((current / total) * 100);

  if (percent >= 100) return "👑 MASTERED";
  if (percent >= 90) return "💎 FULL COLLECTION";
  if (percent >= 60) return "🔥 TRENDING";
  if (percent >= 30) return "📀 GROWING ARCHIVE";

  return "⚠️ INCOMPLETE";
}

function getKnownSeasonEpisodeCount(seriesTitle, seasonNumber) {
  const knownCounts = {
    "Das A-Team": { 1: 14, 2: 23, 3: 25, 4: 23, 5: 13 },

    "Tulsa King": { 1: 9, 2: 10, 3: 10 },

    "Es - Welcome to Derry": { 1: 8 },

    "Star Wars: The Clone Wars": {
      1: 22, 2: 22, 3: 22, 4: 22, 5: 20, 6: 13, 7: 12
    },

    "Star Wars Galaxy of Adventures": {
      1: 36, 2: 18
    },

    "The Boys": { 1: 8, 2: 8, 3: 8, 4: 8, 5: 7 },
    "Die Ewoks": { 1: 13, 2: 22 },
    "The Mandalorian": { 1: 8, 2: 8, 3: 8 },
    "Andor": { 1: 12, 2: 12 },
    "Ahsoka": { 1: 8 },
    "Loki": { 1: 6, 2: 6 },
    "WandaVision": { 1: 9 },
    "Moon Knight": { 1: 6 },
    "The Falcon and the Winter Soldier": { 1: 6 },
    "Obi-Wan Kenobi": { 1: 6 },
    "The Book of Boba Fett": { 1: 7 }
  };

  return knownCounts[seriesTitle]?.[Number(seasonNumber)] || null;
}

function getKnownSeasonCount(seriesTitle) {
  const knownSeasonCounts = {
    "Das A-Team": 5,
    "Tulsa King": 3,
    "Es - Welcome to Derry": 1,
    "Star Wars: The Clone Wars": 7,
    "Star Wars Galaxy of Adventures": 2,

    "The Boys": 5,
    "Die Ewoks": 2,
    "The Mandalorian": 3,
    "Andor": 2,
    "Ahsoka": 1,
    "Loki": 2,
    "WandaVision": 1,
    "Moon Knight": 1,
    "The Falcon and the Winter Soldier": 1,
    "Obi-Wan Kenobi": 1,
    "The Book of Boba Fett": 1
  };

  return knownSeasonCounts[seriesTitle] || null;
}

// =============================
// SERIES HUB CAPTION
// =============================
async function seriesHubCaption(tmdb) {
  const episodes =
    await getSeriesEpisodes(tmdb.seriesTitle);

  const seasons = {};

  for (const ep of episodes) {
    const season = Number(ep.season || 0);
    if (!seasons[season]) seasons[season] = [];
    seasons[season].push(ep);
  }

  const savedEpisodes =
    episodes.length;

  const savedSeasonCount =
    Object.keys(seasons).length;

  const officialSeasonCount =
    getKnownSeasonCount(tmdb.seriesTitle) ||
    savedSeasonCount ||
    1;

  let officialTotalEpisodes = 0;

  for (let s = 1; s <= officialSeasonCount; s++) {
    officialTotalEpisodes +=
      getKnownSeasonEpisodeCount(tmdb.seriesTitle, s) ||
      seasons[s]?.length ||
      0;
  }

  if (!officialTotalEpisodes) {
    officialTotalEpisodes = savedEpisodes;
  }

  const percent =
    officialTotalEpisodes > 0
      ? Math.round((savedEpisodes / officialTotalEpisodes) * 100)
      : 0;

  const progressBar =
    buildSeriesProgressBar(
      tmdb.seriesTitle,
      savedEpisodes,
      officialTotalEpisodes
    );

  const status =
    savedEpisodes >= officialTotalEpisodes && officialTotalEpisodes > 0
      ? "🏆 SERIES COMPLETE"
      : "⚠️ SERIES INCOMPLETE";

  const rank =
    getSeriesRank(savedEpisodes, officialTotalEpisodes);

  let timeline = "";

  for (let season = 1; season <= officialSeasonCount; season++) {
    const saved =
      seasons[season]?.length || 0;

    const total =
      getKnownSeasonEpisodeCount(tmdb.seriesTitle, season) ||
      saved;

    const bar =
      buildSeriesProgressBar(
        tmdb.seriesTitle,
        saved,
        total
      );

    const complete =
      saved >= total && total > 0;

    timeline +=
      `📀 SEASON ${String(season).padStart(2, "0")} • ` +
      `${bar} ${saved}/${total} ` +
      `${complete ? "✅" : "⚠️"}\n`;
  }

  let seasonIndex = "";

  if (!episodes.length) {
    seasonIndex =
      "Noch keine Episoden gespeichert.\n";
  } else {
    for (const season of Object.keys(seasons).map(Number).sort((a, b) => a - b)) {
      const seasonEpisodes = seasons[season];
      const total =
        getKnownSeasonEpisodeCount(tmdb.seriesTitle, season) ||
        seasonEpisodes.length;

      const savedNumbers =
        seasonEpisodes.map((ep) => Number(ep.episode));

      const missing = [];

      for (let ep = 1; ep <= total; ep++) {
        if (!savedNumbers.includes(ep)) {
          missing.push(`E${String(ep).padStart(2, "0")}`);
        }
      }

      seasonIndex +=
        `📀 SEASON ${String(season).padStart(2, "0")} • ` +
        `${seasonEpisodes.length}/${total}\n`;

      seasonIndex += missing.length
        ? `⚠️ Missing • ${missing.join(", ")}\n`
        : "✅ Season Complete\n";

      seasonEpisodes.forEach((ep, index) => {
        const prefix =
          index === seasonEpisodes.length - 1 ? "┗" : "┠";

        const code =
          `S${String(ep.season).padStart(2, "0")}E${String(ep.episode).padStart(2, "0")}`;

        seasonIndex +=
          `${prefix} ${code}` +
          (ep.episode_title ? ` • ${ep.episode_title}` : "") +
          "\n";
      });

      seasonIndex += "\n";
    }
  }

  const genreLine =
    formatSeasonGenres(tmdb.genre);

  return (
    "███ SERIES NEXUS HUB ███\n\n" +

    `📺 ${String(tmdb.seriesTitle || "").toUpperCase()}\n` +
    "SERIES ARCHIVE CORE\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    `⭐ RATING • ${tmdb.seriesRating || tmdb.rating || "Unbekannt"} IMDb\n` +
    `📀 SEASONS • ${savedSeasonCount}/${officialSeasonCount}\n` +
    `🎞 EPISODES • ${savedEpisodes}/${officialTotalEpisodes}\n` +
    `📊 ARCHIVE • ${progressBar} ${percent}%\n` +
    `${status}\n` +
    `🏅 SERIES RANK • ${rank}\n` +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "🛰 TIMELINE\n" +
    `${timeline || "Noch keine Timeline verfügbar.\n"}\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🧭 SEASON INDEX\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `${seasonIndex}` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🎭 GENRE\n" +
    `${genreLine}\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends"
  ).slice(0, 4000);
}

// =============================
// FULL EPISODE LIST
// =============================
async function fullEpisodeListCaption(seriesTitle) {
  const episodes =
    await getSeriesEpisodes(seriesTitle);

  if (!episodes.length) {
    return "Keine Episoden gespeichert.";
  }

  const grouped = {};

  for (const ep of episodes) {
    const season = Number(ep.season || 0);
    if (!grouped[season]) grouped[season] = [];
    grouped[season].push(ep);
  }

  let result =
    "███ EPISODE INDEX ███\n\n" +
    `📺 ${String(seriesTitle || "").toUpperCase()}\n\n`;

  for (const season of Object.keys(grouped).map(Number).sort((a, b) => a - b)) {
    result +=
      "━━━━━━━━━━━━━━━━━━\n" +
      `📀 SEASON ${String(season).padStart(2, "0")}\n` +
      "━━━━━━━━━━━━━━━━━━\n";

    grouped[season].forEach((ep, index) => {
      const prefix =
        index === grouped[season].length - 1 ? "┗" : "┠";

      result +=
        `${prefix} S${String(ep.season).padStart(2, "0")}E${String(ep.episode).padStart(2, "0")}` +
        (ep.episode_title ? ` • ${ep.episode_title}` : "") +
        "\n";
    });

    result += "\n";
  }

  result +=
    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return result.slice(0, 4000);
}

// =============================
// CREATE OR UPDATE EPISODE LIST
// =============================
async function createOrUpdateEpisodeList({ topicId, seriesTitle }) {
  if (!topicId || !seriesTitle) return null;

  const topic =
    await getSeriesHubTopic(topicId);

  if (!topic) return null;

  const text =
    await fullEpisodeListCaption(seriesTitle);

  if (topic.episode_list_message_id) {
    const edited = await tg("editMessageText", {
      chat_id: SERIES_GROUP_ID,
      message_id: Number(topic.episode_list_message_id),
      text
    });

    if (!edited?.__error) {
      console.log("✅ Episodenliste aktualisiert:", seriesTitle);
      return edited;
    }

    const editError =
      edited?.error?.description ||
      edited?.description ||
      "";

    if (editError.includes("message is not modified")) {
      console.log("ℹ️ Episodenliste unverändert:", seriesTitle);
      return topic.episode_list_message_id;
    }

    if (editError.includes("message to edit not found")) {
      console.log("⚠️ Episodenliste fehlt, lösche alte ID:", seriesTitle);

      if (pgPool) {
        await pgPool.query(
          `
          UPDATE topics
          SET episode_list_message_id = NULL
          WHERE topic_id = $1
          `,
          [topicId]
        );
      } else {
        db.prepare(`
          UPDATE topics
          SET episode_list_message_id = NULL
          WHERE topic_id = ?
        `).run(topicId);
      }
    } else {
      console.log(
        "⚠️ Episodenliste Edit Fehler:",
        seriesTitle,
        editError || edited
      );
    }
  }

  const msg = await tg("sendMessage", {
    chat_id: SERIES_GROUP_ID,
    message_thread_id: Number(topicId),
    text
  });

  if (msg?.message_id) {
    if (pgPool) {
      await pgPool.query(
        `
        UPDATE topics
        SET episode_list_message_id = $1
        WHERE topic_id = $2
        `,
        [msg.message_id, topicId]
      );
    } else {
      db.prepare(`
        UPDATE topics
        SET episode_list_message_id = ?
        WHERE topic_id = ?
      `).run(
        msg.message_id,
        topicId
      );
    }

    console.log("✅ Episodenliste erstellt:", seriesTitle);
  }

  return msg;
}

// =============================
// CREATE SERIES HUB IF MISSING
// =============================
async function createSeriesHubIfMissing({ tmdb, topicId }) {
  const topic =
    await getSeriesHubTopic(topicId);

  if (topic?.hub_message_id) {
    return topic.hub_message_id;
  }

  const bannerData =
    await createSeriesHubBanner(tmdb);

  if (bannerData) {
    await tg("sendPhoto", {
      chat_id: SERIES_GROUP_ID,
      message_thread_id: topicId,
      photo: bannerData.photo,
      caption: bannerData.caption
    });
  }

  const hub = await tg("sendMessage", {
  chat_id: SERIES_GROUP_ID,
  message_thread_id: topicId,
  text: await seriesHubCaption(tmdb),
  parse_mode: "HTML"
});

  if (hub?.message_id) {
    await saveHubMessageId(topicId, hub.message_id);
    return hub.message_id;
  }

  return null;
}

// =============================
// UPDATE SERIES HUB
// =============================
async function updateSeriesHub({ tmdb, topicId }) {
  const topic =
    await getSeriesHubTopic(topicId);

  if (!topic?.hub_message_id) {
    return null;
  }

  const text =
    await seriesHubCaption(tmdb);

  const edited = await tg("editMessageText", {
    chat_id: SERIES_GROUP_ID,
    message_id: Number(topic.hub_message_id),
    text
  });

  if (!edited?.__error) {
    console.log(
      "✅ Series Hub aktualisiert:",
      tmdb.seriesTitle
    );

    return edited;
  }

  const editError =
    edited?.error?.description ||
    edited?.description ||
    "";

  if (
    editError.includes(
      "message is not modified"
    )
  ) {
    console.log(
      "ℹ️ Series Hub unverändert:",
      tmdb.seriesTitle
    );

    return topic.hub_message_id;
  }

  if (
    editError.includes(
      "message to edit not found"
    )
  ) {

    console.log(
      "⚠️ Series Hub fehlt, lösche alte ID:",
      tmdb.seriesTitle
    );

    if (pgPool) {
      await pgPool.query(
        `
        UPDATE topics
        SET hub_message_id = NULL
        WHERE topic_id = $1
        `,
        [topicId]
      );
    } else {
      db.prepare(`
        UPDATE topics
        SET hub_message_id = NULL
        WHERE topic_id = ?
      `).run(topicId);
    }

    return null;
  }

  console.log(
    "⚠️ Series Hub Edit Fehler:",
    tmdb.seriesTitle,
    editError || edited
  );

  return null;
}

// =============================
// SERIES SEASON CARDS
// =============================
async function createSeasonCardIfMissing({ tmdb, topicId, season }) {
  const separators = await getSeasonSeparators(topicId);

  const seasonKey = String(season).padStart(2, "0");

  if (separators[`card_${seasonKey}`]) {
    return separators[`card_${seasonKey}`];
  }

  console.log(
    "🎴 CREATE SEASON CARD:",
    tmdb.seriesTitle,
    "S" + seasonKey
  );

  let seasonData =
  await getSeasonTMDB(
    tmdb.tmdbId,
    season
  );

console.log(
  "🧪 SEASON DATA DEBUG:",
  JSON.stringify(
    seasonData?.episodes?.slice(0, 3),
    null,
    2
  )
);

  if (!seasonData) {
    seasonData = {
      air_date: "",
      overview:
        tmdb.overview ||
        "Keine Beschreibung verfügbar.",
      episodes: Array.from({
        length:
          getKnownSeasonEpisodeCount(
            tmdb.seriesTitle,
            season
          ) || 0
      }),
      poster_path: null
    };
  }

  const caption =
    (
      await seasonCaption(
        tmdb,
        seasonData,
        season
      )
    ).slice(0, 1024);

  const seasonPoster =
    seasonData?.poster_path
      ? posterUrl(seasonData.poster_path)
      : null;

  const fallbackPoster =
    tmdb.seriesPosterUrl ||
    tmdb.posterUrl ||
    tmdb.backdropUrl ||
    null;

  const sourcePoster =
    seasonPoster ||
    fallbackPoster;

  let brandedSeasonPoster = null;

  let card = null;

  if (brandedSeasonPoster) {
    card = await tg("sendPhoto", {
      chat_id: SERIES_GROUP_ID,
      message_thread_id: Number(topicId),
      photo: brandedSeasonPoster,
      caption
    });
  }

  if (!card?.message_id && sourcePoster) {
    console.log(
      "⚠️ Branded Cover fehlgeschlagen — versuche Originalposter"
    );

    card = await tg("sendPhoto", {
      chat_id: SERIES_GROUP_ID,
      message_thread_id: Number(topicId),
      photo: sourcePoster,
      caption
    });
  }

  if (!card?.message_id) {
    console.log(
      "⚠️ Kein gültiges Poster — erstelle Text-Staffelkarte"
    );

    card = await tg("sendMessage", {
      chat_id: SERIES_GROUP_ID,
      message_thread_id: Number(topicId),
      text: caption
    });
  }

  if (card?.message_id) {
    separators[`card_${seasonKey}`] =
      card.message_id;

    await saveSeasonSeparators(
      topicId,
      separators
    );

    console.log(
      "✅ Staffelkarte erstellt:",
      tmdb.seriesTitle,
      "S" + seasonKey
    );

    return card.message_id;
  }

  return null;
}

async function updateSeasonCard({ tmdb, topicId, season }) {
  const separators =
    await getSeasonSeparators(topicId);

  const seasonKey =
    String(season).padStart(2, "0");

  const messageId =
    separators[`card_${seasonKey}`];

  if (!messageId) {
    console.log("ℹ️ Keine Staffelkarte vorhanden:", tmdb.seriesTitle, seasonKey);
    return null;
  }

  let seasonData =
    await getSeasonTMDB(tmdb.tmdbId, season);

  if (!seasonData) {
    seasonData = {
      air_date: "",
      overview:
        tmdb.overview ||
        "Keine Beschreibung verfügbar.",
      episodes: Array.from({
        length:
          getKnownSeasonEpisodeCount(
            tmdb.seriesTitle,
            season
          ) || 0
      }),
      poster_path: null
    };
  }

  const caption =
    (
      await seasonCaption(
        tmdb,
        seasonData,
        season
      )
    ).slice(0, 1024);

  const edited = await tg("editMessageCaption", {
    chat_id: SERIES_GROUP_ID,
    message_id: Number(messageId),
    caption
  });

  if (!edited?.__error) {
    console.log("✅ Staffelkarte aktualisiert:", tmdb.seriesTitle, seasonKey);
    return edited;
  }

  const editError =
    edited?.error?.description ||
    edited?.description ||
    "";

  if (editError.includes("message is not modified")) {
    console.log("ℹ️ Staffelkarte unverändert:", tmdb.seriesTitle, seasonKey);
    return messageId;
  }

  if (editError.includes("message to edit not found")) {
    console.log("⚠️ Staffelkarte fehlt, lösche alte ID:", tmdb.seriesTitle, seasonKey);

    delete separators[`card_${seasonKey}`];

    await saveSeasonSeparators(
      topicId,
      separators
    );

    return null;
  }

  console.log(
    "⚠️ Staffelkarte Edit Fehler:",
    tmdb.seriesTitle,
    seasonKey,
    editError || edited
  );

  return null;
}

async function getSeasonSeparators(topicId) {
  let topic = null;

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT season_separators
      FROM topics
      WHERE topic_id = $1
      LIMIT 1
      `,
      [topicId]
    );

    topic = result.rows[0] || null;
  } else {
    topic = db.prepare(`
      SELECT season_separators
      FROM topics
      WHERE topic_id = ?
      LIMIT 1
    `).get(topicId);
  }

  try {
    return JSON.parse(
      topic?.season_separators || "{}"
    );
  } catch {
    return {};
  }
}

async function saveSeasonSeparators(topicId, separators) {
  const value =
    JSON.stringify(separators || {});

  if (pgPool) {
    return await pgPool.query(
      `
      UPDATE topics
      SET season_separators = $1
      WHERE topic_id = $2
      `,
      [value, topicId]
    );
  }

  return db.prepare(`
    UPDATE topics
    SET season_separators = ?
    WHERE topic_id = ?
  `).run(value, topicId);
}

// =============================
// COPY MEDIA TO TARGET GROUP
// =============================
async function copyOriginalMedia({
  fromChatId,
  messageId,
  targetChatId,
  topicId,
  caption = "",
fileId = "",
isVideo = false,
adminChatId = "",
replyMarkup = null
}) {
  const safeCaption = String(caption || "").slice(0, 1024);

  const baseData = {
    chat_id: targetChatId,
    from_chat_id: fromChatId,
    message_id: messageId,
    message_thread_id: topicId
  };

  if (safeCaption) {
  baseData.caption = safeCaption;
  baseData.parse_mode = "HTML";
}
  
  if (replyMarkup) {
  baseData.reply_markup = replyMarkup;
}

  let result = await tg("copyMessage", baseData);

  if (result?.message_id) {
    console.log("COPY OK:", result.message_id);
    return result;
  }

  console.log("⚠️ copyMessage fehlgeschlagen:", JSON.stringify(result, null, 2));

  if (fileId) {
    const sendMethod = isVideo ? "sendVideo" : "sendDocument";
    const mediaField = isVideo ? "video" : "document";

    result = await tg(sendMethod, {
  chat_id: targetChatId,
  message_thread_id: topicId,
  [mediaField]: fileId,
  caption: safeCaption,
  parse_mode: "HTML",
  ...(replyMarkup ? { reply_markup: replyMarkup } : {})
});

    if (result?.message_id) {
      console.log("FILE_ID SEND OK:", result.message_id);
      return result;
    }

    console.log("⚠️ file_id Fallback fehlgeschlagen:", JSON.stringify(result, null, 2));
  }

  if (adminChatId) {
    await tg("sendMessage", {
      chat_id: adminChatId,
      text:
        "❌ Datei konnte nicht kopiert/gesendet werden.\n\n" +
        `Methode: ${result?.method || "unbekannt"}\n` +
        `Fehler: ${JSON.stringify(result?.error || result || "unbekannt").slice(0, 1000)}`
    });
  }

  return result;
}

// =============================
// TELEGRAM SAFE REQUEST
// =============================
async function telegramRequest(
  method,
  payload = {},
  retry = true
) {
  try {
    const response = await axios.post(
      `${BASE_URL}/${method}`,
      payload
    );

    return response.data.result;
  } catch (err) {
    const errorData =
      err.response?.data || err.message;

    const description =
      errorData?.description || "";

    // =============================
    // IGNORE: MESSAGE NOT MODIFIED
    // =============================
    if (description.includes("message is not modified")) {
      return {
        __error: true,
        method,
        error: errorData,
        description
      };
    }

    // =============================
    // RATE LIMIT AUTO RETRY
    // =============================
    if (
      retry &&
      errorData?.error_code === 429
    ) {
      const retryAfter =
        errorData.parameters?.retry_after || 5;

      console.log(
        `⏳ Telegram Rate Limit erkannt → warte ${retryAfter}s`
      );

      await new Promise((resolve) =>
        setTimeout(
          resolve,
          (retryAfter + 1) * 1000
        )
      );

      return telegramRequest(
        method,
        payload,
        false
      );
    }

    // =============================
    // REAL TELEGRAM ERROR
    // =============================
    console.error(`❌ Telegram API Fehler (${method}):`);
    console.error(
      typeof errorData === "string"
        ? errorData
        : JSON.stringify(errorData, null, 2)
    );

    return {
      __error: true,
      method,
      error: errorData,
      description
    };
  }
}

// =============================
// TELEGRAM WRAPPER
// =============================
async function tg(method, payload = {}) {
  return await telegramRequest(
    method,
    payload
  );
}

async function sendLocalPhoto({
  chatId,
  topicId,
  photoPath,
  caption
}) {
  try {
    const FormData = require("form-data");

    const form = new FormData();

    form.append("chat_id", chatId);

    if (topicId) {
      form.append("message_thread_id", topicId);
    }

    form.append(
      "photo",
      fs.createReadStream(photoPath)
    );

    if (caption) {
      form.append("caption", caption);
    }

    for (let attempt = 1; attempt <= 3; attempt++) {

  try {

    const res = await axios.post(
      `${BASE_URL}/sendPhoto`,
      form,
      {
        headers: form.getHeaders()
      }
    );

    return res.data.result;

  } catch (err) {

    console.error(
      `❌ Local Banner Upload Fehler Versuch ${attempt}:`,
      err.response?.data || err.message
    );

    if (attempt >= 3) {
      return null;
    }

    await sleep(2000 * attempt);
  }
}
  } catch (err) {
    console.error(
      "❌ Local Banner Upload Fehler:",
      err.response?.data || err.message
    );

    return null;
  }
}

// =============================
// TELEGRAM TOPICS
// =============================
async function createOrGetTopic({ chatId, name, type }) {
  const uniqueKey = makeKey(`${type}-${chatId}-${name}`);

  let existingTopic = null;

  if (pgPool) {
    const existing = await pgPool.query(
      `
      SELECT *
      FROM topics
      WHERE unique_key = $1
      LIMIT 1
      `,
      [uniqueKey]
    );

    existingTopic = existing.rows[0] || null;
  } else {
    existingTopic = getTopic(uniqueKey) || null;
  }

  if (existingTopic?.topic_id) {
    return Number(existingTopic.topic_id);
  }

  const topic = await tg("createForumTopic", {
    chat_id: chatId,
    name
  });

  if (!topic?.message_thread_id) {
    console.error("❌ Thema konnte nicht erstellt werden:", name);
    console.error("Telegram Antwort:", JSON.stringify(topic, null, 2));
    return null;
  }

  if (pgPool) {
    await pgPool.query(
      `
      INSERT INTO topics
      (name, type, chat_id, topic_id, unique_key)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (unique_key)
      DO UPDATE SET
        topic_id = EXCLUDED.topic_id,
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        chat_id = EXCLUDED.chat_id
      `,
      [
        name,
        type,
        String(chatId),
        topic.message_thread_id,
        uniqueKey
      ]
    );
  } else {
    saveTopic({
      name,
      type,
      chatId,
      topicId: topic.message_thread_id,
      uniqueKey
    });
  }

  console.log("✅ Thema erstellt:", name, topic.message_thread_id);

  return topic.message_thread_id;
}

async function ensureCommandCenters() {

  const movieCenters = [
  "🎛 Movie Command Center",

  "🔥 Neuerscheinungen",

  "🌌 Star Wars Universe",
  "🏰 Disney Universe",
  "🧬 Marvel Universe",
  "🦇 DC Universe",

  "🎞 Filmreihen",

  "🎬 Klassische Filme",
  "📼 Filme der 80er",
  "📀 Filme der 90er",
  "🎥 Filme der 2000er",
  "🚀 Neuere Filme",

  "🌍 Internationale Filme",
  "📚 Dokumentationen",
  "🎨 Animation",
  "🍿 Familienfilme",
  "🧸 Kinderfilme",
  "⛩ Anime"
];

  const seriesCenters = [
  "🎛 SERIES COMMAND CENTER",

  "📺 SERIES LIBRARY",
  "🔥 TRENDING",
  "🧩 INCOMPLETE",
  "🏆 MASTERED",

  "🚨 NEWS CENTER",
  "📅 COMING SOON",
  "🎬 PRODUKTIONSSTATUS",
  "🆕 NEUE STAFFELN",

  "🎭 MINI SERIES",
  "👶 KIDS SERIES",
  "🌸 ANIME HUB",
  "🌍 DOCUMENTARY SERIES",

  "⭐ STAR WARS SERIES",
  "🧬 MARVEL SERIES",
  "🦇 DC SERIES",
  "🏰 DISNEY SERIES",

  "🌌 UNIVERSES"
];

  for (const name of movieCenters) {

    await createOrGetTopic({
      chatId: MOVIE_GROUP_ID,
      name,
      type: "system_hub"
    });

    await sleep(300);
  }

  // await ensureStarWarsEraTopics();

  /*
  for (const bucket of movieTopicBuckets) {

    await createOrGetTopic({
      chatId: MOVIE_GROUP_ID,
      name: bucket.name,
      type: bucket.type
    });

    await sleep(1200);
  }
  */

  for (const name of seriesCenters) {

    await createOrGetTopic({
      chatId: SERIES_GROUP_ID,
      name,
      type: "system_hub"
    });

    await sleep(1500);
  }

  await createOrUpdateCommandCenter({
  chatId: MOVIE_GROUP_ID,
  topicName: "🎛 Movie Command Center",
  caption: await movieCommandCenterCaption()
});

// Alte technische Hubs deaktiviert, damit keine Extra-Topics entstehen
// await createOrUpdateMovieIndexHub();
// await createOrUpdateCollectionsIndexHub();
// await createOrUpdateUniversesIndexHub();
// await createOrUpdatePremiumQualityHub();
// await createOrUpdateEliteArchiveHub();
// await createOrUpdateHallOfFameHub();
// await createOrUpdateNewReleasesHub();
// await createOrUpdateMovieLibraryHub();

await createOrUpdateCommandCenter({
  chatId: SERIES_GROUP_ID,
  topicName: "🎛 SERIES COMMAND CENTER",
  caption: await seriesCommandCenterCaption()
});

await createOrUpdateCommandCenter({
  chatId: SERIES_GROUP_ID,
  topicName: "📺 SERIES LIBRARY",
  caption: await seriesLibraryHubCaption()
});

await createOrUpdateCommandCenter({
  chatId: SERIES_GROUP_ID,
  topicName: "🔥 TRENDING",
  caption: await trendingSeriesHubCaption()
});

await createOrUpdateCommandCenter({
  chatId: SERIES_GROUP_ID,
  topicName: "🧩 INCOMPLETE",
  caption: await incompleteSeriesHubCaption()
});

await createOrUpdateCommandCenter({
  chatId: SERIES_GROUP_ID,
  topicName: "🏆 MASTERED",
  caption: await masteredSeriesHubCaption()
});

await createOrUpdateCommandCenter({
  chatId: SERIES_GROUP_ID,
  topicName: "🚨 NEWS CENTER",
  caption: await seriesNewsCenterCaption()
});

await createOrUpdateCommandCenter({
  chatId: SERIES_GROUP_ID,
  topicName: "📅 COMING SOON",
  caption: await seriesComingSoonCaption()
});

await createOrUpdateCommandCenter({
  chatId: SERIES_GROUP_ID,
  topicName: "🎬 PRODUKTIONSSTATUS",
  caption: await seriesProductionStatusCaption()
});

await createOrUpdateCommandCenter({
  chatId: SERIES_GROUP_ID,
  topicName: "🆕 NEUE STAFFELN",
  caption: await seriesNewSeasonsCaption()
});

await createOrUpdateCommandCenter({
  chatId: SERIES_GROUP_ID,
  topicName: "🎭 MINI SERIES",
  caption: await miniSeriesHubCaption()
});

await createOrUpdateCommandCenter({
  chatId: SERIES_GROUP_ID,
  topicName: "👶 KIDS SERIES",
  caption: await kidsSeriesHubCaption()
});

await createOrUpdateCommandCenter({
  chatId: SERIES_GROUP_ID,
  topicName: "🌸 ANIME HUB",
  caption: await animeSeriesHubCaption()
});

await createOrUpdateCommandCenter({
  chatId: SERIES_GROUP_ID,
  topicName: "🌍 DOCUMENTARY SERIES",
  caption: await documentarySeriesHubCaption()
});

await createOrUpdateCommandCenter({
  chatId: SERIES_GROUP_ID,
  topicName: "🌌 UNIVERSES",
  caption: await seriesUniversesHubCaption()
});

await createOrUpdateCommandCenter({
  chatId: SERIES_GROUP_ID,
  topicName: "⭐ STAR WARS SERIES",
  caption: await starWarsSeriesHubCaption()
});

await createOrUpdateCommandCenter({
  chatId: SERIES_GROUP_ID,
  topicName: "🧬 MARVEL SERIES",
  caption: await marvelSeriesHubCaption()
});

await createOrUpdateCommandCenter({
  chatId: SERIES_GROUP_ID,
  topicName: "🦇 DC SERIES",
  caption: await dcSeriesHubCaption()
});

await createOrUpdateCommandCenter({
  chatId: SERIES_GROUP_ID,
  topicName: "🏰 DISNEY SERIES",
  caption: await disneySeriesHubCaption()
});
}

// =============================
// MOVIE COMMAND CENTER CAPTION V2
// =============================
async function movieCommandCenterCaption() {
  let movieCount = 0;
  let universeCount = 0;
  let collectionCount = 0;
  let hallOfFameCount = 0;
  let knowledgeCount = 0;
  let newReleaseCount = 0;
  let totalBytes = 0;

  let topicLines = "";

  async function getTopicCount(topicName) {
    if (pgPool) {
      const topicKey = makeKey(`movie_category-${MOVIE_GROUP_ID}-${topicName}`);
      const systemKey = makeKey(`system_hub-${MOVIE_GROUP_ID}-${topicName}`);

      const result = await pgPool.query(
        `
        SELECT COUNT(m.id) AS count
        FROM movies m
        LEFT JOIN topics t
  ON m.topic_id = t.topic_id
        WHERE t.unique_key = $1
           OR t.unique_key = $2
        `,
        [topicKey, systemKey]
      );

      return Number(result.rows[0]?.count || 0);
    }

    const topicKey = makeKey(`movie_category-${MOVIE_GROUP_ID}-${topicName}`);
    const systemKey = makeKey(`system_hub-${MOVIE_GROUP_ID}-${topicName}`);

    const row = db.prepare(`
      SELECT COUNT(m.id) AS count
      FROM movies m
      LEFT JOIN topics t
        ON m.topic_id = t.topic_id
      WHERE t.unique_key = ?
         OR t.unique_key = ?
    `).get(topicKey, systemKey);

    return Number(row?.count || 0);
  }

  if (pgPool) {
    movieCount = Number((await pgPool.query(`
      SELECT COUNT(*) AS count
      FROM movies
    `)).rows[0]?.count || 0);

    universeCount = Number((await pgPool.query(`
      SELECT COUNT(DISTINCT universe) AS count
      FROM movies
      WHERE universe IS NOT NULL
        AND TRIM(universe) <> ''
    `)).rows[0]?.count || 0);

    collectionCount = Number((await pgPool.query(`
      SELECT COUNT(DISTINCT collection) AS count
      FROM movies
      WHERE collection IS NOT NULL
        AND TRIM(collection) <> ''
    `)).rows[0]?.count || 0);

    const ratingRows = (await pgPool.query(`
      SELECT rating
      FROM movies
      WHERE rating IS NOT NULL
    `)).rows;

    hallOfFameCount =
      ratingRows.filter((m) => getRatingValue(m.rating) >= 8).length;

    knowledgeCount = Number((await pgPool.query(`
      SELECT COUNT(*) AS count
      FROM knowledge
    `)).rows[0]?.count || 0);

    newReleaseCount = Number((await pgPool.query(`
  SELECT COUNT(*) AS count
  FROM movies
  WHERE year ~ '^\\d{4}$'
    AND year::int >= 2024
`)).rows[0]?.count || 0);

    totalBytes = Number((await pgPool.query(`
      SELECT COALESCE(SUM(file_size_bytes), 0) AS total
      FROM movies
    `)).rows[0]?.total || 0);
  } else {
    movieCount = db.prepare(`
      SELECT COUNT(*) AS count
      FROM movies
    `).get()?.count || 0;

    universeCount = db.prepare(`
      SELECT COUNT(DISTINCT universe) AS count
      FROM movies
      WHERE universe IS NOT NULL
        AND TRIM(universe) <> ''
    `).get()?.count || 0;

    collectionCount = db.prepare(`
      SELECT COUNT(DISTINCT collection) AS count
      FROM movies
      WHERE collection IS NOT NULL
        AND TRIM(collection) <> ''
    `).get()?.count || 0;

    const ratingRows = db.prepare(`
      SELECT rating
      FROM movies
      WHERE rating IS NOT NULL
    `).all();

    hallOfFameCount =
      ratingRows.filter((m) => getRatingValue(m.rating) >= 8).length;

    knowledgeCount = db.prepare(`
      SELECT COUNT(*) AS count
      FROM knowledge
    `).get()?.count || 0;

    newReleaseCount = db.prepare(`
      SELECT COUNT(*) AS count
      FROM movies
      WHERE CAST(NULLIF(year, '') AS INTEGER) >= 2024
    `).get()?.count || 0;

    try {
      totalBytes = Number(db.prepare(`
        SELECT COALESCE(SUM(file_size_bytes), 0) AS total
        FROM movies
      `).get()?.total || 0);
    } catch (err) {
      console.error("⚠️ SQLite file_size_bytes fehlt:", err.message);
      totalBytes = 0;
    }
  }

  for (const topicName of ALLOWED_MOVIE_TOPICS) {
    const count = await getTopicCount(topicName);

    topicLines +=
      `${topicName}: ${count}\n`;
  }

  const totalGB =
    (totalBytes / 1024 / 1024 / 1024).toFixed(2);

  return (
    "━━━━━━━━━━━━━━━━━━\n" +
    "🎛 FILM-KOMMANDOZENTRUM\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "📁 PREMIUM-FILMARCHIV\n" +
    "🎬 AUTOMATISIERTES FILM-SYSTEM\n" +
    "🧠 SMARTES FILM-MANAGEMENT\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "📊 ARCHIV-STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    `🎬 Filme: ${movieCount}\n` +
    `🎞 Filmreihen: ${collectionCount}\n` +
    `🌌 Universen: ${universeCount}\n` +
    `💾 Speicher: ${totalGB} GB\n` +
    `🏆 Hall of Fame: ${hallOfFameCount}\n` +
    `📚 Knowledge Files: ${knowledgeCount}\n` +
    `🔥 Neuerscheinungen: ${newReleaseCount}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "📂 THEMEN-STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    topicLines + "\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🧭 NAVIGATION\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    "🔥 Neuerscheinungen\n" +
    "🌌 Star Wars Universe\n" +
    "🏰 Disney Universe\n" +
    "🧬 Marvel Universe\n" +
    "🦇 DC Universe\n" +
    "🎞 Filmreihen\n" +
    "🎬 Klassische Filme\n" +
    "📼 Filme der 80er\n" +
    "📀 Filme der 90er\n" +
    "🎥 Filme der 2000er\n" +
    "🚀 Neuere Filme\n" +
    "🌍 Internationale Filme\n" +
    "📚 Dokumentationen\n" +
    "🎨 Animation\n" +
    "🍿 Familienfilme\n" +
    "🧸 Kinderfilme\n" +
    "⛩ Anime\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends"
  ).slice(0, 4000);
}

// =============================
// SERIES COMMAND CENTER CAPTION V2
// =============================
async function seriesCommandCenterCaption() {
  let seriesCount = 0;
  let episodeCount = 0;
  let universeSeriesCount = 0;
  let incompleteCount = 0;
  let masteredCount = 0;
  let latest = [];
  let trending = [];

  if (pgPool) {
    seriesCount = Number((await pgPool.query(`
      SELECT COUNT(DISTINCT series_title) AS count
      FROM series
    `)).rows[0]?.count || 0);

    episodeCount = Number((await pgPool.query(`
      SELECT COUNT(*) AS count
      FROM series
    `)).rows[0]?.count || 0);

    universeSeriesCount = Number((await pgPool.query(`
      SELECT COUNT(DISTINCT universe) AS count
      FROM series
      WHERE universe IS NOT NULL
    `)).rows[0]?.count || 0);

    const latestResult = await pgPool.query(`
      SELECT series_title, season, episode, episode_title
      FROM series
      ORDER BY created_at DESC
      LIMIT 5
    `);

    latest = latestResult.rows;

    const trendingResult = await pgPool.query(`
      SELECT series_title, COUNT(*) AS count
      FROM series
      GROUP BY series_title
      ORDER BY count DESC, series_title ASC
      LIMIT 5
    `);

    trending = trendingResult.rows;
  } else {
    seriesCount = db.prepare(`
      SELECT COUNT(DISTINCT series_title) AS count
      FROM series
    `).get()?.count || 0;

    episodeCount = db.prepare(`
      SELECT COUNT(*) AS count
      FROM series
    `).get()?.count || 0;

    universeSeriesCount = db.prepare(`
      SELECT COUNT(DISTINCT universe) AS count
      FROM series
      WHERE universe IS NOT NULL
    `).get()?.count || 0;

    latest = db.prepare(`
      SELECT series_title, season, episode, episode_title
      FROM series
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    trending = db.prepare(`
      SELECT series_title, COUNT(*) AS count
      FROM series
      GROUP BY series_title
      ORDER BY count DESC, series_title ASC
      LIMIT 5
    `).all();
  }

  // Serien auf Vollständigkeit prüfen
  const allSeries = pgPool
    ? (await pgPool.query(`
        SELECT series_title, season, episode
        FROM series
        ORDER BY series_title ASC, season ASC, episode ASC
      `)).rows
    : db.prepare(`
        SELECT series_title, season, episode
        FROM series
        ORDER BY series_title ASC, season ASC, episode ASC
      `).all();

  const grouped = {};

  for (const row of allSeries) {
    const title = row.series_title;
    const season = Number(row.season || 0);
    const episode = Number(row.episode || 0);

    if (!title || !season || !episode) continue;

    if (!grouped[title]) {
      grouped[title] = {};
    }

    if (!grouped[title][season]) {
      grouped[title][season] = [];
    }

    grouped[title][season].push(episode);
  }

  for (const title of Object.keys(grouped)) {
    let isIncomplete = false;

    for (const season of Object.keys(grouped[title])) {
      const episodes = [...new Set(grouped[title][season])].sort((a, b) => a - b);
      const maxEpisode = Math.max(...episodes);

      for (let ep = 1; ep <= maxEpisode; ep++) {
        if (!episodes.includes(ep)) {
          isIncomplete = true;
          break;
        }
      }

      if (isIncomplete) break;
    }

    if (isIncomplete) {
      incompleteCount++;
    } else {
      masteredCount++;
    }
  }

  let latestText = "";

  if (!latest.length) {
    latestText = "Noch keine Folgen gespeichert.\n";
  } else {
    for (const s of latest) {
      latestText +=
        `• ${s.series_title} ` +
        `S${String(s.season).padStart(2, "0")}` +
        `E${String(s.episode).padStart(2, "0")}`;

      if (s.episode_title) {
        latestText += ` • ${s.episode_title}`;
      }

      latestText += "\n";
    }
  }

  let trendingText = "";

  if (!trending.length) {
    trendingText = "Noch keine Trends verfügbar.\n";
  } else {
    for (const s of trending) {
      trendingText += `• ${s.series_title} — ${s.count} Episode(n)\n`;
    }
  }

  return cleanTelegramText(
    "━━━━━━━━━━━━━━━━━━\n" +
    "🎛 SERIES COMMAND CENTER\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "📁 PREMIUM SERIES ARCHIVE\n" +
    "📺 AUTOMATED EPISODE SYSTEM\n" +
    "🧠 SMART SERIES MANAGEMENT\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "📊 ARCHIV STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    `📺 Serien: ${seriesCount}\n` +
    `🎞 Episoden: ${episodeCount}\n` +
    `🌌 Universes: ${universeSeriesCount}\n` +
    `🧩 Unvollständig: ${incompleteCount}\n` +
    `🏆 Vollständig: ${masteredCount}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🆕 NEUE FOLGEN\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    latestText + "\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🔥 TRENDING SERIEN\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    trendingText + "\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🧭 NAVIGATION\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    "🌌 UNIVERSES\n" +
    "📺 SERIES LIBRARY\n" +
    "🔥 TRENDING\n" +
    "🧩 INCOMPLETE\n" +
    "🏆 MASTERED\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends"
  );
}

// =============================
// SERIES LIBRARY HUB CAPTION
// =============================
async function seriesLibraryHubCaption() {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT
        series_title,
        MAX(genre) AS genre,
        MAX(rating) AS rating,
        COUNT(*) AS count
      FROM series
      GROUP BY series_title
      ORDER BY series_title ASC
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT
        series_title,
        genre,
        rating,
        COUNT(*) AS count
      FROM series
      GROUP BY series_title
      ORDER BY series_title ASC
    `).all();
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "📺 SERIES LIBRARY\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    "🔤 Serien A-Z Übersicht\n\n";

  if (!rows.length) {
    resultText += "Noch keine Serien gespeichert.\n";
  } else {
    let currentLetter = "";

    for (const s of rows) {
      const letter = String(s.series_title || "#")
        .charAt(0)
        .toUpperCase();

      if (letter !== currentLetter) {
        currentLetter = letter;
        resultText += `\n${currentLetter}\n`;
      }

      const genreText = String(s.genre || "Sonstige")
        .split("/")
        .map(g => g.trim())
        .filter(Boolean)
        .slice(0, 2)
        .join(" • ");

      resultText += `• ${s.series_title}\n`;
      resultText += `  🎞 ${s.count} Episode(n)\n`;
      resultText += `  🎭 ${genreText || "Unbekannt"}\n`;
      resultText += `  ⭐ ${s.rating || "Unbekannt"}\n\n`;
    }
  }

  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  return cleanTelegramText(resultText).slice(0, 4000);
}

// =============================
// TRENDING SERIES HUB CAPTION
// =============================
async function trendingSeriesHubCaption() {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT
        series_title,
        MAX(genre) AS genre,
        MAX(rating) AS rating,
        COUNT(*) AS count
      FROM series
      GROUP BY series_title
      ORDER BY count DESC, series_title ASC
      LIMIT 20
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT
        series_title,
        genre,
        rating,
        COUNT(*) AS count
      FROM series
      GROUP BY series_title
      ORDER BY count DESC, series_title ASC
      LIMIT 20
    `).all();
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🔥 TRENDING SERIES\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    "📊 Sortiert nach gespeicherten Episoden\n\n";

  if (!rows.length) {
    resultText += "Noch keine Serien gespeichert.\n";
  } else {
    let rank = 1;

    for (const s of rows) {
      const genreText = String(s.genre || "Sonstige")
        .split("/")
        .map(g => g.trim())
        .filter(Boolean)
        .slice(0, 2)
        .join(" • ");

      resultText += `#${rank} ${s.series_title}\n`;
      resultText += `  🎞 ${s.count} Episode(n)\n`;
      resultText += `  🎭 ${genreText || "Unbekannt"}\n`;
      resultText += `  ⭐ ${s.rating || "Unbekannt"}\n\n`;

      rank++;
    }
  }

  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  return cleanTelegramText(resultText).slice(0, 4000);
}

// =============================
// INCOMPLETE SERIES HUB CAPTION
// =============================
async function incompleteSeriesHubCaption() {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT series_title, season, episode
      FROM series
      ORDER BY series_title ASC, season ASC, episode ASC
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT series_title, season, episode
      FROM series
      ORDER BY series_title ASC, season ASC, episode ASC
    `).all();
  }

  const grouped = {};

  for (const row of rows) {
    const title = row.series_title;
    const season = Number(row.season || 0);
    const episode = Number(row.episode || 0);

    if (!title || !season || !episode) continue;

    if (!grouped[title]) {
      grouped[title] = {};
    }

    if (!grouped[title][season]) {
      grouped[title][season] = [];
    }

    grouped[title][season].push(episode);
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🧩 INCOMPLETE SERIES\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    "⚠️ Serien mit fehlenden Episoden\n\n";

  let found = false;

  for (const title of Object.keys(grouped).sort()) {
    let missingLines = "";

    for (const season of Object.keys(grouped[title]).map(Number).sort((a, b) => a - b)) {
      const episodes = [...new Set(grouped[title][season])].sort((a, b) => a - b);
      const maxEpisode = Math.max(...episodes);

      const missing = [];

      for (let ep = 1; ep <= maxEpisode; ep++) {
        if (!episodes.includes(ep)) {
          missing.push(ep);
        }
      }

      if (missing.length) {
        missingLines +=
          `  📀 Staffel ${String(season).padStart(2, "0")} fehlt: ` +
          missing
            .map(ep => `E${String(ep).padStart(2, "0")}`)
            .join(", ") +
          "\n";
      }
    }

    if (missingLines) {
      found = true;

      resultText += `• ${title}\n`;
      resultText += missingLines + "\n";
    }
  }

  if (!found) {
    resultText += "✅ Alle Serien wirken vollständig nach aktuellem Datenstand.\n";
  }

  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  return cleanTelegramText(resultText).slice(0, 4000);
}

// =============================
// MASTERED SERIES HUB CAPTION
// =============================
async function masteredSeriesHubCaption() {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT series_title, season, episode, genre, rating
      FROM series
      ORDER BY series_title ASC, season ASC, episode ASC
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT series_title, season, episode, genre, rating
      FROM series
      ORDER BY series_title ASC, season ASC, episode ASC
    `).all();
  }

  const grouped = {};

  for (const row of rows) {
    const title = row.series_title;
    const season = Number(row.season || 0);
    const episode = Number(row.episode || 0);

    if (!title || !season || !episode) continue;

    if (!grouped[title]) {
      grouped[title] = {
        seasons: {},
        genre: row.genre || null,
        rating: row.rating || null
      };
    }

    if (!grouped[title].seasons[season]) {
      grouped[title].seasons[season] = [];
    }

    grouped[title].seasons[season].push(episode);
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🏆 MASTERED SERIES\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    "✅ Vollständige Serien nach aktuellem Datenstand\n\n";

  let found = false;

  for (const title of Object.keys(grouped).sort()) {
    let isIncomplete = false;
    let episodeCount = 0;

    for (const season of Object.keys(grouped[title].seasons).map(Number).sort((a, b) => a - b)) {
      const episodes = [...new Set(grouped[title].seasons[season])]
        .sort((a, b) => a - b);

      episodeCount += episodes.length;

      const maxEpisode = Math.max(...episodes);

      for (let ep = 1; ep <= maxEpisode; ep++) {
        if (!episodes.includes(ep)) {
          isIncomplete = true;
          break;
        }
      }

      if (isIncomplete) break;
    }

    if (!isIncomplete) {
      found = true;

      const genreText = String(grouped[title].genre || "Sonstige")
        .split("/")
        .map(g => g.trim())
        .filter(Boolean)
        .slice(0, 2)
        .join(" • ");

      resultText += `• ${title}\n`;
      resultText += `  🎞 ${episodeCount} Episode(n)\n`;
      resultText += `  🎭 ${genreText || "Unbekannt"}\n`;
      resultText += `  ⭐ ${grouped[title].rating || "Unbekannt"}\n\n`;
    }
  }

  if (!found) {
    resultText += "Noch keine vollständig wirkenden Serien gefunden.\n";
  }

  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  return cleanTelegramText(resultText).slice(0, 4000);
}

// =============================
// SERIES UNIVERSES HUB CAPTION
// =============================
async function seriesUniversesHubCaption() {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT
        universe,
        series_title,
        COUNT(*) AS count,
        MAX(rating) AS rating
      FROM series
      WHERE universe IS NOT NULL
        AND universe <> ''
      GROUP BY universe, series_title
      ORDER BY universe ASC, series_title ASC
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT
        universe,
        series_title,
        COUNT(*) AS count,
        MAX(rating) AS rating
      FROM series
      WHERE universe IS NOT NULL
        AND universe <> ''
      GROUP BY universe, series_title
      ORDER BY universe ASC, series_title ASC
    `).all();
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🌌 SERIES UNIVERSES\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    "🧭 Serien nach Universum sortiert\n\n";

  if (!rows.length) {
    resultText += "Noch keine Serien-Universen erkannt.\n";
  } else {
    let currentUniverse = "";

    for (const row of rows) {
      if (row.universe !== currentUniverse) {
        currentUniverse = row.universe;

        resultText +=
          "━━━━━━━━━━━━━━━━━━\n" +
          `🌌 ${currentUniverse}\n` +
          "━━━━━━━━━━━━━━━━━━\n";
      }

      resultText += `• ${row.series_title}\n`;
      resultText += `  🎞 ${row.count} Episode(n)\n`;
      resultText += `  ⭐ ${row.rating || "Unbekannt"}\n\n`;
    }
  }

  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  return cleanTelegramText(resultText).slice(0, 4000);
}

// =============================
// SINGLE SERIES HUB — SERIES NEXUS BLACK EDITION
// =============================
async function singleSeriesHubCaption(seriesTitle) {
  let rows = [];
  let library = null;

  if (pgPool) {
    const episodeResult = await pgPool.query(
      `
      SELECT *
      FROM series
      WHERE series_title = $1
      ORDER BY season ASC, episode ASC
      `,
      [seriesTitle]
    );

    rows = episodeResult.rows;

    const libraryResult = await pgPool.query(
      `
      SELECT *
      FROM series_library
      WHERE title = $1
      LIMIT 1
      `,
      [seriesTitle]
    );

    library = libraryResult.rows[0] || null;
  } else {
    rows = db.prepare(`
      SELECT *
      FROM series
      WHERE series_title = ?
      ORDER BY season ASC, episode ASC
    `).all(seriesTitle);

    library = db.prepare(`
      SELECT *
      FROM series_library
      WHERE title = ?
      LIMIT 1
    `).get(seriesTitle);
  }

  const title =
    library?.title ||
    rows[0]?.series_title ||
    seriesTitle ||
    "Unbekannte Serie";

  const genre =
    library?.genres ||
    rows[0]?.genre ||
    "Unbekannt";

  const rating =
    library?.rating ||
    rows[0]?.rating ||
    "Unbekannt";

  const universe =
    rows[0]?.universe ||
    "Standalone Series";

  const overviewRaw = String(
    library?.overview ||
    rows[0]?.overview ||
    "Keine Beschreibung verfügbar."
  )
    .replace(/\s+/g, " ")
    .trim();

  let overview = overviewRaw;

  if (overview.length > 430) {
    overview = overview.slice(0, 430);

    const lastSentenceEnd = Math.max(
      overview.lastIndexOf("."),
      overview.lastIndexOf("!"),
      overview.lastIndexOf("?")
    );

    if (lastSentenceEnd > 220) {
      overview = overview.slice(0, lastSentenceEnd + 1);
    } else {
      const lastSpace = overview.lastIndexOf(" ");

      if (lastSpace > 220) {
        overview = overview.slice(0, lastSpace);
      }

      overview += " …";
    }
  }

  const seasons = {};

  for (const row of rows) {
    const season = Number(row.season || 0);
    const episode = Number(row.episode || 0);

    if (!season || !episode) continue;

    if (!seasons[season]) {
      seasons[season] = [];
    }

    seasons[season].push(episode);
  }

  let totalSaved = 0;
  let totalKnown = 0;
  let totalMissing = 0;
  let seasonLines = "";

  for (const season of Object.keys(seasons).map(Number).sort((a, b) => a - b)) {
    const episodes = [...new Set(seasons[season])].sort((a, b) => a - b);
    const known = Math.max(...episodes);

    totalSaved += episodes.length;
    totalKnown += known;

    const missing = [];

    for (let ep = 1; ep <= known; ep++) {
      if (!episodes.includes(ep)) {
        missing.push(ep);
      }
    }

    totalMissing += missing.length;

    const seasonKey = String(season).padStart(2, "0");

    if (missing.length) {
      seasonLines +=
        `⚠️ Staffel ${seasonKey} • ${episodes.length}/${known} • INCOMPLETE\n`;
    } else {
      seasonLines +=
        `🏆 Staffel ${seasonKey} • COMPLETE\n`;
    }
  }

  const percent =
    totalKnown > 0
      ? Math.round((totalSaved / totalKnown) * 100)
      : 0;

  const progressBar =
    "█".repeat(Math.floor(percent / 10)) +
    "░".repeat(10 - Math.floor(percent / 10));

  const archiveStatus =
    totalMissing > 0
      ? "ARCHIVE INCOMPLETE"
      : "ARCHIVE VERIFIED";

  const collectionStatus =
    totalMissing > 0
      ? "ACTIVE COLLECTION"
      : "MASTERED COLLECTION";

  const genreText = String(genre)
    .split("/")
    .map(g => g.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" • ");

  const archiveCode =
    `SER-${String(title)
      .replace(/[^a-z0-9]/gi, "")
      .toUpperCase()
      .slice(0, 5)}`;

  const seriesTag =
    `#${String(title)
      .replace(/[^a-zA-Z0-9ÄÖÜäöüß]/g, "")}`;

  const seasonCount =
  Object.keys(seasons).length;

const seasonLabel =
  seasonCount === 1 ? "Staffel" : "Staffeln";

let resultText =
  "███ SERIES NEXUS ███\n\n" +

    `📺 ${String(title).toUpperCase()}\n\n` +
    "📡 SERIES ENTRY • VERIFIED\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🏛 SERIES CLASSIFICATION\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `🎭 ${genreText || "Unbekannt"}\n` +
    `🌌 ${universe}\n\n` +
    `🧬 ${archiveCode}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "📊 ARCHIVE STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `📀 ${seasonLabel} • ${seasonCount}\n` +
    `🎞 Episoden • ${totalSaved}/${totalKnown}\n\n` +
    `${progressBar} ${percent}%\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "📖 SERIES DOSSIER\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `${overview}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "📀 SEASON MATRIX\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `${seasonLines || "Noch keine Staffeln gespeichert.\n"}\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🛰 SERIES STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `📡 ${archiveStatus}\n` +
    `🏆 ${collectionStatus}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    `${seriesTag}\n` +
    "@LibraryOfLegends";

  return cleanTelegramText(resultText).slice(0, 4000);
}

// =============================
// CREATE OR UPDATE SINGLE SERIES HUB
// =============================
async function createOrUpdateSingleSeriesHub(seriesTitle, topicId) {
  if (!seriesTitle || !topicId) {
    return null;
  }

  const caption = await singleSeriesHubCaption(seriesTitle);

  let existingTopic = null;

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT *
      FROM series_topics
      WHERE series_name = $1
      LIMIT 1
      `,
      [seriesTitle]
    );

    existingTopic = result.rows[0] || null;
  } else {
    existingTopic = db.prepare(`
      SELECT *
      FROM series_topics
      WHERE series_name = ?
      LIMIT 1
    `).get(seriesTitle);
  }

  const existingHubMessageId =
    existingTopic?.hub_message_id || null;

  if (existingHubMessageId) {
    const edited = await tg("editMessageText", {
      chat_id: SERIES_GROUP_ID,
      message_id: Number(existingHubMessageId),
      text: caption
    });

    if (!edited?.__error) {
      console.log("✅ Single Series Hub aktualisiert:", seriesTitle);
      return existingHubMessageId;
    }

    const editError =
      edited?.error?.description ||
      edited?.description ||
      "";

    if (editError.includes("message is not modified")) {
      console.log("ℹ️ Single Series Hub unverändert:", seriesTitle);
      return existingHubMessageId;
    }

    if (editError.includes("message to edit not found")) {
      console.log("⚠️ Single Series Hub Message fehlt, erstelle neu:", seriesTitle);

      if (pgPool) {
        await pgPool.query(
          `
          UPDATE series_topics
          SET hub_message_id = NULL
          WHERE series_name = $1
          `,
          [seriesTitle]
        );
      } else {
        db.prepare(`
          UPDATE series_topics
          SET hub_message_id = NULL
          WHERE series_name = ?
        `).run(seriesTitle);
      }
    } else {
      console.log(
        "⚠️ Single Series Hub Edit Fehler:",
        seriesTitle,
        editError || edited
      );
    }
  }

  const sent = await tg("sendMessage", {
  chat_id: SERIES_GROUP_ID,
  message_thread_id: Number(topicId),
  text: caption,
  parse_mode: "HTML"
});

  if (!sent?.message_id) {
    return null;
  }

  if (pgPool) {
    await pgPool.query(
      `
      UPDATE series_topics
      SET hub_message_id = $1
      WHERE series_name = $2
      `,
      [
        sent.message_id,
        seriesTitle
      ]
    );
  } else {
    db.prepare(`
      UPDATE series_topics
      SET hub_message_id = ?
      WHERE series_name = ?
    `).run(
      sent.message_id,
      seriesTitle
    );
  }

  console.log("✅ Single Series Hub erstellt:", seriesTitle);

  return sent.message_id;
}

async function createOrUpdateCommandCenter({
  chatId,
  topicName,
  caption
}) {
  const uniqueKey = makeKey(`system_hub-${chatId}-${topicName}`);

  let topic = null;

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT *
      FROM topics
      WHERE unique_key = $1
      LIMIT 1
      `,
      [uniqueKey]
    );

    topic = result.rows[0] || null;
  } else {
    topic = getTopic(uniqueKey);
  }

  if (!topic?.topic_id) {
  const topicId = await createOrGetTopic({
    chatId,
    name: topicName,
    type: "system_hub"
  });

  if (!topicId) {
    console.error("❌ Command Center Topic konnte nicht erstellt werden:", {
      chatId,
      topicName,
      uniqueKey
    });

    return null;
  }

  topic = {
    topic_id: topicId,
    hub_message_id: null
  };
}

  if (topic.hub_message_id) {
    return await tg("editMessageText", {
      chat_id: chatId,
      message_id: topic.hub_message_id,
      text: caption
    });
  }

  const msg = await tg("sendMessage", {
    chat_id: chatId,
    message_thread_id: topic.topic_id,
    text: caption
  });
  
  console.log("🎛 Command Center Send Result:", JSON.stringify(msg, null, 2));

  if (msg?.message_id) {
    if (pgPool) {
      await pgPool.query(
        `
        UPDATE topics
        SET hub_message_id = $1
        WHERE unique_key = $2
        `,
        [msg.message_id, uniqueKey]
      );
    } else {
      db.prepare(`
        UPDATE topics
        SET hub_message_id = ?
        WHERE unique_key = ?
      `).run(msg.message_id, uniqueKey);
    }
  }

  return msg;
}

// =============================
// REFRESH COMMAND CENTERS
// =============================
async function refreshCommandCenters() {
  await refreshMainCommandCentersOnly();
}

async function refreshMainCommandCentersOnly() {
  try {
    await createOrUpdateCommandCenter({
      chatId: MOVIE_GROUP_ID,
      topicName: "🎛 Movie Command Center",
      caption: await movieCommandCenterCaption()
    });
  } catch (err) {
    console.error("❌ Movie Command Center Update Fehler:", err.message);
  }

  try {
    await createOrUpdateCommandCenter({
      chatId: SERIES_GROUP_ID,
      topicName: "🎛 SERIES COMMAND CENTER",
      caption: await seriesCommandCenterCaption()
    });
  } catch (err) {
    console.error("❌ Series Command Center Update Fehler:", err.message);
  }
}

async function createGenreTopicIfMissing(genreName = "") {
  if (!genreName) return null;

  const cleanGenre =
    normalizeGenreName(genreName);

  const topicName =
    `🎭 ${cleanGenre}`;

  return await createOrGetTopic({
    chatId: MOVIE_GROUP_ID,
    name: topicName,
    type: "movie_genre"
  });
}

async function createDecadeTopicIfMissing(year) {

  const decade =
    getDecadeLabel(year);

  if (!decade || decade === "Unknown") {
    return null;
  }

  return await createOrGetTopic({
    chatId: MOVIE_GROUP_ID,
    name: `📅 ${decade}`,
    type: "movie_decade"
  });
}

async function createFskTopicIfMissing(fsk = "") {
  if (!fsk) return null;

  return await createOrGetTopic({
    chatId: MOVIE_GROUP_ID,
    name: `🔞 FSK ${fsk}`,
    type: "movie_fsk"
  });
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
  const callback = update.callback_query;

  // =============================
  // BUTTON CALLBACKS
  // =============================
  if (callback) {
    const userId = String(callback.from?.id || "");

    console.log("🔘 Button gedrückt:", callback.data);
    console.log("USER ID:", userId);

    if (userId !== ADMIN_ID) {
      if (process.env.DEBUG === "true") {
        console.log("⛔ Button ignored - nicht Admin");
      }
      return;
    }

    await handleCallback(callback);
    return;
  }

  // =============================
  // NORMAL MESSAGES
  // =============================
  const msg =
  update.message ||
  update.edited_message;

if (!msg) return;

if (msg.from?.is_bot) {
  console.log("🤖 Bot Nachricht ignoriert");
  return;
}

const userId =
  String(msg.from?.id || "");

console.log("USER ID:", userId);
console.log(
  "CHAT ID:",
  msg.chat?.id,
  "CHAT TITLE:",
  msg.chat?.title
);

if (userId !== ADMIN_ID) {
  if (process.env.DEBUG === "true") {
    console.log("⛔ Ignored - nicht Admin");
  }
  return;
}

  // =============================
  // COMMANDS
  // =============================
  if (msg.text) {
    await handleCommand(msg);
    return;
  }

  // =============================
  // DATABASE RESTORE FILE
  // =============================
  if (msg.document) {
    const fileName = msg.document.file_name || "";

    if (fileName === "library.db") {
      LAST_RESTORE_FILE_ID = msg.document.file_id;

      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "✅ Backup-Datei erkannt.\n\n" +
          "Sende jetzt:\n/restoredb"
      });

      return;
    }
  }

  // =============================
  // MEDIA UPLOAD QUEUE
  // =============================
  if (msg.video || msg.document) {
    console.log("🎥 Video/Datei erkannt");

    await enqueueUpload(
  async () => {
    await handleUpload(msg);
  },
  msg.document?.file_name ||
  msg.video?.file_name ||
  "Unbekannte Datei"
);

    return;
  }

  console.log("⚠️ Unbekannter Nachrichtentyp");
}

// =============================
// CALLBACK HANDLER
// =============================
async function handleCallback(callback) {
  const data = callback.data;
  const chatId = callback.message.chat.id;

  await tg("answerCallbackQuery", {
    callback_query_id: callback.id
  });

  console.log("✅ Callback verarbeitet:", data);

  // =============================
  // SERIES TMDB PICK
  // =============================
  if (data.startsWith("seriespick_")) {
    const tmdbId = data.replace("seriespick_", "");

    const details = await tmdbGet(`/tv/${tmdbId}`, {
      append_to_response: "credits,content_ratings"
    });

    if (!details) {
      return await tg("sendMessage", {
        chat_id: chatId,
        text: "❌ Serie nicht gefunden."
      });
    }

    const poster =
      details.poster_path
        ? posterUrl(details.poster_path)
        : "https://via.placeholder.com/500x750.png?text=No+Poster";

    await tg("sendPhoto", {
      chat_id: chatId,
      photo: poster,
      caption:
        "━━━━━━━━━━━━━━━━━━\n" +
        `📺 ${String(details.name || "").toUpperCase()}\n` +
        "━━━━━━━━━━━━━━━━━━\n\n" +
        `⭐ ${formatRating(details.vote_average)} IMDb\n` +
        `📅 ${details.first_air_date || "Unbekannt"}\n` +
        `🆔 TMDB ID: ${details.id}\n\n` +
        `${String(details.overview || "Keine Beschreibung verfügbar.").slice(0, 800)}`
    });

    return;
  }

  // =============================
  // MOVIE TMDB PICK
  // =============================
  if (data.startsWith("moviepick:")) {
    const userId = String(callback.from?.id || "");
    const tmdbId = Number(data.replace("moviepick:", ""));
    const pending = PENDING_MOVIE_UPLOADS.get(userId);

    if (!pending) {
      return await tg("sendMessage", {
        chat_id: chatId,
        text: "⚠️ Keine offene Film-Auswahl gefunden. Bitte Datei erneut senden."
      });
    }

    PENDING_MOVIE_UPLOADS.delete(userId);

    const tmdb = await getMovieDetailsById(tmdbId);

    if (!tmdb) {
      return await tg("sendMessage", {
        chat_id: chatId,
        text: "❌ TMDB-Details konnten nicht geladen werden."
      });
    }

    return await processMovieUpload({
      msg: pending.msg,
      media: {
        ...pending.media,
        title: tmdb.title,
        year: tmdb.year,
        uniqueKey: makeKey(`${tmdb.title}-${tmdb.year || "unknown"}`)
      },
      tmdb
    });
  }

  // =============================
  // PANEL BUTTONS
  // =============================
  const panelCommands = {
    panel_rebuild_collections: "/rebuildcollections",
    panel_movies: "/movies",
    panel_series: "/series",
    panel_serieshub: "/serieshub",
    panel_seriesaz: "/seriesaz",
    panel_newseries: "/newseries",
    panel_trending: "/trendingseries",
    panel_featured: "/featuredseries",
    panel_az: "/az",
    panel_duplicates: "/duplicates",
    panel_dashboard: "/dashboard",
    panel_stats: "/stats",
    panel_clearseries: "/clearseries"
  };

  if (panelCommands[data]) {
    return await handleCommand({
      chat: { id: chatId },
      text: panelCommands[data]
    });
  }

  // =============================
  // PANEL HELP BUTTONS
  // =============================
  if (data === "panel_missing_help") {
    return await tg("sendMessage", {
      chat_id: chatId,
      text:
        "🧩 Nutzung:\n" +
        "/missingseries Serienname\n\n" +
        "Beispiel:\n/missingseries Game of Thrones"
    });
  }

  if (data === "panel_search_help") {
    return await tg("sendMessage", {
      chat_id: chatId,
      text:
        "🔎 Nutzung:\n" +
        "/search titel\n\n" +
        "Beispiel:\n/search Game of Thrones"
    });
  }

  if (data === "panel_setseries_help") {
    return await tg("sendMessage", {
      chat_id: chatId,
      text:
        "📌 Nutzung:\n" +
        "/setseries Serienname\n\n" +
        "Beispiel:\n/setseries Timon und Pumbaa"
    });
  }
  
  if (data === "panel_movie_index") {
  await tg("sendMessage", {
    chat_id: chatId,
    text: "ℹ️ Movie Index ist in Library V3 deaktiviert."
  });

  return;
}

  // =============================
  // UNKNOWN BUTTON
  // =============================
  return await tg("sendMessage", {
    chat_id: chatId,
    text: "⚠️ Button noch nicht verbunden."
  });
}

function cleanTelegramText(value = "") {
  return String(value)
    .replace(/\u0000/g, "")
    .replace(/\uFFFD/g, "")
    .normalize("NFC");
}

function extractRatingNumber(value = "") {
  const match = String(value).match(/(\d+(?:[.,]\d+)?)/);

  if (!match) return 0;

  return Number(match[1].replace(",", ".")) || 0;
}

// =============================
// COMMAND HANDLER
// =============================
async function handleCommand(msg) {
  const text = msg.text || "";

  const command = text
    .trim()
    .split(/\s+/)[0]
    .split("@")[0]
    .toLowerCase();

  console.log("🧪 COMMAND CHECK:", {
    text,
    command
  });

  // hier beginnen deine if-Befehle
  
  // =============================
// ADMIN / START COMMAND CENTER V2
// =============================

if (text === "/start" || text === "/admin") {
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🎛 𝐋𝐈𝐁𝐑𝐀𝐑𝐘 𝐎𝐅 𝐋𝐄𝐆𝐄𝐍𝐃𝐒\n" +
      "𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐂𝐄𝐍𝐓𝐄𝐑 𝐕𝟐\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +

      "🎬 𝐌𝐎𝐕𝐈𝐄 𝐀𝐑𝐂𝐇𝐈𝐕𝐄\n\n" +
      "• /movies — Filme anzeigen\n" +
      "• /search TITEL — Suche Filme & Serien\n" +
      "• /findmovie TITEL — Film Debug-Suche\n" +
      "• /collections — Filmreihen anzeigen\n" +
      "• /collection NAME — Filmreihe öffnen\n" +
      "• /az — A–Z Gesamtindex\n\n" +

      "🛠 𝐌𝐎𝐕𝐈𝐄 𝐓𝐎𝐎𝐋𝐒\n\n" +
      "• /fixmovie ALT | NEU | JAHR\n" +
      "• /deletemovie NAME\n" +
      "• /deletetopic NAME\n" +
      "• /rebuildcollections\n" +
      "• /rebuildmovieindex\n" +
      "• /repairmovieuniverses\n\n" +
      
      "━━━━━━━━━━━━━━━━━━\n" +
      "🏆 𝐄𝐋𝐈𝐓𝐄 & 𝐇𝐀𝐋𝐋 𝐎𝐅 𝐅𝐀𝐌𝐄\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "• /rebuildhalloffame — Hall of Fame aktualisieren\n" +
      "• /rebuildmovieindex — Movie Index aktualisieren\n" +
      "• /rebuildcollections — Collections aktualisieren\n\n" +

      "━━━━━━━━━━━━━━━━━━\n" +
      "📺 𝐒𝐄𝐑𝐈𝐄𝐒 𝐀𝐑𝐂𝐇𝐈𝐕𝐄\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "• /series — Serien anzeigen\n" +
      "• /seriesaz — Serien A–Z\n" +
      "• /serieshub — Serien Dashboard\n" +
      "• /newseries — Neue Folgen\n" +
      "• /trendingseries — Trending Serien\n" +
      "• /featuredseries — Featured Serien\n" +
      "• /progress NAME — Serienfortschritt\n" +
      "• /missing SERIE STAFFEL — Fehlende Episoden\n" +
      "• /missingseries NAME — Lückenprüfung\n" +
      "• /checkseries NAME — Premium Serien-Scan\n\n" +

      "🛠 𝐒𝐄𝐑𝐈𝐄𝐒 𝐓𝐎𝐎𝐋𝐒\n\n" +
      "• /setseries NAME\n" +
      "• /clearseries\n" +
      "• /seriespick NAME\n" +
      "• /fixseries ALT | NEU\n" +
      "• /deleteseries NAME S01E01\n" +
      "• /deleteseriestopic NAME\n" +
      "• /rebuildseasoncards NAME\n\n" +
      
      "━━━━━━━━━━━━━━━━━━\n" +
      "📚 𝐊𝐍𝐎𝐖𝐋𝐄𝐃𝐆𝐄 𝐀𝐑𝐂𝐇𝐈𝐕𝐄\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "• /knowledge — Filmwissen anzeigen\n" +
      "• /addfact Kategorie | Titel | Fakt\n" +
      "• /actor NAME — Schauspieler-Dossier erstellen\n\n" +

      "━━━━━━━━━━━━━━━━━━\n" +
      "🌌 𝐔𝐍𝐈𝐕𝐄𝐑𝐒𝐄 𝐒𝐘𝐒𝐓𝐄𝐌\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "• /rebuildstarwars\n" +
      "• /rebuildstarwarseras\n" +
      "• /rebuilduniversehubs\n" +
      "• /repairmovieuniverses\n\n" +
      "• /testuniverse TITEL\n" +
      "• /rebuildstarwarscenter\n" +
      "• /rebuildmultiverse\n" +
      "• /repairuniverses\n" +
      "• /rebuilddccenter\n" +
      "• /rebuildmarvelcenter\n" +
      "• /rebuilddisneycenter\n" +

      "━━━━━━━━━━━━━━━━━━\n" +
      "🧹 𝐒𝐘𝐒𝐓𝐄𝐌 𝐂𝐎𝐍𝐓𝐑𝐎𝐋\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "• /dashboard\n" +
      "• /stats\n" +
      "• /health\n" +
      "• /queue\n" +
      "• /cache\n" +
      "• /clearcache\n" +
      "• /qualitystats\n" +
      "• /duplicates\n" +
      "• /smartduplicates\n" +
      "• /pgstats\n\n" +

      "🧠 𝐑𝐄𝐏𝐀𝐈𝐑 & 𝐑𝐄𝐂𝐎𝐕𝐄𝐑𝐘\n\n" +
      "• /rebuildcommandcenters\n" +
      "• /cleartopicsdb\n" +
      "• /clearmoviesdb\n" +
      "• /resetpremiumtopic\n" +
      "• /resetelitetopic\n" +
      "• /resetnewreleasestopic\n" +
      "• /resetmovielibrarytopic\n\n" +

      "━━━━━━━━━━━━━━━━━━\n" +
      "💾 𝐃𝐀𝐓𝐀𝐁𝐀𝐒𝐄\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "• /backup — SQLite Backup\n" +
      "• /restoredb — SQLite Restore\n\n" +

      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}

// =============================
// TEST UNIVERSE DETECTION
// =============================
if (command.startsWith("/testuniverse")) {
  const query = text.replace("/testuniverse", "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/testuniverse The Flash"
    });
    return;
  }

  const detected =
    detectUniverse(query, "");

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🌌 UNIVERSE DETECTION TEST\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `🔎 Suche: ${query}\n\n` +
      `🌌 Universe: ${detected?.universeName || "Nicht erkannt"}\n` +
      `🧩 Key: ${detected?.universeKey || "—"}\n` +
      `📁 Phase: ${detected?.phase || "—"}\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
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
  
  if (command === "/scanseriesnews") {
  const seriesTitle =
    text.replace(command, "").trim();

  if (!seriesTitle) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/scanseriesnews Landman"
    });
    return;
  }

  const results =
    await scanSeriesNews(seriesTitle);

  if (!results.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Keine News gefunden für:\n\n" +
        seriesTitle
    });
    return;
  }

  let resultText =
    "███ SERIES NEWS SCAN ███\n\n" +
    `📺 ${seriesTitle.toUpperCase()}\n\n` +
    "━━━━━━━━━━━━━━━━━━\n\n";

  for (const item of results) {
    resultText +=
      `🚨 ${item.title}\n` +
      `📅 ${item.date || "Datum unbekannt"}\n` +
      `📰 ${item.source}\n` +
      `${item.link}\n\n` +
      "━━━━━━━━━━━━━━━━━━\n\n";
  }

  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

if (command === "/importseriesnews") {

  const seriesTitle =
    text.replace(command, "").trim();

  if (!seriesTitle) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/importseriesnews Landman"
    });
    return;
  }

  const result =
  await importSeriesNews(seriesTitle);

  await refreshCommandCenters();
  await updateSeriesSmartTopics();

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "✅ News importiert\n\n" +
      `📺 ${seriesTitle}\n` +
      `📰 Importiert: ${result.imported}\n` +
      `⏭ Übersprungen: ${result.skipped}`
  });

  return;
}

if (command === "/addfact") {
  const raw = text.replace(command, "").trim();

  const parts = raw
    .split("|")
    .map((p) => p.trim());

  if (parts.length < 3) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/addfact Kategorie | Titel | Fakt\n\n" +
        "Oder mit Film-Verknüpfung:\n\n" +
        "/addfact Kategorie | Titel | Film | Fakt\n\n" +
        "Beispiel:\n" +
        "/addfact Romanvorlage | Blitz Novel | Blitz | Der Film basiert auf dem Roman Blitz von Ken Bruen."
    });
    return;
  }

  const category = parts[0];
  const title = parts[1];

  let relatedMovie = null;
let relatedSeries = null;
let content = "";

  if (parts.length >= 4) {
    relatedMovie = parts[2];
    content = parts.slice(3).join(" | ");
  } else {
    content = parts.slice(2).join(" | ");
  }

  const libraryId =
    `KNOW-${String(Date.now()).slice(-6)}`;

  const isActorFact =
    category.toLowerCase().includes("schauspieler");

  await saveKnowledge({
    title,
    category,
    content,
    relatedMovie,
    relatedPerson: isActorFact ? title : null,
    libraryId
  });

  const topicId = await createOrGetTopic({
    chatId: MOVIE_GROUP_ID,
    name: "📚 Knowledge Archive",
    type: "knowledge"
  });

  await tg("sendMessage", {
    chat_id: MOVIE_GROUP_ID,
    message_thread_id: Number(topicId),
    text: knowledgeCaption({
      title,
      category,
      content,
      relatedMovie,
      relatedPerson: isActorFact ? title : "",
      libraryId
    }),
    parse_mode: "HTML"
  });

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "✅ Knowledge Fact gespeichert\n\n" +
      `📚 ${title}\n` +
      `📂 ${category}` +
      (relatedMovie ? `\n🎬 Film • ${relatedMovie}` : "")
  });

  return;
}

if (command === "/seriesinfo") {
  const query =
    text.replace(command, "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/seriesinfo SERIENTITEL\n\n" +
        "Beispiel:\n" +
        "/seriesinfo Tulsa King"
    });
    return;
  }

  const dossier =
    await seriesInfoCaption(query);

  if (!dossier) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Serie nicht gefunden:\n\n" +
        query
    });
    return;
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: dossier,
    parse_mode: "HTML"
  });

  return;
}

if (command === "/movieinfo") {
  const query =
    text.replace(command, "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/movieinfo FILMTITEL\n\n" +
        "Beispiel:\n" +
        "/movieinfo Blitz"
    });
    return;
  }

  const dossier =
    await movieInfoCaption(query);

  if (!dossier) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Film nicht gefunden:\n\n" +
        query
    });
    return;
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: dossier,
    parse_mode: "HTML"
  });

  return;
}

if (command === "/knowledge") {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT title, category, library_id, created_at
      FROM knowledge
      ORDER BY created_at DESC
      LIMIT 50
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT title, category, library_id, created_at
      FROM knowledge
      ORDER BY created_at DESC
      LIMIT 50
    `).all();
  }

  let text =
    "███ KNOWLEDGE ARCHIVE HUB ███\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "<b>📚 FILMWISSEN DATENBANK</b>\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    `📚 Einträge • ${rows.length}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "<b>📖 LATEST INTEL FILES</b>\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!rows.length) {
    text += "Noch keine Knowledge-Einträge gespeichert.\n\n";
  } else {
    rows.forEach((item, index) => {
      text +=
        `${String(index + 1).padStart(2, "0")} • ${item.title || "Unbekannt"}\n` +
        `     📂 ${item.category || "Unbekannt"} • ${item.library_id || "NO-ID"}\n\n`;
    });
  }

  text +=
    "🛰 ARCHIV VERIFIZIERT ✅\n\n" +
    "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text,
    parse_mode: "HTML"
  });

  return;
}

if (command === "/repairseriesnews") {
  const count =
    await repairSeriesNewsCategories();

  await updateSeriesSmartTopics();

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "✅ Serien-News Kategorien repariert\n\n" +
      `📰 Geprüft: ${count}`
  });

  return;
}

if (command === "/actor") {
  const actorName =
    text.replace(command, "").trim();

  if (!actorName) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/actor Schauspielername\n\n" +
        "Beispiel:\n" +
        "/actor Jason Statham"
    });
    return;
  }

  const dossier =
    await actorDossierCaption(actorName);

  const topicId = await createOrGetTopic({
    chatId: MOVIE_GROUP_ID,
    name: "🎭 Schauspieler-Dossiers",
    type: "knowledge_actor"
  });

  await tg("sendMessage", {
    chat_id: MOVIE_GROUP_ID,
    message_thread_id: Number(topicId),
    text: dossier,
    parse_mode: "HTML"
  });

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "✅ Actor Dossier erstellt\n\n" +
      `🎭 ${actorName}`
  });

  return;
}
  
  // =============================
// SET CURRENT SERIES
// =============================
if (command === "/setseries") {
  const name = text.replace(command, "").trim();

  if (!name) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/setseries Serienname\n\n" +
        "Beispiel:\n" +
        "/setseries Tulsa King"
    });
    return;
  }

  CURRENT_SERIES_NAME = name;

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "📺 SERIE GESETZT\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `✅ Aktuelle Serie:\n${CURRENT_SERIES_NAME}\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}

if (command === "/addseriesnews") {
  const raw = text.replace(command, "").trim();
  const parts = raw.split("|").map((p) => p.trim());

  if (parts.length < 4) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/addseriesnews Kategorie | Serie | Überschrift | Text | Tag | Datum\n\n" +
        "Kategorien:\n" +
        "• news\n" +
        "• coming_soon\n" +
        "• production\n" +
        "• new_season\n\n" +
        "Beispiel:\n" +
        "/addseriesnews production | Landman | Staffel 3 geht in Produktion | Drehbeginn Ende August 2026 in Fort Worth, Texas. | Landman | Mai 2026"
    });
    return;
  }

  const [
    category,
    seriesTitle,
    headline,
    body,
    tag,
    newsDate
  ] = parts;

  await saveSeriesNews({
    category: category || "news",
    seriesTitle,
    headline,
    body,
    tag,
    newsDate
  });

  await updateSeriesSmartTopics();

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "✅ Serien-News gespeichert\n\n" +
      `🏷 Kategorie: ${category || "news"}\n` +
      `📺 ${seriesTitle}\n` +
      `🚨 ${headline}`
  });

  return;
}

// =============================
// REPAIR MOVIE UNIVERSES
// =============================
if (text === "/repairmovieuniverses") {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT id, title, collection
      FROM movies
    `);

    rows = result.rows;

    for (const movie of rows) {
      const universeData =
  detectUniverse(movie.title, movie.collection);

console.log("🌌 REPAIR UNIVERSE CHECK:", {
  title: movie.title,
  collection: movie.collection,
  universeData
});

      await pgPool.query(
        `
        UPDATE movies
        SET universe = $1,
            universe_phase = $2
        WHERE id = $3
        `,
        [
          universeData?.universeName || null,
          universeData?.phase || null,
          movie.id
        ]
      );
    }
  } else {
    rows = db.prepare(`
      SELECT id, title, collection
      FROM movies
    `).all();

    for (const movie of rows) {
      const universeData =
        detectUniverse(movie.title, movie.collection);

      db.prepare(`
        UPDATE movies
        SET universe = ?,
            universe_phase = ?
        WHERE id = ?
      `).run(
        universeData?.universeName || null,
        universeData?.phase || null,
        movie.id
      );
    }
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🌌 MOVIE UNIVERSES REPAIRED\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `✅ Filme geprüft: ${rows.length}\n` +
      "✅ Universe-Zuordnung aktualisiert\n\n" +
      "Jetzt ausführen:\n" +
      "/rebuildcommandcenters\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}

if (text === "/repairserieslibrary") {
  const rows = await getSeriesOverviewRows();

  let updated = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const tmdb = await searchSeriesTMDB(
        row.series_title,
        1,
        1
      );

      if (!tmdb?.tmdbId) {
        failed++;
        continue;
      }

      await saveSeriesLibrary({
        title: tmdb.seriesTitle || row.series_title,
        tmdbId: tmdb.tmdbId || null,
        firstAirDate: tmdb.firstAirDate || null,
        lastAirDate: tmdb.lastAirDate || null,
        genres: tmdb.genre || null,
        rating: tmdb.seriesRating || tmdb.rating || null,
        overview: tmdb.overview || null,
        posterUrl: tmdb.seriesPosterUrl || tmdb.posterUrl || null,
        totalSeasons: tmdb.totalSeasons || null,
        totalEpisodes: tmdb.totalEpisodes || null,
        status: tmdb.status || null
      });

      updated++;
      await sleep(700);
    } catch (err) {
      failed++;
      console.error("⚠️ Series Library Repair Fehler:", row.series_title, err.message);
    }
  }

  await updateSeriesSmartTopics();

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "✅ Series Library repariert\n\n" +
      `📺 Aktualisiert: ${updated}\n` +
      `⚠️ Fehler: ${failed}`
  });

  return;
}

// =============================
// LEGACY V2 UNIVERSE COMMANDS — DISABLED IN LIBRARY V3
// =============================
if (
  command === "/rebuildmarvelcenter" ||
  command === "/rebuilddisneycenter" ||
  command === "/rebuilddccenter" ||
  command === "/rebuilduniversehubs" ||
  command === "/repairuniverses"
) {
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "⚠️ Dieser V2-Befehl ist in Library of Legends V3 deaktiviert.\n\n" +
      "Die neue Struktur nutzt feste Topics:\n\n" +
      "🌌 Star Wars Universe\n" +
      "🏰 Disney Universe\n" +
      "🧬 Marvel Universe\n" +
      "🦇 DC Universe\n\n" +
      "Es werden keine separaten Command-Center oder Universe-Hubs mehr automatisch erstellt."
  });

  return;
}

if (text === "/resetpremiumtopic") {
  const topicKey = makeKey(`system_hub-${MOVIE_GROUP_ID}-💎 Premium Quality`);

  if (pgPool) {
    await pgPool.query(
      `
      DELETE FROM topics
      WHERE unique_key = $1
      `,
      [topicKey]
    );
  } else {
    db.prepare(`
      DELETE FROM topics
      WHERE unique_key = ?
    `).run(topicKey);
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: "✅ Premium Quality Topic wurde aus der DB gelöscht. Jetzt /rebuildcommandcenters ausführen."
  });

  return;
}

if (text === "/resetelitetopic") {
  const topicKey = makeKey(`system_hub-${MOVIE_GROUP_ID}-🏆 Elite Archive`);

  if (pgPool) {
    await pgPool.query(
      `
      DELETE FROM topics
      WHERE unique_key = $1
      `,
      [topicKey]
    );
  } else {
    db.prepare(`
      DELETE FROM topics
      WHERE unique_key = ?
    `).run(topicKey);
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "✅ Elite Archive Topic wurde aus der DB gelöscht.\n\n" +
      "Jetzt bitte ausführen:\n" +
      "/rebuildcommandcenters"
  });

  return;
}

if (text === "/resetnewreleasestopic") {
  const topicKey = makeKey(`system_hub-${MOVIE_GROUP_ID}-🔥 New Releases`);

  if (pgPool) {
    await pgPool.query(
      `
      DELETE FROM topics
      WHERE unique_key = $1
      `,
      [topicKey]
    );
  } else {
    db.prepare(`
      DELETE FROM topics
      WHERE unique_key = ?
    `).run(topicKey);
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "✅ New Releases Topic wurde aus der DB gelöscht.\n\n" +
      "Jetzt bitte ausführen:\n" +
      "/rebuildcommandcenters"
  });

  return;
}

if (text === "/resetmovielibrarytopic") {
  const topicKey = makeKey(`system_hub-${MOVIE_GROUP_ID}-🎬 Movie Library`);

  if (pgPool) {
    await pgPool.query(
      `
      DELETE FROM topics
      WHERE unique_key = $1
      `,
      [topicKey]
    );
  } else {
    db.prepare(`
      DELETE FROM topics
      WHERE unique_key = ?
    `).run(topicKey);
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "✅ Movie Library Topic wurde aus der DB gelöscht.\n\n" +
      "Jetzt bitte ausführen:\n" +
      "/rebuildcommandcenters"
  });

  return;
}

if (
  text === "/rebuildmultiverse" ||
  text === "/rebuildstarwars" ||
  text === "/rebuildstarwarseras" ||
  text === "/rebuildstarwarscenter"
) {
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "⚠️ Dieser V2-Hub-Befehl ist in Library of Legends V3 deaktiviert.\n\n" +
      "Die neue Struktur nutzt feste Movie-Topics und das Movie Command Center."
  });

  return;
}

// =============================
// CLEAR CURRENT SERIES
// =============================
if (command === "/clearseries") {
  CURRENT_SERIES_NAME = "";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🗑 SERIENNAME ZURÜCKGESETZT\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "✅ Aktuelle Serie wurde geleert.\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}

// =============================
// SUPABASE / POSTGRES STATS
// =============================
if (command === "/pgstats") {
  if (!pgPool) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Supabase/pgPool ist nicht aktiv.\n\n" +
        "Der Bot läuft aktuell mit SQLite."
    });
    return;
  }

  const movies = await pgPool.query(`SELECT COUNT(*) AS count FROM movies`);
  const seriesEpisodes = await pgPool.query(`SELECT COUNT(*) AS count FROM series`);
  const seriesLibrary = await pgPool.query(`SELECT COUNT(*) AS count FROM series_library`);
  const seriesTopics = await pgPool.query(`SELECT COUNT(*) AS count FROM series_topics`);
  const topics = await pgPool.query(`SELECT COUNT(*) AS count FROM topics`);
  const collections = await pgPool.query(`SELECT COUNT(*) AS count FROM collections`);
  const universes = await pgPool.query(`SELECT COUNT(*) AS count FROM universes`);

  const latestMovie = await pgPool.query(`
    SELECT title, year, created_at
    FROM movies
    ORDER BY created_at DESC
    LIMIT 1
  `);

  const latestSeries = await pgPool.query(`
    SELECT series_title, season, episode, created_at
    FROM series
    ORDER BY created_at DESC
    LIMIT 1
  `);

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🧪 SUPABASE DEBUG\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `🎬 Filme: ${movies.rows[0].count}\n` +
    `📺 Serien: ${seriesLibrary.rows[0].count}\n` +
    `🎞 Serien-Episoden: ${seriesEpisodes.rows[0].count}\n` +
    `🧵 Serien-Topics: ${seriesTopics.rows[0].count}\n` +
    `🧩 Topics gesamt: ${topics.rows[0].count}\n` +
    `🎞 Collections: ${collections.rows[0].count}\n` +
    `🌌 Universes: ${universes.rows[0].count}\n\n`;

  if (latestMovie.rows.length) {
    const m = latestMovie.rows[0];

    resultText +=
      "🎬 Letzter Film:\n" +
      `• ${m.title} ${m.year || ""}\n\n`;
  }

  if (latestSeries.rows.length) {
    const s = latestSeries.rows[0];

    resultText +=
      "📺 Letzte Serienfolge:\n" +
      `• ${s.series_title} ` +
      `S${String(s.season).padStart(2, "0")}` +
      `E${String(s.episode).padStart(2, "0")}\n\n`;
  }

  resultText +=
    "✅ PostgreSQL/Supabase aktiv\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// FIND MOVIE / FILM DEBUG SEARCH
// =============================
if (command === "/findmovie") {
  const query = text.replace(command, "").trim().toLowerCase();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/findmovie Hangover\n" +
        "/findmovie Batman\n" +
        "/findmovie fast"
    });
    return;
  }

  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT
        id,
        title,
        year,
        unique_key,
        file_name,
        collection,
        topic_id,
        telegram_message_id,
        quality,
        resolution,
        file_size
      FROM movies
      WHERE LOWER(title) LIKE $1
         OR LOWER(unique_key) LIKE $1
         OR LOWER(file_name) LIKE $1
         OR LOWER(collection) LIKE $1
      ORDER BY created_at DESC
      LIMIT 10
      `,
      [`%${query}%`]
    );

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT
        id,
        title,
        year,
        unique_key,
        file_name,
        collection,
        topic_id,
        telegram_message_id,
        quality,
        resolution,
        file_size
      FROM movies
      WHERE LOWER(title) LIKE ?
         OR LOWER(unique_key) LIKE ?
         OR LOWER(file_name) LIKE ?
         OR LOWER(collection) LIKE ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(
      `%${query}%`,
      `%${query}%`,
      `%${query}%`,
      `%${query}%`
    );
  }

  if (!rows.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Kein Film gefunden:\n\n" +
        query
    });
    return;
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🔎 FILM DEBUG SUCHE\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  for (const m of rows) {
    resultText +=
      `🆔 ID: ${m.id}\n` +
      `🎬 Titel: ${m.title} ${m.year || ""}\n` +
      `🔑 Key: ${m.unique_key || "leer"}\n` +
      `📁 Datei: ${m.file_name || "leer"}\n` +
      `🎞 Collection: ${m.collection || "leer"}\n` +
      `🧵 Topic ID: ${m.topic_id || "leer"}\n` +
      `💬 Message ID: ${m.telegram_message_id || "leer"}\n` +
      `💎 Qualität: ${m.quality || "leer"}\n` +
      `📺 Auflösung: ${m.resolution || "leer"}\n` +
      `💾 Größe: ${m.file_size || "leer"}\n\n`;
  }

  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

  // =============================
  // BACKUP / RESTORE COMMANDS
  // =============================

if (text === "/restoredb") {
  if (!LAST_RESTORE_FILE_ID) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Keine Backup-Datei erkannt.\n\n" +
        "Sende zuerst eine library.db Datei."
    });
    return;
  }

  try {
    const fileData = await tg("getFile", {
      file_id: LAST_RESTORE_FILE_ID
    });

    if (!fileData?.file_path) {
      throw new Error("Kein file_path erhalten");
    }

    const downloadUrl =
      `https://api.telegram.org/file/bot${TOKEN}/${fileData.file_path}`;

    const response = await axios.get(downloadUrl, {
      responseType: "arraybuffer"
    });

    const dbBuffer = Buffer.from(response.data);

    try {
      db.close();
    } catch (e) {
      console.error("DB close Fehler:", e.message);
    }

    fs.writeFileSync(DB_FILE_PATH, dbBuffer);
    
    const testDb = new Database(DB_FILE_PATH, { readonly: true });

const testStats = {
  movies: testDb.prepare("SELECT COUNT(*) AS count FROM movies").get().count,
  series: testDb.prepare("SELECT COUNT(*) AS count FROM series").get().count,
  topics: testDb.prepare("SELECT COUNT(*) AS count FROM topics").get().count
};

testDb.close();

await tg("sendMessage", {
  chat_id: msg.chat.id,
  text:
    "📦 Backup geprüft:\n\n" +
    `🎬 Filme: ${testStats.movies}\n` +
    `📺 Serien-Episoden: ${testStats.series}\n` +
    `🧵 Themen: ${testStats.topics}`
});

    LAST_RESTORE_FILE_ID = "";

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "✅ Datenbank wiederhergestellt.\n\n" +
        "🔄 Bot startet jetzt automatisch neu.\n" +
        "Danach /stats prüfen."
    });

    setTimeout(() => {
      process.exit(0);
    }, 1500);

  } catch (err) {
    console.error("❌ Restore Fehler:", err.message);

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Restore fehlgeschlagen.\n\n" +
        String(err.message).slice(0, 1000)
    });
  }

  return;
}

if (text === "/backup") {
  try {
    const now = new Date();

    const stamp = now
      .toLocaleString("de-DE", {
        timeZone: "Europe/Berlin"
      })
      .replace(/[.:,\s]/g, "-");

    const backupFileName =
      `library-backup-${stamp}.db`;

    const backupPath =
      path.join("/tmp", backupFileName);

    await db.backup(backupPath);

    const stats = {
      movies: db.prepare("SELECT COUNT(*) AS count FROM movies").get().count,
      series: db.prepare("SELECT COUNT(*) AS count FROM series").get().count,
      topics: db.prepare("SELECT COUNT(*) AS count FROM topics").get().count
    };

    const FormData = require("form-data");
    const form = new FormData();

    form.append("chat_id", msg.chat.id);
    form.append(
      "document",
      fs.createReadStream(backupPath),
      backupFileName
    );

    form.append(
      "caption",
      "━━━━━━━━━━━━━━━━━━\n" +
      "💾 DATENBANK BACKUP\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `📁 Datei: ${backupFileName}\n` +
      `🕒 Zeit: ${now.toLocaleString("de-DE", {
        timeZone: "Europe/Berlin"
      })}\n\n` +
      `🎬 Filme: ${stats.movies}\n` +
      `📺 Serien-Episoden: ${stats.series}\n` +
      `🧵 Themen: ${stats.topics}\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
    );

    await axios.post(`${BASE_URL}/sendDocument`, form, {
      headers: form.getHeaders()
    });

    fs.unlinkSync(backupPath);

  } catch (err) {
    console.error("❌ Backup Fehler:", err.message);

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Backup fehlgeschlagen:\n" + err.message
    });
  }

  return;
}

// =============================
// REBUILD COMMAND CENTERS
// =============================
if (text === "/rebuildcommandcenters") {
  if (REBUILD_COMMAND_CENTERS_RUNNING) {
    console.log("⚠️ Rebuild läuft bereits — ignoriert");
    return;
  }

  REBUILD_COMMAND_CENTERS_RUNNING = true;

  try {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "⏳ Command Centers werden aktualisiert..."
    });

    await refreshCommandCenters();

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "━━━━━━━━━━━━━━━━━━\n" +
        "🎛 COMMAND CENTERS AKTUALISIERT\n" +
        "━━━━━━━━━━━━━━━━━━\n\n" +
        "✅ Fertig\n\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        "@LibraryOfLegends"
    });
  } catch (err) {
    console.error("❌ Rebuild Fehler:", err.message);
  } finally {
    REBUILD_COMMAND_CENTERS_RUNNING = false;
  }

  return;
}

// =============================
// DELETE MOVIE
// =============================
if (command === "/deletemovie") {
  const query = text.replace(command, "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/deletemovie Filmname\n" +
        "/deletemovie Batman\n" +
        "/deletemovie hangover-2009"
    });
    return;
  }

  const search = query.toLowerCase();

  let movie = null;

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT *
      FROM movies
      WHERE LOWER(title) LIKE $1
         OR LOWER(unique_key) LIKE $1
         OR LOWER(file_name) LIKE $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [`%${search}%`]
    );

    movie = result.rows[0] || null;
  } else {
    movie = db.prepare(`
      SELECT *
      FROM movies
      WHERE LOWER(title) LIKE ?
         OR LOWER(unique_key) LIKE ?
         OR LOWER(file_name) LIKE ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(
      `%${search}%`,
      `%${search}%`,
      `%${search}%`
    );
  }

  if (!movie) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Film nicht gefunden:\n\n" +
        query
    });
    return;
  }

  if (pgPool) {
    await pgPool.query(
      `
      DELETE FROM movies
      WHERE id = $1
      `,
      [movie.id]
    );
  } else {
    db.prepare(`
      DELETE FROM movies
      WHERE id = ?
    `).run(movie.id);
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🗑 FILM GELÖSCHT\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `🎬 ${movie.title} ${movie.year || ""}\n` +
      `🔑 ${movie.unique_key || "leer"}\n\n` +
      "✅ Film aus Datenbank entfernt\n\n" +
      "Du kannst ihn jetzt erneut hochladen.\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}

if (text === "/cleartopicsdb") {
  if (pgPool) {
    await pgPool.query(`DELETE FROM topics;`);
  } else {
    db.prepare(`DELETE FROM topics;`).run();
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🧹 TOPIC-DATENBANK GELEERT\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "✅ Alte Topic-IDs wurden gelöscht\n" +
      "✅ Telegram-Themen werden beim nächsten Setup neu verknüpft\n\n" +
      "Führe jetzt aus:\n" +
      "/rebuildcommandcenters\n" +
      "━━━━━━━━━━━━━━━━━━"
  });

  return;
}

// =============================
// DELETE TOPIC / THEMA LÖSCHEN
// =============================
if (text.startsWith("/deletetopic")) {

  const query =
    text.replace("/deletetopic", "").trim();

  if (!query) {

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/deletetopic Themenname\n\n" +
        "Beispiel:\n" +
        "/deletetopic Hangover Filmreihe"
    });

    return;
  }

  let topic = null;

  // =============================
  // SUPABASE SEARCH
  // =============================
  if (pgPool) {

    const result =
      await pgPool.query(
        `
        SELECT *
        FROM topics
        WHERE LOWER(name) LIKE $1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [`%${query.toLowerCase()}%`]
      );

    topic =
      result.rows[0] || null;

  } else {

    // =============================
    // SQLITE FALLBACK
    // =============================
    topic = db.prepare(`
      SELECT *
      FROM topics
      WHERE LOWER(name) LIKE ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(
      `%${query.toLowerCase()}%`
    );

  }

  // =============================
  // NOT FOUND
  // =============================
  if (!topic) {

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Thema nicht gefunden:\n\n" +
        query
    });

    return;
  }

  // =============================
  // DELETE FROM SUPABASE
  // =============================
  if (pgPool) {

    await pgPool.query(
      `
      DELETE FROM topics
      WHERE id = $1
      `,
      [topic.id]
    );

  }

  // =============================
  // DELETE FROM SQLITE
  // =============================
  db.prepare(`
    DELETE FROM topics
    WHERE id = ?
  `).run(topic.id);

  // =============================
  // SUCCESS
  // =============================
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🗑 THEMA GELÖSCHT\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `🧵 ${topic.name}\n\n` +
      "✅ Topic aus Supabase entfernt\n" +
      "✅ Topic aus SQLite entfernt\n\n" +
      "Der Bot erstellt das Thema beim nächsten Upload neu.\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}
  
  // =============================
// DELETE SERIES TOPIC
// =============================
if (text.startsWith("/deleteseriestopic")) {
  const query = text.replace("/deleteseriestopic", "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/deleteseriestopic Tulsa King"
    });
    return;
  }

  const targetKey = makeKey(query);

  let topic = null;

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT *
      FROM series_topics
      WHERE LOWER(series_name) LIKE $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [`%${query.toLowerCase()}%`]
    );

    topic = result.rows[0] || null;
  } else {
    topic = db.prepare(`
      SELECT *
      FROM series_topics
      WHERE LOWER(series_name) LIKE ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(`%${query.toLowerCase()}%`);
  }

  if (!topic) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Serien-Topic nicht gefunden:\n\n" +
        query
    });
    return;
  }

  let deletedEpisodes = 0;

  if (pgPool) {
    const del = await pgPool.query(
      `
      DELETE FROM series
      WHERE LOWER(series_title) LIKE $1
      `,
      [`%${topic.series_name.toLowerCase()}%`]
    );

    deletedEpisodes = del.rowCount || 0;

    await pgPool.query(
      `
      DELETE FROM series_topics
      WHERE id = $1
      `,
      [topic.id]
    );
  } else {
    const del = db.prepare(`
      DELETE FROM series
      WHERE LOWER(series_title) LIKE ?
    `).run(`%${topic.series_name.toLowerCase()}%`);

    deletedEpisodes = del.changes || 0;

    db.prepare(`
      DELETE FROM series_topics
      WHERE id = ?
    `).run(topic.id);
  }

  try {
    await tg("deleteForumTopic", {
      chat_id: SERIES_GROUP_ID,
      message_thread_id: Number(topic.topic_id)
    });
  } catch (err) {
    console.error("⚠️ Telegram Topic Delete Fehler:", err.message);
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🗑 SERIENTOPIC GELÖSCHT\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `📺 Serie: ${topic.series_name}\n` +
      `🧵 Topic ID: ${topic.topic_id}\n` +
      `🧹 Episoden gelöscht: ${deletedEpisodes}\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}

// =============================
// DELETE SINGLE SERIES EPISODE
// =============================
if (text.startsWith("/deleteseries")) {
  const query = text.replace("/deleteseries", "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/deleteseries Tulsa King S01E01"
    });
    return;
  }

  const match = query.match(/(.+)\s+s(\d{1,2})e(\d{1,3})/i);

  if (!match) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Format falsch.\n\n" +
        "Beispiel:\n" +
        "/deleteseries Tulsa King S01E01"
    });
    return;
  }

  const title = match[1].trim();
  const season = Number(match[2]);
  const episode = Number(match[3]);

  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT *
      FROM series
      WHERE season = $1
      AND episode = $2
      `,
      [season, episode]
    );

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT *
      FROM series
      WHERE season = ?
      AND episode = ?
    `).all(season, episode);
  }

  const targetKey = makeKey(title);

  const row = rows.find((r) =>
    makeKey(r.series_title || "") === targetKey ||
    makeKey(r.series_title || "").includes(targetKey) ||
    targetKey.includes(makeKey(r.series_title || ""))
  );

  if (!row) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Episode nicht gefunden.\n\n" +
        `Gesucht: ${title} S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`
    });
    return;
  }

  if (pgPool) {
    await pgPool.query(
      `
      DELETE FROM series
      WHERE id = $1
      `,
      [row.id]
    );
  } else {
    db.prepare(`
      DELETE FROM series
      WHERE id = ?
    `).run(row.id);
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🗑 EPISODE GELÖSCHT\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `📺 ${row.series_title}\n` +
      `🎞 S${String(row.season).padStart(2, "0")}E${String(row.episode).padStart(2, "0")}\n\n` +
      "Du kannst die Episode jetzt erneut hochladen.\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}

// =============================
// QUALITY STATS
// =============================
if (command === "/qualitystats") {
  let movies = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT quality, COUNT(*) AS count
      FROM movies
      GROUP BY quality
      ORDER BY count DESC
    `);

    movies = result.rows;
  } else {
    movies = db.prepare(`
      SELECT quality, COUNT(*) AS count
      FROM movies
      GROUP BY quality
      ORDER BY count DESC
    `).all();
  }

  if (!movies.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "📊 Noch keine Qualitätsdaten gespeichert."
    });
    return;
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "📊 QUALITÄTS-STATISTIK\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  for (const row of movies) {
    resultText += `• ${row.quality || "Unbekannt"}: ${row.count}\n`;
  }

  resultText += "\n━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// SYSTEM HEALTH
// =============================
if (command === "/health") {
  let dbStatus = "SQLite";
  let pgStatus = "Nicht aktiv";
  let pgPing = "Nicht getestet";

  if (pgPool) {
    dbStatus = "Supabase/PostgreSQL";

    try {
      const ping = await pgPool.query(`SELECT NOW() AS now`);
      pgStatus = "Online";
      pgPing = String(ping.rows[0].now);
    } catch (err) {
      pgStatus = "Fehler";
      pgPing = err.message;
    }
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🩺 SYSTEM HEALTH\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "✅ Bot: Online\n" +
      `🗄 Datenbank: ${dbStatus}\n` +
      `🧪 Supabase: ${pgStatus}\n` +
      `🕒 DB Ping: ${pgPing}\n\n` +
      `📥 Queue: ${UPLOAD_QUEUE.length}\n` +
      `⚙️ Queue aktiv: ${UPLOAD_QUEUE_RUNNING ? "Ja" : "Nein"}\n` +
      `🧩 Aktive Uploads: ${ACTIVE_UPLOADS.size}\n` +
      `🕒 Zeit: ${new Date().toLocaleString("de-DE", {
        timeZone: "Europe/Berlin"
      })}\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}

// =============================
// SERIES PROGRESS
// =============================
if (command === "/progress") {
  const query = text.replace(command, "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/progress Serienname\n\n" +
        "Beispiel:\n" +
        "/progress Tulsa King"
    });
    return;
  }

  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT series_title, season, episode
      FROM series
      WHERE LOWER(series_title) LIKE $1
      ORDER BY season ASC, episode ASC
      `,
      [`%${query.toLowerCase()}%`]
    );

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT series_title, season, episode
      FROM series
      WHERE LOWER(series_title) LIKE ?
      ORDER BY season ASC, episode ASC
    `).all(`%${query.toLowerCase()}%`);
  }

  if (!rows.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Keine Serie gefunden für:\n\n" +
        query
    });
    return;
  }

  const seriesTitle = rows[0].series_title;
  const seasons = {};

  for (const row of rows) {
    const season = Number(row.season || 0);
    const episode = Number(row.episode || 0);

    if (!season || !episode) continue;

    if (!seasons[season]) {
      seasons[season] = [];
    }

    seasons[season].push(episode);
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "📈 SERIEN-FORTSCHRITT\n" +
    `📺 ${seriesTitle}\n` +
    "━━━━━━━━━━━━━━━━━━\n\n";

  for (const season of Object.keys(seasons).map(Number).sort((a, b) => a - b)) {
    const episodes = [...new Set(seasons[season])].sort((a, b) => a - b);
    const maxEpisode = Math.max(...episodes);

    const missing = [];

    for (let ep = 1; ep <= maxEpisode; ep++) {
      if (!episodes.includes(ep)) {
        missing.push(ep);
      }
    }

    resultText += `📀 Staffel ${String(season).padStart(2, "0")}\n`;
    resultText += `✅ Vorhanden: ${episodes.length}/${maxEpisode}\n`;

    if (missing.length) {
      resultText +=
        `⚠️ Fehlend: ${missing
          .map(ep => `E${String(ep).padStart(2, "0")}`)
          .join(", ")}\n`;
    } else {
      resultText += "✅ Keine Lücken erkannt\n";
    }

    resultText += "\n";
  }

  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

if (text.startsWith("/rebuildseasoncards")) {
  const query = text.replace("/rebuildseasoncards", "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "⚠️ Nutzung:\n/rebuildseasoncards Game of Thrones"
    });
    return;
  }

  let allRows = [];

if (pgPool) {
  const result = await pgPool.query(`
    SELECT *
    FROM series
    ORDER BY series_title ASC, season ASC, episode ASC
  `);

  allRows = result.rows;
} else {
  allRows = db.prepare(`
    SELECT *
    FROM series
    ORDER BY series_title ASC, season ASC, episode ASC
  `).all();
}

const queryKey = makeKey(query);

const rows = allRows.filter((row) => {
  const titleKey = makeKey(row.series_title || "");
  return titleKey.includes(queryKey) || queryKey.includes(titleKey);
});

  if (!rows.length) {
  let names = [];

if (pgPool) {
  const result = await pgPool.query(`
    SELECT series_title, COUNT(*) AS count
    FROM series
    GROUP BY series_title
    ORDER BY series_title ASC
    LIMIT 30
  `);

  names = result.rows;
} else {
  names = db.prepare(`
    SELECT series_title, COUNT(*) AS count
    FROM series
    GROUP BY series_title
    ORDER BY series_title ASC
    LIMIT 30
  `).all();
}

  let list = "";

  for (const n of names) {
    list += `• ${n.series_title} — ${n.count} Folge(n)\n`;
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      `❌ Keine Serie gefunden für:\n${query}\n\n` +
      "📺 Gespeicherte Serien:\n\n" +
      (list || "Keine Serien gespeichert.")
  });
  return;
}

  const first = rows[0];

  const tmdb = await searchSeriesTMDB(
    first.series_title,
    first.season,
    first.episode
  );

  if (!tmdb) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ TMDB-Daten konnten nicht geladen werden."
    });
    return;
  }

  let topic = null;

if (pgPool) {
  const result = await pgPool.query(
    `
    SELECT *
    FROM topics
    WHERE name = $1
      AND type = 'series'
    LIMIT 1
    `,
    [first.series_title]
  );

  topic = result.rows[0] || null;
} else {
  topic = db.prepare(`
    SELECT *
    FROM topics
    WHERE name = ?
      AND type = 'series'
    LIMIT 1
  `).get(first.series_title);
}

  if (!topic) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Serien-Thema nicht gefunden."
    });
    return;
  }

  const seasons = [
    ...new Set(rows.map((r) => Number(r.season)).filter(Boolean))
  ].sort((a, b) => a - b);

  const separators = await getSeasonSeparators(topic.topic_id);

for (const season of seasons) {
  const seasonKey = String(season).padStart(2, "0");

  delete separators[`card_${seasonKey}`];
}

await saveSeasonSeparators(topic.topic_id, separators);

  let createdCount = 0;
let failedSeasons = [];

for (const season of seasons) {
  const result = await createSeasonCardIfMissing({
    tmdb,
    topicId: topic.topic_id,
    season
  });

  if (result) {
    createdCount++;
  } else {
    failedSeasons.push(`S${String(season).padStart(2, "0")}`);
  }

  await new Promise((resolve) => setTimeout(resolve, 1200));
}

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "✅ Staffelkarten Vorgang beendet:\n\n" +
`📺 ${tmdb.seriesTitle}\n` +
`📀 Gefunden: ${seasons.length} Staffel(n)\n` +
`✅ Erstellt: ${createdCount}\n` +
(failedSeasons.length ? `⚠️ Fehler: ${failedSeasons.join(", ")}` : "🏆 Alle Staffelkarten erstellt")
  });

  return;
}

// =============================
// PREMIUM DASHBOARD
// =============================
if (command === "/dashboard") {
  let movieCount = 0;
  let seriesCount = 0;
  let topicCount = 0;
  let collectionCount = 0;
  let seriesLibraryCount = 0;

  if (pgPool) {
    const movies = await pgPool.query(`SELECT COUNT(*) AS count FROM movies`);
    const series = await pgPool.query(`SELECT COUNT(*) AS count FROM series`);
    const topics = await pgPool.query(`SELECT COUNT(*) AS count FROM topics`);
    const collections = await pgPool.query(`SELECT COUNT(*) AS count FROM collections`);
    const seriesLibrary = await pgPool.query(`SELECT COUNT(*) AS count FROM series_library`);

    movieCount = movies.rows[0].count;
    seriesCount = series.rows[0].count;
    topicCount = topics.rows[0].count;
    collectionCount = collections.rows[0].count;
    seriesLibraryCount = seriesLibrary.rows[0].count;
  } else {
    movieCount = db.prepare("SELECT COUNT(*) AS count FROM movies").get().count;
    seriesCount = db.prepare("SELECT COUNT(*) AS count FROM series").get().count;
    topicCount = db.prepare("SELECT COUNT(*) AS count FROM topics").get().count;
    collectionCount = db.prepare("SELECT COUNT(*) AS count FROM collections").get().count;
    seriesLibraryCount = db.prepare("SELECT COUNT(*) AS count FROM series_library").get().count;
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🎛 PREMIUM DASHBOARD\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `🎬 Filme: ${movieCount}\n` +
      `🎞 Collections: ${collectionCount}\n` +
      `📺 Serien: ${seriesLibraryCount}\n` +
      `🎞 Serien-Episoden: ${seriesCount}\n` +
      `🧵 Themen: ${topicCount}\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "⚙️ SYSTEM STATUS: ONLINE\n" +
      "@LibraryOfLegends"
  });

  return;
}

  // =============================
// STATS
// =============================
if (command === "/stats") {
  let movieCount = 0;
  let seriesEpisodeCount = 0;
  let seriesCount = 0;
  let topicCount = 0;
  let collectionCount = 0;

  if (pgPool) {
    const movies = await pgPool.query(`SELECT COUNT(*) AS count FROM movies`);
    const episodes = await pgPool.query(`SELECT COUNT(*) AS count FROM series`);
    const seriesLib = await pgPool.query(`SELECT COUNT(*) AS count FROM series_library`);
    const topics = await pgPool.query(`SELECT COUNT(*) AS count FROM topics`);
    const collections = await pgPool.query(`SELECT COUNT(*) AS count FROM collections`);

    movieCount = movies.rows[0].count;
    seriesEpisodeCount = episodes.rows[0].count;
    seriesCount = seriesLib.rows[0].count;
    topicCount = topics.rows[0].count;
    collectionCount = collections.rows[0].count;
  } else {
    movieCount = db.prepare("SELECT COUNT(*) AS count FROM movies").get().count;
    seriesEpisodeCount = db.prepare("SELECT COUNT(*) AS count FROM series").get().count;
    seriesCount = db.prepare("SELECT COUNT(*) AS count FROM series_library").get().count;
    topicCount = db.prepare("SELECT COUNT(*) AS count FROM topics").get().count;
    collectionCount = db.prepare("SELECT COUNT(*) AS count FROM collections").get().count;
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "📊 𝐒𝐓𝐀𝐓𝐈𝐒𝐓𝐈𝐊\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `🎬 Filme: ${movieCount}\n` +
      `🎞 Collections: ${collectionCount}\n` +
      `📺 Serien: ${seriesCount}\n` +
      `🎞 Serien-Episoden: ${seriesEpisodeCount}\n` +
      `🧵 Themen gespeichert: ${topicCount}\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}
  
  if (text === "/queue") {
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "📥 UPLOAD QUEUE\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `⏳ Wartend: ${UPLOAD_QUEUE.length}\n` +
      `⚙️ Aktiv: ${UPLOAD_QUEUE_RUNNING ? "Ja" : "Nein"}\n` +
      `🧩 Aktive Uploads: ${ACTIVE_UPLOADS.size}\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}

if (text === "/cache") {
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "⚡ TMDB CACHE\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `📦 Einträge: ${TMDB_CACHE.size}\n` +
      `⏳ TTL: 6 Stunden\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}

if (text === "/clearcache") {

  const before = TMDB_CACHE.size;

  TMDB_CACHE.clear();

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🧹 CACHE GELEERT\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `⚡ Entfernte Einträge: ${before}\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}

  // =============================
// GLOBAL SEARCH
// =============================
if (command === "/search") {
  const query = text.replace(command, "").trim().toLowerCase();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "🔎 Bitte nutze:\n\n" +
        "/search tulsa king"
    });
    return;
  }

  let movies = [];
  let episodes = [];

  if (pgPool) {
    const movieResult = await pgPool.query(
      `
      SELECT title, year, genre
      FROM movies
      WHERE LOWER(title) LIKE $1
         OR LOWER(file_name) LIKE $1
         OR LOWER(unique_key) LIKE $1
      ORDER BY title ASC
      LIMIT 10
      `,
      [`%${query}%`]
    );

    const episodeResult = await pgPool.query(
      `
      SELECT series_title, season, episode, episode_title, genre
      FROM series
      WHERE LOWER(series_title) LIKE $1
         OR LOWER(episode_title) LIKE $1
         OR LOWER(file_name) LIKE $1
         OR LOWER(unique_key) LIKE $1
      ORDER BY series_title ASC, season ASC, episode ASC
      LIMIT 15
      `,
      [`%${query}%`]
    );

    movies = movieResult.rows;
    episodes = episodeResult.rows;
  } else {
    movies = db.prepare(`
      SELECT title, year, genre
      FROM movies
      WHERE LOWER(title) LIKE ?
         OR LOWER(file_name) LIKE ?
         OR LOWER(unique_key) LIKE ?
      ORDER BY title ASC
      LIMIT 10
    `).all(`%${query}%`, `%${query}%`, `%${query}%`);

    episodes = db.prepare(`
      SELECT series_title, season, episode, episode_title, genre
      FROM series
      WHERE LOWER(series_title) LIKE ?
         OR LOWER(episode_title) LIKE ?
         OR LOWER(file_name) LIKE ?
         OR LOWER(unique_key) LIKE ?
      ORDER BY series_title ASC, season ASC, episode ASC
      LIMIT 15
    `).all(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🔎 SUCHE\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `Suchbegriff: ${query}\n\n`;

  if (!movies.length && !episodes.length) {
    resultText += "❌ Nichts gefunden.";
  }

  if (movies.length) {
    resultText += "🎬 FILME\n\n";

    for (const m of movies) {
      resultText += `• ${m.title} ${m.year || ""}\n`;
      resultText += `  🎭 ${m.genre || "Unbekannt"}\n\n`;
    }
  }

  if (episodes.length) {
    resultText += "📺 SERIEN\n\n";

    for (const s of episodes) {
      resultText +=
        `• ${s.series_title} ` +
        `S${String(s.season).padStart(2, "0")}` +
        `E${String(s.episode).padStart(2, "0")}\n`;

      if (s.episode_title) {
        resultText += `  🎞 ${s.episode_title}\n`;
      }

      resultText += `  🎭 ${s.genre || "Unbekannt"}\n\n`;
    }
  }

  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// REBUILD COLLECTION HUBS
// =============================
if (command === "/rebuildcollections") {
  let collections = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT *
      FROM collections
      WHERE topic_id IS NOT NULL
      ORDER BY collection_name ASC
    `);

    collections = result.rows;
  } else {
    collections = db.prepare(`
      SELECT *
      FROM collections
      WHERE topic_id IS NOT NULL
      ORDER BY collection_name ASC
    `).all();
  }

  if (!collections.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Keine Collections mit Topic-ID gefunden.\n\n" +
        "Erst Filme mit Filmreihen hochladen."
    });
    return;
  }

  let updated = 0;
  let failed = 0;

  for (const c of collections) {
    try {
      const fakeTmdb = {
        collection: c.collection_name,
        collectionId: c.tmdb_collection_id,
        posterUrl: c.poster_url || null
      };

      await createOrUpdateCollectionHub(fakeTmdb, c.topic_id);

      updated++;

      await new Promise((resolve) => setTimeout(resolve, 700));
    } catch (err) {
      failed++;

      console.error("⚠️ Collection Rebuild Fehler:", {
        collection: c.collection_name,
        error: err.message
      });
    }
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🎞 COLLECTION REBUILD\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `✅ Aktualisiert: ${updated}\n` +
      `⚠️ Fehler: ${failed}\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}
  
  // =============================
// COLLECTIONS LIST
// =============================
if (command === "/collections") {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT 
        c.collection_name,
        c.tmdb_collection_id,
        c.topic_id,
        COUNT(m.id) AS movie_count
      FROM collections c
      LEFT JOIN movies m
        ON m.collection = c.collection_name
      GROUP BY c.id, c.collection_name, c.tmdb_collection_id, c.topic_id
      ORDER BY c.collection_name ASC
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT 
        c.collection_name,
        c.tmdb_collection_id,
        c.topic_id,
        COUNT(m.id) AS movie_count
      FROM collections c
      LEFT JOIN movies m
        ON m.collection = c.collection_name
      GROUP BY c.id
      ORDER BY c.collection_name ASC
    `).all();
  }

  if (!rows.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "🎞 Noch keine Filmreihen gespeichert."
    });
    return;
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🎞 FILMREIHEN\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  for (const row of rows) {
    resultText += `🎞 ${row.collection_name}\n`;
    resultText += `🎬 Filme: ${row.movie_count || 0}\n`;
    resultText += `🧵 Topic: ${row.topic_id || "nicht gesetzt"}\n\n`;
  }

  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// SINGLE COLLECTION
// =============================
if (command === "/collection") {
  const query = text.replace(command, "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/collection Star Wars\n\n" +
        "Beispiel:\n" +
        "/collection Fast & Furious"
    });
    return;
  }

  let collection = null;
  let movies = [];

  if (pgPool) {
    const collectionResult = await pgPool.query(
      `
      SELECT *
      FROM collections
      WHERE LOWER(collection_name) LIKE $1
      ORDER BY collection_name ASC
      LIMIT 1
      `,
      [`%${query.toLowerCase()}%`]
    );

    collection = collectionResult.rows[0] || null;

    if (collection) {
      const movieResult = await pgPool.query(
        `
        SELECT title, year, rating
        FROM movies
        WHERE collection = $1
        ORDER BY year ASC, title ASC
        `,
        [collection.collection_name]
      );

      movies = movieResult.rows;
    }
  } else {
    collection = db.prepare(`
      SELECT *
      FROM collections
      WHERE LOWER(collection_name) LIKE ?
      ORDER BY collection_name ASC
      LIMIT 1
    `).get(`%${query.toLowerCase()}%`);

    if (collection) {
      movies = db.prepare(`
        SELECT title, year, rating
        FROM movies
        WHERE collection = ?
        ORDER BY year ASC, title ASC
      `).all(collection.collection_name);
    }
  }

  if (!collection) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Keine Filmreihe gefunden:\n\n" +
        query
    });
    return;
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🎞 FILMREIHE\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `🎬 ${collection.collection_name}\n` +
    `🧩 TMDB Collection ID: ${collection.tmdb_collection_id || "Unbekannt"}\n` +
    `🧵 Topic ID: ${collection.topic_id || "nicht gesetzt"}\n\n`;

  if (!movies.length) {
    resultText += "Noch keine Filme in dieser Filmreihe gespeichert.\n";
  } else {
    resultText += "🎬 FILME\n\n";

    for (const m of movies) {
      resultText += `• ${m.title} ${m.year || ""}\n`;
      resultText += `  ⭐ ${m.rating || "Unbekannt"}\n\n`;
    }
  }

  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

  // =============================
// MOVIE LIST
// =============================
if (command === "/movies") {
  let movies = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT title, year, genre, rating
      FROM movies
      ORDER BY title ASC
      LIMIT 50
    `);

    movies = result.rows;
  } else {
    movies = db.prepare(`
      SELECT title, year, genre, rating
      FROM movies
      ORDER BY title ASC
      LIMIT 50
    `).all();
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🎬 FILME\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!movies.length) {
    resultText += "Noch keine Filme gespeichert.\n";
  } else {
    for (const m of movies) {
      resultText += `• ${m.title} ${m.year || ""}\n`;
      resultText += `  🎭 ${m.genre || "Unbekannt"}\n`;
      resultText += `  ⭐ ${m.rating || "Unbekannt"}\n\n`;
    }
  }

  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

  // =============================
// SERIES LIST
// =============================
if (command === "/series") {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT series_title, COUNT(*) AS count
      FROM series
      GROUP BY series_title
      ORDER BY series_title ASC
      LIMIT 50
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT series_title, COUNT(*) AS count
      FROM series
      GROUP BY series_title
      ORDER BY series_title ASC
      LIMIT 50
    `).all();
  }

  let resultText = "📺 𝐒𝐄𝐑𝐈𝐄𝐍\n\n";

  if (!rows.length) {
    resultText += "Noch keine Serien gespeichert.";
  } else {
    for (const s of rows) {
      resultText += `• ${s.series_title} — ${s.count} Episode(n)\n`;
    }
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: resultText
  });

  return;
}

// =============================
// SERIES A-Z
// =============================
if (command === "/seriesaz") {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT
  series_title,
  MAX(genre) AS genre,
  MAX(rating) AS rating,
  COUNT(*) AS count
FROM series
GROUP BY series_title
ORDER BY series_title ASC
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT series_title, genre, rating, COUNT(*) AS count
      FROM series
      GROUP BY series_title
      ORDER BY series_title ASC
    `).all();
  }

  if (!rows.length) {
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: "📺 Noch keine Serien gespeichert."
  });
  return;
}

console.log("📺 SERIESAZ ROWS:", rows);

let currentLetter = "";
let resultText =
  "━━━━━━━━━━━━━━━━━━\n" +
  "🔤 SERIEN A-Z\n" +
  "━━━━━━━━━━━━━━━━━━\n";

  for (const s of rows) {
    const letter = String(s.series_title || "#").charAt(0).toUpperCase();

    if (letter !== currentLetter) {
      currentLetter = letter;
      resultText += `\n${currentLetter}\n`;
    }

    const genreText = String(s.genre || "Sonstige")
      .split("/")
      .map((g) => g.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(" • ");

    resultText += `• ${s.series_title}\n`;
    resultText += `  📀 ${s.count} Episode(n)\n`;
    resultText += `  🎭 ${genreText}\n`;
    resultText += `  ⭐ ${s.rating || "Unbekannt"}\n\n`;
  }

  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  console.log("📺 SERIESAZ RESULT:", resultText);

await tg("sendMessage", {
  chat_id: msg.chat.id,
  text: cleanTelegramText(resultText).slice(0, 4000)
});

  return;
}

// =============================
// NEW SERIES EPISODES
// =============================
if (command === "/newseries") {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT series_title, season, episode, episode_title, genre, rating, created_at
      FROM series
      ORDER BY created_at DESC
      LIMIT 10
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT series_title, season, episode, episode_title, genre, rating, created_at
      FROM series
      ORDER BY created_at DESC
      LIMIT 10
    `).all();
  }

  if (!rows.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "📺 Noch keine neuen Serienfolgen gespeichert."
    });
    return;
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🆕 NEUE FOLGEN\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  for (const s of rows) {
    const seasonText = String(s.season).padStart(2, "0");
    const episodeText = String(s.episode).padStart(2, "0");

    const genreText = String(s.genre || "Sonstige")
      .split("/")
      .map((g) => g.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(" • ");

    resultText += `📺 ${s.series_title}\n`;
    resultText += `🎞 S${seasonText}E${episodeText}`;
    if (s.episode_title) resultText += ` • ${s.episode_title}`;
    resultText += "\n";
    resultText += `🎭 ${genreText}\n`;
    resultText += `⭐ ${s.rating || "Unbekannt"}\n\n`;
  }

  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: resultText.slice(0, 4000)
  });

  return;
}

// =============================
// TRENDING SERIES
// =============================
if (command === "/trendingseries") {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT
        series_title,
        MAX(genre) AS genre,
        MAX(rating) AS rating,
        COUNT(*) AS count
      FROM series
      GROUP BY series_title
      ORDER BY count DESC, series_title ASC
      LIMIT 10
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT series_title, genre, rating, COUNT(*) AS count
      FROM series
      GROUP BY series_title
      ORDER BY count DESC, series_title ASC
      LIMIT 10
    `).all();
  }

  if (!rows.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "🔥 Noch keine Trending-Serien verfügbar."
    });
    return;
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🔥 TRENDING SERIEN\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  let rank = 1;

  for (const s of rows) {
    const genreText = String(s.genre || "Sonstige")
      .split("/")
      .map((g) => g.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(" • ");

    resultText += `#${rank} 📺 ${s.series_title}\n`;
    resultText += `📀 ${s.count} Episode(n)\n`;
    resultText += `🎭 ${genreText}\n`;
    resultText += `⭐ ${s.rating || "Unbekannt"}\n\n`;

    rank++;
  }

  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// FEATURED SERIES
// =============================
if (command === "/featuredseries") {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT
        series_title,
        MAX(genre) AS genre,
        MAX(rating) AS rating,
        COUNT(*) AS count
      FROM series
      GROUP BY series_title
      ORDER BY MAX(rating) DESC, count DESC, series_title ASC
      LIMIT 10
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT series_title, genre, rating, COUNT(*) AS count
      FROM series
      GROUP BY series_title
      ORDER BY rating DESC, count DESC, series_title ASC
      LIMIT 10
    `).all();
  }
  
  rows.sort((a, b) => {
  const ratingA = extractRatingNumber(a.rating);
  const ratingB = extractRatingNumber(b.rating);

  if (ratingB !== ratingA) {
    return ratingB - ratingA;
  }

  return Number(b.count || 0) - Number(a.count || 0);
});

  if (!rows.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "⭐ Noch keine Featured-Serien verfügbar."
    });
    return;
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "⭐ FEATURED SERIEN\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  let rank = 1;

for (const s of rows) {

  const genreText = String(s.genre || "Sonstige")
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" • ");

  resultText += `#${rank} 📺 ${s.series_title}\n`;
  resultText += `📀 ${s.count} Episode(n)\n`;
  resultText += `🎭 ${genreText}\n`;
  resultText += `⭐ ${s.rating || "Unbekannt"}\n\n`;

  rank++; // ← GENAU HIER
}

resultText += "━━━━━━━━━━━━━━━━━━\n";
resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// SERIES HUB
// =============================
if (command === "/serieshub") {
  let latest = [];
  let trending = [];
  let featured = [];

  if (pgPool) {
    const latestResult = await pgPool.query(`
      SELECT series_title, season, episode, episode_title
      FROM series
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const trendingResult = await pgPool.query(`
      SELECT series_title, COUNT(*) AS count
      FROM series
      GROUP BY series_title
      ORDER BY count DESC, series_title ASC
      LIMIT 5
    `);

    const featuredResult = await pgPool.query(`
      SELECT
        series_title,
        MAX(genre) AS genre,
        MAX(rating) AS rating,
        COUNT(*) AS count
      FROM series
      GROUP BY series_title
      ORDER BY MAX(rating) DESC, count DESC, series_title ASC
      LIMIT 5
    `);

    latest = latestResult.rows;
    trending = trendingResult.rows;
    featured = featuredResult.rows;
  } else {
    latest = db.prepare(`
      SELECT series_title, season, episode, episode_title
      FROM series
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    trending = db.prepare(`
      SELECT series_title, COUNT(*) AS count
      FROM series
      GROUP BY series_title
      ORDER BY count DESC, series_title ASC
      LIMIT 5
    `).all();

    featured = db.prepare(`
      SELECT series_title, genre, rating, COUNT(*) AS count
      FROM series
      GROUP BY series_title
      ORDER BY rating DESC, count DESC, series_title ASC
      LIMIT 5
    `).all();
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "📺 SERIES HUB\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  resultText += "🆕 NEUE FOLGEN\n";
  if (!latest.length) {
    resultText += "Noch keine Folgen gespeichert.\n\n";
  } else {
    for (const s of latest) {
      resultText += `• ${s.series_title} S${String(s.season).padStart(2, "0")}E${String(s.episode).padStart(2, "0")}`;
      if (s.episode_title) resultText += ` • ${s.episode_title}`;
      resultText += "\n";
    }
    resultText += "\n";
  }

  resultText += "🔥 TRENDING\n";
  if (!trending.length) {
    resultText += "Noch keine Trends verfügbar.\n\n";
  } else {
    for (const s of trending) {
      resultText += `• ${s.series_title} — ${s.count} Episode(n)\n`;
    }
    resultText += "\n";
  }

  resultText += "⭐ FEATURED\n";
  if (!featured.length) {
    resultText += "Noch keine Featured-Serien verfügbar.\n\n";
  } else {
    for (const s of featured) {
      resultText += `• ${s.series_title} — ${s.rating || "Unbekannt"}\n`;
    }
    resultText += "\n";
  }

  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += "🔤 /seriesaz — Serien A-Z\n";
  resultText += "🆕 /newseries — Neue Folgen\n";
  resultText += "🔥 /trendingseries — Trending\n";
  resultText += "⭐ /featuredseries — Featured\n";
  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// MISSING SERIES EPISODES
// =============================
if (command === "/missingseries") {

  const query = text.replace(command, "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/missingseries Tulsa King"
    });
    return;
  }

  let rows = [];

  if (pgPool) {

    const result = await pgPool.query(
      `
      SELECT series_title, season, episode
      FROM series
      WHERE LOWER(series_title) LIKE $1
      ORDER BY season ASC, episode ASC
      `,
      [`%${query.toLowerCase()}%`]
    );

    rows = result.rows;

  } else {

    rows = db.prepare(`
      SELECT series_title, season, episode
      FROM series
      WHERE LOWER(series_title) LIKE ?
      ORDER BY season ASC, episode ASC
    `).all(`%${query.toLowerCase()}%`);
  }

  if (!rows.length) {

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Keine Serie gefunden:\n\n" +
        query
    });

    return;
  }

  const seasons = {};

  for (const row of rows) {

    const season = Number(row.season);
    const episode = Number(row.episode);

    if (!seasons[season]) {
      seasons[season] = [];
    }

    seasons[season].push(episode);
  }

  let resultText =
    "⚠️ Fehlende Episoden:\n\n" +
    `📺 ${rows[0].series_title}\n\n`;

  let missingCount = 0;

  for (const season of Object.keys(seasons)
    .map(Number)
    .sort((a, b) => a - b)) {

    const episodes =
      [...new Set(seasons[season])]
      .sort((a, b) => a - b);

    const maxEpisode =
      Math.max(...episodes);

    const missing = [];

    for (let ep = 1; ep <= maxEpisode; ep++) {

      if (!episodes.includes(ep)) {
        missing.push(ep);
      }
    }

    if (missing.length) {

      resultText +=
        `📀 Staffel ${String(season).padStart(2,"0")}\n\n`;

      for (const ep of missing) {

        resultText +=
          `• S${String(season).padStart(2,"0")}E${String(ep).padStart(2,"0")}\n`;

        missingCount++;
      }

      resultText += "\n";
    }
  }

  if (!missingCount) {

    resultText =
      "━━━━━━━━━━━━━━━━━━\n" +
      "✅ SERIE VOLLSTÄNDIG\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `📺 ${rows[0].series_title}\n\n` +
      "Keine fehlenden Episoden gefunden.\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends";
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

if (command === "/missing") {
  await handleMissingCommand(msg, text);
  return;
}

// =============================
// CHECK SERIES PREMIUM SCAN
// =============================
if (command === "/checkseries") {
  const query = text.replace(command, "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/checkseries Serienname\n\n" +
        "Beispiel:\n" +
        "/checkseries Tulsa King"
    });
    return;
  }

  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT *
      FROM series
      WHERE LOWER(series_title) LIKE $1
      ORDER BY season ASC, episode ASC
      `,
      [`%${query.toLowerCase()}%`]
    );

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT *
      FROM series
      WHERE LOWER(series_title) LIKE ?
      ORDER BY season ASC, episode ASC
    `).all(`%${query.toLowerCase()}%`);
  }

  if (!rows.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Keine Serie gefunden:\n\n" +
        query
    });
    return;
  }

  const seriesTitle = rows[0].series_title;

  const grouped = {};

  for (const row of rows) {
    const season = Number(row.season || 0);
    const episode = Number(row.episode || 0);

    if (!season || !episode) continue;

    if (!grouped[season]) {
      grouped[season] = [];
    }

    grouped[season].push(episode);
  }

  let totalSavedEpisodes = 0;
  let totalKnownEpisodes = 0;
  let totalMissing = 0;

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🧩 PREMIUM SERIES SCAN\n" +
    `📺 ${String(seriesTitle).toUpperCase()}\n` +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    "📁 SERIES ARCHIVE\n" +
    "PREMIUM EPISODE DATABASE\n" +
    "🎞 SERIES ACTIVE\n\n";

  const seasons = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  for (const season of seasons) {
    const existing = [...new Set(grouped[season])]
      .sort((a, b) => a - b);

    const knownCount =
      Math.max(...existing);

    totalKnownEpisodes += knownCount;
    totalSavedEpisodes += existing.length;

    const missing = [];

    for (let ep = 1; ep <= knownCount; ep++) {
      if (!existing.includes(ep)) {
        missing.push(ep);
      }
    }

    totalMissing += missing.length;

    resultText += "━━━━━━━━━━━━━━━━━━\n";
    resultText += `📀 STAFFEL ${String(season).padStart(2, "0")}\n`;
    resultText += `✅ VORHANDEN: ${existing.length}/${knownCount}\n`;

    if (missing.length) {
      resultText +=
        "⚠️ FEHLEND: " +
        missing
          .map(ep => `E${String(ep).padStart(2, "0")}`)
          .join(", ") +
        "\n";

      resultText += "⚠️ STATUS: UNVOLLSTÄNDIG\n\n";
    } else {
      resultText += "🏆 STATUS: VOLLSTÄNDIG\n\n";
    }
  }

  const percent =
    totalKnownEpisodes > 0
      ? Math.round((totalSavedEpisodes / totalKnownEpisodes) * 100)
      : 0;

  const progressBar =
    "█".repeat(Math.floor(percent / 10)) +
    "░".repeat(10 - Math.floor(percent / 10));

  let rank = "BRONZE";

  if (percent >= 100) {
    rank = "LEGEND";
  } else if (percent >= 90) {
    rank = "ELITE";
  } else if (percent >= 75) {
    rank = "GOLD";
  } else if (percent >= 50) {
    rank = "SILBER";
  }

  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += `📊 GESAMT: ${progressBar} ${percent}% • ${totalSavedEpisodes}/${totalKnownEpisodes}\n`;

  if (totalMissing) {
    resultText += `⚠️ FEHLENDE EPISODEN: ${totalMissing}\n`;
  } else {
    resultText += "✅ KOMPLETTE SERIE\n";
  }

  resultText += `🏅 SERIEN-RANG: ${rank}\n`;
  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

  if (text === "/az") {
    const movies = db.prepare(`
      SELECT title, year
      FROM movies
      ORDER BY title ASC
    `).all();

    const series = db.prepare(`
      SELECT series_title, COUNT(*) AS count
      FROM series
      GROUP BY series_title
      ORDER BY series_title ASC
    `).all();

    let result = "🔤 𝐀–𝐙 𝐋𝐈𝐒𝐓𝐄\n\n";

    result += "🎬 𝐅𝐈𝐋𝐌𝐄\n";
    if (!movies.length) {
      result += "Keine Filme gespeichert.\n";
    } else {
      for (const m of movies) {
        result += `• ${m.title} ${m.year || ""}\n`;
      }
    }

    result += "\n📺 𝐒𝐄𝐑𝐈𝐄𝐍\n";
    if (!series.length) {
      result += "Keine Serien gespeichert.\n";
    } else {
      for (const s of series) {
        result += `• ${s.series_title} — ${s.count} Episode(n)\n`;
      }
    }

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: result
    });
    return;
  }
  
  if (text.startsWith("/fixmovie")) {
  const query = text.replace("/fixmovie", "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "⚠️ Nutzung:\n/fixmovie AlterTitel | Neuer Titel | Jahr\n\nBeispiel:\n/fixmovie Der Pate | The Godfather | 1972"
    });
    return;
  }

  const parts = query.split("|").map((p) => p.trim());

  if (parts.length < 2) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Format falsch.\nBeispiel:\n/fixmovie Der Pate | The Godfather | 1972"
    });
    return;
  }

  const oldTitle = parts[0];
  const newTitle = parts[1];
  const year = parts[2] || "";

  const movie = db.prepare(`
    SELECT * FROM movies
    WHERE LOWER(title) LIKE ?
    LIMIT 1
  `).get(`%${oldTitle.toLowerCase()}%`);

  if (!movie) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Film in Datenbank nicht gefunden."
    });
    return;
  }

  const tmdb = await searchMovieTMDB(newTitle, year);

  if (!tmdb) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Keine TMDB-Daten für den neuen Titel gefunden."
    });
    return;
  }

  db.prepare(`
    UPDATE movies
    SET title = ?, year = ?, genre = ?, rating = ?, runtime = ?, overview = ?,
        poster_url = ?, collection = ?, fsk = ?, director = ?, cast = ?,
        unique_key = ?
    WHERE id = ?
  `).run(
    tmdb.title,
    tmdb.year,
    tmdb.genre,
    tmdb.rating,
    tmdb.runtime,
    tmdb.overview,
    tmdb.posterUrl,
    tmdb.collection,
    tmdb.fsk,
    tmdb.director,
    tmdb.cast,
    makeKey(`${tmdb.title}-${tmdb.year || "unknown"}`),
    movie.id
  );

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "✅ Film korrigiert:\n\n" +
      `Alt: ${movie.title} ${movie.year || ""}\n` +
      `Neu: ${tmdb.title} ${tmdb.year || ""}`
  });

  return;
}

// =============================
// EDIT MOVIE — SUPABASE / SQLITE
// =============================
if (text.startsWith("/editmovie")) {
  const query =
    text.replace("/editmovie", "").trim();

  if (!query || !query.includes("|")) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/editmovie Suchname | feld=wert | feld=wert\n\n" +
        "Beispiele:\n" +
        "/editmovie Vaiana | rating=7.6 | genre=Animation/Abenteuer\n" +
        "/editmovie Hannibal | collection=Hannibal Lecter Filmreihe\n" +
        "/editmovie Vaiana | collection=-"
    });

    return;
  }

  const parts =
    query
      .split("|")
      .map((p) => p.trim())
      .filter(Boolean);

  const searchText =
    parts.shift();

  if (!searchText) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Kein Suchname angegeben."
    });

    return;
  }

  function normalizeEditValue(value = "") {
    const clean =
      String(value || "").trim();

    const lower =
      clean.toLowerCase();

    if (
      lower === "-" ||
      lower === "null" ||
      lower === "leer" ||
      lower === "none"
    ) {
      return null;
    }

    return clean;
  }

  const fieldMap = {
    title: "title",
    titel: "title",
    name: "title",

    year: "year",
    jahr: "year",

    genre: "genre",
    genres: "genre",

    rating: "rating",
    imdb: "rating",
    bewertung: "rating",

    runtime: "runtime",
    laufzeit: "runtime",

    overview: "overview",
    story: "overview",
    beschreibung: "overview",

    collection: "collection",
    reihe: "collection",
    filmreihe: "collection",

    quality: "quality",
    qualität: "quality",

    audio: "audio",
    sprache: "audio",

    source: "source",
    quelle: "source",

    fsk: "fsk",

    director: "director",
    regie: "director",

    cast: pgPool ? "cast_list" : "cast",
    darsteller: pgPool ? "cast_list" : "cast",

    libraryid: "library_id",
    library_id: "library_id",
    ref: "library_id",

    resolution: "resolution",
    auflösung: "resolution",

    filesize: "file_size",
    file_size: "file_size",
    größe: "file_size",
    speicher: "file_size",

    videocodec: "video_codec",
    video_codec: "video_codec",
    codec: "video_codec",

    audiocodec: "audio_codec",
    audio_codec: "audio_codec",

    audiochannels: "audio_channels",
    audio_channels: "audio_channels",
    kanäle: "audio_channels",

    hdr: "hdr",

    universe: "universe",
    universum: "universe",

    universephase: "universe_phase",
    universe_phase: "universe_phase",
    phase: "universe_phase",

    starwarsera: "starwars_era",
    starwars_era: "starwars_era",
    era: "starwars_era"
  };

  const updateValues = {};

  for (const part of parts) {
    const equalIndex =
      part.indexOf("=");

    if (equalIndex === -1) {
      continue;
    }

    const rawKey =
      part
        .slice(0, equalIndex)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/-/g, "_");

    const rawValue =
      part.slice(equalIndex + 1);

    const dbField =
      fieldMap[rawKey];

    if (!dbField) {
      continue;
    }

    updateValues[dbField] =
      normalizeEditValue(rawValue);
  }

  if (!Object.keys(updateValues).length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Keine gültigen Felder erkannt.\n\n" +
        "Erlaubt sind z.B.:\n" +
        "title, year, genre, rating, runtime, overview,\n" +
        "collection, quality, source, fsk, director, cast"
    });

    return;
  }

  let movie = null;

  const search =
    `%${searchText.toLowerCase()}%`;

  if (pgPool) {
    const result =
      await pgPool.query(
        `
        SELECT *
        FROM movies
        WHERE LOWER(title) LIKE $1
           OR LOWER(file_name) LIKE $1
           OR LOWER(unique_key) LIKE $1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [search]
      );

    movie =
      result.rows[0] || null;
  } else {
    movie =
      db.prepare(`
        SELECT *
        FROM movies
        WHERE LOWER(title) LIKE ?
           OR LOWER(file_name) LIKE ?
           OR LOWER(unique_key) LIKE ?
        ORDER BY created_at DESC
        LIMIT 1
      `).get(search, search, search);
  }

  if (!movie) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Film nicht gefunden:\n\n" +
        searchText
    });

    return;
  }

  const nextTitle =
    updateValues.title ??
    movie.title;

  const nextYear =
    updateValues.year ??
    movie.year;

  if (
    Object.prototype.hasOwnProperty.call(updateValues, "title") ||
    Object.prototype.hasOwnProperty.call(updateValues, "year")
  ) {
    updateValues.unique_key =
      makeKey(`${nextTitle}-${nextYear || "unknown"}`);
  }

  const entries =
    Object.entries(updateValues);

  try {
    if (pgPool) {
      const setSql =
        entries
          .map(([field], index) =>
            `${field} = $${index + 1}`
          )
          .join(", ");

      await pgPool.query(
        `
        UPDATE movies
        SET ${setSql}
        WHERE id = $${entries.length + 1}
        `,
        [
          ...entries.map(([, value]) => value),
          movie.id
        ]
      );
    } else {
      const setSql =
        entries
          .map(([field]) =>
            `${field} = ?`
          )
          .join(", ");

      db.prepare(`
        UPDATE movies
        SET ${setSql}
        WHERE id = ?
      `).run(
        ...entries.map(([, value]) => value),
        movie.id
      );
    }
  } catch (err) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Film konnte nicht aktualisiert werden:\n\n" +
        err.message
    });

    return;
  }

  let updatedMovie = null;

  if (pgPool) {
    const result =
      await pgPool.query(
        `
        SELECT *
        FROM movies
        WHERE id = $1
        LIMIT 1
        `,
        [movie.id]
      );

    updatedMovie =
      result.rows[0] || movie;
  } else {
    updatedMovie =
      db.prepare(`
        SELECT *
        FROM movies
        WHERE id = ?
        LIMIT 1
      `).get(movie.id) || movie;
  }

  const finalTmdb = {
    title:
      updatedMovie.title,

    year:
      updatedMovie.year,

    genre:
      updatedMovie.genre,

    rating:
      updatedMovie.rating,

    runtime:
      updatedMovie.runtime,

    overview:
      updatedMovie.overview,

    posterUrl:
      updatedMovie.poster_url,

    fsk:
      updatedMovie.fsk,

    director:
      updatedMovie.director,

    cast:
      updatedMovie.cast_list ||
      updatedMovie.cast,

    collection:
      updatedMovie.collection
  };

  const finalExtras = {
    quality:
      updatedMovie.quality || "HD",

    audio:
      updatedMovie.audio || "Deutsch",

    source:
      updatedMovie.source || "Unbekannt",

    libraryId:
      updatedMovie.library_id || "",

    resolution:
      updatedMovie.resolution || "Unbekannt",

    fileSize:
      updatedMovie.file_size || "Unbekannt",

    fileSizeBytes:
      updatedMovie.file_size_bytes || null,

    videoCodec:
      updatedMovie.video_codec || "Unbekannt",

    audioCodec:
      updatedMovie.audio_codec || "Unbekannt",

    audioChannels:
      updatedMovie.audio_channels || "Unbekannt",

    hdr:
      updatedMovie.hdr || null,

    universe:
      updatedMovie.universe || null,

    universePhase:
      updatedMovie.universe_phase || null,

    collection:
      updatedMovie.collection || null
  };

  if (updatedMovie.collection) {
    let collectionRows = [];

    if (pgPool) {
      const result =
        await pgPool.query(
          `
          SELECT title, year
          FROM movies
          WHERE LOWER(collection) = LOWER($1)
          ORDER BY year ASC, title ASC
          `,
          [updatedMovie.collection]
        );

      collectionRows =
        result.rows;
    } else {
      collectionRows =
        db.prepare(`
          SELECT title, year
          FROM movies
          WHERE LOWER(collection) = LOWER(?)
          ORDER BY year ASC, title ASC
        `).all(updatedMovie.collection);
    }

    finalExtras.collectionMovies =
      collectionRows.length || 1;

    finalExtras.collectionOrder =
      collectionRows.map((row) => ({
        title: row.title,
        year: row.year
      }));
  }

  const newCaption =
    updatedMovie.collection
      ? collectionSagaCaption(finalTmdb, finalExtras)
      : movieCaption(finalTmdb, finalExtras);

  let captionStatus =
    "ℹ️ Telegram-Caption nicht aktualisiert.";

  if (updatedMovie.telegram_message_id) {
    try {
      const edited =
        await tg("editMessageCaption", {
          chat_id: MOVIE_GROUP_ID,
          message_id: Number(updatedMovie.telegram_message_id),
          caption: newCaption,
          parse_mode: "HTML"
        });

      if (!edited?.__error) {
        captionStatus =
          "✅ Telegram-Caption aktualisiert.";
      } else {
        captionStatus =
          "⚠️ Telegram-Caption konnte nicht aktualisiert werden.";
      }
    } catch (err) {
      captionStatus =
        "⚠️ Telegram-Caption Fehler: " + err.message;
    }
  }

  try {
    await refreshMainCommandCentersOnly();
  } catch (err) {
    console.error(
      "⚠️ Command Center Refresh nach /editmovie fehlgeschlagen:",
      err.message
    );
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "✅ FILM AKTUALISIERT\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `🎬 ${updatedMovie.title} ${updatedMovie.year || ""}\n` +
      `🆔 DB-ID: ${updatedMovie.id}\n\n` +
      "Geändert:\n" +
      entries
        .map(([field, value]) =>
          `• ${field}: ${value === null ? "leer" : value}`
        )
        .join("\n") +
      "\n\n" +
      captionStatus +
      "\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}

if (text.startsWith("/fixseries")) {
  const query = text.replace("/fixseries", "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n" +
        "/fixseries AlterTitel | Neuer Titel\n\n" +
        "Beispiel:\n/fixseries GOT | Game of Thrones"
    });
    return;
  }

  const parts = query.split("|").map((p) => p.trim());

  if (parts.length < 2) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Format falsch.\nBeispiel:\n/fixseries GOT | Game of Thrones"
    });
    return;
  }

  const oldTitle = parts[0];
  const newTitle = parts[1];

  const row = db.prepare(`
    SELECT * FROM series
    WHERE LOWER(series_title) LIKE ?
    ORDER BY season ASC, episode ASC
    LIMIT 1
  `).get(`%${oldTitle.toLowerCase()}%`);

  if (!row) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Serie in Datenbank nicht gefunden."
    });
    return;
  }

  const tmdb = await searchSeriesTMDB(newTitle, row.season, row.episode);

  if (!tmdb) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Keine TMDB-Daten für die neue Serie gefunden."
    });
    return;
  }

  db.prepare(`
    UPDATE series
    SET series_title = ?, genre = ?, rating = ?, overview = ?, poster_url = ?
    WHERE LOWER(series_title) LIKE ?
  `).run(
    tmdb.seriesTitle,
    tmdb.genre,
    tmdb.rating,
    tmdb.overview,
    tmdb.posterUrl,
    `%${oldTitle.toLowerCase()}%`
  );

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "✅ Serie korrigiert:\n\n" +
      `Alt: ${oldTitle}\n` +
      `Neu: ${tmdb.seriesTitle}`
  });

  return;
}

// =============================
// SERIES PICK FROM TMDB
// =============================
if (command === "/seriespick") {
  const query = text.replace(command, "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/seriespick Serienname\n\n" +
        "Beispiel:\n" +
        "/seriespick Andor"
    });
    return;
  }

  const search = await tmdbGet("/search/tv", {
    query,
    include_adult: false,
    language: "de-DE"
  });

  if (!search?.results?.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Keine Serien gefunden:\n\n" +
        query
    });
    return;
  }

  const buttons = search.results
    .slice(0, 8)
    .map((s) => [{
      text:
        `${s.name} (${s.first_air_date?.slice(0, 4) || "?"})`,
      callback_data:
        `seriespick_${s.id}`
    }]);

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "📺 TMDB SERIEN-AUSWAHL\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `🔎 Suche: ${query}\n\n` +
      "Bitte wähle die richtige Serie:",
    reply_markup: {
      inline_keyboard: buttons
    }
  });

  return;
}
  
  // =============================
// SMART DUPLICATES
// =============================
if (command === "/smartduplicates") {
  let movies = [];
  let series = [];

  if (pgPool) {
    const movieResult = await pgPool.query(`
      SELECT id, title, year, file_name
      FROM movies
      ORDER BY title ASC
    `);

    const seriesResult = await pgPool.query(`
      SELECT id, series_title, season, episode, file_name
      FROM series
      ORDER BY series_title ASC, season ASC, episode ASC
    `);

    movies = movieResult.rows;
    series = seriesResult.rows;
  } else {
    movies = db.prepare(`
      SELECT id, title, year, file_name
      FROM movies
      ORDER BY title ASC
    `).all();

    series = db.prepare(`
      SELECT id, series_title, season, episode, file_name
      FROM series
      ORDER BY series_title ASC, season ASC, episode ASC
    `).all();
  }

  function simpleKey(value = "") {
    return String(value)
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]/g, "");
  }

  const movieMap = {};
  const seriesMap = {};

  for (const m of movies) {
    const key = simpleKey(`${m.title}-${m.year || ""}`);

    if (!movieMap[key]) {
      movieMap[key] = [];
    }

    movieMap[key].push(m);
  }

  for (const s of series) {
    const key = simpleKey(
      `${s.series_title}-s${String(s.season).padStart(2, "0")}-e${String(s.episode).padStart(2, "0")}`
    );

    if (!seriesMap[key]) {
      seriesMap[key] = [];
    }

    seriesMap[key].push(s);
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🧠 SMART DUPLIKATE\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  let found = false;

  resultText += "🎬 FILME\n";

  for (const key of Object.keys(movieMap)) {
    if (movieMap[key].length > 1) {
      found = true;
      resultText += "\n⚠️ Mögliches Duplikat:\n";

      for (const m of movieMap[key]) {
        resultText += `• ID ${m.id} — ${m.title} ${m.year || ""}\n`;
        resultText += `  📁 ${m.file_name || "leer"}\n`;
      }
    }
  }

  resultText += "\n📺 SERIEN\n";

  for (const key of Object.keys(seriesMap)) {
    if (seriesMap[key].length > 1) {
      found = true;
      resultText += "\n⚠️ Mögliches Duplikat:\n";

      for (const s of seriesMap[key]) {
        resultText +=
          `• ID ${s.id} — ${s.series_title} ` +
          `S${String(s.season).padStart(2, "0")}` +
          `E${String(s.episode).padStart(2, "0")}\n`;

        resultText += `  📁 ${s.file_name || "leer"}\n`;
      }
    }
  }

  if (!found) {
    resultText += "\n✅ Keine Smart-Duplikate gefunden.\n";
  }

  resultText += "\n━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

  // =============================
// DUPLICATES
// =============================
if (command === "/duplicates") {
  let movieDupes = [];
  let seriesDupes = [];

  if (pgPool) {
    const movieResult = await pgPool.query(`
      SELECT title, year, COUNT(*) AS count
      FROM movies
      GROUP BY title, year
      HAVING COUNT(*) > 1
      ORDER BY count DESC, title ASC
    `);

    const seriesResult = await pgPool.query(`
      SELECT series_title, season, episode, COUNT(*) AS count
      FROM series
      GROUP BY series_title, season, episode
      HAVING COUNT(*) > 1
      ORDER BY count DESC, series_title ASC, season ASC, episode ASC
    `);

    movieDupes = movieResult.rows;
    seriesDupes = seriesResult.rows;
  } else {
    movieDupes = db.prepare(`
      SELECT title, year, COUNT(*) AS count
      FROM movies
      GROUP BY title, year
      HAVING count > 1
      ORDER BY count DESC, title ASC
    `).all();

    seriesDupes = db.prepare(`
      SELECT series_title, season, episode, COUNT(*) AS count
      FROM series
      GROUP BY series_title, season, episode
      HAVING count > 1
      ORDER BY count DESC, series_title ASC, season ASC, episode ASC
    `).all();
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🧹 DUPLIKATE\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!movieDupes.length && !seriesDupes.length) {
    resultText += "✅ Keine Duplikate gefunden.\n";
  }

  if (movieDupes.length) {
    resultText += "🎬 FILME\n\n";

    for (const m of movieDupes) {
      resultText += `• ${m.title} ${m.year || ""} — ${m.count}x\n`;
    }

    resultText += "\n";
  }

  if (seriesDupes.length) {
    resultText += "📺 SERIEN\n\n";

    for (const s of seriesDupes) {
      resultText +=
        `• ${s.series_title} ` +
        `S${String(s.season).padStart(2, "0")}` +
        `E${String(s.episode).padStart(2, "0")} — ${s.count}x\n`;
    }

    resultText += "\n";
  }

  resultText += "━━━━━━━━━━━━━━━━━━\n";
  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// CLEAR MOVIES DATABASE
// =============================
if (text === "/clearmoviesdb") {

  if (pgPool) {
    await pgPool.query(`DELETE FROM movies;`);
  }

  db.prepare(`DELETE FROM movies;`).run();

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🧹 FILM-DATENBANK GELEERT\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "✅ Alle Filme wurden gelöscht\n" +
      "✅ Topics bleiben erhalten\n" +
      "✅ Hubs bleiben erhalten\n\n" +
      "Du kannst deine Filme jetzt neu hochladen.\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}

// =============================
// REBUILD MOVIE INDEX
// =============================
if (text === "/rebuildmovieindex") {

  await createOrUpdateMovieIndex();

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🔤 MOVIE INDEX AKTUALISIERT\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "✅ A–Z Index wurde neu erstellt/aktualisiert\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}

if (command === "/rebuildhalloffame") {
  await createOrUpdateHallOfFameHub();

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "✅ Hall of Fame Hub aktualisiert\n\n" +
      "🏆 Mindestwertung • 8.0/10"
  });

  return;
}

// =============================
// UNKNOWN COMMAND
// =============================
await tg("sendMessage", {
  chat_id: msg.chat.id,
  text: "⚠️ Unbekannter Befehl. Nutze /admin"
});
}

function formatEpisodeRanges(episodes = []) {
  if (!episodes.length) return "";

  const nums = episodes
    .map((ep) => Number(String(ep).replace(/\D/g, "")))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  const ranges = [];
  let start = nums[0];
  let prev = nums[0];

  for (let i = 1; i <= nums.length; i++) {
    const current = nums[i];

    if (current === prev + 1) {
      prev = current;
      continue;
    }

    if (start === prev) {
      ranges.push(`E${String(start).padStart(2, "0")}`);
    } else {
      ranges.push(
        `E${String(start).padStart(2, "0")}–E${String(prev).padStart(2, "0")}`
      );
    }

    start = current;
    prev = current;
  }

  return ranges.join(", ");
}

async function sendAdminPanel(chatId) {
  const panelResult = await tg("sendMessage", {
    chat_id: chatId,
    text:
      "🎛 𝐋𝐈𝐁𝐑𝐀𝐑𝐘 𝐂𝐎𝐍𝐓𝐑𝐎𝐋 𝐏𝐀𝐍𝐄𝐋\n\n" +
      "Wähle eine Funktion aus:",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🎬 Filme", callback_data: "panel_movies" },
          { text: "📺 Serien", callback_data: "panel_series" }
        ],
       [
  { text: "🎞 Collection Hubs", callback_data: "panel_rebuild_collections" },
  { text: "🌌 Universe Hub", callback_data: "panel_dashboard" }
],
        [
          { text: "📺 Serien Hub", callback_data: "panel_serieshub" },
          { text: "🔤 Serien A–Z", callback_data: "panel_seriesaz" }
        ],
        [
          { text: "🆕 Neue Folgen", callback_data: "panel_newseries" },
          { text: "🔥 Trending", callback_data: "panel_trending" }
        ],
        [
          { text: "⭐ Featured", callback_data: "panel_featured" },
          { text: "🧩 Fehlende Folgen", callback_data: "panel_missing_help" }
        ],
        [
          { text: "🔤 A–Z Gesamt", callback_data: "panel_az" },
          { text: "🧹 Duplikate", callback_data: "panel_duplicates" }
        ],
        [
  { text: "🎛 Dashboard", callback_data: "panel_dashboard" },
  { text: "📊 Statistik", callback_data: "panel_stats" }
],

[
  { text: "🔤 Movie Index", callback_data: "panel_movie_index" }
],

[
  { text: "🔎 Suche Hilfe", callback_data: "panel_search_help" }
],
        [
          { text: "📌 SetSeries Hilfe", callback_data: "panel_setseries_help" },
          { text: "🗑 Clear Series", callback_data: "panel_clearseries" }
        ]
      ]
    }
  });

  return panelResult;
}

// =============================
// MOVIE UPLOAD PROCESSOR
// =============================
async function processMovieUpload({ msg, media, tmdb }) {
  const fileName =
    msg.document?.file_name ||
    msg.video?.file_name ||
    msg.caption ||
    "Unbekannte Datei";

  const fileId =
    msg.video?.file_id ||
    msg.document?.file_id ||
    "";

  if (await movieExists(media.uniqueKey)) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Film ist bereits gespeichert:\n\n" +
        `🎬 ${media.title} ${media.year || ""}`
    });

    return;
  }

  const mediaExtras =
    await Promise.resolve(
      getMediaExtras(fileName, msg)
    );

  const extras = {
    ...mediaExtras,
    libraryId: await makeLibraryCode(tmdb.genre)
  };

  const fileSize =
    extras.fileSize || "Unbekannt";

  const fileSizeBytes =
    extras.fileSizeBytes || null;

  const quality =
    extras.quality || "HD";

  const source =
    extras.source || "Unbekannt";

  const videoCodec =
    extras.videoCodec || "Unbekannt";

  const audioCodec =
    extras.audioCodec || "Unbekannt";

  const audioChannels =
    extras.audioChannels || "Unbekannt";

  const resolution =
    extras.resolution || "Unbekannt";

  const hdr =
    extras.hdr || null;

  const universeData = detectUniverse(
    tmdb.title,
    tmdb.collection
  );

  const starWarsEra =
    universeData?.universeKey === "StarWars"
      ? detectStarWarsEra(tmdb.title)
      : null;

  console.log("🌌 UNIVERSE DETECT DEBUG:", {
    title: tmdb.title,
    collection: tmdb.collection,
    universeData
  });

  console.log("🌌 STAR WARS ERA DETECT:", {
    title: tmdb.title,
    starWarsEra
  });

  // =============================
  // MOVIE TOPIC ROUTING — LIBRARY V3
  // =============================
  const finalTopicName =
    getSmartMovieTopic({
      ...tmdb,
      collection:
        tmdb.collection ||
        detectCollection(tmdb.title) ||
        null,
      universe:
        universeData?.universeName || null
    });

  const finalTopicType =
    "movie_category";

  const topicId = await createOrGetTopic({
    chatId: MOVIE_GROUP_ID,
    name: finalTopicName,
    type: finalTopicType
  });

  if (!topicId) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Film-Thema konnte nicht erstellt werden.\n\n" +
        "Prüfe MOVIE_GROUP_ID, Bot-Adminrechte und Forum-Themen."
    });

    return;
  }

// =============================
// MOVIE HUB SETUP DEAKTIVIERT
// Keine automatischen Hub-Posts mehr pro Topic
// =============================
/*
if (!universeData?.universeName) {
  await createMovieHubIfMissing({
    topicId,
    topicName: finalTopicName,
    banner:
      tmdb.collectionBackdrop ||
      tmdb.backdropUrl ||
      tmdb.posterUrl ||
      null
  });
}
*/

// =============================
// COLLECTION DB ENTRY — LIBRARY V3
// =============================
const detectedCollection =
  tmdb.collection ||
  detectCollection(tmdb.title) ||
  null;

if (detectedCollection && !universeData?.universeName) {
  const existingCollection =
    tmdb.collectionId
      ? await getCollection(tmdb.collectionId)
      : null;

  if (!existingCollection && tmdb.collectionId) {
    await saveCollection({
      collectionName: detectedCollection,
      tmdbCollectionId: tmdb.collectionId,
      topicId,
      posterUrl: tmdb.collectionPoster || tmdb.posterUrl
    });
  }
}

// =============================
// POST COVER
// =============================
await tg("sendPhoto", {
  chat_id: MOVIE_GROUP_ID,
  message_thread_id: topicId,
  photo:
    tmdb.posterUrl ||
    "https://via.placeholder.com/500x750.png?text=No+Cover"
});

// =============================
// COPY ORIGINAL MEDIA WITH FULL DOSSIER
// =============================
const captionExtras = {
  ...extras,

  topicName: finalTopicName,

  universe:
    universeData?.universeName || null,

  universePhase:
    universeData?.phase || null,

  collection:
    detectedCollection,

  collectionMovies:
    tmdb.collectionMovies?.length || 1,

  collectionOrder:
    tmdb.collectionMovies || []
};

const movieDossierCaption =
  detectedCollection
    ? collectionSagaCaption(
        {
          ...tmdb,
          collection: detectedCollection
        },
        captionExtras
      )
    : movieCaption(
        tmdb,
        captionExtras
      );

const copied = await copyOriginalMedia({
  fromChatId: msg.chat.id,
  messageId: msg.message_id,
  targetChatId: MOVIE_GROUP_ID,
  topicId,
  caption: movieDossierCaption,
  fileId,
  isVideo: !!msg.video,
  adminChatId: msg.chat.id
});

if (!copied?.message_id) {
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "⚠️ Cover wurde gepostet, aber Film konnte nicht kopiert werden."
  });

  return;
}

// =============================
// SAVE MOVIE
// =============================
await saveMovie({
  title: tmdb.title,
  year: tmdb.year,
  genre: tmdb.genre,
  rating: tmdb.rating,
  runtime: tmdb.runtime,
  overview: tmdb.overview,
  posterUrl: tmdb.posterUrl,

  fileName,
  fileId,
  uniqueKey: media.uniqueKey,

  telegramMessageId: copied.message_id,
  topicId,

  collection:
  tmdb.collection ||
  detectCollection(tmdb.title) ||
  null,

  quality: extras.quality,
  audio: extras.audio,
  source: extras.source,

  fsk: tmdb.fsk,
  director: tmdb.director,
  cast: tmdb.cast,

  libraryId: extras.libraryId,

  resolution: extras.resolution,
  fileSize: extras.fileSize,
  fileSizeBytes: extras.fileSizeBytes,

  videoCodec: extras.videoCodec,
  audioCodec: extras.audioCodec,
  audioChannels: extras.audioChannels,

  hdr: extras.hdr,

  universe:
  universeData?.universeName ||
  detectUniverse(tmdb.title) ||
  null,
  universePhase: universeData?.phase || null,

  starWarsEra: starWarsEra?.key || null
});

if (isHallOfFameMovie(tmdb.rating)) {
  await createOrGetTopic({
    chatId: MOVIE_GROUP_ID,
    name: "🏆 Hall of Fame",
    type: "system_hub"
  });

  console.log("🏆 Hall of Fame Movie erkannt:", tmdb.title);
}

// =============================
// UPDATE MOVIE INDEX HUB — DISABLED IN LIBRARY V3
// =============================
// Alte technische Movie-Hubs deaktiviert.
// Keine automatischen Extra-Topics mehr pro Upload.

/*
try {
  await createOrUpdateMovieIndexHub();
  await createOrUpdateCollectionsIndexHub();
  await createOrUpdateUniversesIndexHub();
  await createOrUpdatePremiumQualityHub();
  await createOrUpdateEliteArchiveHub();
  await createOrUpdateNewReleasesHub();
  await createOrUpdateMovieLibraryHub();
} catch (err) {
  console.error(
    "⚠️ Movie Hubs Update Fehler:",
    err.message
  );
}
*/

// =============================
// UPDATE HUBS — DISABLED IN MOVIE V3
// =============================
// Keine automatischen Hub-Updates mehr pro Upload.
// Filme werden nur noch in die feste V3-Topic-Struktur einsortiert.
// Das verhindert doppelte Topics, technische Hubs und überfüllte Themenbereiche.

/*
if (universeData?.universeName) {
  try {
    await createOrUpdateUniverseHub(
      universeData.universeName
    );

    await createOrUpdateMultiverseCommandCenter();

    if (isDcUniverse(universeData?.universeKey)) {
      await createOrUpdateDcCommandCenter();
    }

    if (isMarvelUniverse(universeData?.universeKey)) {
      await createOrUpdateMarvelCommandCenter();
    }

    if (isDisneyUniverse(universeData?.universeKey)) {
      await createOrUpdateDisneyCommandCenter();
    }

  } catch (err) {
    console.error(
      "⚠️ Universe/Multiverse Hub Update Fehler:",
      err.message
    );
  }
} else {
  try {
    await updateMovieHub({
      topicId,
      topicName: finalTopicName
    });
  } catch (err) {
    console.error("⚠️ Movie Hub Update Fehler:", err.message);
  }

  if (useCollectionTopic) {
    try {
      await createOrUpdateCollectionHub(tmdb, topicId);
    } catch (err) {
      console.error("⚠️ Collection Hub Fehler:", err.message);
    }
  }
}
*/

// =============================
// UPDATE STAR WARS ERA HUBS
// =============================
/*
if (starWarsEra) {
  try {
    await createOrUpdateStarWarsEraHubs();
    await createOrUpdateStarWarsCommandCenter();
  } catch (err) {
    console.error(
      "⚠️ Star Wars Era/Command Center Update Fehler:",
      err.message
    );
  }
}
*/

// =============================
// ADMIN CONFIRMATION
// =============================
await tg("sendMessage", {
  chat_id: msg.chat.id,
  text:
    "✅ Film erfolgreich einsortiert:\n\n" +
    `🎬 ${tmdb.title}\n` +
    `🎭 Thema: ${finalTopicName}\n` +
    (
      tmdb.collection
        ? `🎞 Filmreihe: ${tmdb.collection}\n`
        : ""
    ) +
    `🏷 ${extras.libraryId}`
});

// =============================
// REFRESH GLOBAL SYSTEMS
// =============================
try {
  await refreshMainCommandCentersOnly();
} catch (err) {
  console.error("⚠️ Main Command Center Refresh Fehler:", err.message);
}

logToDb(
  "movie_saved",
  `${tmdb.title} ${tmdb.year || ""}`
);
}

// =============================
// UPLOAD HANDLER
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

  // =============================
  // DUPLICATE SHIELD
  // =============================
  const uploadKey =
    `${fileName}-${fileId}`;

  if (ACTIVE_UPLOADS.has(uploadKey)) {

    console.log(
      "⚠️ Doppelter Upload blockiert:",
      fileName
    );

    return;
  }

  ACTIVE_UPLOADS.add(uploadKey);

  try {

  const manualMovie =
  parseManualMovieCaption(
    msg.caption || ""
  );

const manualSeries =
  parseManualSeriesCommand(
    msg.caption || ""
  );

const media =
  manualMovie ||
  manualSeries ||
  parseMedia(fileName);

  console.log("🧠 Parsed:", media);

  if (media.type === "series") {
    const exists = await seriesExists(media.uniqueKey);

    if (exists) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "⚠️ Serie/Episode ist bereits gespeichert:\n\n" +
          `📺 ${media.seriesTitle} S${media.seasonText}E${media.episodeText}`
      });
      return;
    }

    const normalizedSeriesTitle =
  normalizeSeriesTitle(media.seriesTitle);

await tg("sendMessage", {
  chat_id: msg.chat.id,
  text:
    "🔎 Serie erkannt — suche TMDB-Daten...\n\n" +
    `📺 ${normalizedSeriesTitle} S${media.seasonText}E${media.episodeText}`
});

const tmdb = await searchSeriesTMDB(
  normalizedSeriesTitle,
  media.season,
  media.episode
);

    if (!tmdb) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "❌ Keine TMDB-Daten gefunden:\n\n" +
          `📺 ${media.seriesTitle}`
      });
      return;
    }

    let topicId = await getSeriesTopic(tmdb.seriesTitle);

if (!topicId) {
  topicId = await createOrGetTopic({
    chatId: SERIES_GROUP_ID,
    name: tmdb.seriesTitle,
    type: "series"
  });

  if (topicId) {
    await saveSeriesTopic(tmdb.seriesTitle, topicId);
  }
}
    
    console.log("🧵 SERIES TOPIC ID:", topicId, tmdb.seriesTitle);

    if (!topicId) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "❌ Serien-Thema konnte nicht erstellt werden.\n\n" +
          "Prüfe SERIES_GROUP_ID, Bot-Adminrechte und Forum-Themen."
      });
      return;
    }

    const extras = {
  ...getMediaExtras(fileName, msg)
};

await createSeriesHubIfMissing({
  tmdb,
  topicId
});

await createSeasonCardIfMissing({
  tmdb,
  topicId,
  season: media.season
});

const captionText =
  await seriesCaption(
    tmdb,
    media,
    extras
  );

const copied = await copyOriginalMedia({
  fromChatId: msg.chat.id,
  messageId: msg.message_id,
  targetChatId: SERIES_GROUP_ID,
  topicId,
  caption: captionText,
  fileId,
  isVideo: !!msg.video,
  adminChatId: msg.chat.id
});

    if (!copied?.message_id) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text: "⚠️ Serien-Karte wurde gepostet, aber Datei konnte nicht kopiert werden."
      });
      return;
    }
    
    const seriesUniverseData =
  detectUniverse(
    tmdb.seriesTitle,
    ""
  );

const starWarsEra =
  seriesUniverseData?.universeKey === "StarWars"
    ? detectStarWarsEra(tmdb.seriesTitle)
    : null;

console.log("🌌 SERIES ERA DETECT:", {
  title: tmdb.seriesTitle,
  starWarsEra
});

const seriesLibraryId = await saveSeriesLibrary({
  title: tmdb.seriesTitle || media.seriesTitle,
  tmdbId: tmdb.tmdbId || null,

  firstAirDate: tmdb.firstAirDate || null,
  lastAirDate: tmdb.lastAirDate || null,

  genres: tmdb.genre || null,
  rating: tmdb.rating || null,

  overview: tmdb.overview || null,
  posterUrl: tmdb.posterUrl || null,

  totalSeasons: tmdb.totalSeasons || null,
  totalEpisodes: tmdb.totalEpisodes || null,

  status: tmdb.status || null
});

const episodesToSave =
  media.episodes?.length
    ? media.episodes
    : [media.episode];

for (const ep of episodesToSave) {
  const episodeIndex =
    episodesToSave.indexOf(ep) + 1;

  const doubleEpisodeBaseTitle =
    media.episodeTitleFromFile ||
    tmdb.episodeTitle ||
    "Der schnellste Mann der Welt";

  const finalEpisodeTitle =
    episodesToSave.length > 1
      ? `${doubleEpisodeBaseTitle} Teil ${episodeIndex}`
      : (tmdb.episodeTitle || media.episodeTitleFromFile || "");

  await saveSeries({
    seriesTitle: tmdb.seriesTitle || media.seriesTitle,
    season: media.season,
    episode: ep,
    episodeTitle: finalEpisodeTitle,

    genre: tmdb.genre,
    rating: tmdb.rating,
    overview: tmdb.overview,
    posterUrl: tmdb.posterUrl,

    fileName,
    fileId,
    uniqueKey:
      episodesToSave.length > 1
        ? `${makeKey(tmdb.seriesTitle || media.seriesTitle)}-s${String(media.season).padStart(2, "0")}-e${String(ep).padStart(2, "0")}`
        : media.uniqueKey,

    telegramMessageId: copied.message_id,
    topicId,

    seriesLibraryId,

    universe: seriesUniverseData?.universeName || null,
    universePhase: seriesUniverseData?.phase || null,
    starWarsEra: starWarsEra?.key || null
  });
}

try {
  await createOrUpdateSingleSeriesHub(
    tmdb.seriesTitle,
    topicId
  );
} catch (err) {
  console.error("⚠️ Single Series Hub Fehler:", err.message);
}

try {
  const missingEpisodes = await getMissingEpisodes(
    tmdb.seriesTitle,
    media.season
  );

  if (missingEpisodes.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Fehlende Episoden erkannt:\n\n" +
        `📺 ${tmdb.seriesTitle}\n` +
        `📀 Staffel ${String(media.season).padStart(2, "0")}\n\n` +
        "Fehlt:\n" +
        missingEpisodes
          .map(ep => `• S${String(media.season).padStart(2, "0")}E${String(ep).padStart(2, "0")}`)
          .join("\n")
    });
  }
} catch (err) {
  console.error("⚠️ Missing Episodes Fehler:", err.message);
}

try {
  await updateSeasonCard({
    tmdb,
    topicId,
    season: media.season
  });
} catch (err) {
  console.error("⚠️ Staffelkarte Update Fehler:", err.message);
}
    
    try {
  await updateSeriesHub({
    tmdb,
    topicId
  });
} catch (err) {
  console.error("⚠️ Hub Update Fehler:", err.message);
}

try {
  await updateSeriesSmartTopics();
} catch (err) {
  console.error("⚠️ Series Smart Topics Fehler:", err.message);
}

try {
  await createOrUpdateEpisodeList({
    topicId,
    seriesTitle: tmdb.seriesTitle
  });
} catch (err) {
  console.error("⚠️ Episodenliste Update Fehler:", err.message);
}

// Library V3:
// Serien-Universe-Hubs sind deaktiviert,
// damit Serien nicht versehentlich in der Movie-Gruppe landen.
console.log("ℹ️ Serien Universe/Multiverse Hub übersprungen");

/*
if (starWarsEra) {
  try {
    await createOrUpdateStarWarsEraHubs();
    await createOrUpdateStarWarsCommandCenter();
  } catch (err) {
    console.error(
      "⚠️ Serien Star Wars Era/Command Center Fehler:",
      err.message
    );
  }
}
*/

await tg("sendMessage", {
  chat_id: msg.chat.id,
  text:
    "✅ Serie erfolgreich einsortiert:\n\n" +
    `📺 ${tmdb.seriesTitle} S${media.seasonText}E${media.episodeText}\n` +
    `🧵 Thema: ${tmdb.seriesTitle}`
});

try {
  await refreshMainCommandCentersOnly();
} catch (err) {
  console.error("⚠️ Main Command Center Refresh Fehler:", err.message);
}

logToDb(
  "series_saved",
  `${tmdb.seriesTitle} S${media.seasonText}E${media.episodeText}`
);

return;
}

  if (media.type === "movie") {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "🔎 Film erkannt — suche TMDB-Daten...\n\n" +
        `🎬 ${media.title} ${media.year || ""}`
    });

    const tmdb = await searchMovieTMDB(media.title, media.year);

    if (!tmdb) {
      const choices = await searchMovieTMDBChoices(media.title, media.year);

      if (!choices.length) {
        await tg("sendMessage", {
          chat_id: msg.chat.id,
          text:
            "❌ Keine TMDB-Daten gefunden:\n\n" +
            `🎬 ${media.title}\n\n` +
            "💡 Tipp:\n/movie Exakter Filmtitel | Jahr"
        });
        return;
      }

      PENDING_MOVIE_UPLOADS.set(String(msg.from.id), { msg, media });

      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "🎬 Mehrere mögliche TMDB-Treffer gefunden.\n\n" +
          "Bitte wähle den richtigen Film:",
        reply_markup: {
          inline_keyboard: choices.map((m) => [
            {
              text: `🎬 ${m.title} (${m.year})`,
              callback_data: `moviepick:${m.id}`
            }
          ])
        }
      });

      return;
    }

    return await processMovieUpload({ msg, media, tmdb });
  }

} finally {
  ACTIVE_UPLOADS.delete(uploadKey);

  console.log(
    "🧹 Upload freigegeben:",
    fileName
  );
}
}

// =============================
// STARTUP NOTIFICATION
// =============================
async function notifyStartup() {
  try {

    await tg("sendMessage", {
      chat_id: ADMIN_ID,
      text:
        "✅ Bot ist online\n\n" +
        "⚙️ Render Neustart erkannt\n" +
        `🕒 Zeit: ${new Date().toLocaleString("de-DE", {
          timeZone: "Europe/Berlin"
        })}`
    });

  } catch (err) {

    console.error(
      "❌ Startup Notification Fehler:",
      err.message
    );

  }
}

// =============================
// SERVER START
// =============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);

  await testPostgresConnection();
  await ensurePostgresTables();

  if (process.env.CREATE_COMMAND_CENTERS === "true") {
    try {
      console.log("🎛 Erstelle Command Centers...");
      await ensureCommandCenters();
      console.log("✅ Command Centers bereit");
    } catch (err) {
      console.error("❌ Command Center Fehler:", err.message);
    }
  }

  await notifyStartup();
});

// =============================
// AUTO ERROR RECOVERY
// =============================
process.on("unhandledRejection", async (err) => {

  console.error(
    "❌ UNHANDLED REJECTION:",
    err
  );

  try {

    await tg("sendMessage", {
      chat_id: ADMIN_ID,
      text:
        "⚠️ Unhandled Rejection erkannt\n\n" +
        String(err).slice(0, 3500)
    });

  } catch (e) {

    console.error(
      "❌ Fehler-Notification fehlgeschlagen:",
      e.message
    );
  }
});

process.on("uncaughtException", async (err) => {

  console.error(
    "💥 UNCAUGHT EXCEPTION:",
    err
  );

  try {

    await tg("sendMessage", {
      chat_id: ADMIN_ID,
      text:
        "💥 Bot Crash erkannt\n\n" +
        String(err).slice(0, 3500)
    });

  } catch (e) {

    console.error(
      "❌ Crash-Notification fehlgeschlagen:",
      e.message
    );
  }

  process.exit(1);
});
