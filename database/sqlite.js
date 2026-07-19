const path = require("path");
const Database = require("better-sqlite3");

const DB_FILE_PATH = path.join(__dirname, "..", "library.db");
const db = new Database(DB_FILE_PATH);

db.pragma("journal_mode = WAL");


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

console.log("â Datenbank bereit");


module.exports = {
  db,
  addColumnIfMissing
};