const express = require("express");
const axios = require("axios");
const Database = require("better-sqlite3");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const Parser = require("rss-parser");
const rssParser = new Parser();
const os = require("os");

const { startUserbotImporter } = require("./userbot-importer");

const {
  handleAccessCommands,
  handleAccessCallback,
} = require("./access-commands");

const {
  isMaintenanceBlocked,
  handleMaintenanceCommands,
} = require("./maintenance-commands");

const {
  handleResetCommands,
} = require("./reset-commands");

const { handleLibrarySearchCommands } = require("./library-search-commands");
const { handleAzCommands } = require("./library-az-commands");
const { handleBrowseCommands } = require("./library-browse-commands");
const { handleYearCommands } = require("./library-year-commands");
const { handleDupeCommands } = require("./library-dupe-commands");
const { handleWrongImportCommands } = require("./library-wrongimport-commands");
const { handleCleanupCommands } = require("./library-cleanup-commands");
const { handleEpisodeCheckCommands } = require("./library-episodecheck-commands");
const { handleEpisodeFixCommands } = require("./library-episodefix-commands");
const { handleSeriesAuditCommands } = require("./library-seriesaudit-commands");
const { handleSeriesClusterCommands } = require("./library-seriescluster-commands");
const { handleSeriesSplitCommands } = require("./library-seriessplit-commands");
const { handleSeriesFixFromFileCommands } = require("./library-seriesfixfromfile-commands");
const { handleLibraryHolCommands } = require("./library-hol-commands");
const { handleFavoriteCommands } = require("./library-favorites-commands");
const { handlePopularCommands } = require("./library-popular-commands");
const { handleRandomCommands } = require("./library-random-commands");
const { handleHistoryCommands } = require("./library-history-commands");

const app = express();

const { registerUserbotSessionSetup } = require("./userbot-session-web");
registerUserbotSessionSetup(app);

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
  CREATE TABLE IF NOT EXISTS user_favorites (
    id BIGSERIAL PRIMARY KEY,

    telegram_user_id BIGINT NOT NULL,

    item_type TEXT NOT NULL
      CHECK (item_type IN ('movie', 'series')),

    item_ref TEXT NOT NULL,
    title TEXT,
    year TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (telegram_user_id, item_type, item_ref)
  );
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS deleted_library_items (
    id BIGSERIAL PRIMARY KEY,

    item_type TEXT NOT NULL,
    item_ref TEXT NOT NULL,

    title TEXT,
    reason TEXT,

    item_data JSONB NOT NULL,

    deleted_by BIGINT,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),

    restored_by BIGINT,
    restored_at TIMESTAMPTZ
  );
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS library_edit_logs (
    id BIGSERIAL PRIMARY KEY,

    item_type TEXT NOT NULL,
    item_ref TEXT NOT NULL,

    action TEXT NOT NULL,
    before_data JSONB,
    after_data JSONB,

    edited_by BIGINT,
    edited_at TIMESTAMPTZ DEFAULT NOW()
  );
`);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS bot_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

await pgPool.query(`
  CREATE INDEX IF NOT EXISTS idx_library_edit_logs_item
  ON library_edit_logs (item_type, item_ref, edited_at DESC);
`);

await pgPool.query(`
  CREATE INDEX IF NOT EXISTS idx_deleted_library_items_type_ref
  ON deleted_library_items (item_type, item_ref);
`);

await pgPool.query(`
  CREATE INDEX IF NOT EXISTS idx_user_favorites_user
  ON user_favorites (telegram_user_id, created_at DESC);
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

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS bot_users (
    telegram_user_id BIGINT PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    last_name TEXT,

    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'approved', 'blocked', 'rejected')),

    role TEXT NOT NULL DEFAULT 'member'
      CHECK (role IN ('member', 'vip', 'admin')),

    search_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    download_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    daily_movie_limit INTEGER NOT NULL DEFAULT 3,
    daily_season_limit INTEGER NOT NULL DEFAULT 1,
    daily_series_limit INTEGER NOT NULL DEFAULT 0,

    requested_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by BIGINT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
`);

await pgPool.query(`
  ALTER TABLE bot_users
  ADD COLUMN IF NOT EXISTS daily_episode_limit INTEGER NOT NULL DEFAULT 3;
`);

await pgPool.query(`
  CREATE TABLE IF NOT EXISTS bot_usage_logs (
    id BIGSERIAL PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL,
    action_type TEXT NOT NULL
      CHECK (action_type IN ('movie', 'episode', 'season', 'series_all')),
    item_id TEXT,
    usage_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`);

await pgPool.query(`
  CREATE INDEX IF NOT EXISTS idx_bot_usage_user_date
  ON bot_usage_logs (telegram_user_id, usage_date);
`);

await pgPool.query(`
  CREATE INDEX IF NOT EXISTS idx_bot_users_status
  ON bot_users (status);
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

// =============================
// SAVE SERIES TOPIC — LIBRARY V3 COMPATIBILITY
// Alte Einzel-Serien-Topics werden nicht mehr gespeichert.
// Serien landen jetzt in festen Archiv-Kategorien.
// Diese Funktion bleibt nur bestehen, damit alte Aufrufe nicht crashen.
// =============================
async function saveSeriesTopic(seriesName, topicId) {
  console.log("ℹ️ saveSeriesTopic übersprungen — Library V3 nutzt feste Serien-Kategorien:", {
    seriesName,
    topicId
  });

  return {
    skipped: true,
    reason: "Library V3 uses fixed series categories",
    seriesName,
    topicId
  };
}

// =============================
// SERIES TOPIC COMPATIBILITY — LIBRARY V3
// Alte Einzel-Serien-Topics werden nicht mehr benutzt.
// Serien landen jetzt in festen Archiv-Kategorien.
// =============================
async function getSeriesTopic(seriesName, tmdb = {}, media = {}) {
  const finalSeriesTopicName =
    typeof getSmartSeriesTopic === "function"
      ? getSmartSeriesTopic(
          {
            ...tmdb,
            seriesTitle:
              tmdb.seriesTitle ||
              tmdb.title ||
              seriesName
          },
          {
            ...media,
            seriesTitle:
              media.seriesTitle ||
              media.title ||
              seriesName
          }
        )
      : FIXED_LIBRARY_TOPICS.drama.name;

  const topicId =
    await createOrGetTopic({
      chatId: SERIES_GROUP_ID,
      name: finalSeriesTopicName,
      type: "series_category"
    });

  return topicId || null;
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

function normalizeCollectionMatchText(value = "") {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/[:;,.!?()[\]{}'"`´’‘“”]/g, " ")
    .replace(/[-_/\\]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectionMatchIncludes(text, aliases = []) {
  const normalizedText =
    normalizeCollectionMatchText(text);

  return aliases.some((alias) => {
    const normalizedAlias =
      normalizeCollectionMatchText(alias);

    return (
      normalizedAlias &&
      normalizedText.includes(normalizedAlias)
    );
  });
}

const MOVIE_COLLECTION_ALIASES_V2 = [
  {
    collection: "Superman",
    aliases: [
      "superman",
      "superman the movie",
      "superman der film",
      "superman ii",
      "superman iii",
      "superman iv",
      "superman returns",
      "man of steel",
      "batman v superman",
      "batman vs superman",
      "superman red son",
      "superman man of tomorrow",
      "death of superman",
      "reign of the supermen",
      "all star superman"
    ]
  },
  {
    collection: "Batman",
    aliases: [
      "batman",
      "dark knight",
      "the batman",
      "batman begins",
      "batman forever",
      "batman returns",
      "batman robin",
      "mask of the phantasm"
    ]
  },
  {
    collection: "Bad Boys",
    aliases: [
      "bad boys",
      "bad boys ii",
      "bad boys 2",
      "bad boys for life",
      "bad boys ride or die"
    ]
  },
  {
    collection: "Bourne-Reihe",
    aliases: [
      "bourne",
      "bourne identitat",
      "bourne verschworung",
      "bourne ultimatum",
      "bourne vermachtnis",
      "jason bourne",
      "bourne legacy"
    ]
  },
  {
    collection: "Final Destination",
    aliases: [
      "final destination",
      "bloodlines"
    ]
  },
  {
    collection: "Jurassic Universe",
    aliases: [
      "jurassic park",
      "jurassic world",
      "vergessene welt jurassic park",
      "lost world jurassic park",
      "gefallene konigreich",
      "fallen kingdom",
      "neues zeitalter",
      "dominion"
    ]
  },
  {
    collection: "Pacific Rim",
    aliases: [
      "pacific rim",
      "pacific rim uprising"
    ]
  },
  {
    collection: "Fast & Furious",
    aliases: [
      "fast furious",
      "fast and furious",
      "fast five",
      "fast x",
      "tokyo drift",
      "hobbs shaw"
    ]
  },
  {
    collection: "Mission: Impossible",
    aliases: [
      "mission impossible",
      "phantom protokoll",
      "ghost protocol",
      "rogue nation",
      "fallout",
      "dead reckoning"
    ]
  },
  {
    collection: "Harry Potter",
    aliases: [
      "harry potter",
      "fantastic beasts",
      "phantastische tierwesen",
      "hogwarts"
    ]
  },
  {
    collection: "Matrix",
    aliases: [
      "matrix",
      "matrix reloaded",
      "matrix revolutions",
      "matrix resurrections"
    ]
  },
  {
    collection: "Terminator",
    aliases: [
      "terminator",
      "judgment day",
      "tag der abrechnung",
      "rise of the machines",
      "salvation",
      "genisys",
      "dark fate"
    ]
  },
  {
    collection: "Transformers",
    aliases: [
      "transformers",
      "bumblebee",
      "rise of the beasts",
      "aufstieg der bestien"
    ]
  },
  {
    collection: "Planet der Affen",
    aliases: [
      "planet der affen",
      "planet of the apes",
      "prevolution",
      "revolution",
      "survival",
      "kingdom of the planet of the apes"
    ]
  },
  {
    collection: "Marvel",
    aliases: [
      "marvel",
      "avengers",
      "iron man",
      "captain america",
      "thor",
      "hulk",
      "black panther",
      "doctor strange",
      "guardians of the galaxy",
      "ant man",
      "ant-man"
    ]
  },
  {
    collection: "Spider-Man",
    aliases: [
      "spider man",
      "spider-man",
      "spiderman",
      "venom",
      "morbius",
      "no way home",
      "far from home",
      "homecoming",
      "across the spider verse",
      "into the spider verse"
    ]
  },
  {
    collection: "X-Men",
    aliases: [
      "x men",
      "x-men",
      "wolverine",
      "logan",
      "deadpool",
      "new mutants"
    ]
  },
  {
    collection: "Star Wars",
    aliases: [
      "star wars",
      "krieg der sterne",
      "jedi",
      "sith",
      "rogue one",
      "solo a star wars story"
    ]
  },
  {
    collection: "Star Trek",
    aliases: [
      "star trek",
      "enterprise",
      "into darkness",
      "beyond"
    ]
  }
];

function detectCollection(title = "", extras = {}) {
  const combined =
    [
      title,
      extras.title,
      extras.fileName,
      extras.file_name,
      extras.collection,
      extras.universe
    ]
      .map((value) => String(value || ""))
      .join(" ");

  for (const entry of MOVIE_COLLECTION_ALIASES_V2) {
    if (collectionMatchIncludes(combined, entry.aliases)) {
      return entry.collection;
    }
  }

  return null;
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

  let hub = await tg("sendMessage", {
  chat_id: MOVIE_GROUP_ID,
  message_thread_id: Number(topicId),
  text: hubText,
  parse_mode: "HTML"
});

const sendError =
  hub?.error?.description ||
  hub?.description ||
  "";

if (sendError.includes("message thread not found")) {

  console.log(
    "♻️ Topic existiert nicht mehr:",
    tmdb.collection
  );

  const newTopicId =
  await recreateTopic({
      chatId: MOVIE_GROUP_ID,
      name: tmdb.collection,
      type: "collection"
    });

  if (!newTopicId) {
    return null;
  }

  if (pgPool) {

    await pgPool.query(
      `
      UPDATE collections
      SET topic_id = $1,
          hub_message_id = NULL
      WHERE tmdb_collection_id = $2
      `,
      [
        newTopicId,
        tmdb.collectionId
      ]
    );

  } else {

    db.prepare(`
      UPDATE collections
      SET topic_id = ?,
          hub_message_id = NULL
      WHERE tmdb_collection_id = ?
    `).run(
      newTopicId,
      tmdb.collectionId
    );

  }

  hub = await tg("sendMessage", {
    chat_id: MOVIE_GROUP_ID,
    message_thread_id: Number(newTopicId),
    text: hubText,
    parse_mode: "HTML"
  });
}

if (hub?.message_id) {

  await saveCollectionHubMessageId(
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

  console.log(
    "✅ Collection Hub erstellt:",
    tmdb.collection
  );
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

// ━━━━━━━━━━━━━━━━━━
// 🎵 MUSIC ARCHIVE HELPERS
// ━━━━━━━━━━━━━━━━━━

const MUSIC_EXTENSIONS = [
  ".mp3",
  ".flac",
  ".m4a",
  ".aac",
  ".ogg",
  ".opus",
  ".wav",
  ".wma",
  ".alac",
  ".aiff"
];

const MUSIC_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/flac",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
  "audio/opus",
  "audio/wav",
  "audio/x-wav",
  "audio/x-ms-wma",
  "audio/aiff"
];

function isMusicFileName(fileName = "") {
  const lower = String(fileName || "").toLowerCase();
  return MUSIC_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function isMusicMimeType(mimeType = "") {
  const lower = String(mimeType || "").toLowerCase();
  return MUSIC_MIME_TYPES.includes(lower) || lower.startsWith("audio/");
}

function detectMusicMedia({ fileName = "", mimeType = "", audio = null } = {}) {
  return Boolean(
    audio ||
    isMusicFileName(fileName) ||
    isMusicMimeType(mimeType)
  );
}

function cleanMusicText(value = "") {
  return String(value || "")
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/\b(official|video|audio|lyrics|remaster(ed)?|explicit|clean)\b/gi, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\([^\)]*\)/g, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseMusicFileName(fileName = "") {
  const cleaned = String(fileName || "")
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let artist = "";
  let title = "";
  let album = "";
  let track_no = "";

  // Standard: Künstler - Titel.mp3
  if (cleaned.includes(" - ")) {
    const parts = cleaned.split(" - ").map((v) => v.trim()).filter(Boolean);

    artist = parts[0] || "";
    title = parts.slice(1).join(" - ") || "";

    return {
      artist,
      title,
      album,
      track_no
    };
  }

  // Beispiel:
  // Thomas Anders Sings Modern Talking Magic The Best 06 Love Society
  const trackMatch = cleaned.match(/^(.+?)\s+(\d{1,2})\s+(.+)$/);

  if (trackMatch) {
    const beforeTrack = trackMatch[1].trim();
    track_no = trackMatch[2].padStart(2, "0");
    title = trackMatch[3].trim();

    // Spezialfall: Künstler + Album mit "Sings"
    const singsMatch = beforeTrack.match(/^(.+?)\s+(Sings\s+.+)$/i);

    if (singsMatch) {
      artist = singsMatch[1].trim();
      album = singsMatch[2].trim();
    } else {
      artist = beforeTrack;
    }

    return {
      artist,
      title,
      album,
      track_no
    };
  }

  title = cleaned;

  return {
    artist,
    title,
    album,
    track_no
  };
}

function normalizeMusicUniqueKey(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9äöüß]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();
}

function formatMusicDuration(seconds) {
  const total = Number(seconds || 0);
  if (!total || Number.isNaN(total)) return "Unbekannt";

  const mins = Math.floor(total / 60);
  const secs = Math.round(total % 60);

  return `${mins}:${String(secs).padStart(2, "0")} Min.`;
}

function formatMusicBitrate(value) {
  const bitrate = Number(value || 0);
  if (!bitrate || Number.isNaN(bitrate)) return "Unbekannt";
  return `${Math.round(bitrate / 1000)} kbps`;
}

function formatMusicSampleRate(value) {
  const sampleRate = Number(value || 0);
  if (!sampleRate || Number.isNaN(sampleRate)) return "Unbekannt";
  return `${sampleRate} Hz`;
}

function formatMusicFileSize(bytes) {
  const size = Number(bytes || 0);
  if (!size || Number.isNaN(size)) return "Unbekannt";

  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value = value / 1024;
    unit++;
  }

  return `${value.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

function makeMusicTag(value = "") {
  return String(value || "")
    .replace(/[^a-zA-Z0-9äöüÄÖÜß]+/g, "")
    .trim();
}

function detectMusicQuality(track = {}) {
  const codec = String(track.codec || "").toLowerCase();
  const bitrate = Number(track.bitrate || 0);
  const format = String(track.format || "").toLowerCase();

  if (format.includes("flac") || codec.includes("flac")) return "Lossless";
  if (format.includes("alac") || codec.includes("alac")) return "Lossless";
  if (bitrate >= 320000) return "High Quality";
  if (bitrate >= 192000) return "Standard Quality";
  if (bitrate > 0) return "Low / Medium Quality";

  return "Unbekannt";
}

async function readMusicMetadataFromFile(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return {};
    }

    const { parseFile } = await import("music-metadata");

    const metadata = await parseFile(filePath, {
      duration: true,
      skipCovers: true
    });

    const common = metadata.common || {};
    const format = metadata.format || {};

    return {
      artist:
        common.artist ||
        (Array.isArray(common.artists) ? common.artists.join(", ") : "") ||
        "",
      title: common.title || "",
      album: common.album || "",
      year: common.year ? String(common.year) : "",
      genre: Array.isArray(common.genre) ? common.genre.join(", ") : common.genre || "",
      track_no: common.track?.no ? String(common.track.no) : "",
      duration: format.duration ? Math.round(format.duration) : null,
      codec: format.codec || "",
      bitrate: format.bitrate || null,
      sample_rate: format.sampleRate || null,
      channels: format.numberOfChannels || null,
      format: format.container || format.codec || ""
    };
  } catch (error) {
    console.error("❌ Musik-Metadaten konnten nicht gelesen werden:", error.message);
    return {};
  }
}

function mergeMusicMetadata({ telegramAudio = {}, document = {}, fileMetadata = {} }) {
  const fileName =
    telegramAudio.file_name ||
    document.file_name ||
    document.fileName ||
    "";

  const parsedName = parseMusicFileName(fileName);

  const artist =
    fileMetadata.artist ||
    telegramAudio.performer ||
    parsedName.artist ||
    "Unbekannter Künstler";

  const title =
    fileMetadata.title ||
    telegramAudio.title ||
    parsedName.title ||
    fileName ||
    "Unbekannter Titel";

  const track = {
    artist,
    title,

    album:
      fileMetadata.album ||
      parsedName.album ||
      "",

    year:
      fileMetadata.year ||
      "",

    genre:
      fileMetadata.genre ||
      "",

    track_no:
      fileMetadata.track_no ||
      parsedName.track_no ||
      "",

    duration:
      fileMetadata.duration ||
      telegramAudio.duration ||
      null,

    codec:
      fileMetadata.codec ||
      "",

    bitrate:
      fileMetadata.bitrate ||
      null,

    sample_rate:
      fileMetadata.sample_rate ||
      null,

    channels:
      fileMetadata.channels ||
      null,

    format:
      fileMetadata.format ||
      document.mime_type ||
      telegramAudio.mime_type ||
      "",

    file_name: fileName,

    file_id:
      telegramAudio.file_id ||
      document.file_id ||
      "",

    file_unique_id:
      telegramAudio.file_unique_id ||
      document.file_unique_id ||
      "",

    file_size:
      telegramAudio.file_size ||
      document.file_size ||
      null
  };

  track.quality = detectMusicQuality(track);

  track.unique_key = normalizeMusicUniqueKey(
    `${track.artist}-${track.title}-${track.album || ""}-${track.track_no || ""}-${track.duration || ""}`
  );

  return track;
}

function buildMusicCaption(track = {}) {
  const artistTag = makeMusicTag(track.artist);
  const genreTag = makeMusicTag(track.genre);

  return `███ MUSIC ARCHIVE ███

━━━━━━━━━━━━━━━━━━
🎵 TRACK IMPORT
━━━━━━━━━━━━━━━━━━
🎤 Künstler: ${track.artist || "Unbekannt"}
🎶 Titel: ${track.title || "Unbekannt"}
💿 Album: ${track.album || "Unbekannt"}
🔢 Track: ${track.track_no || "Unbekannt"}
📅 Jahr: ${track.year || "Unbekannt"}
🏷 Genre: ${track.genre || "Unbekannt"}

━━━━━━━━━━━━━━━━━━
📊 AUDIO-INFOS
━━━━━━━━━━━━━━━━━━
⏱ Dauer: ${formatMusicDuration(track.duration)}
🎧 Codec: ${track.codec || "Unbekannt"}
🔥 Qualität: ${track.quality || "Unbekannt"}
🔊 Bitrate: ${formatMusicBitrate(track.bitrate)}
🎼 Sample Rate: ${formatMusicSampleRate(track.sample_rate)}
🔈 Kanäle: ${track.channels || "Unbekannt"}
📁 Format: ${track.format || "Unbekannt"}

━━━━━━━━━━━━━━━━━━
📂 DATEI
━━━━━━━━━━━━━━━━━━
📄 Datei: ${track.file_name || "Unbekannt"}
💾 Größe: ${formatMusicFileSize(track.file_size)}

━━━━━━━━━━━━━━━━━━
📖 ARCHIV-HINWEIS
━━━━━━━━━━━━━━━━━━
Dieser Track wurde automatisch erkannt, technisch analysiert und im Musikarchiv gespeichert.

━━━━━━━━━━━━━━━━━━
🛰 MUSIK ARCHIVIERT ✅
━━━━━━━━━━━━━━━━━━
#Music #Musik${artistTag ? `\n#${artistTag}` : ""}${genreTag ? `\n#${genreTag}` : ""}

@LibraryOfLegends`;
}

async function saveMusicTrack(track) {
  if (!pgPool) {
    console.log("⚠️ Kein pgPool vorhanden, Musik-Track wird nicht in Postgres gespeichert.");
    return null;
  }

  const sql = `
    INSERT INTO music_tracks (
      artist,
      title,
      album,
      year,
      genre,
      track_no,
      duration,
      codec,
      bitrate,
      sample_rate,
      channels,
      format,
      quality,
      file_name,
      file_id,
      file_unique_id,
      file_size,
      unique_key
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17, $18
    )
    ON CONFLICT (unique_key) DO UPDATE SET
      file_id = EXCLUDED.file_id,
      file_unique_id = EXCLUDED.file_unique_id,
      file_size = EXCLUDED.file_size
    RETURNING *;
  `;

  const values = [
    track.artist,
    track.title,
    track.album,
    track.year,
    track.genre,
    track.track_no,
    track.duration,
    track.codec,
    track.bitrate,
    track.sample_rate,
    track.channels,
    track.format,
    track.quality,
    track.file_name,
    track.file_id,
    track.file_unique_id,
    track.file_size,
    track.unique_key
  ];

  const result = await pgPool.query(sql, values);
  return result.rows[0];
}

async function handleMusicImport({ msg, localFilePath = null }) {
  const telegramAudio = msg.audio || {};
  const document = msg.document || {};

  let fileMetadata = {};

  if (localFilePath) {
    fileMetadata = await readMusicMetadataFromFile(localFilePath);
  }

  const track = mergeMusicMetadata({
    telegramAudio,
    document,
    fileMetadata
  });

  const savedTrack = await saveMusicTrack(track);
  const caption = buildMusicCaption(savedTrack || track);

  return {
    type: "music",
    track: savedTrack || track,
    caption
  };
}

function parseMedia(fileName = "", mimeType = "") {
  // =============================
  // 🎵 MUSIC CHECK — MUSS VOR SERIE/FILM KOMMEN
  // =============================
  if (
    detectMusicMedia({
      fileName,
      mimeType
    })
  ) {
    const parsedMusic = parseMusicFileName(fileName);

    const artist =
      parsedMusic.artist ||
      "Unbekannter Künstler";

    const title =
      parsedMusic.title ||
      cleanMusicText(fileName) ||
      "Unbekannter Titel";

    return {
      type: "music",
      isMusic: true,
      artist,
      title,
      uniqueKey: normalizeMusicUniqueKey(`${artist}-${title}`)
    };
  }

  // =============================
  // 📺 SERIES CHECK
  // =============================
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

  // =============================
  // 🎬 MOVIE CHECK
  // =============================
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

// =============================
// SMART MOVIE TOPIC ROUTING V3.1
// Familien-/Animationsfilme haben Vorrang vor Abenteuer
// =============================
function getSmartMovieTopic(tmdb = {}) {
  const title =
    String(tmdb.title || "")
      .toLowerCase();

  const genre =
    String(tmdb.genre || tmdb.mainGenre || "")
      .toLowerCase();

  const collection =
    String(tmdb.collection || "")
      .toLowerCase();

  const universe =
    String(tmdb.universe || "")
      .toLowerCase();

  const text =
    `${title} ${genre} ${collection} ${universe}`;

  const year =
    Number(tmdb.year || 0);

  // =============================
  // KLASSIKER & NOSTALGIE
  // Alles vor 2000
  // =============================
  if (
    year > 0 &&
    year < 2000
  ) {
    return FIXED_LIBRARY_TOPICS.classic.name;
  }

  // =============================
  // HORROR / MYSTERY / PSYCHO
  // Hat Vorrang vor Thriller/Drama
  // =============================
  if (
    text.includes("horror") ||
    text.includes("mystery") ||
    text.includes("psycho") ||
    text.includes("slasher") ||
    text.includes("paranormal") ||
    text.includes("okkult") ||
    text.includes("dämon") ||
    text.includes("daemon") ||
    text.includes("geister") ||
    text.includes("spuk") ||
    text.includes("düster") ||
    text.includes("duester")
  ) {
    return FIXED_LIBRARY_TOPICS.horror.name;
  }

  // =============================
  // FAMILIE / ANIMATION / KINDER
  // Wichtig: vor Abenteuer/Action prüfen
  // Beispiel: Toy Story, Minions, Disney, Pixar
  // =============================
  if (
    text.includes("familie") ||
    text.includes("family") ||
    text.includes("animation") ||
    text.includes("anime") ||
    text.includes("kids") ||
    text.includes("kinder") ||
    text.includes("zeichentrick") ||
    text.includes("pixar") ||
    text.includes("disney") ||
    text.includes("toy story") ||
    text.includes("eiskönigin") ||
    text.includes("frozen") ||
    text.includes("minions") ||
    text.includes("ich einfach unverbesserlich") ||
    text.includes("lightyear") ||
    text.includes("onward") ||
    text.includes("sonic") ||
    text.includes("pokemon") ||
    text.includes("pokémon")
  ) {
    return FIXED_LIBRARY_TOPICS.drama.name;
  }

  // =============================
  // ACTION / THRILLER / SCI-FI
  // Abenteuer landet nur hier, wenn es kein Familien-/Animationsfilm ist
  // =============================
  if (
    text.includes("action") ||
    text.includes("thriller") ||
    text.includes("krimi") ||
    text.includes("crime") ||
    text.includes("science fiction") ||
    text.includes("sci-fi") ||
    text.includes("scifi") ||
    text.includes("fantasy") ||
    text.includes("abenteuer") ||
    text.includes("adventure") ||
    text.includes("superheld") ||
    text.includes("superhero") ||
    text.includes("marvel") ||
    text.includes("dc") ||
    text.includes("star wars") ||
    text.includes("star trek") ||
    text.includes("fast") ||
    text.includes("furious") ||
    text.includes("jason statham") ||
    text.includes("bourne") ||
    text.includes("mission impossible") ||
    text.includes("jurassic")
  ) {
    return FIXED_LIBRARY_TOPICS.action.name;
  }

  // =============================
  // KOMÖDIE / DRAMA / ROMANTIK
  // =============================
  if (
    text.includes("komödie") ||
    text.includes("komoedie") ||
    text.includes("comedy") ||
    text.includes("drama") ||
    text.includes("romantik") ||
    text.includes("romance") ||
    text.includes("liebe")
  ) {
    return FIXED_LIBRARY_TOPICS.drama.name;
  }

  // Standard-Fallback
  return FIXED_LIBRARY_TOPICS.drama.name;
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
    
    let seasonImages = null;

try {
  seasonImages =
    await tmdbGet(
      `/tv/${best.id}/season/${season}/images`,
      {
        include_image_language: "de,en,null"
      }
    );
} catch (err) {
  console.error(
    "⚠️ Season Images Fehler:",
    err.message
  );
}

const seasonPosterPath =
  seasonDetails?.poster_path ||
  seasonImages?.posters?.find((p) => p.iso_639_1 === "de")?.file_path ||
  seasonImages?.posters?.find((p) => p.iso_639_1 === null)?.file_path ||
  seasonImages?.posters?.find((p) => p.iso_639_1 === "en")?.file_path ||
  seasonImages?.posters?.[0]?.file_path ||
  details.poster_path ||
  "";
    
    let watchProviders = null;

try {
  watchProviders =
    await tmdbGet(`/tv/${best.id}/watch/providers`);
} catch (err) {
  console.error(
    "⚠️ Watch Provider Fehler:",
    err.message
  );
}

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
      
      const networkText =
  details.networks
    ?.map((n) => n.name)
    .filter(Boolean)
    .join(" • ") || "";

const normalizeProviderName = (name = "") => {
  const clean =
    String(name || "")
      .replace(/\s+/g, " ")
      .trim();

  const lower =
    clean.toLowerCase();

  if (
    lower.includes("paramount")
  ) {
    return "Paramount+";
  }

  if (
    lower.includes("amazon") ||
    lower.includes("prime")
  ) {
    return "Prime Video";
  }

  if (
    lower.includes("disney")
  ) {
    return "Disney+";
  }

  if (
    lower.includes("netflix")
  ) {
    return "Netflix";
  }

  if (
    lower.includes("apple")
  ) {
    return "Apple TV+";
  }

  if (
    lower.includes("wow")
  ) {
    return "WOW";
  }

  if (
    lower.includes("sky")
  ) {
    return "Sky";
  }

  if (
    lower.includes("rtl")
  ) {
    return "RTL+";
  }

  if (
    lower.includes("joyn")
  ) {
    return "Joyn";
  }

  return clean;
};

const getProviderNames = (region = "DE") => {
  const regionData =
    watchProviders?.results?.[region];

  if (!regionData) {
    return "";
  }

  const rawProviders = [
    ...(regionData.flatrate || []),
    ...(regionData.free || []),
    ...(regionData.ads || [])
  ];

  const providers =
    rawProviders
      .map((p) => normalizeProviderName(p.provider_name))
      .filter(Boolean)
      .filter((name, index, arr) => arr.indexOf(name) === index);

  const priority = [
    "Paramount+",
    "Netflix",
    "Disney+",
    "Prime Video",
    "Apple TV+",
    "WOW",
    "Sky",
    "RTL+",
    "Joyn"
  ];

  const preferred =
    priority.find((name) => providers.includes(name));

  return preferred || providers[0] || "";
};

const streamingProvider =
  getProviderNames("DE") ||
  getProviderNames("US") ||
  networkText ||
  "";

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

episodeVoteAverage:
  episodeDetails?.vote_average !== undefined &&
  episodeDetails?.vote_average !== null
    ? Number(episodeDetails.vote_average)
    : null,

episodeVoteCount:
  episodeDetails?.vote_count !== undefined &&
  episodeDetails?.vote_count !== null
    ? Number(episodeDetails.vote_count)
    : 0,

episodeOverview:
  episodeDetails?.overview ||
  details.overview ||
  "Keine Beschreibung verfügbar.",

overview:
  episodeDetails?.overview ||
  details.overview ||
  "Keine Beschreibung verfügbar.",

    seasonPosterUrl:
  posterUrl(seasonPosterPath),

posterUrl:
  posterUrl(
    episodeDetails?.still_path ||
    seasonPosterPath ||
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

network:
  networkText || null,

networks:
  networkText || null,

provider:
  streamingProvider || null,

streamingProvider:
  streamingProvider || null,

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
  const text = `${tmdb.collection || ""} ${extras.collection || ""} ${extras.universe || ""} ${tmdb.title || ""} ${extras.fileName || ""}`
    .toLowerCase();

  if (text.includes("superman") || text.includes("man of steel") || text.includes("batman v superman")) {
    return "███ SUPERMAN DOSSIER ███";
  }

  if (text.includes("batman")) {
    return "███ BATMAN DOSSIER ███";
  }

  if (text.includes("dc") || text.includes("justice league") || text.includes("suicide squad")) {
    return "███ DC DOSSIER ███";
  }

  if (text.includes("james bond") || text.includes("007")) {
    return "███ BOND DOSSIER ███";
  }

  if (text.includes("marvel") || text.includes("avengers") || text.includes("iron man") || text.includes("captain america") || text.includes("thor")) {
    return "███ MARVEL DOSSIER ███";
  }

  if (text.includes("x-men") || text.includes("x men") || text.includes("wolverine") || text.includes("deadpool")) {
    return "███ X-MEN DOSSIER ███";
  }

  if (text.includes("spider-man") || text.includes("spiderman") || text.includes("venom")) {
    return "███ SPIDER-VERSE DOSSIER ███";
  }

  if (text.includes("star wars")) {
    return "███ GALACTIC DOSSIER ███";
  }

  if (text.includes("star trek")) {
    return "███ STARFLEET DOSSIER ███";
  }

  if (text.includes("jurassic")) {
    return "███ JURASSIC DOSSIER ███";
  }

  if (text.includes("fast") || text.includes("furious")) {
    return "███ FAST SAGA DOSSIER ███";
  }

  if (text.includes("mission impossible")) {
    return "███ IMF DOSSIER ███";
  }

  if (text.includes("bourne")) {
    return "███ BOURNE DOSSIER ███";
  }

  if (text.includes("final destination")) {
    return "███ FINAL DESTINATION DOSSIER ███";
  }

  if (text.includes("bad boys")) {
    return "███ BAD BOYS DOSSIER ███";
  }

  if (text.includes("pacific rim")) {
    return "███ PACIFIC RIM DOSSIER ███";
  }

  if (text.includes("harry potter") || text.includes("fantastic beasts") || text.includes("phantastische tierwesen")) {
    return "███ WIZARDING WORLD DOSSIER ███";
  }

  if (text.includes("matrix")) {
    return "███ MATRIX DOSSIER ███";
  }

  if (text.includes("terminator")) {
    return "███ TERMINATOR DOSSIER ███";
  }

  if (text.includes("transformers")) {
    return "███ TRANSFORMERS DOSSIER ███";
  }

  if (text.includes("planet der affen") || text.includes("planet of the apes")) {
    return "███ APES DOSSIER ███";
  }

  return "███ LEGENDS DOSSIER ███";
}

// =============================
// COLLECTION SAGA CAPTION
// =============================
function getCollectionCode(collection = "") {
  const key = makeKey(collection);

  if (key.includes("superman")) return "SUP";
  if (key.includes("batman")) return "BAT";
  if (key.includes("dc")) return "DC";
  if (key.includes("james-bond") || key.includes("007")) return "BOND";

  if (key.includes("marvel")) return "MCU";
  if (key.includes("avengers")) return "AVG";
  if (key.includes("x-men") || key.includes("x-men") || key.includes("wolverine") || key.includes("deadpool")) return "XMEN";
  if (key.includes("spider-man") || key.includes("spiderman") || key.includes("venom")) return "SPDR";

  if (key.includes("star-wars")) return "SW";
  if (key.includes("star-trek")) return "ST";

  if (key.includes("fast")) return "FAST";
  if (key.includes("john-wick")) return "WICK";
  if (key.includes("hangover")) return "HANG";
  if (key.includes("mission")) return "IMF";
  if (key.includes("bourne")) return "BOUR";
  if (key.includes("final-destination")) return "FD";
  if (key.includes("jurassic")) return "JURA";
  if (key.includes("harry-potter")) return "HP";
  if (key.includes("fantastic-beasts") || key.includes("phantastische-tierwesen")) return "FB";
  if (key.includes("terminator")) return "TERM";
  if (key.includes("matrix")) return "MTRX";
  if (key.includes("bad-boys")) return "BAD";
  if (key.includes("pacific-rim")) return "PAC";
  if (key.includes("transformers")) return "TRF";
  if (key.includes("planet-der-affen") || key.includes("planet-of-the-apes")) return "APES";

  const short =
    String(collection || "SAGA")
      .replace(/filmreihe/gi, "")
      .replace(/collection/gi, "")
      .replace(/reihe/gi, "")
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
  detectCollection(tmdb.title, {
    ...extras,
    collection: tmdb.collection || extras.collection,
    fileName: extras.fileName || extras.file_name || extras.file || ""
  }) ||
  tmdb.collection ||
  extras.collection ||
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

function llDetectAudioTextFromFileName(fileName = "", fallback = "") {
  const combined =
    `${fileName || ""} ${fallback || ""}`
      .toLowerCase()
      .replace(/[._-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const fallbackClean =
    String(fallback || "")
      .replace(/\s+/g, " ")
      .trim();

  const fallbackIsUseful =
    fallbackClean &&
    ![
      "unbekannt",
      "unknown",
      "leer",
      "n/a",
      "-"
    ].includes(fallbackClean.toLowerCase());

  const hasGerman =
    /\b(german|deutsch|ger|de)\b/i.test(combined);

  const hasEnglish =
    /\b(english|englisch|eng|en)\b/i.test(combined);

  const hasDual =
    /\b(dl|dual|multi|mehrsprachig|2 audio|zwei tonspuren)\b/i.test(combined);

  const hasDdPlus =
    /\b(ddp|dd\+|eac3|e-ac-3|dolby digital plus)\b/i.test(combined);

  const hasAc3 =
    /\b(ac3|ac-3|dolby digital)\b/i.test(combined);

  const hasAac =
    /\b(aac)\b/i.test(combined);

  let languageText = "";

  if ((hasGerman && hasDual) || (hasGerman && hasEnglish) || hasDual) {
    languageText = "Deutsch / Dual Language";
  } else if (hasGerman) {
    languageText = "Deutsch";
  } else if (hasEnglish) {
    languageText = "Englisch";
  } else if (fallbackIsUseful && !fallbackClean.toLowerCase().includes("unbekannt")) {
    languageText = fallbackClean;
  } else {
    languageText = "Deutsch";
  }

  if (hasDdPlus) {
    return `${languageText} DD+`;
  }

  if (hasAc3) {
    return `${languageText} AC-3`;
  }

  if (hasAac) {
    return `${languageText} AAC`;
  }

  return languageText;
}

function llExtractRatingNumber(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const matches =
    String(value)
      .replace(",", ".")
      .match(/\d+(?:\.\d+)?/g);

  if (!matches || !matches.length) {
    return null;
  }

  const number =
    Number(matches[matches.length - 1]);

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  if (number > 10 && number <= 100) {
    return number / 10;
  }

  if (number > 10) {
    return 10;
  }

  return number;
}

// =============================
// MOVIE CAPTION — LIBRARY V3 COMPACT BLOCK STYLE
// =============================
function movieCaption(tmdb = {}, extras = {}) {
  const makeHashTag = (value = "") => {
    const clean =
      String(value || "")
        .replace(/&/g, "Und")
        .replace(/[^\p{L}\p{N}]+/gu, "")
        .trim();

    return clean ? `#${clean}` : "";
  };

  const safeText = (value = "") =>
    String(value || "")
      .replace(/</g, "‹")
      .replace(/>/g, "›")
      .replace(/\s+/g, " ")
      .trim();

  const title =
    safeText(
      tmdb.title ||
      extras.title ||
      "Unbekannter Film"
    );

  const year =
    tmdb.year ||
    extras.year ||
    "";

  const titleLine =
    year
      ? `🎬 ${title} (${year})`
      : `🎬 ${title}`;

  const ratingNumber =
    typeof llExtractRatingNumber === "function"
      ? llExtractRatingNumber(
          tmdb.rating ||
          tmdb.vote_average ||
          tmdb.voteAverage ||
          extras.rating ||
          ""
        )
      : typeof extractRatingNumber === "function"
        ? extractRatingNumber(
            tmdb.rating ||
            extras.rating ||
            ""
          )
        : null;

  const ratingText =
    ratingNumber
      ? `${Number(ratingNumber).toFixed(1)}/10`
      : "folgt";

  const rawFsk =
    safeText(
      tmdb.fsk ||
      tmdb.certification ||
      tmdb.ageRating ||
      extras.fsk ||
      extras.certification ||
      ""
    );

  const fskText =
    rawFsk
      ? (
          rawFsk.toUpperCase().startsWith("FSK")
            ? rawFsk
            : `FSK ${rawFsk}`
        )
      : "FSK Unbekannt";

  const castSource =
    Array.isArray(tmdb.cast)
      ? tmdb.cast.join(" • ")
      : (
          tmdb.cast ||
          extras.cast ||
          ""
        );

  const castTags =
    String(castSource || "")
      .split(/•|,|\//)
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, 2)
      .map(makeHashTag)
      .filter(Boolean)
      .join(" · ");

  const castLine =
    castTags || "#CastFolgt";

  const overview =
    typeof trimTextAtSentence === "function"
      ? trimTextAtSentence(
          tmdb.overview ||
          extras.overview ||
          "Keine Beschreibung verfügbar.",
          260
        )
      : safeText(
          tmdb.overview ||
          extras.overview ||
          "Keine Beschreibung verfügbar."
        ).slice(0, 260);

  const rawQuality =
    safeText(
      extras.quality ||
      tmdb.quality ||
      ""
    );

  const quality =
    /2160|uhd|4k/i.test(rawQuality)
      ? "UHD"
      : /1080|fhd/i.test(rawQuality)
        ? "FHD"
        : /720|hd/i.test(rawQuality)
          ? "HD"
          : rawQuality || "Unbekannt";

  const fileSize =
    typeof llFormatCompactSize === "function"
      ? llFormatCompactSize(
          extras.fileSize ||
          extras.file_size ||
          extras.fileSizeBytes ||
          extras.file_size_bytes ||
          tmdb.fileSize ||
          tmdb.file_size ||
          ""
        )
      : (
          extras.fileSize ||
          extras.file_size ||
          tmdb.fileSize ||
          tmdb.file_size ||
          ""
        );

  const fileName =
    extras.fileName ||
    extras.file_name ||
    tmdb.fileName ||
    tmdb.file_name ||
    "";

  const audioRaw =
    typeof llDetectAudioTextFromFileName === "function"
      ? llDetectAudioTextFromFileName(
          fileName,
          extras.audio ||
          extras.audioText ||
          extras.language ||
          extras.languages ||
          tmdb.audio ||
          tmdb.language ||
          ""
        )
      : (
          extras.audio ||
          extras.audioText ||
          extras.language ||
          tmdb.audio ||
          tmdb.language ||
          ""
        );

  const audio =
    safeText(audioRaw || "Unbekannt");

  const mediaLine =
    [
      quality,
      fileSize || "Unbekannt",
      audio
    ]
      .filter(Boolean)
      .join(" · ");

  const genreTags =
    String(tmdb.genre || extras.genre || "")
      .split(/\/|•|,/)
      .map((g) => g.trim())
      .filter(Boolean)
      .slice(0, 3)
      .map(makeHashTag)
      .filter(Boolean)
      .join(" ");

  const libraryIdRaw =
    extras.libraryId ||
    extras.library_id ||
    tmdb.libraryId ||
    tmdb.library_id ||
    "";

  const libraryId =
    libraryIdRaw
      ? (
          String(libraryIdRaw).startsWith("#")
            ? String(libraryIdRaw)
            : `#${libraryIdRaw}`
        )
      : "#LIB0000";

  const archiveLine =
    [
      libraryId,
      genreTags
    ]
      .filter(Boolean)
      .join(" ");
      
        const movieSeriesStatus =
    extras.movieSeriesStatus || null;

  let seriesLine = "";

  if (movieSeriesStatus?.name) {
    const statusText =
      movieSeriesStatus.complete
        ? `✅ vollständig ${movieSeriesStatus.presentCount}/${movieSeriesStatus.total}`
        : `⚠️ ${movieSeriesStatus.presentCount}/${movieSeriesStatus.total} vorhanden`;

    seriesLine =
      `🎞 Reihe: ${movieSeriesStatus.name} · ${statusText}\n`;
  }

  const resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    `${titleLine}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    `⭐ Bewertung: ${ratingText} | 🔞 ${fskText}\n` +
    `👥 ${castLine}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    "📝 Handlung:\n" +
    `${safeText(overview)}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    `📦 ${mediaLine}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    seriesLine +
    `🗂 Archiv: ${archiveLine}\n` +
    "@LibraryOfLegends";

  return (
    typeof cleanTelegramText === "function"
      ? cleanTelegramText(resultText)
      : resultText
  ).slice(0, 1200);
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
// SERIES EPISODE CAPTION — LIBRARY V3 COMPACT
// =============================
async function seriesCaption(tmdb = {}, media = {}, extras = {}) {
  const makeHashTag = (value = "") => {
    const clean =
      String(value || "")
        .replace(/&/g, "Und")
        .replace(/[^\p{L}\p{N}]+/gu, "")
        .trim();

    return clean ? `#${clean}` : "";
  };

  const title =
    String(
      tmdb.seriesTitle ||
      tmdb.title ||
      media.seriesTitle ||
      "Unbekannte Serie"
    )
      .replace(/\s+/g, " ")
      .trim();

  const season =
    Number(
      media.season ||
      tmdb.seasonNumber ||
      1
    );

  const episode =
    Number(
      media.episode ||
      tmdb.episodeNumber ||
      1
    );

  const seasonText =
    String(season).padStart(2, "0");

  const episodeText =
    String(episode).padStart(2, "0");

  const episodeCode =
    `S${seasonText}E${episodeText}`;

  const episodeTitle =
    String(
      tmdb.episodeTitle ||
      media.episodeTitleFromFile ||
      ""
    )
      .replace(/\s+\/\s+/g, " · ")
      .replace(/\s+/g, " ")
      .trim();

  const ratingNumber =
    typeof llGetRealEpisodeRating === "function"
      ? llGetRealEpisodeRating(tmdb, media, extras)
      : typeof llExtractRatingNumber === "function"
        ? llExtractRatingNumber(
            tmdb.episodeRating ||
            tmdb.rating ||
            tmdb.vote_average ||
            tmdb.voteAverage ||
            ""
          )
        : extractRatingNumber(
            tmdb.episodeRating ||
            tmdb.rating ||
            ""
          );

  const rating =
    ratingNumber
      ? `${Number(ratingNumber).toFixed(1)}/10`
      : "folgt";

  const quality =
    extras.quality ||
    tmdb.quality ||
    "Unbekannt";

  const fileSize =
    typeof llFormatCompactSize === "function"
      ? llFormatCompactSize(
          extras.fileSize ||
          extras.file_size ||
          tmdb.fileSize ||
          tmdb.file_size ||
          ""
        )
      : (
          extras.fileSize ||
          extras.file_size ||
          tmdb.fileSize ||
          tmdb.file_size ||
          ""
        );

  const fileName =
    extras.fileName ||
    extras.file_name ||
    tmdb.fileName ||
    tmdb.file_name ||
    "";

  const audio =
    typeof llDetectAudioTextFromFileName === "function"
      ? llDetectAudioTextFromFileName(
          fileName,
          extras.audio ||
            extras.audioText ||
            extras.language ||
            extras.languages ||
            tmdb.audio ||
            tmdb.language ||
            ""
        )
      : (
          extras.audio ||
          extras.audioText ||
          tmdb.audio ||
          "Unbekannt"
        );

  const mediaLine =
    [
      quality,
      fileSize || "Unbekannt",
      audio || "Unbekannt"
    ]
      .filter(Boolean)
      .join(" · ");

  const overview =
    trimTextAtSentence(
      tmdb.episodeOverview ||
      tmdb.overview ||
      extras.overview ||
      "Keine Beschreibung verfügbar.",
      220
    );

  const seriesTag =
    makeHashTag(title);

  const episodeTag =
    makeHashTag(episodeCode);

  const resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    `📺 ${escapeHtml(title)}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    `${escapeHtml(episodeCode)}\n` +
    `${episodeTitle ? `${escapeHtml(episodeTitle)}\n` : ""}` +
    "━━━━━━━━━━━━━━━━━━\n" +
    `⭐ ${escapeHtml(rating)}\n` +
    `📦 ${escapeHtml(mediaLine)}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    `${escapeHtml(overview)}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    `Staffel ${season} · Episode ${episode}\n` +
    `${seriesTag} ${episodeTag}\n` +
    "@LibraryOfLegends";

  return cleanTelegramText(resultText).slice(0, 1000);
}

function llFormatEpisodeRank(tmdb = {}, media = {}, extras = {}) {
  const rating =
    llGetRealEpisodeRating(tmdb, media, extras);

  if (rating === null) {
    return "⭐ Rank: 🏆 Archive ∙ Noch nicht bewertet";
  }

  const stars =
    llStarsFromRating10(rating);

  return `⭐ Rank: 🏆 ${rating.toFixed(1)}/10 ∙ ${stars}`;
}

function llGetRealEpisodeRating(tmdb = {}, media = {}, extras = {}) {
  const candidates = [
    tmdb.episodeVoteAverage,
    tmdb.episodeRating,
    tmdb.episode?.vote_average,
    tmdb.episode?.voteAverage,
    media.episodeVoteAverage,
    media.episodeRating,
    extras.episodeVoteAverage,
    extras.episodeRating
  ];

  for (const value of candidates) {
    const rating =
      llNormalizeEpisodeRating(value);

    if (rating !== null && rating > 0) {
      return rating;
    }
  }

  return null;
}

function llNormalizeEpisodeRating(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const match =
    String(value)
      .replace(",", ".")
      .match(/\d+(?:\.\d+)?/);

  if (!match) {
    return null;
  }

  const number =
    Number(match[0]);

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  if (number > 10 && number <= 100) {
    return number / 10;
  }

  if (number > 10) {
    return 10;
  }

  return number;
}

function llStarsFromRating10(rating = 0) {
  const stars =
    Math.max(
      0,
      Math.min(
        5,
        Math.round(Number(rating || 0) / 2)
      )
    );

  return "★".repeat(stars) + "☆".repeat(5 - stars);
}

function llShortSeriesTitle(title = "") {
  const clean =
    String(title || "")
      .replace(/\s+/g, " ")
      .trim();

  const key =
    clean
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");

  const shortTitles = {
    starwarsdieabenteuerderjungenjedi: "Star Wars: Junge Jedi",
    starwarsjungejedi: "Star Wars: Junge Jedi"
  };

  return shortTitles[key] || clean;
}

function llCompactDossierText(text = "", maxLength = 260) {
  const clean =
    String(text || "")
      .replace(/\s+/g, " ")
      .trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  const cut =
    clean.slice(0, maxLength);

  const lastSentence =
    Math.max(
      cut.lastIndexOf("."),
      cut.lastIndexOf("!"),
      cut.lastIndexOf("?")
    );

  if (lastSentence > maxLength * 0.55) {
    return cut.slice(0, lastSentence + 1);
  }

  return cut.replace(/\s+\S*$/, "") + "…";
}

function llFormatCompactSize(value) {
  if (!value) {
    return "Unbekannt";
  }

  if (typeof value === "number") {
    const mb =
      value > 1024 * 1024
        ? value / 1024 / 1024
        : value;

    return `${Math.round(mb)} MB`;
  }

  const text =
    String(value).trim();

  const match =
    text.match(/([\d.,]+)\s*(GB|MB)/i);

  if (!match) {
    return text;
  }

  const number =
    Number(match[1].replace(",", "."));

  const unit =
    match[2].toUpperCase();

  if (unit === "GB") {
    return `${number.toFixed(2)} GB`;
  }

  return `${Math.round(number)} MB`;
}

function llFormatCompactQuality(media = {}, extras = {}) {
  const quality =
    String(extras.quality || media.quality || "")
      .toUpperCase()
      .trim();

  const resolution =
    extras.resolution ||
    extras.videoResolution ||
    media.resolution ||
    "";

  const width =
    Number(extras.width || media.width || 0);

  const height =
    Number(extras.height || media.height || 0);

  const resMatch =
    String(resolution).match(/(\d{3,4})x(\d{3,4})/);

  const detectedWidth =
    width || Number(resMatch?.[1] || 0);

  const detectedHeight =
    height || Number(resMatch?.[2] || 0);

  if (
    quality.includes("UHD") ||
    quality.includes("4K") ||
    detectedHeight >= 2160 ||
    detectedWidth >= 3840
  ) {
    return "UHD 2160p";
  }

  if (
    quality.includes("FHD") ||
    quality.includes("1080") ||
    detectedHeight >= 1080 ||
    detectedWidth >= 1920
  ) {
    return "FHD 1080p";
  }

  if (
    quality.includes("HD") ||
    quality.includes("720") ||
    detectedHeight >= 720 ||
    detectedWidth >= 1280
  ) {
    return "HD 720p";
  }

  return "SD";
}

function llFormatCompactAudio(media = {}, extras = {}) {
  const rawLang =
    extras.audio ||
    extras.audioLanguage ||
    media.audio ||
    media.audioLanguage ||
    "";

  const rawCodec =
    extras.audioCodec ||
    media.audioCodec ||
    "DD+";

  const rawChannels =
    extras.audioChannels ||
    media.audioChannels ||
    "";

  const lang =
    String(rawLang || "").toLowerCase();

  let flag = "🇩🇪";

  if (
    lang.includes("deutsch") &&
    lang.includes("englisch")
  ) {
    flag = "🇩🇪/🇬🇧";
  } else if (
    lang.includes("english") ||
    lang.includes("englisch")
  ) {
    flag = "🇬🇧";
  }

  let codec =
    String(rawCodec || "DD+")
      .replace("E-AC3 / DDP", "DD+")
      .replace("E-AC3", "DD+")
      .replace("DDP", "DD+")
      .replace("Unbekannt", "DD+")
      .trim();

  if (!codec) {
    codec = "DD+";
  }

  const channels =
    rawChannels && rawChannels !== "Unbekannt"
      ? ` ${rawChannels}`
      : "";

  return `${flag} ${codec}${channels}`.trim();
}

function llNormalizeGenreName(genre = "") {
  const value =
    String(genre || "")
      .replace(/\s+/g, " ")
      .trim();

  const key =
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");

  const map = {
    kids: "Familie",
    family: "Familie",
    familie: "Familie",
    children: "Familie",
    kinder: "Familie",

    sciencefiction: "Sci-Fi",
    scifi: "Sci-Fi",
    syfy: "Sci-Fi",

    actionadventure: "Action",
    adventure: "Abenteuer",

    crime: "Krimi",
    mystery: "Mystery",
    thriller: "Thriller",
    horror: "Horror",

    animation: "Animation",
    anime: "Anime",

    comedy: "Komödie",
    drama: "Drama",
    fantasy: "Fantasy",

    documentary: "Dokumentation",
    history: "Historie",
    war: "Krieg",
    western: "Western",

    tvmovie: "TV-Film",
    music: "Musik",
    romance: "Romantik"
  };

  return map[key] || value || "Sonstige";
}

function llMakeCompactHashTag(text = "") {
  return String(text || "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) =>
      word.charAt(0).toUpperCase() +
      word.slice(1)
    )
    .join("");
}

// =============================
// SERIES REGISTRY CAPTION — SERIES HUB
// =============================
function buildSeriesRegistryBar(current = 0, total = 0) {
  const safeTotal =
    Math.max(Number(total || 0), 1);

  const safeCurrent =
    Math.max(Number(current || 0), 0);

  const percent =
    Math.max(
      0,
      Math.min(1, safeCurrent / safeTotal)
    );

  const slots = 10;

  const filled =
    Math.round(percent * slots);

  return (
    "▓".repeat(filled) +
    "░".repeat(slots - filled)
  );
}

function getSeriesRegistryLevel(current = 0, total = 0) {
  const safeTotal =
    Number(total || 0);

  const safeCurrent =
    Number(current || 0);

  if (!safeTotal || safeCurrent <= 0) {
    return "🆕 NEW SERIES ENTRY";
  }

  const percent =
    Math.round((safeCurrent / safeTotal) * 100);

  if (percent >= 100) {
    return "👑 MASTERED ELITE ARCHIVE";
  }

  if (percent >= 75) {
    return "🔥 ACTIVE PREMIUM ARCHIVE";
  }

  if (percent >= 35) {
    return "⚙️ ACTIVE SERIES ARCHIVE";
  }

  return "🧩 BUILDING SERIES ARCHIVE";
}

function getSeriesRegistryStatus(rating = "", current = 0, total = 0) {
  const ratingNumber =
    getRatingValue(rating);

  const safeTotal =
    Number(total || 0);

  const safeCurrent =
    Number(current || 0);

  const complete =
    safeTotal > 0 &&
    safeCurrent >= safeTotal;

  if (ratingNumber >= 8 && complete) {
    return "🏆 MASTERPIECE SELECTION";
  }

  if (complete) {
    return "✅ COMPLETE SERIES ARCHIVE";
  }

  if (safeCurrent > 0) {
    return "📡 ACTIVE BROADCAST ARCHIVE";
  }

  return "🆕 NEW SERIES REGISTRY";
}

function buildSeriesSeasonTimeline(seasons = []) {
  if (!Array.isArray(seasons) || !seasons.length) {
    return "└─ 📀 S01 │ ░░░░░░░░░░ 0/0 [PENDING]";
  }

  return seasons
    .slice(0, 8)
    .map((season, index) => {
      const seasonNumber =
        String(season.season || season.season_number || index + 1)
          .padStart(2, "0");

      const saved =
        Number(
          season.savedEpisodes ??
          season.saved ??
          season.current ??
          season.episodesSaved ??
          0
        );

      const totalRaw =
  season.totalEpisodes ??
  season.total ??
  season.official ??
  season.episode_count ??
  saved;

const total =
  Number(totalRaw || 0);

      const hasOfficialTotal =
  total > 0;

const complete =
  hasOfficialTotal &&
  saved >= total;

const bar =
  hasOfficialTotal
    ? buildSeriesRegistryBar(saved, total)
    : "▓".repeat(Math.min(saved, 10)) +
      "░".repeat(Math.max(10 - Math.min(saved, 10), 0));

      const connector =
  "├─";

      const status =
  complete
    ? "[ONLINE]"
    : saved > 0
      ? "[ACTIVE]"
      : "[PENDING]";

const totalText =
  hasOfficialTotal
    ? total
    : "?";

return (
  `${connector} 📀 S${seasonNumber} │ ${bar} ${saved}/${totalText} ${status}`
);
    })
    .join("\n");
}

function makeSeriesRegistryTags(seriesTitle = "", genre = "", level = "") {
  const seriesTag =
    "#" + String(seriesTitle || "Serie")
      .split(/\s+/)
      .filter(Boolean)
      .map((word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
      )
      .join("")
      .replace(/[^a-zA-Z0-9ÄÖÜäöüß]/g, "");

  const genreTags =
    String(genre || "")
      .split(/[\/•,]/)
      .map((g) => g.trim())
      .filter(Boolean)
      .slice(0, 2)
      .map((g) => `#${g.replace(/\s+/g, "")}`)
      .join(" ");

  const eliteTag =
    String(level || "").includes("MASTERED")
      ? "#ELITE"
      : "#SERIES";

  return [genreTags, seriesTag, eliteTag]
    .filter(Boolean)
    .join(" ");
}

function seriesRegistryCaption(series = {}, stats = {}) {
  const title =
    series.title ||
    series.seriesTitle ||
    series.name ||
    "Unbekannte Serie";
    
    const displayTitle =
  llShortSeriesTitle(title);

  const year =
    series.year ||
    String(series.first_air_date || series.firstAirDate || "")
      .slice(0, 4) ||
    "";

  const genre =
    series.genre ||
    series.genres ||
    "Sonstige";

  const genreParts =
    String(genre || "Sonstige")
      .split(/[\/•,]/)
      .map((g) => llNormalizeGenreName(g.trim()))
      .filter(Boolean)
      .slice(0, 2);

  const genreText =
    genreParts.length
      ? genreParts.join(" · ")
      : "Sonstige";

  const ratingNumber =
    getRatingValue(series.rating || stats.rating);

  const ratingText =
    ratingNumber > 0
      ? `${ratingNumber.toFixed(1)}/10`
      : "Unbekannt";

  const savedEpisodes =
    Number(
      stats.savedEpisodes ??
      stats.currentEpisodes ??
      series.savedEpisodes ??
      0
    );

  const totalEpisodes =
    Number(
      stats.totalEpisodes ??
      stats.officialTotalEpisodes ??
      series.total_episodes ??
      series.totalEpisodes ??
      0
    );

  const episodeProgress =
    totalEpisodes > 0
      ? `${savedEpisodes}/${totalEpisodes} Folgen im Archiv`
      : `${savedEpisodes} Folgen im Archiv`;

  const status =
    totalEpisodes > 0 && savedEpisodes >= totalEpisodes
      ? "Vollständig"
      : savedEpisodes > 0
        ? "Im Aufbau"
        : "Noch nicht gestartet";

  const story =
  trimTextAtSentence(
    series.overview ||
    series.description ||
    "Keine Serienbeschreibung verfügbar.",
    260
  ).replace(/\s+\/\s+/g, " ");

  const seasons =
    Array.isArray(stats.seasons)
      ? stats.seasons
      : Array.isArray(series.seasons)
        ? series.seasons
        : [];

  const seasonLines =
    seasons.length
      ? seasons
          .slice(0, 10)
          .map((season, index) => {
            const seasonNumber =
              Number(
                season.season ||
                season.season_number ||
                index + 1
              );

            const seasonText =
              String(seasonNumber).padStart(2, "0");

            const saved =
              Number(
                season.savedEpisodes ??
                season.saved ??
                season.current ??
                season.episodesSaved ??
                0
              );

            const total =
              Number(
                season.totalEpisodes ??
                season.total ??
                season.official ??
                season.episode_count ??
                0
              );

            if (total > 0) {
              return `S${seasonText} · ${saved}/${total} Folgen`;
            }

            return `S${seasonText} · ${saved} Folgen`;
          })
          .join("\n")
      : "Noch keine Staffeldaten verfügbar.";

  const moreSeasons =
    seasons.length > 10
      ? `\n+ ${seasons.length - 10} weitere Staffel(n)`
      : "";

  const seriesTag =
  "#" + llMakeCompactHashTag(displayTitle);

  const caption = [
    `📺 ${escapeHtml(displayTitle)}${year ? ` (${escapeHtml(year)})` : ""}`,
    "",
    `⭐ ${escapeHtml(ratingText)}`,
    `🎭 ${escapeHtml(genreText)}`,
    `📚 ${escapeHtml(episodeProgress)}`,
    `Status · ${escapeHtml(status)}`,
    "",
    escapeHtml(story),
    "",
    "Staffeln",
    escapeHtml(seasonLines + moreSeasons),
    "",
    `${seriesTag} #Serien`,
    "@LibraryOfLegends"
  ].join("\n");

  return cleanTelegramText(caption).slice(0, 1800);
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

// =============================
// ACCESS BOT WRAPPER
// Für access-commands.js
// =============================
const accessBot = {
  async sendMessage(chatId, text, options = {}) {
    return tg("sendMessage", {
      chat_id: chatId,
      text,
      ...options
    });
  },

  async sendVideo(chatId, video, options = {}) {
    return tg("sendVideo", {
      chat_id: chatId,
      video,
      ...options
    });
  },

  async sendDocument(chatId, document, options = {}) {
    return tg("sendDocument", {
      chat_id: chatId,
      document,
      ...options
    });
  },

  async answerCallbackQuery(callbackQueryId, options = {}) {
    return tg("answerCallbackQuery", {
      callback_query_id: callbackQueryId,
      ...options
    });
  },

  async editMessageText(chatId, messageId, text, options = {}) {
    return tg("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      ...options
    });
  }
};

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

// =============================
// RECREATE TELEGRAM TOPIC
// Erzwingt ein neues Topic
// =============================
async function recreateTopic({ chatId, name, type }) {

  const uniqueKey =
    makeKey(`${type}-${chatId}-${name}`);

  const topic = await tg("createForumTopic", {
    chat_id: chatId,
    name
  });

  if (!topic?.message_thread_id) {
    console.error(
      "❌ Neues Topic konnte nicht erstellt werden:",
      name
    );
    return null;
  }

  if (pgPool) {

    await pgPool.query(
      `
      UPDATE topics
      SET topic_id = $1
      WHERE unique_key = $2
      `,
      [
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

  console.log(
    "♻️ Topic neu erstellt:",
    name,
    topic.message_thread_id
  );

  return topic.message_thread_id;
}

// =============================
// FIXED LIBRARY TOPICS V3
// =============================
const FIXED_LIBRARY_TOPICS = {
  start: {
    name: "📌 Start & Suche",
    movieType: "movie_start",
    seriesType: "series_start",
    locked: true,
    pin: true,
    description:
      "Inhaltsverzeichnis, Suche und wichtigste Navigation."
  },

  action: {
    name: "💥 Action, Thriller & Sci-Fi",
    movieType: "movie_category",
    seriesType: "series_category",
    locked: true,
    pin: false,
    description:
      "Action, Thriller, Sci-Fi, Fantasy, Abenteuer und schnelle Unterhaltung."
  },

  drama: {
    name: "🍿 Komödie, Drama & Familie",
    movieType: "movie_category",
    seriesType: "series_category",
    locked: true,
    pin: false,
    description:
      "Komödie, Drama, Familie, Romantik, Animation und ruhige Unterhaltung."
  },

  horror: {
    name: "👻 Horror, Mystery & Psycho",
    movieType: "movie_category",
    seriesType: "series_category",
    locked: true,
    pin: false,
    description:
      "Horror, Mystery, Psycho, düstere Thriller und gruselige Inhalte."
  },

    classic: {
    name: "📺 Klassiker & Nostalgie",
    movieType: "movie_category",
    seriesType: "series_category",
    locked: true,
    pin: false,
    description:
      "Filme und Serien vor dem Jahr 2000."
  },

  movieGaps: {
    name: "🧩 Fehlende Filme & Reihen",
    movieType: "movie_gaps",
    seriesType: null,
    locked: true,
    pin: false,
    description:
      "Übersicht über unvollständige Filmreihen und fehlende Filme im Archiv."
  },

  seriesGaps: {
    name: "🧩 Fehlende Episoden",
    movieType: null,
    seriesType: "series_gaps",
    locked: true,
    pin: false,
    description:
      "Übersicht über unvollständige Serien, fehlende Staffeln und fehlende Episoden."
  },

  chat: {
    name: "💬 Mitglieder-Chat & Wünsche",
    movieType: "member_chat",
    seriesType: "member_chat",
    locked: false,
    pin: false,
    description:
      "Mitglieder-Chat, Wünsche, Fragen und Dateianfragen."
  }
};

async function getTopicByUniqueKeyAsync(uniqueKey) {
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

    return result.rows[0] || null;
  }

  return getTopic(uniqueKey);
}

async function getTopicByThreadId(chatId, topicId) {
  if (!chatId || !topicId) {
    return null;
  }

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT *
      FROM topics
      WHERE chat_id = $1
      AND topic_id = $2
      LIMIT 1
      `,
      [
        String(chatId),
        Number(topicId)
      ]
    );

    return result.rows[0] || null;
  }

  return db.prepare(`
    SELECT *
    FROM topics
    WHERE chat_id = ?
    AND topic_id = ?
    LIMIT 1
  `).get(
    String(chatId),
    Number(topicId)
  );
}

async function saveTopicHubMessageIdByKey(uniqueKey, messageId) {
  if (!uniqueKey || !messageId) {
    return;
  }

  if (pgPool) {
    await pgPool.query(
      `
      UPDATE topics
      SET hub_message_id = $1
      WHERE unique_key = $2
      `,
      [
        Number(messageId),
        uniqueKey
      ]
    );

    return;
  }

  db.prepare(`
    UPDATE topics
    SET hub_message_id = ?
    WHERE unique_key = ?
  `).run(
    Number(messageId),
    uniqueKey
  );
}

function fixedTopicIntroCaption(topic, groupLabel = "Archiv") {
  return (
    "━━━━━━━━━━━━━━━━━━\n" +
    `${topic.name}\n` +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    `${topic.description}\n\n` +
    (
      topic.locked
        ? "🔒 Schreibschutz · Nur Admins & Bots\n"
        : "💬 Mitgliederbereich · Chat & Wünsche erlaubt\n"
    ) +
    `🏛 Bereich · ${groupLabel}\n\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends"
  );
}

async function ensureFixedTopic({
  chatId,
  topic,
  type,
  groupLabel
}) {
  if (!chatId || !topic?.name || !type) {
    return null;
  }

  const topicId =
    await createOrGetTopic({
      chatId,
      name: topic.name,
      type
    });

  if (!topicId) {
    return null;
  }

  const uniqueKey =
    makeKey(`${type}-${chatId}-${topic.name}`);

  const row =
    await getTopicByUniqueKeyAsync(uniqueKey);

  if (row?.hub_message_id) {
    return topicId;
  }

  const sent =
    await tg("sendMessage", {
      chat_id: chatId,
      message_thread_id: Number(topicId),
      text: fixedTopicIntroCaption(topic, groupLabel)
    });

  if (sent?.message_id) {
    await saveTopicHubMessageIdByKey(
      uniqueKey,
      sent.message_id
    );

    if (topic.pin) {
      try {
        await tg("pinChatMessage", {
          chat_id: chatId,
          message_id: sent.message_id,
          disable_notification: true
        });
      } catch (err) {
        console.error(
          "⚠️ Topic Pin Fehler:",
          topic.name,
          err.message
        );
      }
    }
  }

  return topicId;
}

async function setupFixedLibraryTopicsForChat({
  chatId,
  groupType
}) {
  const isSeriesGroup =
    groupType === "series";

  const groupLabel =
    isSeriesGroup
      ? "Seriengruppe"
      : "Filmgruppe";

  const result = [];

  for (const topic of Object.values(FIXED_LIBRARY_TOPICS)) {
        const type =
      isSeriesGroup
        ? topic.seriesType
        : topic.movieType;

    if (!type) {
      continue;
    }

    const topicId =
      await ensureFixedTopic({
        chatId,
        topic,
        type,
        groupLabel
      });

    result.push({
      name: topic.name,
      topicId
    });

    await sleep(1200);
  }

  return result;
}

async function setupFixedLibraryTopics() {
  const movieTopics =
    await setupFixedLibraryTopicsForChat({
      chatId: MOVIE_GROUP_ID,
      groupType: "movie"
    });

  const seriesTopics =
    await setupFixedLibraryTopicsForChat({
      chatId: SERIES_GROUP_ID,
      groupType: "series"
    });

  return {
    movieTopics,
    seriesTopics
  };
}

// =============================
// MOVIE A–Z INDEX V3
// =============================
async function getMovieTitlesForAzV3() {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT DISTINCT title, year
      FROM movies
      WHERE title IS NOT NULL
      AND title <> ''
      ORDER BY title ASC
    `);

    rows = result.rows || [];
  } else {
    rows = db.prepare(`
      SELECT DISTINCT title, year
      FROM movies
      WHERE title IS NOT NULL
      AND title <> ''
      ORDER BY title ASC
    `).all();
  }

  const seen = new Set();

  return rows
    .map((row) => {
      const title =
        String(row.title || "")
          .replace(/\s+/g, " ")
          .trim();

      const year =
        row.year ? ` (${row.year})` : "";

      return {
        title,
        label: `${title}${year}`
      };
    })
    .filter((item) => item.title)
    .filter((item) => {
      const key =
        typeof makeKey === "function"
          ? makeKey(item.label)
          : item.label.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort((a, b) =>
      a.label.localeCompare(b.label, "de", {
        sensitivity: "base"
      })
    );
}

// =============================
// A–Z PAGED INDEX STORAGE V3
// speichert Message-IDs der einzelnen A–Z-Seiten
// =============================
async function ensureAzIndexPagesTableV3() {
  if (pgPool) {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS az_index_pages (
        id SERIAL PRIMARY KEY,
        index_key TEXT UNIQUE NOT NULL,
        index_type TEXT NOT NULL,
        chat_id TEXT NOT NULL,
        topic_id INTEGER NOT NULL,
        letter TEXT NOT NULL,
        page INTEGER NOT NULL,
        message_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    return;
  }

  db.prepare(`
    CREATE TABLE IF NOT EXISTS az_index_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      index_key TEXT UNIQUE NOT NULL,
      index_type TEXT NOT NULL,
      chat_id TEXT NOT NULL,
      topic_id INTEGER NOT NULL,
      letter TEXT NOT NULL,
      page INTEGER NOT NULL,
      message_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

async function getAzIndexPageV3(indexKey) {
  await ensureAzIndexPagesTableV3();

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT *
      FROM az_index_pages
      WHERE index_key = $1
      LIMIT 1
      `,
      [indexKey]
    );

    return result.rows[0] || null;
  }

  return db.prepare(`
    SELECT *
    FROM az_index_pages
    WHERE index_key = ?
    LIMIT 1
  `).get(indexKey);
}

async function getAzIndexPagesByTypeV3({
  chatId,
  indexType
}) {
  await ensureAzIndexPagesTableV3();

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT *
      FROM az_index_pages
      WHERE chat_id = $1
      AND index_type = $2
      `,
      [
        String(chatId),
        indexType
      ]
    );

    return result.rows || [];
  }

  return db.prepare(`
    SELECT *
    FROM az_index_pages
    WHERE chat_id = ?
    AND index_type = ?
  `).all(
    String(chatId),
    indexType
  );
}

async function saveAzIndexPageV3({
  indexKey,
  indexType,
  chatId,
  topicId,
  letter,
  page,
  messageId
}) {
  await ensureAzIndexPagesTableV3();

  if (pgPool) {
    await pgPool.query(
      `
      INSERT INTO az_index_pages
      (index_key, index_type, chat_id, topic_id, letter, page, message_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (index_key)
      DO UPDATE SET
        index_type = EXCLUDED.index_type,
        chat_id = EXCLUDED.chat_id,
        topic_id = EXCLUDED.topic_id,
        letter = EXCLUDED.letter,
        page = EXCLUDED.page,
        message_id = EXCLUDED.message_id
      `,
      [
        indexKey,
        indexType,
        String(chatId),
        Number(topicId),
        String(letter),
        Number(page),
        Number(messageId)
      ]
    );

    return;
  }

  db.prepare(`
    INSERT INTO az_index_pages
    (index_key, index_type, chat_id, topic_id, letter, page, message_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(index_key)
    DO UPDATE SET
      index_type = excluded.index_type,
      chat_id = excluded.chat_id,
      topic_id = excluded.topic_id,
      letter = excluded.letter,
      page = excluded.page,
      message_id = excluded.message_id
  `).run(
    indexKey,
    indexType,
    String(chatId),
    Number(topicId),
    String(letter),
    Number(page),
    Number(messageId)
  );
}

async function deleteAzIndexPageV3(indexKey) {
  await ensureAzIndexPagesTableV3();

  if (pgPool) {
    await pgPool.query(
      `
      DELETE FROM az_index_pages
      WHERE index_key = $1
      `,
      [indexKey]
    );

    return;
  }

  db.prepare(`
    DELETE FROM az_index_pages
    WHERE index_key = ?
  `).run(indexKey);
}

// =============================
// PAGED A–Z INDEX BUILDER V3
// erstellt pro Buchstabe mehrere Telegram-Seiten
// =============================
function azLetterV3(title = "") {
  const first =
    String(title || "")
      .trim()
      .charAt(0)
      .toUpperCase();

  return /[A-ZÄÖÜ]/i.test(first)
    ? first
    : "#";
}

function groupAzItemsV3(items = []) {
  const groups = {};

  for (const item of items) {
    const title =
      String(item.title || "")
        .replace(/\s+/g, " ")
        .trim();

    const line =
      String(item.line || item.title || "")
        .replace(/\s+/g, " ")
        .trim();

    if (!title || !line) {
      continue;
    }

    const letter =
      azLetterV3(title);

    if (!groups[letter]) {
      groups[letter] = [];
    }

    if (!groups[letter].includes(line)) {
      groups[letter].push(line);
    }
  }

  return groups;
}

function splitAzLinesIntoPagesV3(lines = [], maxChars = 3000) {
  const pages = [];

  let current = [];
  let length = 0;

  for (const line of lines) {
    const addLength =
      String(line || "").length + 1;

    if (
      current.length &&
      length + addLength > maxChars
    ) {
      pages.push(current);
      current = [];
      length = 0;
    }

    current.push(line);
    length += addLength;
  }

  if (current.length) {
    pages.push(current);
  }

  return pages;
}

function buildAzPageTextV3({
  heading,
  letter,
  page,
  totalPages,
  lines
}) {
  const text =
    "━━━━━━━━━━━━━━━━━━\n" +
    `${heading}\n` +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    `🔤 Buchstabe: ${letter}\n` +
    `📄 Seite: ${page}/${totalPages}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    lines.join("\n") +
    "\n━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return cleanTelegramText(text).slice(0, 3900);
}

async function refreshPagedAzIndexV3({
  chatId,
  topic,
  type,
  indexType,
  heading,
  items
}) {
  if (!chatId || !topic?.name || !type || !indexType) {
    return;
  }

  await ensureAzIndexPagesTableV3();

  const topicId =
    await createOrGetTopic({
      chatId,
      name: topic.name,
      type
    });

  if (!topicId) {
    return;
  }

  const groups =
    groupAzItemsV3(items);

  const letters =
    Object.keys(groups)
      .sort((a, b) =>
        a.localeCompare(b, "de", {
          sensitivity: "base"
        })
      );

  console.log(
    "🔤 A–Z Rebuild:",
    indexType,
    "Topic:",
    topic.name,
    "Topic-ID:",
    topicId,
    "Buchstaben:",
    letters.join(", ")
  );

  const activeKeys =
    new Set();

  for (const letter of letters) {
    const lines =
      groups[letter]
        .sort((a, b) =>
          a.localeCompare(b, "de", {
            sensitivity: "base"
          })
        );

    const pages =
      splitAzLinesIntoPagesV3(lines, 3000);

    for (let i = 0; i < pages.length; i++) {
      const pageNumber =
        i + 1;

      const indexKey =
        makeKey(
          `${indexType}-${chatId}-${letter}-${pageNumber}`
        );

      activeKeys.add(indexKey);

      const text =
        buildAzPageTextV3({
          heading,
          letter,
          page: pageNumber,
          totalPages: pages.length,
          lines: pages[i]
        });

      const existingPage =
        await getAzIndexPageV3(indexKey);

      const existingIsSameTopic =
        existingPage?.message_id &&
        Number(existingPage.topic_id) === Number(topicId);

      if (existingPage?.message_id && !existingIsSameTopic) {
        console.log(
          "♻️ A–Z Seite liegt in altem/falschem Topic und wird neu erstellt:",
          indexKey,
          "alt topic:",
          existingPage.topic_id,
          "neu topic:",
          topicId
        );

        try {
          await tg("deleteMessage", {
            chat_id: chatId,
            message_id: Number(existingPage.message_id)
          });
        } catch (err) {
          console.error(
            "⚠️ Alte A–Z Seite konnte nicht gelöscht werden:",
            indexKey,
            err.message
          );
        }

        await deleteAzIndexPageV3(indexKey);
      }

      if (existingIsSameTopic) {
        try {
          await tg("editMessageText", {
            chat_id: chatId,
            message_id: Number(existingPage.message_id),
            text
          });

          console.log(
            "✅ A–Z Seite editiert:",
            letter,
            pageNumber,
            "Message:",
            existingPage.message_id
          );

          continue;
        } catch (err) {
          const msg =
            String(err.message || "").toLowerCase();

          if (msg.includes("message is not modified")) {
            console.log(
              "ℹ️ A–Z Seite unverändert:",
              letter,
              pageNumber
            );

            continue;
          }

          console.error(
            "⚠️ A–Z Seite konnte nicht editiert werden, wird neu gesendet:",
            indexKey,
            err.message
          );

          await deleteAzIndexPageV3(indexKey);
        }
      }

      try {
        const sent =
          await tg("sendMessage", {
            chat_id: chatId,
            message_thread_id: Number(topicId),
            text
          });

        if (sent?.message_id) {
          await saveAzIndexPageV3({
            indexKey,
            indexType,
            chatId,
            topicId,
            letter,
            page: pageNumber,
            messageId: sent.message_id
          });

          console.log(
            "✅ A–Z Seite gesendet:",
            letter,
            pageNumber,
            "Message:",
            sent.message_id
          );

          await sleep(400);
        }
      } catch (err) {
        console.error(
          "❌ A–Z Seite konnte nicht gesendet werden:",
          indexKey,
          "Letter:",
          letter,
          "Page:",
          pageNumber,
          err.message
        );
      }
    }
  }

  const oldPages =
    await getAzIndexPagesByTypeV3({
      chatId,
      indexType
    });

  for (const oldPage of oldPages) {
    if (activeKeys.has(oldPage.index_key)) {
      continue;
    }

    try {
      await tg("deleteMessage", {
        chat_id: chatId,
        message_id: Number(oldPage.message_id)
      });
    } catch (err) {
      console.error(
        "⚠️ Alte A–Z Seite konnte nicht gelöscht werden:",
        oldPage.index_key,
        err.message
      );
    }

    await deleteAzIndexPageV3(oldPage.index_key);
  }
}

async function movieAzIndexCaptionV3() {
  const movies =
    await getMovieTitlesForAzV3();

  const groups =
    groupAzItemsV3(
      movies.map((movie) => ({
        title: movie.title,
        line: `• ${movie.label || movie.title}`
      }))
    );

  const letters =
    Object.keys(groups)
      .sort((a, b) =>
        a.localeCompare(b, "de", {
          sensitivity: "base"
        })
      );

  const text =
    "━━━━━━━━━━━━━━━━━━\n" +
    "📌 START & SUCHE\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "🎬 FILME A–Z\n" +
    "Das Inhaltsverzeichnis ist in einzelne Buchstaben-Seiten aufgeteilt.\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    `🎬 Filme im Index: ${movies.length}\n` +
    `🔤 Buchstaben: ${letters.join(" · ") || "Noch leer"}\n\n` +

    "📄 Die Seiten stehen direkt darunter in diesem Topic.\n" +
    "Wenn ein Buchstabe zu lang wird, erstellt der Bot automatisch Seite 2, Seite 3 usw.\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return cleanTelegramText(text).slice(0, 3900);
}

// =============================
// SERIES COMMAND CENTER V3 — COMPACT
// =============================
async function getSeriesStatsV3() {
  if (pgPool) {
    const seriesResult = await pgPool.query(`
      SELECT COUNT(DISTINCT series_title) AS count
      FROM series
    `);

    const episodeResult = await pgPool.query(`
      SELECT COUNT(*) AS count
      FROM series
    `);

    return {
      seriesCount: Number(seriesResult.rows[0]?.count || 0),
      episodeCount: Number(episodeResult.rows[0]?.count || 0)
    };
  }

  const seriesRow = db.prepare(`
    SELECT COUNT(DISTINCT series_title) AS count
    FROM series
  `).get();

  const episodeRow = db.prepare(`
    SELECT COUNT(*) AS count
    FROM series
  `).get();

  return {
    seriesCount: Number(seriesRow?.count || 0),
    episodeCount: Number(episodeRow?.count || 0)
  };
}

// =============================
// SERIES COMMAND CENTER V3 — COMPACT
// =============================
async function seriesCommandCenterCaptionV3() {
  const stats =
    await getSeriesStatsV3();

  let missingSeriesCount = 0;
  let missingSeasonCount = 0;
  let missingEpisodeCount = 0;

  try {
    if (typeof buildSeriesMissingEpisodesDataV3 === "function") {
      const missingData =
        await buildSeriesMissingEpisodesDataV3();

      missingSeriesCount =
        missingData.length;

      for (const series of missingData) {
        missingSeasonCount +=
          series.seasons?.length || 0;

        for (const season of series.seasons || []) {
          missingEpisodeCount +=
            season.missing?.length || 0;
        }
      }
    }
  } catch (err) {
    console.error(
      "⚠️ Serien-Lückenstatus konnte nicht berechnet werden:",
      err.message
    );
  }

  const text =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🎛 SERIES COMMAND CENTER\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "📺 SERIEN-ARCHIV\n" +
    "PREMIUM EPISODE DATABASE\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "📊 ARCHIV STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    `📺 Serien im Archiv: ${stats.seriesCount}\n` +
    `🎞 Episoden gespeichert: ${stats.episodeCount}\n` +
    `🧩 Serien mit Lücken: ${missingSeriesCount}\n` +
    `📀 Staffeln mit Lücken: ${missingSeasonCount}\n` +
    `❌ Fehlende Episoden: ${missingEpisodeCount}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🛡 SYSTEM STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "✅ Episoden-Duplikatschutz aktiv\n" +
    "📌 A–Z Index aktiv\n" +
    "🧩 Episoden-Lückenprüfung aktiv\n" +
    "🎞 Staffel-Intro aktiv\n" +
    "🧭 Feste Kategorie-Topics aktiv\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🧭 NAVIGATION\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "📌 Start & Suche — Serien A–Z\n" +
    "💥 Action, Thriller & Sci-Fi\n" +
    "🍿 Komödie, Drama & Familie\n" +
    "👻 Horror, Mystery & Psycho\n" +
    "📺 Klassiker & Nostalgie\n" +
    "🧩 Fehlende Episoden\n" +
    "💬 Mitglieder-Chat & Wünsche\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return cleanTelegramText(text).slice(0, 4000);
}

// =============================
// SERIES A–Z INDEX V3
// =============================
async function getSeriesTitlesForAzV3() {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT DISTINCT series_title
      FROM series
      WHERE series_title IS NOT NULL
      AND series_title <> ''
      ORDER BY series_title ASC
    `);

    rows = result.rows || [];
  } else {
    rows = db.prepare(`
      SELECT DISTINCT series_title
      FROM series
      WHERE series_title IS NOT NULL
      AND series_title <> ''
      ORDER BY series_title ASC
    `).all();
  }

  const seen = new Set();

  return rows
    .map((row) =>
      String(row.series_title || "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .filter((title) => {
      const key =
        typeof makeKey === "function"
          ? makeKey(title)
          : title.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort((a, b) =>
      a.localeCompare(b, "de", {
        sensitivity: "base"
      })
    );
}

async function seriesAzIndexCaptionV3() {
  const titles =
    await getSeriesTitlesForAzV3();

  const groups =
    groupAzItemsV3(
      titles.map((title) => ({
        title,
        line: `• ${title}`
      }))
    );

  const letters =
    Object.keys(groups)
      .sort((a, b) =>
        a.localeCompare(b, "de", {
          sensitivity: "base"
        })
      );

  const text =
    "━━━━━━━━━━━━━━━━━━\n" +
    "📌 START & SUCHE\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "📺 SERIEN A–Z\n" +
    "Das Inhaltsverzeichnis ist in einzelne Buchstaben-Seiten aufgeteilt.\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    `📺 Serien im Index: ${titles.length}\n` +
    `🔤 Buchstaben: ${letters.join(" · ") || "Noch leer"}\n\n` +

    "📄 Die Seiten stehen direkt darunter in diesem Topic.\n" +
    "Wenn ein Buchstabe zu lang wird, erstellt der Bot automatisch Seite 2, Seite 3 usw.\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return cleanTelegramText(text).slice(0, 3900);
}

// =============================
// REFRESH MOVIE / SERIES A–Z PAGES V3
// =============================
async function refreshMovieAzPagesV3() {
  const movies =
    await getMovieTitlesForAzV3();

  await refreshPagedAzIndexV3({
    chatId: MOVIE_GROUP_ID,
    topic: FIXED_LIBRARY_TOPICS.start,
    type: FIXED_LIBRARY_TOPICS.start.movieType,
    indexType: "movie_az",
    heading: "🎬 FILME A–Z",
    items:
      movies.map((movie) => ({
        title: movie.title,
        line: `• ${movie.label || movie.title}`
      }))
  });
}

async function refreshSeriesAzPagesV3() {
  const titles =
    await getSeriesTitlesForAzV3();

  await refreshPagedAzIndexV3({
    chatId: SERIES_GROUP_ID,
    topic: FIXED_LIBRARY_TOPICS.start,
    type: FIXED_LIBRARY_TOPICS.start.seriesType,
    indexType: "series_az",
    heading: "📺 SERIEN A–Z",
    items:
      titles.map((title) => ({
        title,
        line: `• ${title}`
      }))
  });
}

// =============================
// UPDATE FIXED TOPIC HUB MESSAGE
// nutzt das bestehende feste Topic statt ein neues Topic zu erstellen
// =============================
async function createOrUpdateFixedTopicHub({
  chatId,
  topic,
  type,
  caption
}) {
  if (!chatId || !topic?.name || !type || !caption) {
    return null;
  }

  const topicId =
    await createOrGetTopic({
      chatId,
      name: topic.name,
      type
    });

  if (!topicId) {
    return null;
  }

  const uniqueKey =
    makeKey(`${type}-${chatId}-${topic.name}`);

  const row =
    await getTopicByUniqueKeyAsync(uniqueKey);

  if (row?.hub_message_id) {
    try {
      await tg("editMessageText", {
        chat_id: chatId,
        message_id: Number(row.hub_message_id),
        text: caption
      });

      return row.hub_message_id;
    } catch (err) {
      console.error(
        "⚠️ Fixed Topic Hub Update Fehler:",
        topic.name,
        err.message
      );
    }
  }

  const sent =
    await tg("sendMessage", {
      chat_id: chatId,
      message_thread_id: Number(topicId),
      text: caption
    });

  if (sent?.message_id) {
    await saveTopicHubMessageIdByKey(
      uniqueKey,
      sent.message_id
    );

    return sent.message_id;
  }

  return null;
}

// =============================
// SERIES MISSING EPISODES V3
// Prüft Lücken innerhalb bereits angefangener Staffeln
// =============================
async function getSeriesEpisodeRowsV3() {
  if (pgPool) {
    const result = await pgPool.query(`
      SELECT series_title, season, episode, episode_title
      FROM series
      WHERE series_title IS NOT NULL
      AND series_title <> ''
      AND season IS NOT NULL
      AND episode IS NOT NULL
      ORDER BY series_title ASC, season ASC, episode ASC
    `);

    return result.rows || [];
  }

  return db.prepare(`
    SELECT series_title, season, episode, episode_title
    FROM series
    WHERE series_title IS NOT NULL
    AND series_title <> ''
    AND season IS NOT NULL
    AND episode IS NOT NULL
    ORDER BY series_title ASC, season ASC, episode ASC
  `).all();
}

async function buildSeriesMissingEpisodesDataV3() {
  const rows =
    await getSeriesEpisodeRowsV3();

  const grouped = {};

  for (const row of rows) {
    const title =
      String(row.series_title || "")
        .replace(/\s+/g, " ")
        .trim();

    const season =
      Number(row.season || 0);

    const episode =
      Number(row.episode || 0);

    if (!title || !season || !episode) {
      continue;
    }

    const titleKey =
      typeof makeKey === "function"
        ? makeKey(title)
        : title.toLowerCase();

    if (!grouped[titleKey]) {
      grouped[titleKey] = {
        title,
        seasons: {}
      };
    }

    if (!grouped[titleKey].seasons[season]) {
      grouped[titleKey].seasons[season] = new Set();
    }

    grouped[titleKey].seasons[season].add(episode);
  }

  const missingSeries = [];

  for (const item of Object.values(grouped)) {
    const seasonBlocks = [];

    for (const seasonKey of Object.keys(item.seasons)) {
      const season =
        Number(seasonKey);

      const episodes =
        [...item.seasons[season]]
          .filter(Boolean)
          .sort((a, b) => a - b);

      if (!episodes.length) {
        continue;
      }

      const maxEpisode =
        Math.max(...episodes);

      const missing = [];

      for (let ep = 1; ep <= maxEpisode; ep++) {
        if (!episodes.includes(ep)) {
          missing.push(ep);
        }
      }

      if (missing.length) {
        seasonBlocks.push({
          season,
          available: episodes.length,
          highestEpisode: maxEpisode,
          missing
        });
      }
    }

    if (seasonBlocks.length) {
      missingSeries.push({
        title: item.title,
        seasons: seasonBlocks.sort((a, b) => a.season - b.season)
      });
    }
  }

  return missingSeries.sort((a, b) =>
    a.title.localeCompare(b.title, "de", {
      sensitivity: "base"
    })
  );
}

async function seriesMissingEpisodesCaptionV3() {
  const missingSeries =
    await buildSeriesMissingEpisodesDataV3();

  let body = "";

  if (!missingSeries.length) {
    body =
      "✅ Aktuell wurden keine Lücken innerhalb gespeicherter Staffeln gefunden.\n\n" +
      "Hinweis: Der Bot erkennt hier fehlende Episoden zwischen bereits vorhandenen Folgen.\n" +
      "Beispiel: S01E01, S01E02, S01E04 → S01E03 wird als fehlend erkannt.\n\n";
  } else {
    for (const series of missingSeries) {
      body += `📺 ${series.title}\n`;

      for (const season of series.seasons) {
        const seasonText =
          String(season.season).padStart(2, "0");

        const missingText =
          season.missing
            .map((ep) =>
              `S${seasonText}E${String(ep).padStart(2, "0")}`
            )
            .join(", ");

        body +=
          `Staffel ${season.season}\n` +
          `Vorhanden: ${season.available}/${season.highestEpisode}\n` +
          `Fehlend: ${missingText}\n\n`;
      }

      body += "━━━━━━━━━━━━━━━━━━\n";
    }
  }

  const text =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🧩 FEHLENDE EPISODEN\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "Automatische Übersicht über Serien-Staffeln mit erkannten Episoden-Lücken.\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    body +
    "@LibraryOfLegends";

  return cleanTelegramText(text).slice(0, 4000);
}

// =============================
// MOVIE SERIES DEFINITIONS V3
// Manuelle Filmreihen-Liste für Lückenprüfung
// =============================
const MOVIE_SERIES_DEFINITIONS_V3 = [
  {
    name: "Superman",
    movies: [
      {
        title: "Superman",
        year: 1978,
        aliases: [
          "Superman",
          "Superman The Movie",
          "Superman Der Film"
        ]
      },
      {
        title: "Superman II",
        year: 1980,
        aliases: [
          "Superman II",
          "Superman 2",
          "Superman II Allein gegen alle"
        ]
      },
      {
        title: "Superman III",
        year: 1983,
        aliases: [
          "Superman III",
          "Superman 3"
        ]
      },
      {
        title: "Superman IV",
        year: 1987,
        aliases: [
          "Superman IV",
          "Superman 4",
          "Superman IV Die Welt am Abgrund"
        ]
      },
      {
        title: "Superman Returns",
        year: 2006,
        aliases: [
          "Superman Returns"
        ]
      },
      {
        title: "Man of Steel",
        year: 2013,
        aliases: [
          "Man of Steel",
          "Superman Man of Steel"
        ]
      },
      {
        title: "Batman v Superman: Dawn of Justice",
        year: 2016,
        aliases: [
          "Batman v Superman",
          "Batman vs Superman",
          "Batman v Superman Dawn of Justice",
          "Dawn of Justice"
        ]
      },
      {
        title: "Superman: Red Son",
        year: 2020,
        aliases: [
          "Superman Red Son",
          "Superman: Red Son"
        ]
      },
      {
        title: "Superman: Man of Tomorrow",
        year: 2020,
        aliases: [
          "Superman Man of Tomorrow",
          "Superman: Man of Tomorrow"
        ]
      }
    ]
  },

  {
    name: "Jurassic Universe",
    movies: [
      {
        title: "Jurassic Park",
        year: 1993,
        aliases: [
          "Jurassic Park"
        ]
      },
      {
        title: "Vergessene Welt: Jurassic Park",
        year: 1997,
        aliases: [
          "Vergessene Welt Jurassic Park",
          "Vergessene Welt: Jurassic Park",
          "The Lost World Jurassic Park",
          "The Lost World: Jurassic Park",
          "Jurassic Park 2"
        ]
      },
      {
        title: "Jurassic Park III",
        year: 2001,
        aliases: [
          "Jurassic Park III",
          "Jurassic Park 3"
        ]
      },
      {
        title: "Jurassic World",
        year: 2015,
        aliases: [
          "Jurassic World"
        ]
      },
      {
        title: "Jurassic World: Das gefallene Königreich",
        year: 2018,
        aliases: [
          "Jurassic World Das gefallene Königreich",
          "Jurassic World: Das gefallene Königreich",
          "Jurassic World Fallen Kingdom",
          "Jurassic World: Fallen Kingdom"
        ]
      },
      {
        title: "Jurassic World: Ein neues Zeitalter",
        year: 2022,
        aliases: [
          "Jurassic World Ein neues Zeitalter",
          "Jurassic World: Ein neues Zeitalter",
          "Jurassic World Dominion"
        ]
      }
    ]
  },

  {
    name: "Bourne-Reihe",
    movies: [
      {
        title: "Die Bourne Identität",
        year: 2002,
        aliases: [
          "Die Bourne Identität",
          "Die Bourne Identitaet",
          "The Bourne Identity",
          "Bourne Identity"
        ]
      },
      {
        title: "Die Bourne Verschwörung",
        year: 2004,
        aliases: [
          "Die Bourne Verschwörung",
          "Die Bourne Verschwoerung",
          "The Bourne Supremacy",
          "Bourne Supremacy"
        ]
      },
      {
        title: "Das Bourne Ultimatum",
        year: 2007,
        aliases: [
          "Das Bourne Ultimatum",
          "The Bourne Ultimatum",
          "Bourne Ultimatum"
        ]
      },
      {
        title: "Das Bourne Vermächtnis",
        year: 2012,
        aliases: [
          "Das Bourne Vermächtnis",
          "Das Bourne Vermaechtnis",
          "The Bourne Legacy",
          "Bourne Legacy"
        ]
      },
      {
        title: "Jason Bourne",
        year: 2016,
        aliases: [
          "Jason Bourne"
        ]
      }
    ]
  },

  {
    name: "Final Destination",
    movies: [
      {
        title: "Final Destination",
        year: 2000,
        aliases: [
          "Final Destination"
        ]
      },
      {
        title: "Final Destination 2",
        year: 2003,
        aliases: [
          "Final Destination 2"
        ]
      },
      {
        title: "Final Destination 3",
        year: 2006,
        aliases: [
          "Final Destination 3"
        ]
      },
      {
        title: "Final Destination 4",
        year: 2009,
        aliases: [
          "Final Destination 4",
          "The Final Destination"
        ]
      },
      {
        title: "Final Destination 5",
        year: 2011,
        aliases: [
          "Final Destination 5"
        ]
      },
      {
        title: "Final Destination: Bloodlines",
        aliases: [
          "Final Destination Bloodlines",
          "Final Destination: Bloodlines"
        ]
      }
    ]
  },

  {
    name: "Pacific Rim",
    movies: [
      {
        title: "Pacific Rim",
        year: 2013,
        aliases: [
          "Pacific Rim"
        ]
      },
      {
        title: "Pacific Rim: Uprising",
        year: 2018,
        aliases: [
          "Pacific Rim Uprising",
          "Pacific Rim: Uprising"
        ]
      }
    ]
  },

  {
    name: "Bad Boys",
    movies: [
      {
        title: "Bad Boys",
        year: 1995,
        aliases: [
          "Bad Boys"
        ]
      },
      {
        title: "Bad Boys II",
        year: 2003,
        aliases: [
          "Bad Boys II",
          "Bad Boys 2"
        ]
      },
      {
        title: "Bad Boys for Life",
        year: 2020,
        aliases: [
          "Bad Boys for Life"
        ]
      },
      {
        title: "Bad Boys: Ride or Die",
        year: 2024,
        aliases: [
          "Bad Boys Ride or Die",
          "Bad Boys: Ride or Die"
        ]
      }
    ]
  }
];

// =============================
// MOVIE GAPS V3
// Prüft fehlende Filme aus manuellen Filmreihen
// =============================
async function getMovieRowsForGapsV3() {
  if (pgPool) {
    const result = await pgPool.query(`
      SELECT
        id,
        title,
        year,
        library_id,
        file_name
      FROM movies
      WHERE title IS NOT NULL
        AND title <> ''
      ORDER BY title ASC;
    `);

    return result.rows || [];
  }

  return db.prepare(`
    SELECT
      id,
      title,
      year,
      library_id,
      file_name
    FROM movies
    WHERE title IS NOT NULL
      AND title <> ''
    ORDER BY title ASC
  `).all();
}

function normalizeMovieGapTextV3(value = "") {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/\bii\b/g, " 2 ")
    .replace(/\biii\b/g, " 3 ")
    .replace(/\biv\b/g, " 4 ")
    .replace(/\bv\b/g, " 5 ")
    .replace(/[:;,.!?()[\]{}'"`´’‘“”]/g, " ")
    .replace(/[-_/\\]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildMovieGapSearchTextV3(movie = {}) {
  return normalizeMovieGapTextV3(
    [
      movie.title,
      movie.file_name,
      movie.library_id
    ]
      .map((value) => String(value || ""))
      .join(" ")
  );
}

function yearMatchesMovieGapV3(row = {}, expected = {}) {
  if (!expected.year) {
    return true;
  }

  if (!row.year) {
    return true;
  }

  return String(row.year) === String(expected.year);
}

function aliasMatchesMovieGapV3(searchText = "", alias = "") {
  const normalizedAlias =
    normalizeMovieGapTextV3(alias);

  if (!normalizedAlias) {
    return false;
  }

  if (searchText === normalizedAlias) {
    return true;
  }

  if (searchText.includes(` ${normalizedAlias} `)) {
    return true;
  }

  if (searchText.startsWith(`${normalizedAlias} `)) {
    return true;
  }

  if (searchText.endsWith(` ${normalizedAlias}`)) {
    return true;
  }

  return searchText.includes(normalizedAlias);
}

function findMovieForGapV3(rows = [], expectedMovie = {}) {
  const aliases =
    [
      expectedMovie.title,
      ...(expectedMovie.aliases || [])
    ]
      .map((alias) => String(alias || "").trim())
      .filter(Boolean);

  for (const row of rows) {
    if (!yearMatchesMovieGapV3(row, expectedMovie)) {
      continue;
    }

    const searchText =
      ` ${buildMovieGapSearchTextV3(row)} `;

    for (const alias of aliases) {
      if (aliasMatchesMovieGapV3(searchText, alias)) {
        return row;
      }
    }
  }

  return null;
}

function analyzeMovieSeriesGapsV3(rows = []) {
  return MOVIE_SERIES_DEFINITIONS_V3.map((series) => {
    const checkedMovies =
      series.movies.map((movie) => {
        const found =
          findMovieForGapV3(rows, movie);

        return {
          ...movie,
          found,
          isPresent: Boolean(found)
        };
      });

    const present =
      checkedMovies.filter((movie) => movie.isPresent);

    const missing =
      checkedMovies.filter((movie) => !movie.isPresent);

    return {
      name: series.name,
      total: checkedMovies.length,
      presentCount: present.length,
      missingCount: missing.length,
      movies: checkedMovies,
      present,
      missing,
      isComplete: missing.length === 0
    };
  });
}

function normalizeMovieGapKeyV3(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([0-9]{4}\)/g, " ")
    .replace(/\biv\b/g, " 4 ")
    .replace(/\biii\b/g, " 3 ")
    .replace(/\bii\b/g, " 2 ")
    .replace(/\bvs\b/g, " v ")
    .replace(/\bversus\b/g, " v ")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/[:;,.!?()[\]{}'"`´’‘“”]/g, " ")
    .replace(/[-_/\\]+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactMovieGapKeyV3(value = "") {
  return normalizeMovieGapKeyV3(value)
    .replace(/\s+/g, "");
}

function stripMovieGapArticlesV3(value = "") {
  return normalizeMovieGapKeyV3(value)
    .replace(/\b(the|der|die|das|ein|eine|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function movieGapAliasesV3(movie) {
  if (typeof movie === "string") {
    return [movie];
  }

  return [
    movie.title,
    ...(movie.aliases || [])
  ]
    .filter(Boolean)
    .map((v) => String(v).trim())
    .filter(Boolean);
}

function buildMovieGapSearchTextV3(row = {}) {
  return normalizeMovieGapKeyV3(
    [
      row.title,
      row.file_name,
      row.library_id
    ]
      .map((value) => String(value || ""))
      .join(" ")
  );
}

function extractYearsFromMovieGapRowV3(row = {}) {
  const raw =
    [
      row.title,
      row.file_name,
      row.library_id,
      row.year
    ]
      .map((value) => String(value || ""))
      .join(" ");

  const matches =
    raw.match(/\b(19[0-9]{2}|20[0-9]{2})\b/g);

  return matches || [];
}

function yearMatchesMovieGapV3(row = {}, expectedMovie = {}) {
  if (!expectedMovie.year) {
    return true;
  }

  const expectedYear =
    String(expectedMovie.year);

  if (row.year) {
    return String(row.year) === expectedYear;
  }

  const years =
    extractYearsFromMovieGapRowV3(row);

  if (years.length) {
    return years.includes(expectedYear);
  }

  return true;
}

function aliasMatchesMovieGapV3(searchText = "", alias = "") {
  const normalizedAlias =
    normalizeMovieGapKeyV3(alias);

  const strippedAlias =
    stripMovieGapArticlesV3(alias);

  const compactSearch =
    compactMovieGapKeyV3(searchText);

  const compactAlias =
    compactMovieGapKeyV3(alias);

  const variants =
    [
      normalizedAlias,
      strippedAlias
    ]
      .filter(Boolean);

  for (const variant of variants) {
    if (!variant) {
      continue;
    }

    const paddedSearch =
      ` ${searchText} `;

    if (paddedSearch.includes(` ${variant} `)) {
      return true;
    }

    if (searchText.startsWith(`${variant} `)) {
      return true;
    }

    if (searchText.endsWith(` ${variant}`)) {
      return true;
    }

    if (searchText.includes(variant)) {
      return true;
    }
  }

  if (
    compactAlias &&
    compactAlias.length >= 5 &&
    compactSearch.includes(compactAlias)
  ) {
    return true;
  }

  return false;
}

function findMovieForGapV3(rows = [], expectedMovie = {}) {
  const aliases =
    movieGapAliasesV3(expectedMovie);

  for (const row of rows) {
    if (!yearMatchesMovieGapV3(row, expectedMovie)) {
      continue;
    }

    const searchText =
      buildMovieGapSearchTextV3(row);

    if (!searchText) {
      continue;
    }

    for (const alias of aliases) {
      if (aliasMatchesMovieGapV3(searchText, alias)) {
        return row;
      }
    }
  }

  return null;
}

async function buildMovieGapsDataV3() {
  const rows =
    await getMovieRowsForGapsV3();

  const result = [];

  for (const collection of MOVIE_SERIES_DEFINITIONS_V3) {
    const present = [];
    const missing = [];
    const matches = [];

    for (const movie of collection.movies || []) {
      const mainTitle =
        typeof movie === "string"
          ? movie
          : movie.title;

      const found =
        findMovieForGapV3(rows, movie);

      if (found) {
        present.push(mainTitle);

        matches.push({
          expected: mainTitle,
          foundTitle: found.title,
          foundYear: found.year,
          foundId: found.id
        });
      } else {
        missing.push(mainTitle);
      }
    }

    result.push({
      name: collection.name,
      total: collection.movies.length,
      present,
      missing,
      matches,
      complete: missing.length === 0
    });
  }

  return result.sort((a, b) =>
    a.name.localeCompare(b.name, "de", {
      sensitivity: "base"
    })
  );
}

async function movieGapsCaptionV3() {
  const collections =
    await buildMovieGapsDataV3();

  const incompleteParts = [];
  const completeParts = [];

  for (const item of collections) {
    if (item.complete) {
      completeParts.push(
        `✅ ${item.name} — vollständig ${item.present.length}/${item.total}`
      );

      continue;
    }

    const lines = [];

    lines.push(`🎞 ${item.name}`);
    lines.push(`Vorhanden: ${item.present.length}/${item.total}`);

    if (item.present.length) {
      lines.push("Im Archiv:");

      for (const title of item.present) {
        lines.push(`✅ ${title}`);
      }
    }

    if (item.missing.length) {
      lines.push("Fehlend:");

      for (const title of item.missing) {
        lines.push(`❌ ${title}`);
      }
    }

    incompleteParts.push(lines.join("\n"));
  }

  const incompleteText =
    incompleteParts.length
      ? incompleteParts.join("\n\n━━━━━━━━━━━━━━━━━━\n\n")
      : "✅ Alle gepflegten Filmreihen wirken nach aktueller Liste vollständig.";

  const completeText =
    completeParts.length
      ? completeParts.join("\n")
      : "Noch keine vollständig erkannte Filmreihe.";

  const text = `
━━━━━━━━━━━━━━━━━━
🧩 FEHLENDE FILME & REIHEN
━━━━━━━━━━━━━━━━━━

Automatische Übersicht über gepflegte Filmreihen und fehlende Filme.

━━━━━━━━━━━━━━━━━━
⚠️ UNVOLLSTÄNDIGE FILMREIHEN
━━━━━━━━━━━━━━━━━━
${incompleteText}

━━━━━━━━━━━━━━━━━━
✅ VOLLSTÄNDIGE FILMREIHEN
━━━━━━━━━━━━━━━━━━
${completeText}

━━━━━━━━━━━━━━━━━━
@LibraryOfLegends
`;

  return cleanTelegramText(text).slice(0, 4000);
}

async function ensureCommandCenters() {
  console.log(
    "🏛 Fixed Library Topics + Command Center + A–Z + Lückenübersichten werden geprüft..."
  );

  // =============================
  // FIXED ARCHIVE TOPICS
  // =============================
  if (typeof setupFixedLibraryTopics === "function") {
    await setupFixedLibraryTopics();
  }

  // =============================
  // MOVIE COMMAND CENTER BEHALTEN
  // =============================
  await createOrGetTopic({
    chatId: MOVIE_GROUP_ID,
    name: "🎛 Movie Command Center",
    type: "system_hub"
  });

  try {
    if (
      typeof createOrUpdateCommandCenter === "function" &&
      typeof movieCommandCenterCaption === "function"
    ) {
      await createOrUpdateCommandCenter({
        chatId: MOVIE_GROUP_ID,
        topicName: "🎛 Movie Command Center",
        caption: await movieCommandCenterCaption()
      });
    }
  } catch (err) {
    console.error(
      "⚠️ Movie Command Center Update Fehler:",
      err.message
    );
  }

  // =============================
  // MOVIE A–Z INDEX IN FESTEM START & SUCHE TOPIC
  // =============================
  try {
    if (
      typeof createOrUpdateFixedTopicHub === "function" &&
      typeof movieAzIndexCaptionV3 === "function"
    ) {
      await createOrUpdateFixedTopicHub({
        chatId: MOVIE_GROUP_ID,
        topic: FIXED_LIBRARY_TOPICS.start,
        type: FIXED_LIBRARY_TOPICS.start.movieType,
        caption: await movieAzIndexCaptionV3()
      });
    }
  } catch (err) {
    console.error(
      "⚠️ Film A–Z Index Update Fehler:",
      err.message
    );
  }

  // =============================
  // MOVIE GAPS TOPIC UPDATE
  // =============================
  try {
    if (
      typeof createOrUpdateFixedTopicHub === "function" &&
      typeof movieGapsCaptionV3 === "function"
    ) {
      await createOrUpdateFixedTopicHub({
        chatId: MOVIE_GROUP_ID,
        topic: FIXED_LIBRARY_TOPICS.movieGaps,
        type: FIXED_LIBRARY_TOPICS.movieGaps.movieType,
        caption: await movieGapsCaptionV3()
      });
    }
  } catch (err) {
    console.error(
      "⚠️ Fehlende Filme & Reihen Update Fehler:",
      err.message
    );
  }

  // =============================
  // SERIES COMMAND CENTER BEHALTEN
  // =============================
  await createOrGetTopic({
    chatId: SERIES_GROUP_ID,
    name: "🎛 SERIES COMMAND CENTER",
    type: "system_hub"
  });

  try {
    if (
      typeof createOrUpdateCommandCenter === "function" &&
      typeof seriesCommandCenterCaptionV3 === "function"
    ) {
      await createOrUpdateCommandCenter({
        chatId: SERIES_GROUP_ID,
        topicName: "🎛 SERIES COMMAND CENTER",
        caption: await seriesCommandCenterCaptionV3()
      });
    }
  } catch (err) {
    console.error(
      "⚠️ Series Command Center Update Fehler:",
      err.message
    );
  }

  // =============================
  // SERIES A–Z INDEX IN FESTEM START & SUCHE TOPIC
  // =============================
  try {
    if (
      typeof createOrUpdateFixedTopicHub === "function" &&
      typeof seriesAzIndexCaptionV3 === "function"
    ) {
      await createOrUpdateFixedTopicHub({
        chatId: SERIES_GROUP_ID,
        topic: FIXED_LIBRARY_TOPICS.start,
        type: FIXED_LIBRARY_TOPICS.start.seriesType,
        caption: await seriesAzIndexCaptionV3()
      });
    }
  } catch (err) {
    console.error(
      "⚠️ Serien A–Z Index Update Fehler:",
      err.message
    );
  }

  // =============================
  // SERIES MISSING EPISODES TOPIC UPDATE
  // =============================
  try {
    if (
      typeof createOrUpdateFixedTopicHub === "function" &&
      typeof seriesMissingEpisodesCaptionV3 === "function"
    ) {
      await createOrUpdateFixedTopicHub({
        chatId: SERIES_GROUP_ID,
        topic: FIXED_LIBRARY_TOPICS.seriesGaps,
        type: FIXED_LIBRARY_TOPICS.seriesGaps.seriesType,
        caption: await seriesMissingEpisodesCaptionV3()
      });
    }
  } catch (err) {
    console.error(
      "⚠️ Fehlende Episoden Update Fehler:",
      err.message
    );
  }

  console.log(
    "✅ Fixed Library Topics + Command Center + A–Z + Lückenübersichten fertig eingerichtet"
  );
}

// =============================
// MOVIE COMMAND CENTER CAPTION V3 — COMPACT
// =============================
async function movieCommandCenterCaption() {
  let movieCount = 0;
  let collectionCount = 0;
  let universeCount = 0;
  let hallOfFameCount = 0;
  let newReleaseCount = 0;
  let totalBytes = 0;

  if (pgPool) {
    movieCount = Number((await pgPool.query(`
      SELECT COUNT(*) AS count
      FROM movies
    `)).rows[0]?.count || 0);

    collectionCount = Number((await pgPool.query(`
      SELECT COUNT(DISTINCT collection) AS count
      FROM movies
      WHERE collection IS NOT NULL
      AND TRIM(collection) <> ''
    `)).rows[0]?.count || 0);

    universeCount = Number((await pgPool.query(`
      SELECT COUNT(DISTINCT universe) AS count
      FROM movies
      WHERE universe IS NOT NULL
      AND TRIM(universe) <> ''
    `)).rows[0]?.count || 0);

    const ratingRows = (await pgPool.query(`
      SELECT rating
      FROM movies
      WHERE rating IS NOT NULL
    `)).rows;

    hallOfFameCount =
      ratingRows.filter((m) => getRatingValue(m.rating) >= 8).length;

    newReleaseCount = Number((await pgPool.query(`
      SELECT COUNT(*) AS count
      FROM movies
      WHERE year ~ '^\\d{4}$'
      AND year::int >= 2024
    `)).rows[0]?.count || 0);

    try {
      totalBytes = Number((await pgPool.query(`
        SELECT COALESCE(SUM(file_size_bytes), 0) AS total
        FROM movies
      `)).rows[0]?.total || 0);
    } catch (err) {
      console.error(
        "⚠️ PG file_size_bytes fehlt oder konnte nicht gelesen werden:",
        err.message
      );

      totalBytes = 0;
    }
  } else {
    movieCount = Number(db.prepare(`
      SELECT COUNT(*) AS count
      FROM movies
    `).get()?.count || 0);

    collectionCount = Number(db.prepare(`
      SELECT COUNT(DISTINCT collection) AS count
      FROM movies
      WHERE collection IS NOT NULL
      AND TRIM(collection) <> ''
    `).get()?.count || 0);

    universeCount = Number(db.prepare(`
      SELECT COUNT(DISTINCT universe) AS count
      FROM movies
      WHERE universe IS NOT NULL
      AND TRIM(universe) <> ''
    `).get()?.count || 0);

    const ratingRows = db.prepare(`
      SELECT rating
      FROM movies
      WHERE rating IS NOT NULL
    `).all();

    hallOfFameCount =
      ratingRows.filter((m) => getRatingValue(m.rating) >= 8).length;

    newReleaseCount = Number(db.prepare(`
      SELECT COUNT(*) AS count
      FROM movies
      WHERE CAST(NULLIF(year, '') AS INTEGER) >= 2024
    `).get()?.count || 0);

    try {
      totalBytes = Number(db.prepare(`
        SELECT COALESCE(SUM(file_size_bytes), 0) AS total
        FROM movies
      `).get()?.total || 0);
    } catch (err) {
      console.error(
        "⚠️ SQLite file_size_bytes fehlt oder konnte nicht gelesen werden:",
        err.message
      );

      totalBytes = 0;
    }
  }

  const totalGB =
    totalBytes
      ? (totalBytes / 1024 / 1024 / 1024).toFixed(2)
      : "0.00";

  const text =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🎛 MOVIE COMMAND CENTER\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "🎬 FILM-ARCHIV\n" +
    "PREMIUM MOVIE DATABASE\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "📊 ARCHIV STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    `🎬 Filme im Archiv: ${movieCount}\n` +
    `🎞 Filmreihen erkannt: ${collectionCount}\n` +
    `🌌 Universen erkannt: ${universeCount}\n` +
    `🏆 Hall of Fame: ${hallOfFameCount}\n` +
    `🔥 Neuerscheinungen: ${newReleaseCount}\n` +
    `💾 Speicher: ${totalGB} GB\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🛡 SYSTEM STATUS\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "✅ Duplikatschutz aktiv\n" +
    "♻️ Qualitätsupgrade aktiv\n" +
    "📌 A–Z Index aktiv\n" +
    "🧩 Reihen- & Lückenprüfung aktiv\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "🧭 NAVIGATION\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "📌 Start & Suche — Filme A–Z\n" +
    "💥 Action, Thriller & Sci-Fi\n" +
    "🍿 Komödie, Drama & Familie\n" +
    "👻 Horror, Mystery & Psycho\n" +
    "📺 Klassiker & Nostalgie\n" +
    "🧩 Fehlende Filme & Reihen\n" +
    "💬 Mitglieder-Chat & Wünsche\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return cleanTelegramText(text).slice(0, 4000);
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
    console.error(
      "❌ Movie Command Center Update Fehler:",
      err.message
    );
  }

  try {
    await createOrUpdateCommandCenter({
      chatId: SERIES_GROUP_ID,
      topicName: "🎛 SERIES COMMAND CENTER",
      caption:
        typeof seriesCommandCenterCaptionV3 === "function"
          ? await seriesCommandCenterCaptionV3()
          : await seriesCommandCenterCaption()
    });
  } catch (err) {
    console.error(
      "❌ Series Command Center Update Fehler:",
      err.message
    );
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
// Stabil ohne Token in der Route
// =============================
app.post("/webhook", async (req, res) => {
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
// WEBHOOK RESET
// Erlaubt auch callback_query für Inline-Buttons
// =============================
app.get(`/setwebhook/${TOKEN}`, async (req, res) => {
  try {
    const baseUrl =
      process.env.PUBLIC_URL ||
      process.env.RENDER_EXTERNAL_URL;

    if (!baseUrl) {
      return res.status(500).json({
        ok: false,
        error:
          "PUBLIC_URL oder RENDER_EXTERNAL_URL fehlt. Setze PUBLIC_URL in Render."
      });
    }

    const cleanBaseUrl =
      String(baseUrl).replace(/\/$/, "");

    const webhookUrl =
      `${cleanBaseUrl}/webhook`;

    const result = await tg("setWebhook", {
      url: webhookUrl,
      allowed_updates: [
        "message",
        "edited_message",
        "callback_query"
      ]
    });

    res.json({
      ok: true,
      webhookUrl,
      result
    });
  } catch (err) {
    console.error("❌ setWebhook Fehler:", err.response?.data || err.message);

    res.status(500).json({
      ok: false,
      error: err.response?.data || err.message
    });
  }
});

// =============================
// WEBHOOK RESET SIMPLE
// iPhone-tauglich: ohne Token in der URL
// =============================
app.get("/setwebhook", async (req, res) => {
  try {
    const baseUrl =
      process.env.PUBLIC_URL ||
      process.env.RENDER_EXTERNAL_URL;

    if (!baseUrl) {
      return res.status(500).json({
        ok: false,
        error: "PUBLIC_URL oder RENDER_EXTERNAL_URL fehlt."
      });
    }

    const cleanBaseUrl =
      String(baseUrl).replace(/\/$/, "");

    const webhookUrl =
      `${cleanBaseUrl}/webhook`;

    const result = await tg("setWebhook", {
      url: webhookUrl,
      allowed_updates: [
        "message",
        "edited_message",
        "callback_query"
      ]
    });

    res.json({
      ok: true,
      webhookUrl,
      allowed_updates: [
        "message",
        "edited_message",
        "callback_query"
      ],
      result
    });
  } catch (err) {
    console.error(
      "❌ setWebhook simple Fehler:",
      err.response?.data || err.message
    );

    res.status(500).json({
      ok: false,
      error: err.response?.data || err.message
    });
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

    // =============================
    // ACCESS ADMIN BUTTONS
    // access:approve:USER_ID
    // access:block:USER_ID
    // access:remove:USER_ID
    // =============================
    const handledAccessCallback = await handleAccessCallback(
      accessBot,
      callback,
      pgPool
    );

    if (handledAccessCallback) return;

    // =============================
    // OLD ADMIN BUTTONS
    // =============================
    if (userId !== ADMIN_ID) {
      if (process.env.DEBUG === "true") {
        console.log("⛔ Button ignored - nicht Admin");
      }

      await tg("answerCallbackQuery", {
        callback_query_id: callback.id,
        text: "⛔ Nur Admins dürfen das.",
        show_alert: true
      });

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

// Wartungsmodus-Kommandos
if (msg.text) {
  const handledMaintenance =
    await handleMaintenanceCommands(accessBot, msg, pgPool);

  if (handledMaintenance) return;
}

// Reset-Preview
if (msg.text) {
  const handledReset =
    await handleResetCommands(accessBot, msg, pgPool);

  if (handledReset) return;
}

// Wartungsmodus blockiert normale User
if (msg.text) {
  const blockedByMaintenance =
    await isMaintenanceBlocked(accessBot, msg, pgPool);

  if (blockedByMaintenance) return;
}

// =============================
// ACCESS COMMANDS
// !id, !freischaltung, !meinlimit,
// /freigeben, /sperren
// =============================
if (msg.text) {
  const handledAccess = await handleAccessCommands(accessBot, msg, pgPool);
  if (handledAccess) return;
}

// =============================
// ADMIN DUPLICATE SCANNER
// /dupes, /dupe TITEL
// =============================
if (msg.text) {
  const handledDupes = await handleDupeCommands(accessBot, msg, pgPool);
  if (handledDupes) return;
}

// =============================
// ADMIN WRONG IMPORT SCANNER
// /wrongimports, /wrongmovies, /wrongmovie TITEL
// =============================
if (msg.text) {
  const handledWrongImports = await handleWrongImportCommands(accessBot, msg, pgPool);
  if (handledWrongImports) return;
}

// =============================
// ADMIN CLEANUP / PAPERKORB
// /trashmovie, /trashwrong, /trashlist, /restoremovie
// =============================
if (msg.text) {
  const handledCleanup = await handleCleanupCommands(accessBot, msg, pgPool);
  if (handledCleanup) return;
}

// =============================
// ADMIN EPISODE CHECK
// /episodecheck, /episodemismatch
// =============================
if (msg.text) {
  const handledEpisodeCheck = await handleEpisodeCheckCommands(accessBot, msg, pgPool);
  if (handledEpisodeCheck) return;
}

// =============================
// ADMIN EPISODE FIX
// /episodefix ID file
// =============================
if (msg.text) {
  const handledEpisodeFix = await handleEpisodeFixCommands(accessBot, msg, pgPool);
  if (handledEpisodeFix) return;
}

// =============================
// ADMIN SERIES AUDIT
// /seriesaudit TITEL
// =============================
if (msg.text) {
  const handledSeriesAudit = await handleSeriesAuditCommands(accessBot, msg, pgPool);
  if (handledSeriesAudit) return;
}

// =============================
// ADMIN SERIES CLUSTER DETAILS
// /seriesclusters ID, /seriescluster ID NAME
// =============================
if (msg.text) {
  const handledSeriesCluster = await handleSeriesClusterCommands(accessBot, msg, pgPool);
  if (handledSeriesCluster) return;
}

// =============================
// ADMIN SERIES SPLIT
// /seriessplit ID CLUSTER title NEUER TITEL
// =============================
if (msg.text) {
  const handledSeriesSplit = await handleSeriesSplitCommands(accessBot, msg, pgPool);
  if (handledSeriesSplit) return;
}

// =============================
// ADMIN SERIES FIX FROM FILE
// /seriesfixfromfile ID preview/confirm
// =============================
if (msg.text) {
  const handledSeriesFixFromFile = await handleSeriesFixFromFileCommands(accessBot, msg, pgPool);
  if (handledSeriesFixFromFile) return;
}

// =============================
// PUBLIC LIBRARY SEARCH
// !suche TITEL
// =============================
if (msg.text) {
  const handledSearch = await handleLibrarySearchCommands(accessBot, msg, pgPool);
  if (handledSearch) return;
}

// =============================
// PUBLIC A-Z BROWSER
// !az, !az a, !a, !filme a, !serien s
// =============================
if (msg.text) {
  const handledAz = await handleAzCommands(accessBot, msg, pgPool);
  if (handledAz) return;
}

// =============================
// PUBLIC BROWSE / KATEGORIEN
// !kategorien, !genre action, !filme action, !serien drama, !4k
// =============================
if (msg.text) {
  const handledBrowse = await handleBrowseCommands(accessBot, msg, pgPool);
  if (handledBrowse) return;
}

// =============================
// PUBLIC YEARS / JAHRE
// !jahre, !jahr 2025, !dekade 90er
// =============================
if (msg.text) {
  const handledYear = await handleYearCommands(accessBot, msg, pgPool);
  if (handledYear) return;
}

// =============================
// PUBLIC FAVORITES / MERKLISTE
// !merken, !merkliste, !vergessen
// =============================
if (msg.text) {
  const handledFavorites = await handleFavoriteCommands(accessBot, msg, pgPool);
  if (handledFavorites) return;
}

// =============================
// PUBLIC HISTORY / VERLAUF
// !verlauf, /verlauf, /usage USER_ID
// =============================
if (msg.text) {
  const handledHistory = await handleHistoryCommands(accessBot, msg, pgPool);
  if (handledHistory) return;
}

// =============================
// PUBLIC POPULAR / BELIEBT
// !beliebt, !top, /popular
// =============================
if (msg.text) {
  const handledPopular = await handlePopularCommands(accessBot, msg, pgPool);
  if (handledPopular) return;
}

// =============================
// PUBLIC RANDOM / ZUFALL
// !zufall, !random, !vorschlag
// =============================
if (msg.text) {
  const handledRandom = await handleRandomCommands(accessBot, msg, pgPool);
  if (handledRandom) return;
}

// =============================
// PUBLIC LIBRARY HOL
// !hol movie ID
// !hol serie ID staffel 1
// !hol serie ID s1e1
// =============================
if (msg.text) {
  const handledHol = await handleLibraryHolCommands(accessBot, msg, pgPool);
  if (handledHol) return;
}

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

  //// =============================
// MEDIA UPLOAD QUEUE
// =============================
if (msg.video || msg.document || msg.audio) {
  console.log("🎥🎵 Video/Datei/Audio erkannt");

  const queueLabel =
    msg.document?.file_name ||
    msg.video?.file_name ||
    msg.audio?.file_name ||
    `${msg.audio?.performer || "Unbekannter Künstler"} - ${msg.audio?.title || "Unbekannter Titel"}` ||
    "Unbekannte Datei";

  await enqueueUpload(
    async () => {
      await handleUpload(msg);
    },
    queueLabel
  );

  return;
}

console.log("⚠️ Unbekannter Nachrichtentyp");
console.log("🔍 Message Keys:", Object.keys(msg || {}));
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
// LIBRARY REFRESH LOCK V3
// verhindert mehrfach laufende /refreshlibrary Jobs
// =============================
let LIBRARY_REFRESH_RUNNING = false;
let LIBRARY_REFRESH_STARTED_AT = 0;

async function runLibraryRefreshJobV3(adminChatId = null) {
  if (LIBRARY_REFRESH_RUNNING) {
    if (adminChatId) {
      await tg("sendMessage", {
        chat_id: adminChatId,
        text:
          "⏳ Library V3 Refresh läuft bereits.\n\n" +
          "Bitte warte, bis der aktuelle Durchlauf fertig ist."
      });
    }

    return false;
  }

  LIBRARY_REFRESH_RUNNING = true;
  LIBRARY_REFRESH_STARTED_AT = Date.now();

  try {
    console.log("🔄 Library V3 Hintergrund-Refresh gestartet");

    if (typeof refreshLibraryIndexesAndGapsV3 === "function") {
      await refreshLibraryIndexesAndGapsV3();
    } else if (typeof refreshMainCommandCentersOnly === "function") {
      await refreshMainCommandCentersOnly();
    }

    if (adminChatId) {
      await tg("sendMessage", {
        chat_id: adminChatId,
        text:
          "✅ Library V3 erfolgreich aktualisiert.\n\n" +
          "📌 A–Z Verzeichnisse\n" +
          "🧩 Lückenübersichten\n" +
          "🎛 Command Center"
      });
    }

    console.log("✅ Library V3 Hintergrund-Refresh fertig");

    return true;
  } catch (err) {
    console.error(
      "❌ Library V3 Hintergrund-Refresh Fehler:",
      err.message
    );

    if (adminChatId) {
      await tg("sendMessage", {
        chat_id: adminChatId,
        text:
          "❌ Library V3 konnte nicht aktualisiert werden.\n\n" +
          `Fehler: ${err.message}`
      });
    }

    return false;
  } finally {
    LIBRARY_REFRESH_RUNNING = false;
  }
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
      "• /pgstats\n" +
      "• /imports — offene Userbot-Importe\n" +
      "• /importinfo ID — Import-Details anzeigen\n" +
      "• /ignoreimport ID — Import ausblenden\n" +
      "• /restoreimport ID — ignorierten Import wiederherstellen\n" +
      "• /fiximport ID | TITEL | JAHR — Import-Titel korrigieren\n" +
      "• /processimport ID — Import-Vorschau erstellen\n\n" +
      "• /approveimport ID — Import final ins Archiv kopieren\n" +
      "• /chatid — aktuelle Chat-ID anzeigen\n" +

      "🧠 𝐑𝐄𝐏𝐀𝐈𝐑 & 𝐑𝐄𝐂𝐎𝐕𝐄𝐑𝐘\n\n" +
      "• /rebuildcommandcenters — Dashboards aktualisieren\n" +
      "• /setupgroups — feste Film- & Serien-Topics erstellen\n" +
      "• /refreshlibrary — A–Z, Lücken & Command Center aktualisieren\n" +
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

  if (command === "/help") {
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "📌 Hilfe\n\n" +
      "➡️ Leite Filme oder Serien an mich weiter.\n" +
      "➡️ Serien erkennt der Bot über S01E01 oder 1x01.\n" +
      "➡️ Filme werden automatisch per Genre sortiert.\n" +
      "➡️ Serien werden automatisch in Archiv-Themen einsortiert."
  });
  return;
}

// =============================
// SETUP FIXED LIBRARY TOPICS
// =============================
if (
  command === "/setupfixedtopics" ||
  command === "/setupgroups"
) {
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "⏳ Feste Archiv-Topics werden geprüft...\n\n" +
      "Filmgruppe, Seriengruppe und Movie Command Center werden eingerichtet."
  });

  await ensureCommandCenters();

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "✅ Archiv-Topics eingerichtet\n\n" +
      "Filmgruppe:\n" +
      "🎛 Movie Command Center\n" +
      "📌 Start & Suche\n" +
      "💥 Action, Thriller & Sci-Fi\n" +
      "🍿 Komödie, Drama & Familie\n" +
      "👻 Horror, Mystery & Psycho\n" +
      "📺 Klassiker & Nostalgie\n" +
      "💬 Mitglieder-Chat & Wünsche\n\n" +
      "Seriengruppe:\n" +
      "📌 Start & Suche\n" +
      "💥 Action, Thriller & Sci-Fi\n" +
      "🍿 Komödie, Drama & Familie\n" +
      "👻 Horror, Mystery & Psycho\n" +
      "📺 Klassiker & Nostalgie\n" +
      "💬 Mitglieder-Chat & Wünsche\n\n" +
      "@LibraryOfLegends"
  });

  return;
}

// =============================
// REFRESH LIBRARY V3
// läuft im Hintergrund, damit Telegram den Befehl nicht mehrfach erneut sendet
// =============================
if (
  command === "/refreshlibrary" ||
  command === "/rebuildlibrary"
) {
  if (LIBRARY_REFRESH_RUNNING) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⏳ Library V3 Refresh läuft bereits.\n\n" +
        "Bitte warte, bis der aktuelle Durchlauf fertig ist."
    });

    return;
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "🔄 Library V3 Refresh wurde gestartet.\n\n" +
      "Der Bot aktualisiert jetzt im Hintergrund:\n" +
      "🎬 Filme A–Z\n" +
      "🧩 Fehlende Filme & Reihen\n" +
      "📺 Serien A–Z\n" +
      "🧩 Fehlende Episoden\n" +
      "🎛 Command Center\n\n" +
      "Du bekommst eine Meldung, sobald alles fertig ist."
  });

  setTimeout(() => {
    runLibraryRefreshJobV3(msg.chat.id);
  }, 100);

  return;
}

// =============================
// SCAN SERIES NEWS
// =============================
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

  // Ab hier kommt dein vorhandener /scanseriesnews-Code weiter.
  
  // =============================
// CHAT ID DEBUG
// =============================
if (command === "/chatid") {
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🧭 CHAT ID DEBUG\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `💬 Chat Titel: ${msg.chat.title || msg.chat.first_name || "Privat"}\n` +
      `🆔 Chat ID: ${msg.chat.id}\n` +
      `👤 Von: ${msg.from?.id || "unbekannt"}\n\n` +
      "Diese Chat ID kannst du in Render ENV verwenden."
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
// PG STATS — PREMIUM COMPACT
// =============================
if (
  command === "/pgstats" ||
  command.startsWith("/pgstats@")
) {
  if (!pgPool) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "🧪 Datenbank\n\n" +
        "PostgreSQL/Supabase ist nicht aktiv.\n" +
        "Der Bot läuft aktuell mit SQLite.\n\n" +
        "@LibraryOfLegends"
    });

    return;
  }

  async function safePgCount(tableName) {
    const allowedTables = new Set([
      "movies",
      "series",
      "series_library",
      "series_topics",
      "topics",
      "collections",
      "universes"
    ]);

    if (!allowedTables.has(tableName)) {
      return 0;
    }

    try {
      const result =
        await pgPool.query(`
          SELECT COUNT(*) AS count
          FROM ${tableName}
        `);

      return Number(result.rows[0]?.count || 0);
    } catch (err) {
      console.error(`⚠️ PG Count Fehler (${tableName}):`, err.message);
      return 0;
    }
  }

  const movieCount =
    await safePgCount("movies");

  const episodeCount =
    await safePgCount("series");

  const seriesCount =
    await safePgCount("series_library");

  const seriesTopicCount =
    await safePgCount("series_topics");

  const topicCount =
    await safePgCount("topics");

  const collectionCount =
    await safePgCount("collections");

  const universeCount =
    await safePgCount("universes");

  let latestMovieText =
    "Kein Film gespeichert";

  let latestSeriesText =
    "Keine Serienfolge gespeichert";

  try {
    const latestMovie =
      await pgPool.query(`
        SELECT title, year, created_at
        FROM movies
        ORDER BY created_at DESC
        LIMIT 1
      `);

    if (latestMovie.rows.length) {
      const m =
        latestMovie.rows[0];

      latestMovieText =
        `${m.title}${m.year ? ` (${m.year})` : ""}`;
    }
  } catch (err) {
    console.error("⚠️ PG Latest Movie Fehler:", err.message);
  }

  try {
    const latestSeries =
      await pgPool.query(`
        SELECT series_title, season, episode, created_at
        FROM series
        ORDER BY created_at DESC
        LIMIT 1
      `);

    if (latestSeries.rows.length) {
      const s =
        latestSeries.rows[0];

      const title =
        typeof llShortSeriesTitle === "function"
          ? llShortSeriesTitle(s.series_title)
          : s.series_title;

      latestSeriesText =
        `${title} S${String(s.season || 1).padStart(2, "0")}E${String(s.episode || 1).padStart(2, "0")}`;
    }
  } catch (err) {
    console.error("⚠️ PG Latest Series Fehler:", err.message);
  }
  
  const movieWord =
  movieCount === 1 ? "Film" : "Filme";

const collectionWord =
  collectionCount === 1 ? "Filmreihe" : "Filmreihen";

const seriesWord =
  seriesCount === 1 ? "Serie" : "Serien";

const episodeWord =
  episodeCount === 1 ? "Folge" : "Folgen";

const topicWord =
  topicCount === 1 ? "Thema" : "Themen";

const seriesTopicWord =
  seriesTopicCount === 1 ? "Serien-Thema" : "Serien-Themen";

const universeWord =
  universeCount === 1 ? "Universum" : "Universen";

  const resultText =
  "🧪 Datenbank\n\n" +

  "PostgreSQL\n" +
  "Status · Aktiv\n\n" +

  "Archiv\n" +
  `${movieCount} ${movieWord}\n` +
  `${collectionCount} ${collectionWord}\n` +
  `${seriesCount} ${seriesWord}\n` +
  `${episodeCount} ${episodeWord}\n\n` +

  "System\n" +
  `${topicCount} ${topicWord}\n` +
  `${seriesTopicCount} ${seriesTopicWord}\n` +
  `${universeCount} ${universeWord}\n\n` +

  "Zuletzt gespeichert\n" +
  `Film · ${latestMovieText}\n` +
  `Serie · ${latestSeriesText}\n\n` +

  "@LibraryOfLegends";

await tg("sendMessage", {
  chat_id: msg.chat.id,
  text: cleanTelegramText(resultText).slice(0, 4000)
});

return;
}

// =============================
// USERBOT IMPORT QUEUE
// =============================
if (command === "/imports") {
  if (!pgPool) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Supabase/pgPool ist nicht aktiv.\n\n" +
        "Die Userbot-Import-Warteschlange läuft aktuell nur mit Supabase."
    });
    return;
  }

  try {
    const result = await pgPool.query(`
      SELECT
        id,
        media_type,
        title,
        year,
        season,
        episode,
        episode_title,
        file_name,
        file_size,
        quality,
        media_source,
        codec,
        audio,
        status,
        created_at
      FROM userbot_imports
      WHERE status IN ('staged', 'pending', 'error')
      ORDER BY created_at DESC
      LIMIT 20
    `);

    const rows = result.rows;

    let resultText =
      "━━━━━━━━━━━━━━━━━━\n" +
      "📦 USERBOT IMPORT QUEUE\n" +
      "━━━━━━━━━━━━━━━━━━\n\n";

    if (!rows.length) {
      resultText +=
        "✅ Keine offenen Userbot-Importe gefunden.\n\n" +
        "Neue Dateien aus 📥 LOL Import erscheinen hier automatisch.";
    } else {
      resultText += `📥 Offene Importe: ${rows.length}\n\n`;

      for (const item of rows) {
        const isSeries = item.media_type === "series";
        const icon = isSeries ? "📺" : "🎬";

        const episodeText = isSeries
          ? ` S${String(item.season || 1).padStart(2, "0")}E${String(item.episode || 0).padStart(2, "0")}`
          : "";

        const meta = [
          item.quality,
          item.media_source,
          item.codec,
          item.audio
        ].filter(Boolean).join(" | ");

        resultText +=
          `🆔 Import-ID: ${item.id}\n` +
          `${icon} ${item.title || "Unbekannt"}${item.year ? ` (${item.year})` : ""}${episodeText}\n`;

        if (item.episode_title) {
          resultText += `📝 ${item.episode_title}\n`;
        }

        if (meta) {
          resultText += `⚙️ ${meta}\n`;
        }

        if (item.file_size) {
          resultText += `💾 ${item.file_size}\n`;
        }

        resultText +=
          `📌 Status: ${item.status || "staged"}\n` +
          `🔎 Details: /importinfo ${item.id}\n\n` +
          "━━━━━━━━━━━━━━━━━━\n\n";
      }
    }

    resultText += "\n@LibraryOfLegends";

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: cleanTelegramText(resultText).slice(0, 4000)
    });
  } catch (err) {
    console.error("❌ /imports Fehler:", err.message);

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Fehler beim Laden der Userbot-Importe:\n\n" +
        String(err.message).slice(0, 1000)
    });
  }

  return;
}

// =============================
// USERBOT IMPORT DETAILS — PREMIUM COMPACT
// =============================
if (
  command === "/importinfo" ||
  command.startsWith("/importinfo@")
) {
  if (!pgPool) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "📦 Importdetails\n\n" +
        "Supabase/PostgreSQL ist nicht aktiv.\n" +
        "Die Userbot-Import-Details benötigen Supabase.\n\n" +
        "@LibraryOfLegends"
    });
    return;
  }

  const importId =
    Number(
      text
        .replace(/^\/importinfo(?:@\w+)?/i, "")
        .trim()
    );

  if (!importId || !Number.isFinite(importId)) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung\n\n" +
        "/importinfo 2"
    });
    return;
  }

  try {
    const result = await pgPool.query(
      `
      SELECT *
      FROM userbot_imports
      WHERE id = $1
      LIMIT 1
      `,
      [importId]
    );

    const item =
      result.rows[0];

    if (!item) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "❌ Import nicht gefunden\n\n" +
          `Import #${importId}`
      });
      return;
    }

    const isSeries =
      item.media_type === "series";

    const typeText =
      isSeries ? "Serie" :
      item.media_type === "movie" ? "Film" :
      "Unbekannt";

    const title =
      item.title || "Unbekannter Titel";

    const yearText =
      item.year ? ` (${item.year})` : "";

    const seasonText =
      String(item.season || 1).padStart(2, "0");

    const episodeText =
      String(item.episode || 0).padStart(2, "0");

    const episodeDisplay =
      isSeries
        ? `S${seasonText}E${episodeText}`
        : "";

    const episodeTitle =
      String(item.episode_title || "")
        .replace(/\s+\/\s+/g, " · ")
        .replace(/\s+/g, " ")
        .trim();

    const fileSize =
      typeof llFormatCompactSize === "function"
        ? llFormatCompactSize(item.file_size || "")
        : item.file_size || "Unbekannt";

    const resolution =
      item.width && item.height
        ? `${item.width}x${item.height}`
        : "Unbekannt";

    const duration =
      item.duration_minutes
        ? `${item.duration_minutes} Min.`
        : "Unbekannt";

    const quality =
      item.quality || "Unbekannt";

    const source =
      item.media_source || "Unbekannt";

    const codec =
      item.codec || "Unbekannt";

    const audio =
      item.audio || "Unbekannt";

    const rawStatus =
      String(item.status || "staged").toLowerCase();

    const statusMap = {
      staged: "Bereit",
      pending: "Wartet",
      queued: "Wartet",
      processing: "Wird verarbeitet",
      processed: "Vorbereitet",
      archived: "Archiviert",
      done: "Archiviert",
      error: "Fehler",
      failed: "Fehler",
      ignored: "Ignoriert"
    };

    const status =
      statusMap[rawStatus] || item.status || "Bereit";

    const isArchived =
      Boolean(item.final_message_id) ||
      rawStatus === "archived" ||
      rawStatus === "done";

    const targetText =
      isArchived
        ? "Archiviert"
        : item.target_chat_id
          ? "Ziel gesetzt"
          : rawStatus === "processed"
            ? "Bereit zur Übernahme"
            : rawStatus === "ignored"
              ? "Ignoriert"
              : "Noch nicht archiviert";

    const actionText =
      isArchived
        ? "Abgeschlossen\nImport wurde archiviert.\n\n"
        : rawStatus === "ignored"
          ? "Aktion\n" +
            `/restoreimport ${item.id} · wiederherstellen\n\n`
          : "Aktion\n" +
            `/processimport ${item.id} · Vorschau prüfen\n` +
            `/approveimport ${item.id} · final archivieren\n\n`;

    let resultText =
      `📦 Import #${item.id}\n\n` +

      `${title}${yearText}\n` +
      `${typeText}`;

    if (isSeries && episodeDisplay) {
      resultText += ` · ${episodeDisplay}`;
    }

    resultText += ` · ${status}\n`;

    if (episodeTitle) {
      resultText += `${episodeTitle}\n`;
    }

    resultText +=
      "\nDatei\n" +
      `${quality} · ${fileSize}\n` +
      `${audio}\n\n` +

      "Technik\n" +
      `${source} · ${codec}\n` +
      `${resolution} · ${duration}\n\n` +

      "Telegram\n" +
      `Quelle · ${item.source_message_id || "leer"}\n` +
      `Staging · ${item.staging_message_id || "leer"}\n\n` +

      "Archiv\n" +
      `Status · ${targetText}\n` +
      `Topic · ${item.target_topic_id || "leer"}\n` +
      `Final · ${item.final_message_id || "leer"}\n\n` +

      actionText +
      "@LibraryOfLegends";

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: cleanTelegramText(resultText).slice(0, 4000)
    });
  } catch (err) {
    console.error("❌ /importinfo Fehler:", err.message);

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Fehler beim Laden der Import-Details\n\n" +
        String(err.message).slice(0, 1000)
    });
  }

  return;
}

// =============================
// IGNORE USERBOT IMPORT — PREMIUM COMPACT
// =============================
if (
  command === "/ignoreimport" ||
  command.startsWith("/ignoreimport@")
) {
  if (!pgPool) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "📦 Import ignorieren\n\n" +
        "Supabase/PostgreSQL ist nicht aktiv.\n" +
        "Userbot-Importe benötigen Supabase.\n\n" +
        "@LibraryOfLegends"
    });
    return;
  }

  const importId =
    Number(
      text
        .replace(/^\/ignoreimport(?:@\w+)?/i, "")
        .trim()
    );

  if (!importId || !Number.isFinite(importId)) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung\n\n" +
        "/ignoreimport 1"
    });
    return;
  }

  try {
    const result = await pgPool.query(
      `
      UPDATE userbot_imports
      SET status = 'ignored',
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, media_type, title, year, file_name, status
      `,
      [importId]
    );

    const item =
      result.rows[0];

    if (!item) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "❌ Import nicht gefunden\n\n" +
          `Import #${importId}`
      });
      return;
    }

    const isSeries =
      item.media_type === "series";

    const titleText =
      `${item.title || "Unbekannter Titel"}${item.year ? ` (${item.year})` : ""}`;

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        `🗑 Import #${item.id} ignoriert\n\n` +

        `${titleText}\n` +
        `${isSeries ? "Serie" : "Film"}\n\n` +

        "Status\n" +
        "Ignoriert\n\n" +

        "Wiederherstellen\n" +
        `/restoreimport ${item.id}\n\n` +

        "@LibraryOfLegends"
    });
  } catch (err) {
    console.error("❌ /ignoreimport Fehler:", err.message);

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Import konnte nicht ignoriert werden\n\n" +
        String(err.message).slice(0, 1000)
    });
  }

  return;
}

// =============================
// RESTORE USERBOT IMPORT — PREMIUM COMPACT
// =============================
if (
  command === "/restoreimport" ||
  command.startsWith("/restoreimport@")
) {
  if (!pgPool) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "📦 Import wiederherstellen\n\n" +
        "Supabase/PostgreSQL ist nicht aktiv.\n" +
        "Userbot-Importe benötigen Supabase.\n\n" +
        "@LibraryOfLegends"
    });
    return;
  }

  const importId =
    Number(
      text
        .replace(/^\/restoreimport(?:@\w+)?/i, "")
        .trim()
    );

  if (!importId || !Number.isFinite(importId)) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung\n\n" +
        "/restoreimport 2"
    });
    return;
  }

  try {
    const result = await pgPool.query(
      `
      UPDATE userbot_imports
      SET status = 'staged',
          final_message_id = NULL,
          target_chat_id = NULL,
          target_topic_id = NULL,
          processed_at = NULL,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, media_type, title, year, file_name, status
      `,
      [importId]
    );

    const item =
      result.rows[0];

    if (!item) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "❌ Import nicht gefunden\n\n" +
          `Import #${importId}`
      });
      return;
    }

    const isSeries =
      item.media_type === "series";

    const titleText =
      `${item.title || "Unbekannter Titel"}${item.year ? ` (${item.year})` : ""}`;

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        `♻️ Import #${item.id} wiederhergestellt\n\n` +

        `${titleText}\n` +
        `${isSeries ? "Serie" : "Film"}\n\n` +

        "Status\n" +
        "Bereit\n\n" +

        "Nächste Schritte\n" +
        `/processimport ${item.id} · Vorschau prüfen\n` +
        `/approveimport ${item.id} · final archivieren\n\n` +

        "@LibraryOfLegends"
    });
  } catch (err) {
    console.error("❌ /restoreimport Fehler:", err.message);

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Import konnte nicht wiederhergestellt werden\n\n" +
        String(err.message).slice(0, 1000)
    });
  }

  return;
}

// =============================
// FIX USERBOT IMPORT TITLE / YEAR — PREMIUM COMPACT
// =============================
if (
  command === "/fiximport" ||
  command.startsWith("/fiximport@")
) {
  if (!pgPool) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "📦 Import korrigieren\n\n" +
        "Supabase/PostgreSQL ist nicht aktiv.\n" +
        "Userbot-Importe benötigen Supabase.\n\n" +
        "@LibraryOfLegends"
    });
    return;
  }

  const raw =
    text
      .replace(/^\/fiximport(?:@\w+)?/i, "")
      .trim();

  const parts =
    raw
      .split("|")
      .map((p) => p.trim())
      .filter(Boolean);

  if (parts.length < 2) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung\n\n" +
        "/fiximport ID | Neuer Titel | Jahr\n\n" +
        "Beispiel\n" +
        "/fiximport 3 | Wardriver | 2026\n\n" +
        "Ohne Jahr\n" +
        "/fiximport 3 | Wardriver"
    });
    return;
  }

  const importId =
    Number(parts[0]);

  const newTitle =
    parts[1];

  const newYear =
    parts[2] ? Number(parts[2]) : null;

  if (!importId || !Number.isFinite(importId)) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Ungültige Import-ID\n\n" +
        "/fiximport 3 | Wardriver | 2026"
    });
    return;
  }

  if (!newTitle) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Kein neuer Titel angegeben\n\n" +
        "/fiximport 3 | Wardriver | 2026"
    });
    return;
  }

  try {
    const result = await pgPool.query(
      `
      UPDATE userbot_imports
      SET title = $1,
          year = COALESCE($2, year),
          status = 'staged',
          final_message_id = NULL,
          target_chat_id = NULL,
          target_topic_id = NULL,
          processed_at = NULL,
          updated_at = NOW()
      WHERE id = $3
      RETURNING id, media_type, title, year, file_name, status
      `,
      [
        newTitle,
        newYear && Number.isFinite(newYear) ? newYear : null,
        importId
      ]
    );

    const item =
      result.rows[0];

    if (!item) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "❌ Import nicht gefunden\n\n" +
          `Import #${importId}`
      });
      return;
    }

    const isSeries =
      item.media_type === "series";

    const titleText =
      `${item.title || "Unbekannter Titel"}${item.year ? ` (${item.year})` : ""}`;

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        `✏️ Import #${item.id} korrigiert\n\n` +

        `${titleText}\n` +
        `${isSeries ? "Serie" : "Film"}\n\n` +

        "Status\n" +
        "Bereit\n\n" +

        "Nächster Schritt\n" +
        `/processimport ${item.id}\n\n` +

        "@LibraryOfLegends"
    });
  } catch (err) {
    console.error("❌ /fiximport Fehler:", err.message);

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Import konnte nicht korrigiert werden\n\n" +
        String(err.message).slice(0, 1000)
    });
  }

  return;
}

// =============================
// SYNC USERBOT IMPORT TO MOVIE DB
// =============================
if (
  command === "/syncimportdb" ||
  command.startsWith("/syncimportdb@")
) {
  if (!pgPool) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "📦 Import-Datenbank Sync\n\n" +
        "Supabase/PostgreSQL ist nicht aktiv.\n" +
        "Der Sync benötigt Supabase.\n\n" +
        "@LibraryOfLegends"
    });
    return;
  }

  const importId =
    Number(
      text
        .replace(/^\/syncimportdb(?:@\w+)?/i, "")
        .trim()
    );

  if (!importId || !Number.isFinite(importId)) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung\n\n" +
        "/syncimportdb 3"
    });
    return;
  }

  try {
    const result = await pgPool.query(
      `
      SELECT *
      FROM userbot_imports
      WHERE id = $1
      LIMIT 1
      `,
      [importId]
    );

    const item =
      result.rows[0];

    if (!item) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "❌ Import nicht gefunden\n\n" +
          `Import #${importId}`
      });
      return;
    }

    const isSeries =
      item.media_type === "series";

    if (isSeries) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          `📦 Import #${item.id}\n\n` +
          "Serien-Sync kommt separat.\n" +
          "Dieser Befehl speichert aktuell nur Filme in movies.\n\n" +
          "@LibraryOfLegends"
      });
      return;
    }

    await saveApprovedMovieImportToDb(
  item,
  item.final_message_id || null,
  item.target_topic_id || null
);

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        `✅ Import #${item.id} synchronisiert\n\n` +

        `${item.title || "Unbekannter Titel"}${item.year ? ` (${item.year})` : ""}\n` +
        "Film\n\n" +

        "Datenbank\n" +
        "Eintrag wurde in movies gespeichert.\n\n" +

        "Jetzt prüfen\n" +
        "/newmovies\n" +
        "/movies\n\n" +

        "@LibraryOfLegends"
    });
  } catch (err) {
    console.error("❌ /syncimportdb Fehler:", err.message);

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Import konnte nicht synchronisiert werden\n\n" +
        String(err.message).slice(0, 1200) +
        "\n\n" +
        "@LibraryOfLegends"
    });
  }

  return;
}

// =============================
// MARK USERBOT IMPORT AS ARCHIVED
// =============================
if (
  command === "/markimportarchived" ||
  command.startsWith("/markimportarchived@")
) {
  if (!pgPool) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "📦 Import markieren\n\n" +
        "Supabase/PostgreSQL ist nicht aktiv.\n\n" +
        "@LibraryOfLegends"
    });
    return;
  }

  const raw =
    text
      .replace(/^\/markimportarchived(?:@\w+)?/i, "")
      .trim();

  const parts =
    raw
      .split("|")
      .map((p) => p.trim())
      .filter(Boolean);

  const importId =
    Number(parts[0]);

  const topicId =
    parts[1] || null;

  const finalMessageId =
    parts[2] || null;

  if (!importId || !Number.isFinite(importId) || !finalMessageId) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung\n\n" +
        "/markimportarchived ID | TopicID | MessageID\n\n" +
        "Beispiel\n" +
        "/markimportarchived 3 | 18373 | 18374"
    });
    return;
  }

  try {
    const importResult = await pgPool.query(
      `
      SELECT *
      FROM userbot_imports
      WHERE id = $1
      LIMIT 1
      `,
      [importId]
    );

    const item =
      importResult.rows[0];

    if (!item) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "❌ Import nicht gefunden\n\n" +
          `Import #${importId}`
      });
      return;
    }

    const isSeries =
      item.media_type === "series";

    const targetChatId =
      isSeries ? SERIES_GROUP_ID : MOVIE_GROUP_ID;

    await pgPool.query(
      `
      UPDATE userbot_imports
      SET status = 'archived',
          target_chat_id = $2,
          target_topic_id = $3,
          final_message_id = $4,
          processed_at = COALESCE(processed_at, NOW()),
          updated_at = NOW()
      WHERE id = $1
      `,
      [
        importId,
        targetChatId ? String(targetChatId) : null,
        topicId ? String(topicId) : null,
        String(finalMessageId)
      ]
    );

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        `✅ Import #${importId} markiert\n\n` +

        `${item.title || "Unbekannter Titel"}${item.year ? ` (${item.year})` : ""}\n` +
        `${isSeries ? "Serie" : "Film"}\n\n` +

        "Status\n" +
        "Archiviert\n\n" +

        "Archiv\n" +
        `Topic · ${topicId || "leer"}\n` +
        `Final · ${finalMessageId}\n\n` +

        `/importinfo ${importId}\n\n` +
        "@LibraryOfLegends"
    });
  } catch (err) {
    console.error("❌ /markimportarchived Fehler:", err.message);

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Import konnte nicht markiert werden\n\n" +
        String(err.message).slice(0, 1200) +
        "\n\n" +
        "@LibraryOfLegends"
    });
  }

  return;
}

// =============================
// FIX IMPORT MOVIE META
// =============================
if (
  command === "/fiximportmovie" ||
  command.startsWith("/fiximportmovie@")
) {
  if (!pgPool) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "🎬 Film-Metadaten\n\n" +
        "Supabase/PostgreSQL ist nicht aktiv.\n" +
        "Dieser Befehl benötigt Supabase.\n\n" +
        "@LibraryOfLegends"
    });
    return;
  }

  const raw =
    text
      .replace(/^\/fiximportmovie(?:@\w+)?/i, "")
      .trim();

  const parts =
    raw
      .split("|")
      .map((p) => p.trim());

  const importId =
    Number(parts[0]);

  const genre =
    parts[1] || null;

  const rating =
    parts[2] && Number.isFinite(Number(parts[2]))
      ? Number(parts[2])
      : null;

  const overview =
    parts[3] || null;

  if (!importId || !Number.isFinite(importId) || !genre) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung\n\n" +
        "/fiximportmovie ID | Genre | Bewertung | Beschreibung\n\n" +
        "Beispiel\n" +
        "/fiximportmovie 3 | Action / Thriller | 6.2 | Ein Fahrer gerät in eine gefährliche Verschwörung."
    });
    return;
  }

  try {
    const importResult = await pgPool.query(
      `
      SELECT *
      FROM userbot_imports
      WHERE id = $1
      LIMIT 1
      `,
      [importId]
    );

    const item =
      importResult.rows[0];

    if (!item) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "❌ Import nicht gefunden\n\n" +
          `Import #${importId}`
      });
      return;
    }

    if (item.media_type === "series") {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          `📦 Import #${item.id}\n\n` +
          "Dieser Befehl ist nur für Filme.\n" +
          "Serien-Metadaten machen wir separat.\n\n" +
          "@LibraryOfLegends"
      });
      return;
    }

    const uniqueKey =
      item.unique_key ||
      item.file_unique_id ||
      `userbot-import-${item.id}`;

    const updateResult = await pgPool.query(
      `
      UPDATE movies
      SET genre = $1,
          rating = COALESCE($2, rating),
          overview = COALESCE($3, overview)
      WHERE unique_key = $4
         OR (
          LOWER(title) = LOWER($5)
          AND year = $6
         )
      RETURNING id, title, year, genre, rating
      `,
      [
        genre,
        rating,
        overview,
        uniqueKey,
        item.title || "",
        item.year || null
      ]
    );

    const movie =
      updateResult.rows[0];

    if (!movie) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          `❌ Film nicht in movies gefunden\n\n` +
          `${item.title || "Unbekannter Titel"}${item.year ? ` (${item.year})` : ""}\n\n` +
          "Erst ausführen:\n" +
          `/syncimportdb ${item.id}\n\n` +
          "@LibraryOfLegends"
      });
      return;
    }

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        `✅ Film-Metadaten aktualisiert\n\n` +

        `${movie.title || "Unbekannter Titel"}${movie.year ? ` (${movie.year})` : ""}\n` +
        `${movie.genre || "Sonstige"}${movie.rating ? ` · ${movie.rating}/10` : ""}\n\n` +

        "Jetzt prüfen\n" +
        "/movies\n" +
        "/newmovies\n\n" +

        "@LibraryOfLegends"
    });
  } catch (err) {
    console.error("❌ /fiximportmovie Fehler:", err.message);

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Film-Metadaten konnten nicht aktualisiert werden\n\n" +
        String(err.message).slice(0, 1200) +
        "\n\n" +
        "@LibraryOfLegends"
    });
  }

  return;
}

// =============================
// USERBOT IMPORT SEARCH HELPERS
// =============================
function uniqueImportSearchTerms(values = []) {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    const clean = String(value || "")
      .replace(/\s+/g, " ")
      .trim();

    if (!clean) continue;

    const key = clean.toLowerCase();

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(clean);
  }

  return result;
}

function buildImportSearchCandidates(item) {
  const title = String(item.title || "").trim();
  const year = item.year ? String(item.year) : "";

  const candidates = [];

  if (title && year) candidates.push(`${title} ${year}`);
  if (title) candidates.push(title);

  const lowerTitle = title.toLowerCase();

  // Spezialfall: The Fires / Brennender Abgrund / Eldarnir
  if (
    lowerTitle.includes("the fires") ||
    lowerTitle.includes("brennender abgrund") ||
    lowerTitle.includes("eldarnir")
  ) {
    candidates.push(
      year ? `The Fires ${year}` : "The Fires",
      "The Fires",
      year ? `The Fires Brennender Abgrund ${year}` : "The Fires Brennender Abgrund",
      "The Fires Brennender Abgrund",
      year ? `The Fires - Brennender Abgrund ${year}` : "The Fires - Brennender Abgrund",
      "The Fires - Brennender Abgrund",
      year ? `Brennender Abgrund ${year}` : "Brennender Abgrund",
      "Brennender Abgrund",
      year ? `Eldarnir ${year}` : "Eldarnir",
      "Eldarnir"
    );
  }

  // Falls Titel aus vielen Wörtern besteht: erste 2–3 Wörter versuchen
  const words = title.split(" ").filter(Boolean);

  if (words.length >= 2) {
    const firstTwo = words.slice(0, 2).join(" ");
    candidates.push(year ? `${firstTwo} ${year}` : firstTwo);
    candidates.push(firstTwo);
  }

  if (words.length >= 3) {
    const firstThree = words.slice(0, 3).join(" ");
    candidates.push(year ? `${firstThree} ${year}` : firstThree);
    candidates.push(firstThree);
  }

  return uniqueImportSearchTerms(candidates);
}

async function findImportDossier(item) {
  const isSeries = item.media_type === "series";
  const candidates = buildImportSearchCandidates(item);

  for (const candidate of candidates) {
    try {
      const dossier = isSeries
        ? await seriesInfoCaption(candidate)
        : await movieInfoCaption(candidate);

      if (dossier) {
        return {
          dossier,
          matchedQuery: candidate,
          candidates
        };
      }
    } catch (err) {
      console.error("⚠️ Import Dossier Suche fehlgeschlagen:", candidate, err.message);
    }
  }

  return {
    dossier: null,
    matchedQuery: null,
    candidates
  };
}

function buildFallbackImportPreview(item = {}, dossierResult = {}) {
  const isSeries =
    item.media_type === "series";

  const typeText =
    isSeries ? "Serie" :
    item.media_type === "movie" ? "Film" :
    "Unbekannt";

  const title =
    item.title || "Unbekannter Titel";

  const yearText =
    item.year ? ` (${item.year})` : "";

  const seasonText =
    String(item.season || 1).padStart(2, "0");

  const episodeText =
    String(item.episode || 0).padStart(2, "0");

  const episodeCode =
    isSeries
      ? `S${seasonText}E${episodeText}`
      : "";

  const episodeTitle =
    String(item.episode_title || "")
      .replace(/\s+\/\s+/g, " · ")
      .replace(/\s+/g, " ")
      .trim();

  const rawStatus =
    String(item.status || "staged").toLowerCase();

  const statusMap = {
    staged: "Bereit",
    pending: "Wartet",
    queued: "Wartet",
    error: "Fehler",
    processing: "Wird verarbeitet",
    processed: "Vorbereitet",
    archived: "Archiviert",
    done: "Archiviert"
  };

  const statusText =
    statusMap[rawStatus] || item.status || "Bereit";

  const fileSize =
    typeof llFormatCompactSize === "function"
      ? llFormatCompactSize(item.file_size || "")
      : item.file_size || "Unbekannt";

  const resolution =
    item.width && item.height
      ? `${item.width}x${item.height}`
      : "Unbekannt";

  const duration =
    item.duration_minutes
      ? `${item.duration_minutes} Min.`
      : "Unbekannt";

  const quality =
    item.quality || "Unbekannt";

  const source =
    item.media_source || "Unbekannt";

  const codec =
    item.codec || "Unbekannt";

  const audio =
    item.audio || "Unbekannt";

  const triedQueries =
    dossierResult.triedQueries ||
    dossierResult.queries ||
    dossierResult.attemptedQueries ||
    [];

  let queryText = "";

  if (Array.isArray(triedQueries) && triedQueries.length) {
    queryText =
      triedQueries
        .filter(Boolean)
        .slice(0, 5)
        .map((q) => `• ${q}`)
        .join("\n");
  } else {
    const searchTitle =
      item.title || "";

    queryText =
      item.year
        ? `• ${searchTitle} ${item.year}\n• ${searchTitle}`
        : `• ${searchTitle || "Keine Suchbegriffe gespeichert"}`;
  }

  let resultText =
    `⚠️ Import-Vorschau #${item.id}\n\n` +

    "Kein TMDB-Dossier gefunden.\n" +
    "Der Import kann trotzdem manuell geprüft werden.\n\n" +

    `${title}${yearText}\n` +
    `${typeText}`;

  if (isSeries && episodeCode) {
    resultText += ` · ${episodeCode}`;
  }

  resultText += ` · ${statusText}\n`;

  if (episodeTitle) {
    resultText += `${episodeTitle}\n`;
  }

  resultText +=
    "\nDatei\n" +
    `${quality} · ${fileSize}\n` +
    `${audio}\n\n` +

    "Technik\n" +
    `${source} · ${codec}\n` +
    `${resolution} · ${duration}\n\n` +

    "Suchbegriffe\n" +
    `${queryText}\n\n` +

    "Aktionen\n" +
    `/fiximport ${item.id} | Neuer Titel | ${item.year || "Jahr"}\n` +
    `/approveimport ${item.id} · trotzdem übernehmen\n\n` +

    "@LibraryOfLegends";

  return cleanTelegramText(resultText).slice(0, 4000);
}

// =============================
// PROCESS USERBOT IMPORT — PREMIUM PREVIEW
// =============================
if (
  command === "/processimport" ||
  command.startsWith("/processimport@")
) {
  if (!pgPool) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "📦 Import-Vorschau\n\n" +
        "Supabase/PostgreSQL ist nicht aktiv.\n" +
        "Userbot-Importe benötigen Supabase.\n\n" +
        "@LibraryOfLegends"
    });
    return;
  }

  const importId =
    Number(
      text
        .replace(/^\/processimport(?:@\w+)?/i, "")
        .trim()
    );

  if (!importId || !Number.isFinite(importId)) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung\n\n" +
        "/processimport 2"
    });
    return;
  }

  try {
    const result = await pgPool.query(
      `
      SELECT *
      FROM userbot_imports
      WHERE id = $1
      LIMIT 1
      `,
      [importId]
    );

    const item =
      result.rows[0];

    if (!item) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "❌ Import nicht gefunden\n\n" +
          `Import #${importId}`
      });
      return;
    }

    const rawStatus =
      String(item.status || "staged").toLowerCase();

    const statusMap = {
      staged: "Bereit",
      pending: "Wartet",
      queued: "Wartet",
      error: "Fehler",
      processing: "Wird verarbeitet",
      processed: "Vorbereitet",
      archived: "Archiviert",
      done: "Archiviert"
    };

    const statusText =
      statusMap[rawStatus] || item.status || "Bereit";

    const isFinalArchived =
      Boolean(item.final_message_id) ||
      rawStatus === "archived" ||
      rawStatus === "done";

    if (isFinalArchived) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          `📦 Import #${item.id}\n\n` +
          "Dieser Import wurde bereits archiviert.\n\n" +
          `Final · ${item.final_message_id || "gesetzt"}\n\n` +
          "@LibraryOfLegends"
      });
      return;
    }

    const allowedPreviewStatuses =
      ["staged", "pending", "queued", "error", "processed"];

    if (!allowedPreviewStatuses.includes(rawStatus)) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          `📦 Import #${item.id}\n\n` +
          "Dieser Import ist aktuell nicht für die Vorschau freigegeben.\n\n" +
          `Status · ${statusText}\n\n` +
          "@LibraryOfLegends"
      });
      return;
    }

    const isSeries =
      item.media_type === "series";

    const typeText =
      isSeries ? "Serie" :
      item.media_type === "movie" ? "Film" :
      "Unbekannt";

    const title =
      item.title || "Unbekannter Titel";

    const yearText =
      item.year ? ` (${item.year})` : "";

    const seasonText =
      String(item.season || 1).padStart(2, "0");

    const episodeText =
      String(item.episode || 0).padStart(2, "0");

    const episodeCode =
      isSeries
        ? `S${seasonText}E${episodeText}`
        : "";

    const episodeTitle =
      String(item.episode_title || "")
        .replace(/\s+\/\s+/g, " · ")
        .replace(/\s+/g, " ")
        .trim();

    const searchTitle =
      item.title || "";

    const searchQuery =
      item.year
        ? `${searchTitle} ${item.year}`
        : searchTitle;

    const fileSize =
      typeof llFormatCompactSize === "function"
        ? llFormatCompactSize(item.file_size || "")
        : item.file_size || "Unbekannt";

    const resolution =
      item.width && item.height
        ? `${item.width}x${item.height}`
        : "Unbekannt";

    const duration =
      item.duration_minutes
        ? `${item.duration_minutes} Min.`
        : "Unbekannt";

    const quality =
      item.quality || "Unbekannt";

    const source =
      item.media_source || "Unbekannt";

    const codec =
      item.codec || "Unbekannt";

    const audio =
      item.audio || "Unbekannt";

    let previewHeader =
      `📦 Import-Vorschau #${item.id}\n\n` +

      `${title}${yearText}\n` +
      `${typeText}`;

    if (isSeries && episodeCode) {
      previewHeader += ` · ${episodeCode}`;
    }

    previewHeader += ` · ${statusText}\n`;

    if (episodeTitle) {
      previewHeader += `${episodeTitle}\n`;
    }

    previewHeader +=
      "\nDatei\n" +
      `${quality} · ${fileSize}\n` +
      `${audio}\n\n` +

      "Technik\n" +
      `${source} · ${codec}\n` +
      `${resolution} · ${duration}\n\n` +

      "TMDB\n" +
      `Suche · ${searchQuery || "leer"}\n` +
      "Mehrere Suchvarianten werden automatisch geprüft.\n\n" +

      "@LibraryOfLegends";

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: cleanTelegramText(previewHeader).slice(0, 4000)
    });

    const dossierResult =
      await findImportDossier(item);

    const dossier =
      dossierResult.dossier;

    if (!dossier) {
      const fallbackPreview =
        buildFallbackImportPreview(item, dossierResult);

      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text: cleanTelegramText(fallbackPreview).slice(0, 4000)
      });

      return;
    }

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "✅ Vorschau gefunden\n\n" +
        `Quelle · ${dossierResult.matchedQuery || "Automatische Suche"}\n\n` +
        dossier,
      parse_mode: "HTML"
    });

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "🧭 Nächster Schritt\n\n" +
        "Wenn die Vorschau stimmt:\n\n" +
        `/approveimport ${item.id} · final archivieren\n\n` +
        "Wenn etwas nicht stimmt, Importdetails prüfen:\n\n" +
        `/importinfo ${item.id}\n\n` +
        "@LibraryOfLegends"
    });

  } catch (err) {
    console.error("❌ /processimport Fehler:", err.message);

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Fehler beim Erstellen der Import-Vorschau\n\n" +
        String(err.message).slice(0, 1000)
    });
  }

  return;
}

// =============================
// ENRICH USERBOT IMPORT WITH TMDB DATA
// =============================
async function enrichApprovedImportItem(item = {}) {
  if (!item || item.media_type === "series") {
    return item;
  }

  if (typeof searchMovieTMDB !== "function") {
    return item;
  }

  const candidates =
    typeof buildImportSearchCandidates === "function"
      ? buildImportSearchCandidates(item)
      : [
          item.year
            ? `${item.title || ""} ${item.year}`
            : item.title || ""
        ];

  let tmdb = null;
  let matchedQuery = "";

  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      tmdb = await searchMovieTMDB(
        candidate,
        item.year || ""
      );

      if (tmdb) {
        matchedQuery = candidate;
        break;
      }
    } catch (err) {
      console.error(
        "⚠️ Import TMDB Enrichment Fehler:",
        candidate,
        err.message
      );
    }
  }

  if (!tmdb) {
    console.log("⚠️ Kein TMDB-Enrichment gefunden für Import:", {
      id: item.id,
      title: item.title,
      year: item.year
    });

    return item;
  }

  console.log("✅ Import mit TMDB-Daten erweitert:", {
    id: item.id,
    title: item.title,
    matchedQuery,
    tmdbTitle: tmdb.title,
    tmdbYear: tmdb.year
  });

  return {
    ...item,

    title:
      item.title ||
      tmdb.title,

    year:
      item.year ||
      tmdb.year,

    genre:
      item.genre ||
      tmdb.genre,

    rating:
      item.rating ||
      tmdb.rating,

    overview:
      item.overview ||
      tmdb.overview,

    description:
      item.description ||
      tmdb.overview,

    poster_url:
      item.poster_url ||
      tmdb.posterUrl,

    posterUrl:
      item.posterUrl ||
      tmdb.posterUrl,

    fsk:
      item.fsk ||
      tmdb.fsk,

    certification:
      item.certification ||
      tmdb.fsk,

    director:
      item.director ||
      tmdb.director,

    cast:
      item.cast ||
      tmdb.cast,

    cast_list:
      item.cast_list ||
      tmdb.cast,

    collection:
      item.collection ||
      tmdb.collection,

    collection_id:
      item.collection_id ||
      tmdb.collectionId,

    tmdb_id:
      item.tmdb_id ||
      tmdb.tmdbId
  };
}

function buildApprovedImportCaption(item = {}) {
  const makeHashTag = (value = "") => {
    const clean =
      String(value || "")
        .replace(/&/g, "Und")
        .replace(/[^\p{L}\p{N}]+/gu, "")
        .trim();

    return clean ? `#${clean}` : "";
  };

  const extractRating = (value = "") => {
    if (typeof llExtractRatingNumber === "function") {
      const found =
        llExtractRatingNumber(value);

      if (
        found !== null &&
        found !== undefined &&
        Number.isFinite(Number(found))
      ) {
        return Number(found);
      }
    }

    const matches =
      String(value || "")
        .replace(",", ".")
        .match(/\d+(?:\.\d+)?/g);

    if (!matches || !matches.length) {
      return null;
    }

    const number =
      Number(matches[matches.length - 1]);

    if (
      !Number.isFinite(number) ||
      number <= 0 ||
      number > 10
    ) {
      return null;
    }

    return number;
  };

  const isSeries =
    item.media_type === "series";

  const title =
    String(item.title || "Unbekannter Titel")
      .replace(/\s+/g, " ")
      .trim();

  const yearText =
    item.year ? ` (${item.year})` : "";

  const ratingNumber =
    extractRating(
      item.rating ||
      item.vote_average ||
      item.voteAverage ||
      item.tmdbRating ||
      ""
    );

  const rating =
    ratingNumber
      ? `${ratingNumber.toFixed(1)}/10`
      : "folgt";

  const fskValue =
    item.fsk ||
    item.certification ||
    item.ageRating ||
    "";

  const fskClean =
    String(fskValue || "")
      .replace(/^FSK\s*/i, "")
      .replace(/^Unbekannt$/i, "")
      .trim();

  const fsk =
    fskClean
      ? `FSK ${fskClean}`
      : "FSK folgt";

  const rawCast =
    String(
      item.cast ||
      item.cast_list ||
      item.castList ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim();

  const castTags =
    rawCast &&
    !["unbekannt", "cast folgt"].includes(rawCast.toLowerCase())
      ? rawCast
          .split("•")
          .map((p) => p.trim())
          .filter(Boolean)
          .slice(0, 2)
          .map(makeHashTag)
          .filter(Boolean)
          .join(" · ")
      : "";

  const finalCastTags =
    castTags || "#CastFolgt";

  const overview =
    trimTextAtSentence(
      item.overview ||
      item.description ||
      "Handlung folgt.",
      260
    );

  const quality =
    item.quality ||
    "Unbekannt";

  const fileSize =
    typeof llFormatCompactSize === "function"
      ? llFormatCompactSize(
          item.file_size ||
          item.fileSize ||
          ""
        )
      : (
          item.file_size ||
          item.fileSize ||
          ""
        );

  const fileName =
    item.file_name ||
    item.fileName ||
    item.original_file_name ||
    item.originalFileName ||
    "";

  const audioSourceText =
    [
      item.audio,
      item.audioText,
      item.language,
      item.languages,
      item.audio_codec,
      item.audioCodec,
      item.audio_channels,
      item.audioChannels,
      fileName
    ]
      .filter(Boolean)
      .join(" ");

  const audio =
    typeof llDetectAudioTextFromFileName === "function"
      ? llDetectAudioTextFromFileName(
          fileName,
          audioSourceText
        )
      : (
          item.audio ||
          item.audioText ||
          "Deutsch"
        );

  const mediaLine =
    [
      quality,
      fileSize || "Unbekannt",
      audio || "Unbekannt"
    ]
      .filter(Boolean)
      .join(" · ");

  const genreTags =
    String(item.genre || "")
      .split(/[\/•,]/)
      .map((g) => g.trim())
      .filter(Boolean)
      .map((g) =>
        typeof llNormalizeGenreName === "function"
          ? llNormalizeGenreName(g)
          : g
      )
      .slice(0, 3)
      .map(makeHashTag)
      .filter(Boolean)
      .join(" ");

  const archiveId =
    item.library_id ||
    item.libraryId ||
    item.archive_id ||
    item.archiveId ||
    item.import_archive_id ||
    "";

  const archiveTag =
    archiveId
      ? makeHashTag(archiveId)
      : item.id
        ? makeHashTag(`LIB${String(item.id).padStart(4, "0")}`)
        : "#LIB";

  if (isSeries) {
    const seasonText =
      String(item.season || 1).padStart(2, "0");

    const episodeText =
      String(item.episode || 0).padStart(2, "0");

    const episodeCode =
      `S${seasonText}E${episodeText}`;

    const episodeTitle =
      String(item.episode_title || "")
        .replace(/\s+\/\s+/g, " · ")
        .replace(/\s+/g, " ")
        .trim();

    const seriesText =
      `📺 ${escapeHtml(title)}\n` +
      `${escapeHtml(episodeCode)}\n` +
      (episodeTitle ? `${escapeHtml(episodeTitle)}\n` : "") +
      "\n" +
      `📦 ${escapeHtml(mediaLine || "Unbekannt")}\n\n` +
      `🗂 Archiv: ${archiveTag}\n` +
      "@LibraryOfLegends";

    return cleanTelegramText(seriesText).slice(0, 1000);
  }

  const movieText =
    `🎬 ${escapeHtml(title)}${escapeHtml(yearText)}\n` +
    `⭐ Bewertung: ${escapeHtml(rating)} | 🔞 ${escapeHtml(fsk)}\n` +
    `👥 ${finalCastTags}\n\n` +

    "📝 Handlung:\n" +
    `${escapeHtml(overview)}\n\n` +

    `📦 ${escapeHtml(mediaLine || "Unbekannt")}\n\n` +

    `🗂 Archiv: ${archiveTag}${genreTags ? ` ${genreTags}` : ""}\n` +
    "@LibraryOfLegends";

  return cleanTelegramText(movieText).slice(0, 1000);
}

// =============================
// USERBOT IMPORT APPROVE HELPERS
// =============================
function extractTelegramMessageId(response) {
  if (!response) return null;

  if (response.message_id) return response.message_id;
  if (response.result?.message_id) return response.result.message_id;
  if (response.data?.result?.message_id) return response.data.result.message_id;
  if (response.data?.message_id) return response.data.message_id;

  return null;
}

async function ensureUserbotImportProcessingColumns() {
  if (!pgPool) return;

  await pgPool.query(`
    ALTER TABLE userbot_imports
    ADD COLUMN IF NOT EXISTS target_chat_id TEXT;
  `);

  await pgPool.query(`
    ALTER TABLE userbot_imports
    ADD COLUMN IF NOT EXISTS target_topic_id TEXT;
  `);

  await pgPool.query(`
    ALTER TABLE userbot_imports
    ADD COLUMN IF NOT EXISTS final_message_id TEXT;
  `);

  await pgPool.query(`
    ALTER TABLE userbot_imports
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
  `);
}

async function saveApprovedMovieImportToDb(item, finalMessageId, topicId) {
  if (!pgPool) return;

  const title =
    item.title || "Unbekannter Titel";

  const year =
    item.year && Number.isFinite(Number(item.year))
      ? Number(item.year)
      : null;

  const genre =
    item.genre || "Sonstige";

  const rating =
    item.rating && Number.isFinite(Number(item.rating))
      ? Number(item.rating)
      : null;

  const runtime =
    item.duration_minutes && Number.isFinite(Number(item.duration_minutes))
      ? Number(item.duration_minutes)
      : null;

  const overview =
    item.overview || "Keine Beschreibung verfügbar.";

  const posterUrl =
    item.poster_url || null;

  const fileName =
    item.file_name || "";

  const fileId =
    item.file_id || item.telegram_file_id || "";

  const uniqueKey =
    item.unique_key ||
    item.file_unique_id ||
    `userbot-import-${item.id}`;

  const telegramMessageId =
    finalMessageId && Number.isFinite(Number(finalMessageId))
      ? Number(finalMessageId)
      : null;

  const topicValue =
    topicId && Number.isFinite(Number(topicId))
      ? Number(topicId)
      : null;

  await pgPool.query(
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
      topic_id
    )
    VALUES
    (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12
    )
    ON CONFLICT (unique_key) DO UPDATE
    SET
      title = EXCLUDED.title,
      year = EXCLUDED.year,
      genre = EXCLUDED.genre,
      rating = EXCLUDED.rating,
      runtime = EXCLUDED.runtime,
      overview = EXCLUDED.overview,
      poster_url = EXCLUDED.poster_url,
      file_name = EXCLUDED.file_name,
      file_id = EXCLUDED.file_id,
      telegram_message_id = EXCLUDED.telegram_message_id,
      topic_id = EXCLUDED.topic_id
    `,
    [
      title,
      year,
      genre,
      rating,
      runtime,
      overview,
      posterUrl,
      fileName,
      fileId,
      uniqueKey,
      telegramMessageId,
      topicValue
    ]
  );
}

// =============================
// APPROVE USERBOT IMPORT — COPY TO ARCHIVE
// =============================
if (command === "/approveimport") {
  if (!pgPool) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Supabase/pgPool ist nicht aktiv.\n\n" +
        "Userbot-Importe laufen aktuell nur mit Supabase."
    });
    return;
  }

  const importId = Number(text.replace(command, "").trim());

  if (!importId || !Number.isFinite(importId)) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/approveimport 2"
    });
    return;
  }

  try {
  await ensureUserbotImportProcessingColumns();

  const result = await pgPool.query(
      `
      SELECT *
      FROM userbot_imports
      WHERE id = $1
      LIMIT 1
      `,
      [importId]
    );

    const item = result.rows[0];

    if (!item) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "❌ Import nicht gefunden:\n\n" +
          `Import-ID: ${importId}`
      });
      return;
    }

    const rawStatus =
  String(item.status || "staged").toLowerCase();

const allowedImportStatuses = [
  "staged",
  "pending",
  "queued",
  "error",
  "processed"
];

const alreadyArchived =
  Boolean(item.final_message_id) ||
  rawStatus === "archived" ||
  rawStatus === "done";

if (alreadyArchived) {
  if (!isSeries && item.final_message_id) {
    await saveApprovedMovieImportToDb(
      item,
      item.final_message_id,
      item.target_topic_id
    );
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      `📦 Import #${item.id}\n\n` +
      "Dieser Import wurde bereits archiviert.\n\n" +
      "Datenbank\n" +
      (!isSeries
        ? "Filmeintrag wurde geprüft/gespeichert.\n"
        : "Serien-Sync folgt separat.\n") +
      `Final · ${item.final_message_id || "gesetzt"}\n\n` +
      `/importinfo ${item.id}\n\n` +
      "@LibraryOfLegends"
  });

  return;
}

if (!allowedImportStatuses.includes(rawStatus)) {
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      `⚠️ Import #${item.id}\n\n` +
      "Dieser Import kann aktuell nicht verarbeitet werden.\n\n" +
      `Status · ${item.status || "unbekannt"}\n\n` +
      "@LibraryOfLegends"
  });
  return;
}

    const isSeries = item.media_type === "series";
    const targetChatId = isSeries ? SERIES_GROUP_ID : MOVIE_GROUP_ID;

    if (!targetChatId) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "❌ Zielgruppe fehlt.\n\n" +
          (isSeries
            ? "Bitte SERIES_GROUP_ID in Render prüfen."
            : "Bitte MOVIE_GROUP_ID in Render prüfen.")
      });
      return;
    }

    const stagingChatId =
      process.env.BOT_STAGING_CHAT_ID ||
      process.env.STAGING_GROUP_ID ||
      process.env.STAGING_CHAT_ID;

    if (!stagingChatId) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "❌ BOT_STAGING_CHAT_ID fehlt in Render.\n\n" +
          "Der Bot braucht die numerische Chat-ID der 📤 LOL Staging Gruppe,\n" +
          "damit er die Datei ins Archiv kopieren kann."
      });
      return;
    }

    if (!item.staging_message_id) {
      await pgPool.query(
        `
        UPDATE userbot_imports
        SET status = 'error',
            updated_at = NOW()
        WHERE id = $1
        `,
        [item.id]
      );

      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "❌ Staging Message ID fehlt.\n\n" +
          `🆔 Import-ID: ${item.id}\n` +
          "Die Datei wurde zwar importiert, aber die Message-ID der Staging-Datei wurde nicht gespeichert.\n\n" +
          "Bitte Datei erneut in 📥 LOL Import senden oder Userbot-Import nochmal testen."
      });
      return;
    }

    let topicId = null;

    if (isSeries) {
      topicId = await createOrGetTopic({
        chatId: targetChatId,
        name: item.title || "Unbekannte Serie",
        type: "series"
      });
    } else {
      topicId = await createOrGetTopic({
        chatId: targetChatId,
        name: "🎬 Movie Library",
        type: "system_hub"
      });
    }

    const approvedItem =
  !isSeries && typeof enrichApprovedImportItem === "function"
    ? await enrichApprovedImportItem(item)
    : item;

const caption =
  buildApprovedImportCaption(approvedItem);

    const copyPayload = {
      chat_id: targetChatId,
      from_chat_id: stagingChatId,
      message_id: Number(item.staging_message_id),
      caption: cleanTelegramText(caption).slice(0, 1000)
    };

    if (topicId) {
      copyPayload.message_thread_id = Number(topicId);
    }

    const copied = await tg("copyMessage", copyPayload);

console.log("📨 copyMessage Response:", JSON.stringify(copied, null, 2));

const finalMessageId = extractTelegramMessageId(copied);

console.log("💬 Final Message ID:", finalMessageId || "unbekannt");

if (copied?.__error || !finalMessageId) {
  await pgPool.query(
  `
  UPDATE userbot_imports
  SET status = 'archived',
      target_chat_id = $2,
      target_topic_id = $3,
      final_message_id = $4,
      processed_at = NOW(),
      updated_at = NOW()
  WHERE id = $1
  `,
  [
    item.id,
    String(targetChatId),
    topicId ? String(topicId) : null,
    String(finalMessageId)
  ]
);

if (!isSeries) {
  await saveApprovedMovieImportToDb(
    approvedItem,
    finalMessageId,
    topicId
  );
}

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      `❌ Import #${item.id} nicht kopiert\n\n` +

      `${item.title || "Unbekannter Titel"}${item.year ? ` (${item.year})` : ""}\n\n` +

      "Telegram konnte die Staging-Nachricht nicht ins Archiv kopieren.\n\n" +

      "Fehler\n" +
      `${copied?.description || copied?.error?.description || "Keine Message-ID erhalten"}\n\n` +

      "Status\n" +
      "Der Import wurde auf Fehler gesetzt.\n\n" +

      "Prüfen\n" +
      "BOT_STAGING_CHAT_ID\n" +
      "Bot-Rechte in der Staging-Gruppe\n" +
      "Staging Message ID\n\n" +

      `/importinfo ${item.id}\n\n` +
      "@LibraryOfLegends"
  });

  return;
}

await pgPool.query(
  `
  UPDATE userbot_imports
  SET status = 'archived',
      target_chat_id = $2,
      target_topic_id = $3,
      final_message_id = $4,
      processed_at = NOW(),
      updated_at = NOW()
  WHERE id = $1
  `,
  [
    item.id,
    String(targetChatId),
    topicId ? String(topicId) : null,
    String(finalMessageId)
  ]
);

const titleText =
  `${item.title || "Unbekannter Titel"}${item.year ? ` (${item.year})` : ""}`;

const episodeText =
  isSeries
    ? `S${String(item.season || 1).padStart(2, "0")}E${String(item.episode || 0).padStart(2, "0")}`
    : "";

await tg("sendMessage", {
  chat_id: msg.chat.id,
  text:
    `✅ Import #${item.id} archiviert\n\n` +

    `${titleText}\n` +
    `${isSeries ? "Serie" : "Film"}${isSeries ? ` · ${episodeText}` : ""}\n\n` +

    "Ziel\n" +
    `${isSeries ? "Seriengruppe" : "Filmgruppe"}\n` +
    `Topic · ${topicId || "ohne"}\n` +
    `Message · ${finalMessageId || "unbekannt"}\n\n` +

    "Status\n" +
    "Archiviert\n\n" +

    `/importinfo ${item.id}\n\n` +
    "@LibraryOfLegends"
});
  } catch (err) {
    console.error("❌ /approveimport Fehler:", err.message);

    await pgPool.query(
      `
      UPDATE userbot_imports
      SET status = 'error',
          updated_at = NOW()
      WHERE id = $1
      `,
      [importId]
    ).catch(() => {});

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Import konnte nicht freigegeben werden\n\n" +
        String(err.message).slice(0, 1500) +
        "\n\n" +
        `/importinfo ${importId}\n\n` +
        "@LibraryOfLegends"
    });
  }

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
// WIPE ARCHIVE — MOVIES / SERIES / TOPICS
// =============================
if (
  command === "/wipearchive" ||
  command.startsWith("/wipearchive@")
) {
  if (!pgPool) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "🧹 Archiv-Reset\n\n" +
        "Supabase/PostgreSQL ist nicht aktiv.\n" +
        "Der Archiv-Reset benötigt Supabase.\n\n" +
        "@LibraryOfLegends"
    });
    return;
  }

  const raw =
    text
      .replace(/^\/wipearchive(?:@\w+)?/i, "")
      .trim();

  const confirmed =
    raw === "CONFIRM";

  const archiveTables = [
    "movies",
    "series",
    "series_library",
    "collections",
    "universes",
    "topics",
    "series_topics"
  ];

  async function getExistingArchiveTables() {
    const result = await pgPool.query(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1)
      `,
      [archiveTables]
    );

    const existing =
      result.rows.map((row) => row.table_name);

    return archiveTables.filter((table) =>
      existing.includes(table)
    );
  }

  async function safeCount(tableName) {
    if (!archiveTables.includes(tableName)) return 0;

    try {
      const result = await pgPool.query(
        `SELECT COUNT(*) AS count FROM "${tableName}"`
      );

      return Number(result.rows[0]?.count || 0);
    } catch (err) {
      console.error(`⚠️ Count Fehler (${tableName}):`, err.message);
      return 0;
    }
  }

  async function collectTopicsForDeletion() {
    const rows = [];

    try {
      const result = await pgPool.query(
        `
        SELECT chat_id, topic_id, name, type
        FROM topics
        WHERE chat_id IS NOT NULL
          AND topic_id IS NOT NULL
        `
      );

      for (const row of result.rows) {
        rows.push({
          chatId: row.chat_id,
          topicId: row.topic_id,
          name: row.name,
          type: row.type
        });
      }
    } catch (err) {
      console.error("⚠️ topics konnten nicht gelesen werden:", err.message);
    }

    try {
      const result = await pgPool.query(
        `
        SELECT topic_id, name
        FROM series_topics
        WHERE topic_id IS NOT NULL
        `
      );

      for (const row of result.rows) {
        rows.push({
          chatId: SERIES_GROUP_ID,
          topicId: row.topic_id,
          name: row.name,
          type: "series"
        });
      }
    } catch (err) {
      console.error("⚠️ series_topics konnten nicht gelesen werden:", err.message);
    }

    const seen = new Set();
    const unique = [];

    for (const row of rows) {
      if (!row.chatId || !row.topicId) continue;

      const key =
        `${String(row.chatId)}:${String(row.topicId)}`;

      if (seen.has(key)) continue;

      seen.add(key);
      unique.push(row);
    }

    return unique;
  }

  async function deleteTelegramTopicSafe(topic) {
    try {
      const result = await tg("deleteForumTopic", {
        chat_id: topic.chatId,
        message_thread_id: Number(topic.topicId)
      });

      if (result?.__error) {
        return {
          ok: false,
          error:
            result.description ||
            result.error?.description ||
            "Telegram-Fehler"
        };
      }

      return {
        ok: true,
        error: null
      };
    } catch (err) {
      return {
        ok: false,
        error: err.message
      };
    }
  }

  try {
    const existingTables =
      await getExistingArchiveTables();

    const counts = {};

    for (const table of archiveTables) {
      counts[table] =
        existingTables.includes(table)
          ? await safeCount(table)
          : 0;
    }

    const topicsToDelete =
      await collectTopicsForDeletion();

    if (!confirmed) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "⚠️ Archiv-Reset vorbereitet\n\n" +

          "Dieser Vorgang löscht Filme, Serien und gespeicherte Topics.\n\n" +

          "Datenbank\n" +
          `Filme · ${counts.movies}\n` +
          `Serien-Episoden · ${counts.series}\n` +
          `Serien-Hubs · ${counts.series_library}\n` +
          `Filmreihen · ${counts.collections}\n` +
          `Universen · ${counts.universes}\n` +
          `Topics · ${counts.topics}\n` +
          `Serien-Topics · ${counts.series_topics}\n\n` +

          "Telegram\n" +
          `${topicsToDelete.length} gespeicherte Topics werden gelöscht, falls der Bot die Rechte dafür hat.\n\n` +

          "Nicht gelöscht\n" +
          "userbot_imports bleibt erhalten.\n\n" +

          "Zum endgültigen Löschen ausführen:\n" +
          "/wipearchive CONFIRM\n\n" +

          "@LibraryOfLegends"
      });
      return;
    }

    let deletedTopicCount = 0;
    let failedTopicCount = 0;

    for (const topic of topicsToDelete) {
      const result =
        await deleteTelegramTopicSafe(topic);

      if (result.ok) {
        deletedTopicCount++;
      } else {
        failedTopicCount++;
        console.error(
          "⚠️ Topic konnte nicht gelöscht werden:",
          topic,
          result.error
        );
      }
    }

    if (existingTables.length) {
      const tableSql =
        existingTables
          .map((table) => `"${table}"`)
          .join(", ");

      await pgPool.query(
        `TRUNCATE TABLE ${tableSql} RESTART IDENTITY CASCADE`
      );
    }

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "✅ Archiv wurde zurückgesetzt\n\n" +

        "Gelöscht\n" +
        `Filme · ${counts.movies}\n` +
        `Serien-Episoden · ${counts.series}\n` +
        `Serien-Hubs · ${counts.series_library}\n` +
        `Filmreihen · ${counts.collections}\n` +
        `Universen · ${counts.universes}\n` +
        `DB-Topics · ${counts.topics + counts.series_topics}\n\n` +

        "Telegram Topics\n" +
        `Gelöscht · ${deletedTopicCount}\n` +
        `Fehlgeschlagen · ${failedTopicCount}\n\n` +

        "Import-Historie\n" +
        "userbot_imports wurde nicht gelöscht.\n\n" +

        "/library\n" +
        "/pgstats\n\n" +

        "@LibraryOfLegends"
    });
  } catch (err) {
    console.error("❌ /wipearchive Fehler:", err.message);

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "❌ Archiv-Reset fehlgeschlagen\n\n" +
        String(err.message).slice(0, 1500) +
        "\n\n" +
        "@LibraryOfLegends"
    });
  }

  return;
}

// =============================
// DASHBOARD — PREMIUM COMPACT
// =============================
if (
  command === "/dashboard" ||
  command.startsWith("/dashboard@")
) {
  let movieCount = 0;
  let episodeCount = 0;
  let topicCount = 0;
  let collectionCount = 0;
  let seriesLibraryCount = 0;

  if (pgPool) {
    const movies =
      await pgPool.query(`
        SELECT COUNT(*) AS count
        FROM movies
      `);

    const episodes =
      await pgPool.query(`
        SELECT COUNT(*) AS count
        FROM series
      `);

    const topics =
      await pgPool.query(`
        SELECT COUNT(*) AS count
        FROM topics
      `);

    const collections =
      await pgPool.query(`
        SELECT COUNT(*) AS count
        FROM collections
      `);

    const seriesLibrary =
      await pgPool.query(`
        SELECT COUNT(*) AS count
        FROM series_library
      `);

    movieCount =
      Number(movies.rows[0]?.count || 0);

    episodeCount =
      Number(episodes.rows[0]?.count || 0);

    topicCount =
      Number(topics.rows[0]?.count || 0);

    collectionCount =
      Number(collections.rows[0]?.count || 0);

    seriesLibraryCount =
      Number(seriesLibrary.rows[0]?.count || 0);
  } else {
    movieCount =
      Number(
        db.prepare(`
          SELECT COUNT(*) AS count
          FROM movies
        `).get()?.count || 0
      );

    episodeCount =
      Number(
        db.prepare(`
          SELECT COUNT(*) AS count
          FROM series
        `).get()?.count || 0
      );

    topicCount =
      Number(
        db.prepare(`
          SELECT COUNT(*) AS count
          FROM topics
        `).get()?.count || 0
      );

    collectionCount =
      Number(
        db.prepare(`
          SELECT COUNT(*) AS count
          FROM collections
        `).get()?.count || 0
      );

    seriesLibraryCount =
      Number(
        db.prepare(`
          SELECT COUNT(*) AS count
          FROM series_library
        `).get()?.count || 0
      );
  }

  const movieWord =
    movieCount === 1 ? "Film" : "Filme";

  const collectionWord =
    collectionCount === 1 ? "Filmreihe" : "Filmreihen";

  const seriesWord =
    seriesLibraryCount === 1 ? "Serie" : "Serien";

  const episodeWord =
    episodeCount === 1 ? "Folge" : "Folgen";

  const topicWord =
    topicCount === 1 ? "Thema" : "Themen";

  const resultText =
    "🎛 Dashboard\n\n" +

    "Archiv\n" +
    `${movieCount} ${movieWord}\n` +
    `${collectionCount} ${collectionWord}\n` +
    `${seriesLibraryCount} ${seriesWord}\n` +
    `${episodeCount} ${episodeWord}\n\n` +

    "System\n" +
    `${topicCount} ${topicWord}\n` +
    "Status · Online\n\n" +

    "/library · Hauptnavigation\n" +
    "/systemhub · System & Verwaltung\n\n" +

    "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

  // =============================
// STATS — PREMIUM COMPACT
// =============================
if (
  command === "/stats" ||
  command.startsWith("/stats@")
) {
  let movieCount = 0;
  let seriesEpisodeCount = 0;
  let seriesCount = 0;
  let topicCount = 0;
  let collectionCount = 0;

  if (pgPool) {
    const movies =
      await pgPool.query(`
        SELECT COUNT(*) AS count
        FROM movies
      `);

    const episodes =
      await pgPool.query(`
        SELECT COUNT(*) AS count
        FROM series
      `);

    const seriesLib =
      await pgPool.query(`
        SELECT COUNT(*) AS count
        FROM series_library
      `);

    const topics =
      await pgPool.query(`
        SELECT COUNT(*) AS count
        FROM topics
      `);

    const collections =
      await pgPool.query(`
        SELECT COUNT(*) AS count
        FROM collections
      `);

    movieCount =
      Number(movies.rows[0]?.count || 0);

    seriesEpisodeCount =
      Number(episodes.rows[0]?.count || 0);

    seriesCount =
      Number(seriesLib.rows[0]?.count || 0);

    topicCount =
      Number(topics.rows[0]?.count || 0);

    collectionCount =
      Number(collections.rows[0]?.count || 0);
  } else {
    movieCount =
      Number(db.prepare(`
        SELECT COUNT(*) AS count
        FROM movies
      `).get()?.count || 0);

    seriesEpisodeCount =
      Number(db.prepare(`
        SELECT COUNT(*) AS count
        FROM series
      `).get()?.count || 0);

    seriesCount =
      Number(db.prepare(`
        SELECT COUNT(*) AS count
        FROM series_library
      `).get()?.count || 0);

    topicCount =
      Number(db.prepare(`
        SELECT COUNT(*) AS count
        FROM topics
      `).get()?.count || 0);

    collectionCount =
      Number(db.prepare(`
        SELECT COUNT(*) AS count
        FROM collections
      `).get()?.count || 0);
  }

  const movieWord =
    movieCount === 1 ? "Film" : "Filme";

  const collectionWord =
    collectionCount === 1 ? "Filmreihe" : "Filmreihen";

  const seriesWord =
    seriesCount === 1 ? "Serie" : "Serien";

  const episodeWord =
    seriesEpisodeCount === 1 ? "Folge" : "Folgen";

  const topicWord =
    topicCount === 1 ? "Thema" : "Themen";

  const resultText =
    "📊 Statistik\n\n" +

    "Archiv\n" +
    `${movieCount} ${movieWord}\n` +
    `${collectionCount} ${collectionWord}\n` +
    `${seriesCount} ${seriesWord}\n` +
    `${seriesEpisodeCount} ${episodeWord}\n\n` +

    "System\n" +
    `${topicCount} ${topicWord}\n\n` +

    "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}
  
  // =============================
// QUEUE — PREMIUM COMPACT
// =============================
if (
  command === "/queue" ||
  command.startsWith("/queue@")
) {
  const waiting =
    Number(UPLOAD_QUEUE.length || 0);

  const activeUploads =
    Number(ACTIVE_UPLOADS.size || 0);

  const queueStatus =
    UPLOAD_QUEUE_RUNNING ? "Aktiv" : "Bereit";

  const waitingWord =
    waiting === 1 ? "Import" : "Importe";

  const activeWord =
    activeUploads === 1 ? "Upload" : "Uploads";

  const resultText =
    "📥 Import Queue\n\n" +

    "Status\n" +
    `${queueStatus}\n\n` +

    "Warteschlange\n" +
    `${waiting} wartende ${waitingWord}\n` +
    `${activeUploads} aktive ${activeWord}\n\n` +

    "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// CACHE — PREMIUM COMPACT
// =============================
if (
  command === "/cache" ||
  command.startsWith("/cache@")
) {
  const cacheCount =
    Number(TMDB_CACHE.size || 0);

  const entryWord =
    cacheCount === 1 ? "Eintrag" : "Einträge";

  const resultText =
    "⚡ TMDB Cache\n\n" +

    "Status\n" +
    `${cacheCount} ${entryWord}\n` +
    "TTL · 6 Stunden\n\n" +

    "/clearcache · Cache leeren\n\n" +

    "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// CLEAR CACHE — PREMIUM COMPACT
// =============================
if (
  command === "/clearcache" ||
  command.startsWith("/clearcache@")
) {
  const before =
    Number(TMDB_CACHE.size || 0);

  TMDB_CACHE.clear();

  const entryWord =
    before === 1 ? "Eintrag" : "Einträge";

  const resultText =
    "🧹 Cache geleert\n\n" +

    `${before} ${entryWord} entfernt\n\n` +

    "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
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
      "🎞 Filmreihen aktualisiert\n\n" +
      `Aktualisiert · ${updated}\n` +
      `Fehler · ${failed}\n\n` +
      "@LibraryOfLegends"
  });

  return;
}
  
  // =============================
// COLLECTIONS LIST — PREMIUM COMPACT
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
    "🎞 Filmreihen\n\n";

  for (const row of rows) {
    const count =
      Number(row.movie_count || 0);

    const movieWord =
      count === 1 ? "Film" : "Filme";

    resultText += `• ${row.collection_name}\n`;
    resultText += `  ${count} ${movieWord}\n\n`;
  }

  resultText += "/collection Name · Filmreihe öffnen\n\n";
  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// SINGLE COLLECTION — PREMIUM COMPACT
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
    `🎞 ${collection.collection_name}\n\n`;

  if (!movies.length) {
    resultText += "Noch keine Filme in dieser Filmreihe gespeichert.\n\n";
  } else {
    const count =
      movies.length;

    const movieWord =
      count === 1 ? "Film" : "Filme";

    resultText += `${count} ${movieWord} im Archiv\n\n`;

    for (const m of movies) {
      const title =
        String(m.title || "Unbekannter Film").trim();

      const yearText =
        m.year ? ` (${m.year})` : "";

      const ratingNumber =
        typeof extractRatingNumber === "function"
          ? extractRatingNumber(m.rating)
          : getRatingValue(m.rating);

      const ratingText =
        ratingNumber > 0
          ? `${ratingNumber.toFixed(1)}/10`
          : "Unbekannt";

      resultText += `• ${title}${yearText}\n`;
      resultText += `  ${ratingText}\n\n`;
    }
  }

  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// LIBRARY HOME — PREMIUM COMPACT
// =============================
if (
  command === "/library" ||
  command.startsWith("/library@") ||
  command === "/home" ||
  command.startsWith("/home@")
) {
  let movieCount = 0;
  let seriesCount = 0;
  let episodeCount = 0;
  let collectionCount = 0;

  if (pgPool) {
    const movieResult = await pgPool.query(`
      SELECT COUNT(*) AS count
      FROM movies
    `);

    const seriesResult = await pgPool.query(`
      SELECT
        COUNT(DISTINCT series_title) AS series_count,
        COUNT(*) AS episode_count
      FROM series
    `);

    const collectionResult = await pgPool.query(`
      SELECT COUNT(*) AS count
      FROM collections
    `);

    movieCount =
      Number(movieResult.rows[0]?.count || 0);

    seriesCount =
      Number(seriesResult.rows[0]?.series_count || 0);

    episodeCount =
      Number(seriesResult.rows[0]?.episode_count || 0);

    collectionCount =
      Number(collectionResult.rows[0]?.count || 0);
  } else {
    const movieRow = db.prepare(`
      SELECT COUNT(*) AS count
      FROM movies
    `).get();

    const seriesRow = db.prepare(`
      SELECT
        COUNT(DISTINCT series_title) AS series_count,
        COUNT(*) AS episode_count
      FROM series
    `).get();

    const collectionRow = db.prepare(`
      SELECT COUNT(*) AS count
      FROM collections
    `).get();

    movieCount =
      Number(movieRow?.count || 0);

    seriesCount =
      Number(seriesRow?.series_count || 0);

    episodeCount =
      Number(seriesRow?.episode_count || 0);

    collectionCount =
      Number(collectionRow?.count || 0);
  }

  const movieWord =
    movieCount === 1 ? "Film" : "Filme";

  const seriesWord =
    seriesCount === 1 ? "Serie" : "Serien";

  const episodeWord =
    episodeCount === 1 ? "Folge" : "Folgen";

  const collectionWord =
    collectionCount === 1 ? "Filmreihe" : "Filmreihen";

  const resultText =
    "🏛️ Library of Legends\n\n" +

    "🎬 Filme\n" +
    "/moviehub · Filmarchiv öffnen\n" +
    "/newmovies · Neue Filme\n" +
    "/movies · Filme A–Z\n\n" +

    "📺 Serien\n" +
    "/serieshub · Serienarchiv öffnen\n" +
    "/newseries · Neue Folgen\n" +
    "/seriesaz · Serien A–Z\n\n" +

    "🎞 Filmreihen\n" +
    "/collections · Filmreihen öffnen\n\n" +
    "/systemhub · System & Verwaltung\n\n" +

    "Archiv\n" +
    `${movieCount} ${movieWord} · ${seriesCount} ${seriesWord} · ${episodeCount} ${episodeWord}\n` +
    `${collectionCount} ${collectionWord}\n\n` +

    "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// SYSTEM HUB — PREMIUM COMPACT
// =============================
if (
  command === "/systemhub" ||
  command.startsWith("/systemhub@") ||
  command === "/adminhub" ||
  command.startsWith("/adminhub@")
) {
  const resultText =
    "⚙️ System\n\n" +

    "Übersicht\n" +
    "/dashboard · Dashboard\n" +
    "/stats · Statistik\n" +
    "/pgstats · Datenbankstatus\n\n" +

    "Import\n" +
    "/queue · Import Queue\n\n" +

    "Cache\n" +
    "/cache · TMDB Cache\n" +
    "/clearcache · Cache leeren\n\n" +

    "Filme\n" +
    "/movies · Filme A–Z\n" +
    "/moviehub · Filmarchiv\n" +
    "/newmovies · Neue Filme\n" +
    "/collections · Filmreihen\n" +
    "/rebuildcollections · Filmreihen aktualisieren\n\n" +

    "Serien\n" +
    "/serieshub · Serienarchiv\n" +
    "/seriesaz · Serien A–Z\n" +
    "/newseries · Neue Folgen\n" +
    "/trendingseries · Beliebte Serien\n" +
    "/featuredseries · Serien-Highlights\n\n" +

    "Rebuild\n" +
    "/rebuildserieshub Name · Serien-Hub neu bauen\n" +
    "/seriesregistry Name · Serienübersicht erzeugen\n\n" +

    "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// MOVIE HUB — PREMIUM COMPACT
// =============================
if (command === "/moviehub") {
  let latest = [];
  let featured = [];

  if (pgPool) {
    const latestResult = await pgPool.query(`
      SELECT title, year, genre, rating, created_at
      FROM movies
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const featuredResult = await pgPool.query(`
      SELECT title, year, genre, rating
      FROM movies
      ORDER BY created_at DESC
      LIMIT 80
    `);

    latest = latestResult.rows;
    featured = featuredResult.rows;
  } else {
    latest = db.prepare(`
      SELECT title, year, genre, rating, created_at
      FROM movies
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    featured = db.prepare(`
      SELECT title, year, genre, rating
      FROM movies
      ORDER BY created_at DESC
      LIMIT 80
    `).all();
  }

  featured.sort((a, b) => {
    const ratingA =
      typeof extractRatingNumber === "function"
        ? extractRatingNumber(a.rating)
        : getRatingValue(a.rating);

    const ratingB =
      typeof extractRatingNumber === "function"
        ? extractRatingNumber(b.rating)
        : getRatingValue(b.rating);

    if (ratingB !== ratingA) {
      return ratingB - ratingA;
    }

    return String(a.title || "").localeCompare(String(b.title || ""), "de");
  });

  featured = featured.slice(0, 5);

  let resultText =
    "🎬 Filme\n\n";

  resultText += "Neu im Archiv\n";

  if (!latest.length) {
    resultText += "Noch keine Filme gespeichert.\n\n";
  } else {
    for (const m of latest) {
      const title =
        String(m.title || "Unbekannter Film").trim();

      const yearText =
        m.year ? ` (${m.year})` : "";

      resultText += `• ${title}${yearText}\n`;
    }

    resultText += "\n";
  }

  resultText += "Highlights\n";

  if (!featured.length) {
    resultText += "Noch keine Featured-Filme verfügbar.\n\n";
  } else {
    for (const m of featured) {
      const title =
        String(m.title || "Unbekannter Film").trim();

      const yearText =
        m.year ? ` (${m.year})` : "";

      const ratingNumber =
        typeof extractRatingNumber === "function"
          ? extractRatingNumber(m.rating)
          : getRatingValue(m.rating);

      const ratingText =
        ratingNumber > 0
          ? `${ratingNumber.toFixed(1)}/10`
          : "Unbekannt";

      resultText += `• ${title}${yearText} · ${ratingText}\n`;
    }

    resultText += "\n";
  }

  resultText += "/movies · Filme A–Z\n";
  resultText += "/newmovies · Neue Filme\n";
  resultText += "/collections · Filmreihen\n\n";
  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// NEW MOVIES — PREMIUM COMPACT
// =============================
if (command === "/newmovies") {
  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT title, year, genre, rating, created_at
      FROM movies
      ORDER BY created_at DESC
      LIMIT 10
    `);

    rows = result.rows;
  } else {
    rows = db.prepare(`
      SELECT title, year, genre, rating, created_at
      FROM movies
      ORDER BY created_at DESC
      LIMIT 10
    `).all();
  }

  if (!rows.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "🎬 Noch keine neuen Filme gespeichert."
    });
    return;
  }

  let resultText =
    "🆕 Neue Filme\n\n";

  for (const m of rows) {
    const title =
      String(m.title || "Unbekannter Film").trim();

    const yearText =
      m.year ? ` (${m.year})` : "";

    const genreText =
      String(m.genre || "Sonstige")
        .split(/[\/•,]/)
        .map((g) =>
          typeof llNormalizeGenreName === "function"
            ? llNormalizeGenreName(g.trim())
            : g.trim()
        )
        .filter(Boolean)
        .slice(0, 2)
        .join(" · ") || "Sonstige";

    const ratingNumber =
      typeof extractRatingNumber === "function"
        ? extractRatingNumber(m.rating)
        : getRatingValue(m.rating);

    const ratingText =
      ratingNumber > 0
        ? `${ratingNumber.toFixed(1)}/10`
        : "Unbekannt";

    resultText += `• ${title}${yearText}\n`;
    resultText += `  ${genreText} · ${ratingText}\n\n`;
  }

  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

  // =============================
// MOVIE LIST — PREMIUM COMPACT
// =============================
if (command === "/movies") {
  let movies = [];

  if (pgPool) {
    const result = await pgPool.query(`
      SELECT title, year, genre, rating
      FROM movies
      ORDER BY title ASC
      LIMIT 80
    `);

    movies = result.rows;
  } else {
    movies = db.prepare(`
      SELECT title, year, genre, rating
      FROM movies
      ORDER BY title ASC
      LIMIT 80
    `).all();
  }

  let resultText =
    "🎬 Filme A–Z\n\n";

  if (!movies.length) {
    resultText += "Noch keine Filme gespeichert.\n";
  } else {
    let currentLetter = "";

    for (const m of movies) {
      const title =
        String(m.title || "Unbekannter Film").trim();

      const letter =
        title.charAt(0).toUpperCase();

      if (letter !== currentLetter) {
        currentLetter = letter;
        resultText += `${currentLetter}\n`;
      }

      const yearText =
        m.year ? ` (${m.year})` : "";

      const genreText =
        String(m.genre || "Sonstige")
          .split(/[\/•,]/)
          .map((g) =>
            typeof llNormalizeGenreName === "function"
              ? llNormalizeGenreName(g.trim())
              : g.trim()
          )
          .filter(Boolean)
          .slice(0, 2)
          .join(" · ") || "Sonstige";

      const ratingNumber =
        typeof extractRatingNumber === "function"
          ? extractRatingNumber(m.rating)
          : getRatingValue(m.rating);

      const ratingText =
        ratingNumber > 0
          ? `${ratingNumber.toFixed(1)}/10`
          : "Unbekannt";

      resultText += `• ${title}${yearText}\n`;
      resultText += `  ${genreText} · ${ratingText}\n\n`;
    }
  }

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
// SERIES A-Z — PREMIUM COMPACT
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

  rows.sort((a, b) => {
    const titleA =
      typeof llShortSeriesTitle === "function"
        ? llShortSeriesTitle(a.series_title)
        : a.series_title;

    const titleB =
      typeof llShortSeriesTitle === "function"
        ? llShortSeriesTitle(b.series_title)
        : b.series_title;

    return String(titleA).localeCompare(String(titleB), "de");
  });

  let currentLetter = "";

  let resultText =
    "🔤 Serien A–Z\n\n";

  for (const s of rows) {
    const title =
      typeof llShortSeriesTitle === "function"
        ? llShortSeriesTitle(s.series_title)
        : s.series_title;

    const letter =
      String(title || "#")
        .charAt(0)
        .toUpperCase();

    if (letter !== currentLetter) {
      currentLetter = letter;
      resultText += `${currentLetter}\n`;
    }

    const genreText =
      String(s.genre || "Sonstige")
        .split(/[\/•,]/)
        .map((g) =>
          typeof llNormalizeGenreName === "function"
            ? llNormalizeGenreName(g.trim())
            : g.trim()
        )
        .filter(Boolean)
        .slice(0, 2)
        .join(" · ") || "Sonstige";

    const ratingNumber =
      typeof extractRatingNumber === "function"
        ? extractRatingNumber(s.rating)
        : getRatingValue(s.rating);

    const ratingText =
      ratingNumber > 0
        ? `${ratingNumber.toFixed(1)}/10`
        : "Unbekannt";

    const count =
      Number(s.count || 0);

    const episodeWord =
      count === 1 ? "Folge" : "Folgen";

    resultText += `• ${title}\n`;
    resultText += `  ${count} ${episodeWord} · ${genreText} · ${ratingText}\n\n`;
  }

  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// NEW SERIES — PREMIUM COMPACT
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
    "🆕 Neue Folgen\n\n";

  for (const s of rows) {
    const title =
      typeof llShortSeriesTitle === "function"
        ? llShortSeriesTitle(s.series_title)
        : s.series_title;

    const seasonText =
      String(s.season || 1).padStart(2, "0");

    const episodeText =
      String(s.episode || 1).padStart(2, "0");

    const episodeTitle =
      String(s.episode_title || "")
        .replace(/\s+\/\s+/g, " · ")
        .replace(/\s+/g, " ")
        .trim();

    const genreText =
      String(s.genre || "Sonstige")
        .split(/[\/•,]/)
        .map((g) =>
          typeof llNormalizeGenreName === "function"
            ? llNormalizeGenreName(g.trim())
            : g.trim()
        )
        .filter(Boolean)
        .slice(0, 2)
        .join(" · ") || "Sonstige";

    const ratingNumber =
      typeof extractRatingNumber === "function"
        ? extractRatingNumber(s.rating)
        : getRatingValue(s.rating);

    const ratingText =
      ratingNumber > 0
        ? `${ratingNumber.toFixed(1)}/10`
        : "Unbekannt";

    resultText += `• ${title} · S${seasonText}E${episodeText}\n`;

    if (episodeTitle) {
      resultText += `  ${episodeTitle}\n`;
    }

    resultText += `  ${genreText} · ${ratingText}\n\n`;
  }

  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// SERIES REGISTRY / REBUILD SERIES HUB
// =============================
if (
  command === "/seriesregistry" ||
  command.startsWith("/seriesregistry@") ||
  command === "/rebuildserieshub" ||
  command.startsWith("/rebuildserieshub@")
) {
  const query =
    text
      .replace(/^\/(?:seriesregistry|rebuildserieshub)(?:@\w+)?/i, "")
      .trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/seriesregistry Serienname\n" +
        "/rebuildserieshub Serienname\n\n" +
        "Beispiel:\n" +
        "/rebuildserieshub Tulsa King"
    });

    return;
  }

  const search =
    `%${query.toLowerCase()}%`;

  let rows = [];

  if (pgPool) {
    const result =
      await pgPool.query(
        `
        SELECT *
        FROM series
        WHERE LOWER(series_title) LIKE $1
        ORDER BY season ASC, episode ASC
        `,
        [search]
      );

    rows =
      result.rows;
  } else {
    rows =
      db.prepare(`
        SELECT *
        FROM series
        WHERE LOWER(series_title) LIKE ?
        ORDER BY season ASC, episode ASC
      `).all(search);
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

  const first =
    rows[0];

  const seriesTitle =
    first.series_title ||
    query;

  const seasonMap =
    new Map();

  for (const row of rows) {
    const season =
      Number(row.season || 1);

    const episode =
      Number(row.episode || 0);

    if (!seasonMap.has(season)) {
      seasonMap.set(season, {
        season,
        episodes: new Set(),
        highestEpisode: 0
      });
    }

    const item =
      seasonMap.get(season);

    if (episode > 0) {
      item.episodes.add(episode);

      item.highestEpisode =
        Math.max(
          item.highestEpisode,
          episode
        );
    }
  }

  const seasons =
    [...seasonMap.values()]
      .sort((a, b) => a.season - b.season)
      .map((season) => {
        const knownTotal =
          typeof getKnownSeasonEpisodeCount === "function"
            ? getKnownSeasonEpisodeCount(
                seriesTitle,
                season.season
              )
            : 0;

        return {
          season:
            season.season,

          savedEpisodes:
            season.episodes.size,

          totalEpisodes:
            knownTotal || 0,

          highestEpisode:
            season.highestEpisode || 0
        };
      });

  const savedEpisodes =
    seasons.reduce(
      (sum, season) =>
        sum + Number(season.savedEpisodes || 0),
      0
    );

  const officialTotalEpisodes =
    seasons.reduce(
      (sum, season) =>
        sum + Number(season.totalEpisodes || 0),
      0
    );

  const totalEpisodes =
    officialTotalEpisodes || 0;

  const seriesData = {
    title:
      seriesTitle,

    year:
      first.first_air_date
        ? String(first.first_air_date).slice(0, 4)
        : "",

    genre:
      first.genre || "Sonstige",

    rating:
      first.rating || "Unbekannt",

    overview:
      first.overview ||
      "Keine Serienbeschreibung verfügbar."
  };

  const stats = {
    savedEpisodes,
    totalEpisodes,
    seasons
  };

  const caption =
    seriesRegistryCaption(seriesData, stats);

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    message_thread_id:
      msg.message_thread_id || undefined,
    text: caption,
    parse_mode: "HTML"
  });

  return;
}

// =============================
// TRENDING SERIES — PREMIUM COMPACT
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
    "🔥 Trending Serien\n\n";

  let rank = 1;

  for (const s of rows) {
    const title =
      typeof llShortSeriesTitle === "function"
        ? llShortSeriesTitle(s.series_title)
        : s.series_title;

    const genreText =
      String(s.genre || "Sonstige")
        .split(/[\/•,]/)
        .map((g) => llNormalizeGenreName(g.trim()))
        .filter(Boolean)
        .slice(0, 2)
        .join(" · ") || "Sonstige";

    const count =
      Number(s.count || 0);

    const episodeWord =
      count === 1 ? "Folge" : "Folgen";

    resultText += `${rank}. ${title}\n`;
    resultText += `${count} ${episodeWord} · ${genreText}\n\n`;

    rank++;
  }

  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// FEATURED SERIES — PREMIUM COMPACT
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
    const ratingA =
      typeof extractRatingNumber === "function"
        ? extractRatingNumber(a.rating)
        : getRatingValue(a.rating);

    const ratingB =
      typeof extractRatingNumber === "function"
        ? extractRatingNumber(b.rating)
        : getRatingValue(b.rating);

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
    "⭐ Featured Serien\n\n";

  let rank = 1;

  for (const s of rows) {
    const title =
      typeof llShortSeriesTitle === "function"
        ? llShortSeriesTitle(s.series_title)
        : s.series_title;

    const genreText =
      String(s.genre || "Sonstige")
        .split(/[\/•,]/)
        .map((g) => llNormalizeGenreName(g.trim()))
        .filter(Boolean)
        .slice(0, 2)
        .join(" · ") || "Sonstige";

    const ratingNumber =
      typeof extractRatingNumber === "function"
        ? extractRatingNumber(s.rating)
        : getRatingValue(s.rating);

    const ratingText =
      ratingNumber > 0
        ? `${ratingNumber.toFixed(1)}/10`
        : "Unbekannt";

    const count =
      Number(s.count || 0);

    const episodeWord =
      count === 1 ? "Folge" : "Folgen";

    resultText += `${rank}. ${title}\n`;
    resultText += `${ratingText} · ${count} ${episodeWord} · ${genreText}\n\n`;

    rank++;
  }

  resultText += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: cleanTelegramText(resultText).slice(0, 4000)
  });

  return;
}

// =============================
// SERIES HUB — PREMIUM COMPACT
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
      ORDER BY count DESC, series_title ASC
      LIMIT 10
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
      ORDER BY count DESC, series_title ASC
      LIMIT 10
    `).all();
  }

  featured.sort((a, b) => {
    const ratingA =
      typeof extractRatingNumber === "function"
        ? extractRatingNumber(a.rating)
        : getRatingValue(a.rating);

    const ratingB =
      typeof extractRatingNumber === "function"
        ? extractRatingNumber(b.rating)
        : getRatingValue(b.rating);

    if (ratingB !== ratingA) {
      return ratingB - ratingA;
    }

    return Number(b.count || 0) - Number(a.count || 0);
  });

  featured = featured.slice(0, 5);

  let resultText =
    "📺 Serien\n\n";

  resultText += "Neue Folgen\n";

  if (!latest.length) {
    resultText += "Noch keine Folgen gespeichert.\n\n";
  } else {
    for (const s of latest) {
      const title =
        typeof llShortSeriesTitle === "function"
          ? llShortSeriesTitle(s.series_title)
          : s.series_title;

      const season =
        String(s.season || 1).padStart(2, "0");

      const episode =
        String(s.episode || 1).padStart(2, "0");

      const episodeTitle =
  String(s.episode_title || "")
    .replace(/\s+\/\s+/g, " · ")
    .replace(/\s+/g, " ")
    .trim();

      resultText += `• ${title} · S${season}E${episode}\n`;

      if (episodeTitle) {
        resultText += `  ${episodeTitle}\n`;
      }
    }

    resultText += "\n";
  }

  resultText += "Trending\n";

  if (!trending.length) {
    resultText += "Noch keine Trends verfügbar.\n\n";
  } else {
    for (const s of trending) {
      const title =
        typeof llShortSeriesTitle === "function"
          ? llShortSeriesTitle(s.series_title)
          : s.series_title;

      const count =
  Number(s.count || 0);

const episodeWord =
  count === 1 ? "Folge" : "Folgen";

resultText += `• ${title} · ${count} ${episodeWord}\n`;
    }

    resultText += "\n";
  }

  resultText += "Featured\n";

  if (!featured.length) {
    resultText += "Noch keine Featured-Serien verfügbar.\n\n";
  } else {
    for (const s of featured) {
      const title =
        typeof llShortSeriesTitle === "function"
          ? llShortSeriesTitle(s.series_title)
          : s.series_title;

      const ratingNumber =
        typeof extractRatingNumber === "function"
          ? extractRatingNumber(s.rating)
          : getRatingValue(s.rating);

      const ratingText =
        ratingNumber > 0
          ? `${ratingNumber.toFixed(1)}/10`
          : "Unbekannt";

      resultText += `• ${title} · ${ratingText}\n`;
    }

    resultText += "\n";
  }

  resultText += "/seriesaz · Serien A–Z\n";
  resultText += "/newseries · Neue Folgen\n";
  resultText += "/trendingseries · Trending\n";
  resultText += "/featuredseries · Featured\n\n";
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

const idMatch =
  String(searchText)
    .trim()
    .match(/^(?:id:|#)?(\d+)$/i);

const yearMatch =
  String(searchText)
    .trim()
    .match(/^(.+?)\s+((?:19|20)\d{2})$/);

if (idMatch) {
  const movieId =
    Number(idMatch[1]);

  if (pgPool) {
    const result =
      await pgPool.query(
        `
        SELECT *
        FROM movies
        WHERE id = $1
        LIMIT 1
        `,
        [movieId]
      );

    movie =
      result.rows[0] || null;
  } else {
    movie =
      db.prepare(`
        SELECT *
        FROM movies
        WHERE id = ?
        LIMIT 1
      `).get(movieId);
  }

} else if (yearMatch) {
  const titlePart =
    yearMatch[1].trim().toLowerCase();

  const yearPart =
    yearMatch[2];

  if (pgPool) {
    const result =
      await pgPool.query(
        `
        SELECT *
        FROM movies
        WHERE (
          LOWER(title) LIKE $1
          OR LOWER(file_name) LIKE $1
          OR LOWER(unique_key) LIKE $1
        )
        AND year = $2
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [`%${titlePart}%`, yearPart]
      );

    movie =
      result.rows[0] || null;
  } else {
    movie =
      db.prepare(`
        SELECT *
        FROM movies
        WHERE (
          LOWER(title) LIKE ?
          OR LOWER(file_name) LIKE ?
          OR LOWER(unique_key) LIKE ?
        )
        AND year = ?
        ORDER BY created_at DESC
        LIMIT 1
      `).get(
        `%${titlePart}%`,
        `%${titlePart}%`,
        `%${titlePart}%`,
        yearPart
      );
  }

} else {
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
  const editError =
    edited?.error?.description ||
    edited?.description ||
    edited?.message ||
    JSON.stringify(edited).slice(0, 500);

  console.error(
    "⚠️ /editmovie Caption Edit Fehler:",
    editError
  );

  if (String(editError).includes("message is not modified")) {
    captionStatus =
      "✅ Telegram-Caption war bereits aktuell.";
  } else if (String(editError).includes("message to edit not found")) {
    captionStatus =
      "⚠️ Telegram-Caption konnte nicht aktualisiert werden: Nachricht nicht gefunden.";
  } else if (String(editError).includes("there is no caption")) {
    captionStatus =
      "⚠️ Telegram-Caption konnte nicht aktualisiert werden: Beitrag hat keine Caption.";
  } else {
    captionStatus =
      "⚠️ Telegram-Caption Fehler:\n" +
      String(editError).slice(0, 1000);
  }
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

// =============================
// REBUILD HALL OF FAME
// =============================
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
// SERIES REGISTRY TEST / HUB
// =============================
if (command === "/seriesregistry" || command.startsWith("/seriesregistry@")) {
  const query =
    text
      .replace(/^\/seriesregistry(?:@\w+)?/i, "")
      .trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/seriesregistry Serienname\n\n" +
        "Beispiel:\n" +
        "/seriesregistry Tulsa King"
    });

    return;
  }

  const search =
    `%${query.toLowerCase()}%`;

  let rows = [];

  if (pgPool) {
    const result =
      await pgPool.query(
        `
        SELECT *
        FROM series
        WHERE LOWER(series_title) LIKE $1
        ORDER BY season ASC, episode ASC
        `,
        [search]
      );

    rows =
      result.rows;
  } else {
    rows =
      db.prepare(`
        SELECT *
        FROM series
        WHERE LOWER(series_title) LIKE ?
        ORDER BY season ASC, episode ASC
      `).all(search);
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

  const first =
    rows[0];

  const seriesTitle =
    first.series_title ||
    query;

  const seasonMap =
    new Map();

  for (const row of rows) {
    const season =
      Number(row.season || 1);

    if (!seasonMap.has(season)) {
      seasonMap.set(season, {
        season,
        savedEpisodes: 0,
        highestEpisode: 0
      });
    }

    const item =
      seasonMap.get(season);

    item.savedEpisodes += 1;

    if (row.episode) {
      item.highestEpisode =
        Math.max(
          item.highestEpisode,
          Number(row.episode)
        );
    }
  }

  const seasons =
    [...seasonMap.values()]
      .sort((a, b) => a.season - b.season)
      .map((season) => {
        const knownTotal =
          getKnownSeasonEpisodeCount(
            seriesTitle,
            season.season
          );

        return {
          season:
            season.season,

          savedEpisodes:
            season.savedEpisodes,

          totalEpisodes:
            knownTotal || 0,

          highestEpisode:
            season.highestEpisode || 0
        };
      });

  const savedEpisodes =
    rows.length;

  const officialTotalEpisodes =
    seasons.reduce(
      (sum, season) =>
        sum + Number(season.totalEpisodes || 0),
      0
    );

  const totalEpisodes =
    officialTotalEpisodes || 0;

  const seriesData = {
    title:
      seriesTitle,

    year:
      first.first_air_date
        ? String(first.first_air_date).slice(0, 4)
        : "",

    genre:
      first.genre || "Sonstige",

    rating:
      first.rating || "Unbekannt",

    overview:
      first.overview ||
      "Keine Serienbeschreibung verfügbar."
  };

  const stats = {
    savedEpisodes,
    totalEpisodes,
    seasons
  };

  const caption =
    seriesRegistryCaption(seriesData, stats);

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    message_thread_id:
      msg.message_thread_id || undefined,
    text: caption,
    parse_mode: "HTML"
  });

  return;
}

// =============================
// CLEAR ALL MEDIA DATABASE
// =============================
if (text === "/clearalldb") {

  if (pgPool) {
    await pgPool.query(`DELETE FROM movies;`);
    await pgPool.query(`DELETE FROM series;`);
    await pgPool.query(`DELETE FROM series_library;`);
  }

  db.prepare(`DELETE FROM movies;`).run();
  db.prepare(`DELETE FROM series;`).run();
  db.prepare(`DELETE FROM series_library;`).run();

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🧹 KOMPLETTE MEDIEN-DATENBANK GELEERT\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "✅ Alle Filme wurden gelöscht\n" +
      "✅ Alle Serienfolgen wurden gelöscht\n" +
      "✅ Serien-Metadaten wurden gelöscht\n\n" +
      "📌 Topics bleiben erhalten\n" +
      "📌 Gruppen bleiben erhalten\n" +
      "📌 Bot-Struktur bleibt erhalten\n\n" +
      "Du kannst Filme und Serien jetzt sauber neu hochladen.\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
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

return;
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
// MOVIE QUALITY UPGRADE CHECK V3
// =============================
function llMovieQualityScoreV3(data = {}) {
  const text =
    [
      data.fileName,
      data.file_name,
      data.quality,
      data.resolution,
      data.source,
      data.videoCodec,
      data.video_codec,
      data.codec
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

  let score = 0;

  // Auflösung
  if (/2160|uhd|4k/.test(text)) {
    score += 400;
  } else if (/1080|fhd/.test(text)) {
    score += 300;
  } else if (/720|hd/.test(text)) {
    score += 200;
  } else if (/480|576|dvd|sd/.test(text)) {
    score += 100;
  }

  // Quelle
  if (/remux/.test(text)) {
    score += 50;
  } else if (/bluray|blu-ray|bdrip|brrip/.test(text)) {
    score += 40;
  } else if (/web-dl|webdl/.test(text)) {
    score += 30;
  } else if (/web|webrip/.test(text)) {
    score += 20;
  } else if (/hdtv/.test(text)) {
    score += 10;
  }

  // Codec kleiner Bonus
  if (/h265|hevc|x265/.test(text)) {
    score += 8;
  } else if (/h264|x264|avc/.test(text)) {
    score += 5;
  }

  return score;
}

function llMovieQualityLabelV3(data = {}) {
  const text =
    [
      data.fileName,
      data.file_name,
      data.quality,
      data.resolution,
      data.source,
      data.videoCodec,
      data.video_codec,
      data.codec
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

  const parts = [];

  if (/2160|uhd|4k/.test(text)) {
    parts.push("UHD");
  } else if (/1080|fhd/.test(text)) {
    parts.push("FHD");
  } else if (/720|hd/.test(text)) {
    parts.push("HD");
  } else if (/480|576|dvd|sd/.test(text)) {
    parts.push("SD");
  } else {
    parts.push("Unbekannt");
  }

  if (/remux/.test(text)) {
    parts.push("REMUX");
  } else if (/bluray|blu-ray|bdrip|brrip/.test(text)) {
    parts.push("BluRay");
  } else if (/web-dl|webdl/.test(text)) {
    parts.push("WEB-DL");
  } else if (/web|webrip/.test(text)) {
    parts.push("WEB");
  }

  if (/h265|hevc|x265/.test(text)) {
    parts.push("H.265");
  } else if (/h264|x264|avc/.test(text)) {
    parts.push("H.264");
  }

  return parts.join(" · ");
}

function llCompareMovieQualityUpgradeV3({
  existingMovie,
  newFileName,
  newExtras
}) {
  const oldData = {
    fileName:
      existingMovie?.file_name ||
      existingMovie?.fileName ||
      "",
    quality:
      existingMovie?.quality ||
      "",
    resolution:
      existingMovie?.resolution ||
      "",
    source:
      existingMovie?.source ||
      "",
    videoCodec:
      existingMovie?.video_codec ||
      existingMovie?.videoCodec ||
      existingMovie?.codec ||
      ""
  };

  const newData = {
    fileName: newFileName,
    file_name: newFileName,
    quality:
      newExtras?.quality ||
      "",
    resolution:
      newExtras?.resolution ||
      "",
    source:
      newExtras?.source ||
      "",
    videoCodec:
      newExtras?.videoCodec ||
      newExtras?.video_codec ||
      newExtras?.codec ||
      ""
  };

  const oldScore =
    llMovieQualityScoreV3(oldData);

  const newScore =
    llMovieQualityScoreV3(newData);

  return {
    isUpgrade: newScore > oldScore,
    oldScore,
    newScore,
    oldLabel: llMovieQualityLabelV3(oldData),
    newLabel: llMovieQualityLabelV3(newData)
  };
}

// =============================
// MOVIE QUALITY UPGRADE FINALIZER V3
// löscht alte Telegram-Nachricht und alten DB-Eintrag
// erst NACHDEM die neue Datei erfolgreich kopiert wurde
// =============================
async function deleteTelegramMovieMessageSafeV3(existingMovie) {
  const oldMessageId =
    existingMovie?.telegram_message_id ||
    existingMovie?.telegramMessageId ||
    null;

  if (!oldMessageId) {
    console.log(
      "ℹ️ Kein alter Telegram-Message-ID für Upgrade vorhanden."
    );

    return false;
  }

  try {
    await tg("deleteMessage", {
      chat_id: MOVIE_GROUP_ID,
      message_id: Number(oldMessageId)
    });

    console.log(
      "🗑 Alte Film-Nachricht gelöscht:",
      oldMessageId
    );

    return true;
  } catch (err) {
    console.error(
      "⚠️ Alte Film-Nachricht konnte nicht gelöscht werden:",
      oldMessageId,
      err.message
    );

    return false;
  }
}

async function deleteMovieDbEntryByUniqueKeyV3(uniqueKey) {
  if (!uniqueKey) {
    return false;
  }

  if (pgPool) {
    await pgPool.query(
      `
      DELETE FROM movies
      WHERE unique_key = $1
      `,
      [uniqueKey]
    );

    return true;
  }

  db.prepare(`
    DELETE FROM movies
    WHERE unique_key = ?
  `).run(uniqueKey);

  return true;
}

async function finalizeMovieQualityUpgradeV3({
  movieUpgrade,
  uniqueKey
}) {
  if (!movieUpgrade?.existingMovie || !uniqueKey) {
    return;
  }

  await deleteTelegramMovieMessageSafeV3(
    movieUpgrade.existingMovie
  );

  await deleteMovieDbEntryByUniqueKeyV3(
    uniqueKey
  );

  console.log(
    "♻️ Alter Film-Datensatz für Upgrade entfernt:",
    uniqueKey
  );
}

// =============================
// MOVIE SERIES STATUS FOR CAPTION V3
// Zeigt im Film-Post kurz an, ob eine Filmreihe vollständig ist
// =============================
async function getMovieSeriesStatusForCaptionV3({
  title,
  collection,
  collectionOrder = []
}) {
  const cleanTitle =
    String(title || "")
      .replace(/\s+/g, " ")
      .trim();

  const cleanCollection =
    String(collection || "")
      .replace(/\s+/g, " ")
      .trim();

  if (!cleanTitle && !cleanCollection) {
    return null;
  }

  const rows =
    await getMovieRowsForGapsV3();

  const archiveKeys = new Set();

  for (const row of rows) {
    const rowTitle =
      String(row.title || "")
        .replace(/\s+/g, " ")
        .trim();

    if (rowTitle) {
      archiveKeys.add(
        normalizeMovieGapKeyV3(rowTitle)
      );
    }
  }

  // Wichtig:
  // Der aktuell hochgeladene Film ist zu diesem Zeitpunkt oft noch nicht gespeichert.
  // Deshalb zählen wir ihn für die Anzeige schon mit.
  if (cleanTitle) {
    archiveKeys.add(
      normalizeMovieGapKeyV3(cleanTitle)
    );
  }

  const collectionKey =
    normalizeMovieGapKeyV3(cleanCollection);

  const titleKey =
    normalizeMovieGapKeyV3(cleanTitle);

  let matchedDefinition = null;

  if (Array.isArray(MOVIE_SERIES_DEFINITIONS_V3)) {
    matchedDefinition =
      MOVIE_SERIES_DEFINITIONS_V3.find((item) => {
        const nameKey =
          normalizeMovieGapKeyV3(item.name);

        if (
          collectionKey &&
          (
            collectionKey.includes(nameKey) ||
            nameKey.includes(collectionKey)
          )
        ) {
          return true;
        }

        return (item.movies || []).some((movie) => {
          const aliases =
            movieGapAliasesV3(movie);

          return aliases.some((alias) =>
            normalizeMovieGapKeyV3(alias) === titleKey
          );
        });
      }) || null;
  }

  let movies = [];
  let seriesName = cleanCollection;

  if (matchedDefinition) {
    seriesName =
      matchedDefinition.name;

    movies =
      matchedDefinition.movies || [];
  } else if (Array.isArray(collectionOrder) && collectionOrder.length > 1) {
    movies =
      collectionOrder
        .map((movie) => ({
          title:
            movie.title ||
            movie.name ||
            "",
          aliases: [
            movie.title,
            movie.name
          ].filter(Boolean)
        }))
        .filter((movie) => movie.title);

    seriesName =
      cleanCollection || "Filmreihe";
  }

  if (!seriesName || !movies.length) {
    return null;
  }

  const present = [];
  const missing = [];

  for (const movie of movies) {
    const aliases =
      movieGapAliasesV3(movie);

    const mainTitle =
      typeof movie === "string"
        ? movie
        : movie.title;

    const exists =
      aliases.some((alias) =>
        archiveKeys.has(
          normalizeMovieGapKeyV3(alias)
        )
      );

    if (exists) {
      present.push(mainTitle);
    } else {
      missing.push(mainTitle);
    }
  }

  return {
    name: seriesName,
    total: movies.length,
    present,
    missing,
    presentCount: present.length,
    missingCount: missing.length,
    complete: missing.length === 0
  };
}

// =============================
// LIBRARY INDEX + GAP REFRESH V3
// Aktualisiert A–Z, Lücken-Topics und Command Center ohne neue Topics zu erzeugen
// =============================
async function refreshLibraryIndexesAndGapsV3() {
  console.log(
    "🔄 Library V3 Übersichten werden aktualisiert..."
  );

  // =============================
  // MOVIE COMMAND CENTER
  // =============================
  try {
    if (
      typeof createOrUpdateCommandCenter === "function" &&
      typeof movieCommandCenterCaption === "function"
    ) {
      await createOrUpdateCommandCenter({
        chatId: MOVIE_GROUP_ID,
        topicName: "🎛 Movie Command Center",
        caption: await movieCommandCenterCaption()
      });
    }
  } catch (err) {
    console.error(
      "⚠️ Movie Command Center Refresh Fehler:",
      err.message
    );
  }

  // =============================
  // MOVIE A–Z
  // =============================
  try {
    if (
      typeof createOrUpdateFixedTopicHub === "function" &&
      typeof movieAzIndexCaptionV3 === "function"
    ) {
      await createOrUpdateFixedTopicHub({
        chatId: MOVIE_GROUP_ID,
        topic: FIXED_LIBRARY_TOPICS.start,
        type: FIXED_LIBRARY_TOPICS.start.movieType,
        caption: await movieAzIndexCaptionV3()
      });
    }
  } catch (err) {
    console.error(
      "⚠️ Film A–Z Refresh Fehler:",
      err.message
    );
  }
  
  // =============================
// MOVIE A–Z PAGES
// =============================
try {
  if (typeof refreshMovieAzPagesV3 === "function") {
    await refreshMovieAzPagesV3();
  }
} catch (err) {
  console.error(
    "⚠️ Film A–Z Seiten Refresh Fehler:",
    err.message
  );
}

  // =============================
  // MOVIE GAPS
  // =============================
  try {
    if (
      typeof createOrUpdateFixedTopicHub === "function" &&
      typeof movieGapsCaptionV3 === "function"
    ) {
      await createOrUpdateFixedTopicHub({
        chatId: MOVIE_GROUP_ID,
        topic: FIXED_LIBRARY_TOPICS.movieGaps,
        type: FIXED_LIBRARY_TOPICS.movieGaps.movieType,
        caption: await movieGapsCaptionV3()
      });
    }
  } catch (err) {
    console.error(
      "⚠️ Fehlende Filme & Reihen Refresh Fehler:",
      err.message
    );
  }

  // =============================
  // SERIES COMMAND CENTER
  // =============================
  try {
    if (
      typeof createOrUpdateCommandCenter === "function" &&
      typeof seriesCommandCenterCaptionV3 === "function"
    ) {
      await createOrUpdateCommandCenter({
        chatId: SERIES_GROUP_ID,
        topicName: "🎛 SERIES COMMAND CENTER",
        caption: await seriesCommandCenterCaptionV3()
      });
    }
  } catch (err) {
    console.error(
      "⚠️ Series Command Center Refresh Fehler:",
      err.message
    );
  }

  // =============================
  // SERIES A–Z
  // =============================
  try {
    if (
      typeof createOrUpdateFixedTopicHub === "function" &&
      typeof seriesAzIndexCaptionV3 === "function"
    ) {
      await createOrUpdateFixedTopicHub({
        chatId: SERIES_GROUP_ID,
        topic: FIXED_LIBRARY_TOPICS.start,
        type: FIXED_LIBRARY_TOPICS.start.seriesType,
        caption: await seriesAzIndexCaptionV3()
      });
    }
  } catch (err) {
    console.error(
      "⚠️ Serien A–Z Refresh Fehler:",
      err.message
    );
  }
  
  // =============================
// SERIES A–Z PAGES
// =============================
try {
  if (typeof refreshSeriesAzPagesV3 === "function") {
    await refreshSeriesAzPagesV3();
  }
} catch (err) {
  console.error(
    "⚠️ Serien A–Z Seiten Refresh Fehler:",
    err.message
  );
}

  // =============================
  // SERIES MISSING EPISODES
  // =============================
  try {
    if (
      typeof createOrUpdateFixedTopicHub === "function" &&
      typeof seriesMissingEpisodesCaptionV3 === "function"
    ) {
      await createOrUpdateFixedTopicHub({
        chatId: SERIES_GROUP_ID,
        topic: FIXED_LIBRARY_TOPICS.seriesGaps,
        type: FIXED_LIBRARY_TOPICS.seriesGaps.seriesType,
        caption: await seriesMissingEpisodesCaptionV3()
      });
    }
  } catch (err) {
    console.error(
      "⚠️ Fehlende Episoden Refresh Fehler:",
      err.message
    );
  }

  console.log(
    "✅ Library V3 Übersichten aktualisiert"
  );
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

    const mediaExtras =
    await Promise.resolve(
      getMediaExtras(fileName, msg)
    );

  const existingMovie =
    await movieExists(media.uniqueKey);

  let movieUpgrade = null;

  if (existingMovie) {
    const qualityCheck =
      llCompareMovieQualityUpgradeV3({
        existingMovie,
        newFileName: fileName,
        newExtras: mediaExtras
      });
      
          const displayTitle =
      existingMovie?.title ||
      tmdb?.title ||
      media.title ||
      "Unbekannter Film";

    const displayYear =
      existingMovie?.year ||
      tmdb?.year ||
      media.year ||
      "";

    if (!qualityCheck.isUpgrade) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "⚠️ Film ist bereits gespeichert:\n\n" +
          `🎬 ${displayTitle}${displayYear ? ` (${displayYear})` : ""}\n\n` +
          `📦 Archiv-Version: ${qualityCheck.oldLabel}\n` +
          `📥 Neuer Upload: ${qualityCheck.newLabel}\n\n` +
          "❌ Kein Qualitätsupgrade erkannt."
      });

      return;
    }

    movieUpgrade = {
      existingMovie,
      ...qualityCheck
    };

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "♻️ Qualitätsupgrade erkannt:\n\n" +
        `🎬 ${displayTitle}${displayYear ? ` (${displayYear})` : ""}\n\n` +
        `📦 Archiv-Version: ${qualityCheck.oldLabel}\n` +
        `📥 Neuer Upload: ${qualityCheck.newLabel}\n\n` +
        "✅ Neue Version wird verarbeitet."
    });

    console.log("♻️ MOVIE QUALITY UPGRADE:", {
      title: media.title,
      year: media.year,
      oldQuality: qualityCheck.oldLabel,
      newQuality: qualityCheck.newLabel,
      oldScore: qualityCheck.oldScore,
      newScore: qualityCheck.newScore
    });
  }

  const libraryId =
    await makeLibraryCode(tmdb.genre);

  const audioText =
    typeof llDetectAudioTextFromFileName === "function"
      ? llDetectAudioTextFromFileName(
          fileName,
          mediaExtras.audio ||
            mediaExtras.audioText ||
            mediaExtras.language ||
            mediaExtras.languages ||
            tmdb.audio ||
            tmdb.language ||
            ""
        )
      : (
          mediaExtras.audio ||
          mediaExtras.audioText ||
          "Unbekannt"
        );

  const extras = {
    ...mediaExtras,

    fileName,
    file_name: fileName,

    libraryId,

    audio: audioText,
    audioText
  };

  const universeData =
    detectUniverse(
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
  const detectedCollection =
    tmdb.collection ||
    detectCollection(tmdb.title) ||
    null;
    
      const movieSeriesStatus =
    detectedCollection
      ? await getMovieSeriesStatusForCaptionV3({
          title: tmdb.title,
          collection: detectedCollection,
          collectionOrder: tmdb.collectionMovies || []
        })
      : null;

  const finalTopicName =
    getSmartMovieTopic({
      ...tmdb,
      collection: detectedCollection,
      universe: universeData?.universeName || null
    });

  const topicId =
    await createOrGetTopic({
      chatId: MOVIE_GROUP_ID,
      name: finalTopicName,
      type: "movie_category"
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
  // COLLECTION DB ENTRY — LIBRARY V3
  // =============================
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
const coverPost =
  await tg("sendPhoto", {
    chat_id: MOVIE_GROUP_ID,
    message_thread_id: topicId,
    photo:
      tmdb.posterUrl ||
      "https://via.placeholder.com/500x750.png?text=No+Cover"
  });

  // =============================
  // COPY ORIGINAL MEDIA WITH MOVIE CAPTION
  // =============================
  const captionExtras = {
  ...extras,

  topicName: finalTopicName,

  movieSeriesStatus,

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
    movieCaption(
      tmdb,
      captionExtras
    );

  const copied =
    await copyOriginalMedia({
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
  if (coverPost?.message_id) {
    try {
      await tg("deleteMessage", {
        chat_id: MOVIE_GROUP_ID,
        message_id: Number(coverPost.message_id)
      });
    } catch (err) {
      console.error(
        "⚠️ Neues Cover konnte nach Copy-Fehler nicht gelöscht werden:",
        err.message
      );
    }
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "⚠️ Cover wurde gepostet, aber Film konnte nicht kopiert werden."
  });

  return;
}

// =============================
// FINALIZE QUALITY UPGRADE
// =============================
if (movieUpgrade?.existingMovie) {
  await finalizeMovieQualityUpgradeV3({
    movieUpgrade,
    uniqueKey: media.uniqueKey
  });
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
      detectedCollection,

    quality:
      extras.quality,

    audio:
      extras.audio,

    source:
      extras.source,

    fsk:
      tmdb.fsk,

    director:
      tmdb.director,

    cast:
      tmdb.cast,

    libraryId:
      extras.libraryId,

    resolution:
      extras.resolution,

    fileSize:
      extras.fileSize,

    fileSizeBytes:
      extras.fileSizeBytes,

    videoCodec:
      extras.videoCodec,

    audioCodec:
      extras.audioCodec,

    audioChannels:
      extras.audioChannels,

    hdr:
      extras.hdr,

    universe:
      universeData?.universeName || null,

    universePhase:
      universeData?.phase || null,

    starWarsEra:
      starWarsEra?.key || null
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
  // ADMIN CONFIRMATION
  // =============================
  await tg("sendMessage", {
  chat_id: msg.chat.id,
  text:
    (
      movieUpgrade?.existingMovie
        ? "♻️ Film erfolgreich aktualisiert:\n\n"
        : "✅ Film erfolgreich einsortiert:\n\n"
    ) +
    `🎬 ${tmdb.title}\n` +
    `🎭 Thema: ${finalTopicName}\n` +
    (
      detectedCollection
        ? `🎞 Filmreihe: ${detectedCollection}\n`
        : ""
    ) +
    (
      movieUpgrade?.existingMovie
        ? `📦 Alt: ${movieUpgrade.oldLabel}\n📥 Neu: ${movieUpgrade.newLabel}\n`
        : ""
    ) +
    `🏷 ${extras.libraryId}`
});

  // =============================
  // REFRESH GLOBAL SYSTEMS
  // =============================
  try {
  if (typeof refreshLibraryIndexesAndGapsV3 === "function") {
    await refreshLibraryIndexesAndGapsV3();
  } else if (typeof refreshMainCommandCentersOnly === "function") {
    await refreshMainCommandCentersOnly();
  }
} catch (err) {
  console.error(
    "⚠️ Library V3 Refresh Fehler:",
    err.message
  );
}

  logToDb(
    "movie_saved",
    `${tmdb.title} ${tmdb.year || ""}`
  );
}

// =============================
// SMART SERIES TOPIC ROUTING V3
// =============================
function getSmartSeriesTopic(tmdb = {}, media = {}) {
  const title =
    String(
      tmdb.seriesTitle ||
      tmdb.title ||
      media.seriesTitle ||
      media.title ||
      ""
    )
      .toLowerCase();

  const genre =
    String(
      tmdb.genre ||
      tmdb.mainGenre ||
      media.genre ||
      ""
    )
      .toLowerCase();

  const universe =
    String(
      tmdb.universe ||
      tmdb.universeName ||
      media.universe ||
      ""
    )
      .toLowerCase();

  const text =
    `${title} ${genre} ${universe}`;

  const rawYear =
    tmdb.firstAirDate ||
    tmdb.first_air_date ||
    tmdb.year ||
    media.year ||
    "";

  const yearMatch =
    String(rawYear).match(/\d{4}/);

  const year =
    yearMatch
      ? Number(yearMatch[0])
      : 0;

  if (year > 0 && year < 2000) {
    return FIXED_LIBRARY_TOPICS.classic.name;
  }

  if (
    text.includes("horror") ||
    text.includes("mystery") ||
    text.includes("psycho") ||
    text.includes("slasher") ||
    text.includes("paranormal") ||
    text.includes("okkult") ||
    text.includes("dämon") ||
    text.includes("daemon") ||
    text.includes("geister") ||
    text.includes("spuk") ||
    text.includes("düster") ||
    text.includes("duester")
  ) {
    return FIXED_LIBRARY_TOPICS.horror.name;
  }

  if (
    text.includes("action") ||
    text.includes("thriller") ||
    text.includes("krimi") ||
    text.includes("crime") ||
    text.includes("science fiction") ||
    text.includes("sci-fi") ||
    text.includes("scifi") ||
    text.includes("fantasy") ||
    text.includes("abenteuer") ||
    text.includes("adventure") ||
    text.includes("superheld") ||
    text.includes("superhero") ||
    text.includes("marvel") ||
    text.includes("dc") ||
    text.includes("star wars") ||
    text.includes("star trek") ||
    text.includes("mission impossible") ||
    text.includes("jurassic")
  ) {
    return FIXED_LIBRARY_TOPICS.action.name;
  }

  if (
    text.includes("komödie") ||
    text.includes("komoedie") ||
    text.includes("comedy") ||
    text.includes("sitcom") ||
    text.includes("drama") ||
    text.includes("romantik") ||
    text.includes("romance") ||
    text.includes("liebe") ||
    text.includes("familie") ||
    text.includes("family") ||
    text.includes("animation") ||
    text.includes("anime") ||
    text.includes("kids") ||
    text.includes("kinder") ||
    text.includes("zeichentrick")
  ) {
    return FIXED_LIBRARY_TOPICS.drama.name;
  }

  return FIXED_LIBRARY_TOPICS.drama.name;
}

// =============================
// SERIES INTRO CARD — LIBRARY V3 PREMIUM
// Wird einmalig gepostet, wenn eine Serie neu startet.
// =============================
function buildSeriesIntroCaption(tmdb = {}, media = {}, topicName = "") {
  const makeHashTag = (value = "") => {
    const clean =
      String(value || "")
        .replace(/&/g, "Und")
        .replace(/[^\p{L}\p{N}]+/gu, "")
        .trim();

    return clean ? `#${clean}` : "";
  };

  const title =
    String(
      tmdb.seriesTitle ||
      tmdb.title ||
      media.seriesTitle ||
      "Unbekannte Serie"
    )
      .replace(/\s+/g, " ")
      .trim();

  const titleUpper =
    title.toUpperCase();

  const seasonText =
    String(media.season || 1).padStart(2, "0");

  const episodeText =
    String(media.episode || 1).padStart(2, "0");

  const episodeTitle =
    String(
      tmdb.episodeTitle ||
      media.episodeTitleFromFile ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim();

  const ratingNumber =
    typeof llExtractRatingNumber === "function"
      ? llExtractRatingNumber(
          tmdb.rating ||
          tmdb.vote_average ||
          tmdb.voteAverage ||
          ""
        )
      : extractRatingNumber(
          tmdb.rating ||
          tmdb.vote_average ||
          tmdb.voteAverage ||
          ""
        );

  const rating =
    ratingNumber
      ? `${Number(ratingNumber).toFixed(1)}/10`
      : "folgt";

  const rawStatus =
  String(tmdb.status || "")
    .toLowerCase();

const statusGerman =
  rawStatus.includes("returning")
    ? "Serie läuft"
    : rawStatus.includes("ended")
      ? "abgeschlossen"
      : rawStatus.includes("canceled") || rawStatus.includes("cancelled")
        ? "abgesetzt"
        : "";

const currentSeason =
  Number(media.season || 1);

const statusText =
  `Start mit Staffel ${String(currentSeason).padStart(2, "0")}` +
  (statusGerman ? ` · ${statusGerman}` : "");

  const genreText =
    String(tmdb.genre || "")
      .split(/[\/•,]/)
      .map((g) => g.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(", ");

  const cleanTopicName =
  String(topicName || "Serienarchiv")
    .replace(/&amp;/g, "&")
    .replace(/&/g, "&");

const genreLine =
  genreText
    ? `${cleanTopicName} · ${genreText}`
    : cleanTopicName;

  const overview =
    trimTextAtSentence(
      tmdb.overview ||
      "Serienbeschreibung folgt.",
      360
    );

  const streamText =
  tmdb.streamingProvider ||
  tmdb.provider ||
  tmdb.network ||
  tmdb.networks ||
  "folgt";

  const mainActor =
    String(tmdb.cast || "")
      .split("•")
      .map((p) => p.trim())
      .filter(Boolean)[0] ||
    "folgt";

  const genreTags =
    String(tmdb.genre || "")
      .split(/[\/•,]/)
      .map((g) => g.trim())
      .filter(Boolean)
      .slice(0, 3)
      .map(makeHashTag)
      .filter(Boolean)
      .join(" ");

  const castTag =
    mainActor !== "folgt"
      ? makeHashTag(mainActor)
      : "";

  const seriesTag =
    makeHashTag(title);

  const episodeStart =
    episodeTitle
      ? `S${seasonText}E${episodeText} - "${episodeTitle}"`
      : `S${seasonText}E${episodeText}`;

  const resultText =
  "━━━━━━━━━━━━━━━━━━\n" +
  `📺 ${titleUpper}\n` +
  "━━━━━━━━━━━━━━━━━━\n" +
  "📁 SERIEN-ARCHIV\n" +
  "PREMIUM EPISODE DATABASE\n" +
  "🎞 EINTRAG AKTIV\n" +
  "━━━━━━━━━━━━━━━━━━\n" +
  `⭐ Rating: ${rating}\n` +
  `📀 Archivstatus: ${statusText}\n` +
  `🎬 Start: ${episodeStart}\n` +
  `🧵 Genre: ${genreLine}\n` +
  "━━━━━━━━━━━━━━━━━━\n" +
  "📖 DOSSIER\n" +
  `${overview}\n` +
  "━━━━━━━━━━━━━━━━━━\n" +
  `🍿 Stream: ${streamText}\n` +
  `👤 Hauptrolle: ${mainActor}\n` +
  `${genreTags ? `${genreTags} ` : ""}${seriesTag}${castTag ? ` ${castTag}` : ""}\n` +
  "👉 @LibraryOfLegends";

  return cleanTelegramText(resultText).slice(0, 1800);
}

async function getSavedSeriesEpisodeTotal(seriesTitle = "") {
  const targetKey =
    makeKey(seriesTitle);

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT series_title
      FROM series
      `
    );

    return result.rows.filter((row) =>
      makeKey(row.series_title) === targetKey
    ).length;
  }

  const rows = db.prepare(`
    SELECT series_title
    FROM series
  `).all();

  return rows.filter((row) =>
    makeKey(row.series_title) === targetKey
  ).length;
}

// =============================
// SAVED EPISODES PER SERIES SEASON
// =============================
async function getSavedSeriesSeasonEpisodeTotal(seriesTitle, season) {
  const targetKey =
    typeof makeKey === "function"
      ? makeKey(seriesTitle)
      : String(seriesTitle || "").toLowerCase().trim();

  const seasonNumber =
    Number(season || 1);

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT series_title
      FROM series
      WHERE season = $1
      `,
      [seasonNumber]
    );

    return result.rows.filter((row) => {
      const rowKey =
        typeof makeKey === "function"
          ? makeKey(row.series_title)
          : String(row.series_title || "").toLowerCase().trim();

      return rowKey === targetKey;
    }).length;
  }

  const rows = db.prepare(`
    SELECT series_title
    FROM series
    WHERE season = ?
  `).all(seasonNumber);

  return rows.filter((row) => {
    const rowKey =
      typeof makeKey === "function"
        ? makeKey(row.series_title)
        : String(row.series_title || "").toLowerCase().trim();

    return rowKey === targetKey;
  }).length;
}

// =============================
// SERIES / SEASON INTRO CARD — ONE PER SEASON
// =============================
async function createSeriesIntroIfFirstEpisode({
  tmdb,
  media,
  topicId,
  topicName
}) {
  const seriesTitle =
    tmdb.seriesTitle ||
    tmdb.title ||
    media.seriesTitle ||
    "";

  const season =
    Number(
      media.season ||
      tmdb.seasonNumber ||
      1
    );

  if (!seriesTitle || !season || !topicId) {
    return null;
  }

  const savedSeasonEpisodes =
    await getSavedSeriesSeasonEpisodeTotal(
      seriesTitle,
      season
    );

  if (savedSeasonEpisodes > 0) {
    console.log(
      "ℹ️ Staffel-Intro existiert bereits oder Staffel enthält Episoden:",
      {
        seriesTitle,
        season,
        savedSeasonEpisodes
      }
    );

    return null;
  }

  const caption =
    buildSeriesIntroCaption(
      tmdb,
      {
        ...media,
        season
      },
      topicName
    );

  const poster =
    tmdb.seasonPosterUrl ||
    tmdb.seriesPosterUrl ||
    tmdb.posterUrl ||
    tmdb.backdropUrl ||
    null;

  let sent = null;

  if (poster) {
    sent =
      await tg("sendPhoto", {
        chat_id: SERIES_GROUP_ID,
        message_thread_id: Number(topicId),
        photo: poster,
        caption
      });
  } else {
    sent =
      await tg("sendMessage", {
        chat_id: SERIES_GROUP_ID,
        message_thread_id: Number(topicId),
        text: caption
      });
  }

  console.log(
    "✅ Staffel-Intro erstellt:",
    {
      seriesTitle,
      season,
      messageId: sent?.message_id || null,
      poster: poster || "kein Poster"
    }
  );

  return sent;
}

// =============================
// UPLOAD HANDLER
// =============================
async function handleUpload(msg) {

  const audioFallbackName =
    msg.audio
      ? `${msg.audio.performer || "Unbekannter Künstler"} - ${msg.audio.title || "Unbekannter Titel"}.mp3`
      : "";

  const fileName =
    msg.document?.file_name ||
    msg.video?.file_name ||
    msg.audio?.file_name ||
    audioFallbackName ||
    msg.caption ||
    "Unbekannte Datei";

  const fileId =
    msg.video?.file_id ||
    msg.document?.file_id ||
    msg.audio?.file_id ||
    "";

  const fileUniqueId =
    msg.video?.file_unique_id ||
    msg.document?.file_unique_id ||
    msg.audio?.file_unique_id ||
    "";

  const fileSize =
    msg.video?.file_size ||
    msg.document?.file_size ||
    msg.audio?.file_size ||
    0;

  const mimeType =
    msg.video?.mime_type ||
    msg.document?.mime_type ||
    msg.audio?.mime_type ||
    "";

  console.log("🚀 HANDLE UPLOAD TRIGGERED");
  console.log("📁 Datei:", fileName);
  console.log("🧾 MIME:", mimeType);
  console.log("💾 Größe:", fileSize);

  // =============================
// DUPLICATE SHIELD
// =============================
const uploadKey =
  `${fileName}-${fileUniqueId || fileId}`;

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
  parseMedia(fileName, mimeType);

console.log("🧠 Parsed:", media);

if (!media || !media.type) {
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
  "❌ Datei konnte nicht erkannt werden.\n\n" +
  `📁 ${fileName}\n\n` +
  "Erwartet wird z.B.:\n" +
  "🎬 Film.Name.2024.mp4\n" +
  "📺 Serie.Name.S01E01.mp4\n" +
  "🎵 Künstler - Titel.mp3"
  });

  return;
}

if (media.type === "music") {
  const musicImport = await handleMusicImport({
    msg,
    localFilePath: null
  });

  console.log(
    "🎵 Musik erkannt:",
    musicImport.track.artist,
    "-",
    musicImport.track.title
  );

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: musicImport.caption
  });

  return;
}

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

    const finalSeriesTopicName =
  typeof getSmartSeriesTopic === "function"
    ? getSmartSeriesTopic(tmdb, media)
    : FIXED_LIBRARY_TOPICS.drama.name;

const topicId =
  await createOrGetTopic({
    chatId: SERIES_GROUP_ID,
    name: finalSeriesTopicName,
    type: "series_category"
  });

if (!topicId) {
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "❌ Serien-Thema konnte nicht erstellt werden.\n\n" +
      "Prüfe SERIES_GROUP_ID, Bot-Adminrechte und Forum-Themen."
  });

  return;
}

console.log("🧵 SERIES CATEGORY TOPIC:", {
  topicId,
  seriesTitle: tmdb.seriesTitle,
  topicName: finalSeriesTopicName
});

await createSeriesIntroIfFirstEpisode({
  tmdb,
  media,
  topicId,
  topicName: finalSeriesTopicName
});

const extras = {
  ...getMediaExtras(fileName, msg),
  fileName,
  file_name: fileName
};

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
    text:
      "⚠️ Serien-Datei konnte nicht kopiert werden."
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
    "Episode";

  const finalEpisodeTitle =
    episodesToSave.length > 1
      ? `${doubleEpisodeBaseTitle} Teil ${episodeIndex}`
      : (
          tmdb.episodeTitle ||
          media.episodeTitleFromFile ||
          ""
        );

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

// =============================
// MISSING EPISODES CHECK
// Bleibt aktiv, weil es nur dem Admin meldet,
// aber keine neuen Topics erstellt.
// =============================
try {
  if (typeof getMissingEpisodes === "function") {
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
  }
} catch (err) {
  console.error(
    "⚠️ Missing Episodes Fehler:",
    err.message
  );
}

// =============================
// OLD SERIES HUBS DISABLED — LIBRARY V3
// Serien landen jetzt in festen Kategorie-Topics.
// Keine Einzelserien-Hubs, Staffel-Karten oder Episodenlisten mehr pro Upload.
// =============================
console.log(
  "ℹ️ Serien-Hubs übersprungen — Library V3 nutzt feste Serien-Kategorien"
);

// Library V3:
// Serien-Universe-Hubs sind deaktiviert,
// damit Serien nicht versehentlich in der Movie-Gruppe landen.
console.log("ℹ️ Serien Universe/Multiverse Hub übersprungen");

await tg("sendMessage", {
  chat_id: msg.chat.id,
  text:
    "✅ Serie erfolgreich einsortiert:\n\n" +
    `📺 ${tmdb.seriesTitle} S${media.seasonText}E${media.episodeText}\n` +
    `🧵 Thema: ${finalSeriesTopicName}`
});

try {
  if (typeof refreshLibraryIndexesAndGapsV3 === "function") {
    await refreshLibraryIndexesAndGapsV3();
  } else if (typeof refreshMainCommandCentersOnly === "function") {
    await refreshMainCommandCentersOnly();
  }
} catch (err) {
  console.error(
    "⚠️ Library V3 Refresh Fehler:",
    err.message
  );
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

async function startServer() {
  try {
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

    app.listen(PORT, () => {
      console.log(`✅ Server läuft auf Port ${PORT}`);
    });

    if (String(process.env.USERBOT_ENABLED || "").toLowerCase() === "true") {
      setTimeout(() => {
        startUserbotImporter().catch((error) => {
          console.error("❌ Userbot Importer konnte nicht gestartet werden:", error);
        });
      }, 3000);
    } else {
      console.log("ℹ️ Userbot Importer deaktiviert. USERBOT_ENABLED ist nicht true.");
    }

    await notifyStartup();
  } catch (error) {
    console.error("❌ Server Start Fehler:", error);
    process.exit(1);
  }
}

startServer();

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
