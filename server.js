const express = require("express");
const axios = require("axios");
const Database = require("better-sqlite3");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

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
    video_codec TEXT,
    audio_codec TEXT,
    audio_channels TEXT,
    hdr TEXT,
    universe TEXT,
    universe_phase TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
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
    series_library_id TEXT,
    universe TEXT,
    universe_phase TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
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
`);

function addColumnIfMissing(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

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
addColumnIfMissing("movies", "video_codec", "TEXT");
addColumnIfMissing("movies", "audio_codec", "TEXT");
addColumnIfMissing("movies", "audio_channels", "TEXT");
addColumnIfMissing("movies", "hdr", "TEXT");
addColumnIfMissing("topics", "hub_message_id", "INTEGER");
addColumnIfMissing("topics", "season_separators", "TEXT DEFAULT '{}'");
addColumnIfMissing("topics", "series_banner_message_id", "INTEGER");
addColumnIfMissing(
  "topics",
  "episode_list_message_id",
  "INTEGER"
);
addColumnIfMissing(
  "topics",
  "hub_message_id",
  "INTEGER"
);
addColumnIfMissing("topics", "movie_hub_message_id", "INTEGER");
addColumnIfMissing("topics", "movie_banner_message_id", "INTEGER");
addColumnIfMissing("series", "series_library_id", "TEXT");
addColumnIfMissing("collections", "hub_message_id", "INTEGER");
addColumnIfMissing("collections", "banner_message_id", "INTEGER");
addColumnIfMissing("movies", "universe", "TEXT");
addColumnIfMissing("movies", "universe_phase", "TEXT");
addColumnIfMissing("movies", "universe_order", "INTEGER");

addColumnIfMissing("series", "universe", "TEXT");
addColumnIfMissing("series", "universe_phase", "TEXT");
addColumnIfMissing("series", "universe_order", "INTEGER");

addColumnIfMissing("topics", "universe_hub_message_id", "INTEGER");
addColumnIfMissing("topics", "universe_banner_message_id", "INTEGER");

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

        video_codec,
        audio_codec,
        audio_channels,

        hdr,

        universe,
        universe_phase
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7,
        $8, $9, $10,
        $11, $12,
        $13, $14, $15, $16,
        $17, $18, $19,
        $20,
        $21, $22,
        $23, $24, $25,
        $26,
        $27, $28
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

        data.videoCodec,
        data.audioCodec,
        data.audioChannels,

        data.hdr,

        data.universe,
        data.universePhase
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
      resolution, file_size, video_codec, audio_codec, audio_channels, hdr,
      universe, universe_phase
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    data.videoCodec,
    data.audioCodec,
    data.audioChannels,
    data.hdr,

    data.universe,
    data.universePhase
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
        universe_phase
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11,
        $12, $13,
        $14,
        $15, $16
      )
      ON CONFLICT (unique_key)
      DO NOTHING
      `,
      [
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
        data.topicId,

        data.seriesLibraryId,

        data.universe,
        data.universePhase
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
      universe_phase
    )
    VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?
    )
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
    data.topicId,

    data.seriesLibraryId,

    data.universe,
    data.universePhase
  );
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
      DO NOTHING
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

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT COUNT(*) AS count
      FROM series
      WHERE series_title = $1
      AND season = $2
      `,
      [
        seriesTitle,
        season
      ]
    );

    return Number(result.rows[0]?.count || 0);
  }

  const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM series
    WHERE series_title = ?
    AND season = ?
  `).get(
    seriesTitle,
    season
  );

  return Number(row?.count || 0);
}

async function getSavedEpisode(seriesTitle, season, episode) {

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT id
      FROM series
      WHERE series_title = $1
      AND season = $2
      AND episode = $3
      LIMIT 1
      `,
      [
        seriesTitle,
        season,
        episode
      ]
    );

    return result.rows[0] || null;
  }

  return db.prepare(`
    SELECT id
    FROM series
    WHERE series_title = ?
    AND season = ?
    AND episode = ?
    LIMIT 1
  `).get(
    seriesTitle,
    season,
    episode
  );
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
      "punisher"
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
      ]
    },

    series: [
      "WandaVision",
      "The Falcon and the Winter Soldier",
      "Loki",
      "Hawkeye",
      "Moon Knight",
      "Ms. Marvel",
      "She-Hulk",
      "Daredevil",
      "The Punisher"
    ]
  },

  DC: {
    topicName: "🦇 DC Universe",
    icon: "🦇",
    archive: "DC MULTIVERSE ARCHIVE",
    subline: "GOTHAM • METROPOLIS • JUSTICE FILES",
    status: "⚡ HERO DATABASE ACTIVE",

    aliases: [
      "dc",
      "batman",
      "superman",
      "wonder woman",
      "aquaman",
      "justice league",
      "joker",
      "harley quinn",
      "the flash",
      "shazam",
      "black adam",
      "suicide squad"
    ],

    phases: {},

    series: [
      "Peacemaker",
      "Gotham",
      "The Flash",
      "Arrow",
      "Titans"
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
      "die eiskönigin",
      "frozen",
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
      "alles steht kopf"
    ],

    phases: {
      "DISNEY CLASSICS": [
        "Schneewittchen",
        "Cinderella",
        "Dornröschen",
        "Arielle",
        "Die Schöne und das Biest",
        "Aladdin",
        "Der König der Löwen",
        "Mulan",
        "Vaiana",
        "Encanto"
      ],

      "PIXAR": [
        "Toy Story",
        "Das große Krabbeln",
        "Monster AG",
        "Findet Nemo",
        "Cars",
        "Ratatouille",
        "WALL·E",
        "Oben",
        "Alles steht Kopf",
        "Coco"
      ]
    },

    series: []
  }
};

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

// =============================
// UNIVERSE DETECTION
// =============================
function detectUniverse(title = "", collection = "") {
  const rawSearch =
    `${title} ${collection}`.trim();

  const search =
    rawSearch.toLowerCase();

  const searchKey =
    makeKey(rawSearch);

  for (const [key, config] of Object.entries(universeConfigs)) {
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
    
    console.log("🌌 UNIVERSE SERIES:", series);

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

  function universeTitleMatch(savedTitle = "", officialTitle = "") {
    const savedKey = makeKey(savedTitle);
    const officialKey = makeKey(officialTitle);

    if (!savedKey || !officialKey) return false;

    return (
      savedKey === officialKey ||
      savedKey.includes(officialKey) ||
      officialKey.includes(savedKey)
    );
  }

  const movieCount = movies.length;
  const seriesCount = series.length;

  const officialMovieTotal =
    Object.values(config.phases || {})
      .reduce((sum, entries) => sum + entries.length, 0);

  const officialSeriesTotal =
    config.series?.length || 0;

  const officialTotal =
    officialMovieTotal + officialSeriesTotal;

  const savedTotal =
    movieCount + seriesCount;

  const universePercent =
    officialTotal > 0
      ? Math.round((savedTotal / officialTotal) * 100)
      : 0;

  const universeProgress =
    buildUniverseProgressBar(savedTotal, officialTotal);

  const years = movies
    .map((m) => Number(m.year))
    .filter((y) => Number.isFinite(y));

  const period =
    years.length
      ? `${Math.min(...years)} → ${Math.max(...years)}`
      : "Unbekannt";

  let result =
    "━━━━━━━━━━━━━━━━━━\n" +
    `${config.icon} ${universeName.toUpperCase()}\n` +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    `📁 ${config.archive}\n` +
    `${config.subline}\n` +
    `${config.status}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +
    `🎬 FILME • ${movieCount}/${officialMovieTotal || movieCount}\n` +
    `📺 SERIEN • ${seriesCount}/${officialSeriesTotal || seriesCount}\n` +
    `🧩 UNIVERSE STATUS • ${savedTotal}/${officialTotal || savedTotal}\n` +
    `📊 FORTSCHRITT • ${universeProgress} ${universePercent}%\n` +
    `📅 ZEITRAUM • ${period}\n` +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (Object.keys(config.phases || {}).length) {
    result +=
      "🧭 TIMELINE\n" +
      "━━━━━━━━━━━━━━━━━━\n\n";

    for (const [phase, entries] of Object.entries(config.phases)) {
      const savedInPhase =
        entries.filter((title) =>
          movies.some((m) =>
            universeTitleMatch(m.title, title)
          )
        ).length;

      const completed =
        savedInPhase >= entries.length;

      result +=
        `${phase} • ${savedInPhase}/${entries.length} ` +
        (completed ? "✅" : "⚠️") +
        "\n";

      entries.forEach((title, index) => {
        const exists =
          movies.some((m) =>
            universeTitleMatch(m.title, title)
          );

        const prefix =
          index === entries.length - 1 ? "┗" : "┠";

        result +=
          `${prefix} ` +
          (exists ? "✅ " : "⬜ ") +
          `${title}\n`;
      });

      result += "\n";
    }
  }

  if (config.series?.length) {
    result +=
      "━━━━━━━━━━━━━━━━━━\n" +
      "📺 SERIEN\n" +
      "━━━━━━━━━━━━━━━━━━\n\n";

    config.series.forEach((seriesTitle, index) => {
      const exists =
        series.some((s) =>
          universeTitleMatch(s.series_title, seriesTitle)
        );

      const prefix =
        index === config.series.length - 1 ? "┗" : "┠";

      result +=
        `${prefix} ` +
        (exists ? "✅ " : "⬜ ") +
        `${seriesTitle}\n`;
    });

    result += "\n";
  }

  result +=
    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return result.slice(0, 4000);
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
// UNIVERSE HUB SYSTEM
// =============================
async function createOrUpdateUniverseHub(universeName = "") {
  if (!universeName) return null;

  const config =
    Object.values(universeConfigs)
      .find((u) => u.topicName === universeName);

  if (!config) return null;

  let universe =
    await getUniverseByName(universeName);

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

    universe =
      await getUniverseByName(universeName);
  }

  const topicId =
    await createOrGetTopic({
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

  const text =
    await universeHubCaption(universeName);

  if (universe?.hub_message_id) {
    const edited = await tg("editMessageText", {
      chat_id: MOVIE_GROUP_ID,
      message_id: universe.hub_message_id,
      text
    });

    if (!edited?.__error) {
      return edited;
    }

    console.error(
      "⚠️ Universe Hub Edit fehlgeschlagen, erstelle neu:",
      edited?.error?.description || edited
    );
  }

  const hub =
    await tg("sendMessage", {
      chat_id: MOVIE_GROUP_ID,
      message_thread_id: topicId,
      text
    });

  if (hub?.message_id) {
    await saveUniverseHubMessageId(
      universeName,
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
        "⚠️ Universe Hub Pin Fehler:",
        err.message
      );
    }
  }

  return hub;
}

async function createOrUpdateCollectionHub(tmdb, topicId) {
  if (!tmdb.collection || !tmdb.collectionId) return null;

  const collection = getCollectionById(tmdb.collectionId);
  if (!collection) return null;

  const hubText = await collectionHubCaption(tmdb.collection);

  if (collection.hub_message_id) {
    return await tg("editMessageText", {
      chat_id: MOVIE_GROUP_ID,
      message_id: collection.hub_message_id,
      text: hubText
    });
  }

  const hub = await tg("sendMessage", {
    chat_id: MOVIE_GROUP_ID,
    message_thread_id: topicId,
    text: hubText
  });

  if (hub?.message_id) {
    saveCollectionHubMessageId(tmdb.collectionId, hub.message_id);

    await tg("pinChatMessage", {
      chat_id: MOVIE_GROUP_ID,
      message_id: hub.message_id,
      disable_notification: true
    });
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
      seasonText,
      episodeText,
      episodeEndText: episodeText,
      isDoubleEpisode: true,
      isSplitEpisode: true,
      episodeTitleFromFile: specialDoubleMatch[4].trim(),
      uniqueKey: makeKey(`${title}-s${seasonText}-e${episodeText}-ab`)
    };
  }

  const pipeMatch = raw.match(/^(.+?)\s*\|\s*S?(\d{1,2})E?(\d{1,2})$/i);
  const normalMatch = raw.match(/^(.+?)\s+S(\d{1,2})E(\d{1,2})$/i);

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

  const seasonText = String(season).padStart(2, "0");
  const episodeText = String(episode).padStart(2, "0");

  title = normalizeSeriesTitle(title);

  return {
    type: "series",
    isSeries: true,
    seriesTitle: title,
    season,
    episode,
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
    fileSize: formatFileSize(msg.video?.file_size || msg.document?.file_size),
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

    createdBy,
    cast,
    fsk
  };
}

async function getSeasonTMDB(tvId, season) {
  if (!tvId || !season) return null;

  return await tmdbGet(
    `/tv/${tvId}/season/${season}`
  );
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
      `🎬 ${String(tmdb.title || "").toUpperCase()}`,

    line2:
      "CINEMA ENTRY • VERIFIED"
  };
}

// =============================
// MOVIE CAPTION
// =============================
function movieCaption(tmdb, extras = {}) {
  const nexus =
    getMovieNexusMeta(tmdb, extras);

  const genreText = String(tmdb.genre || "Sonstige")
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean)
    .join(" • ");

  const genreTags = String(tmdb.genre || "")
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((g) => `#${g.replace(/\s+/g, "")}`)
    .join(" ");

  const castLines = String(tmdb.cast || "Unbekannt")
    .split("•")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((p) => `▸ ${p}`)
    .join("\n");

  const overviewRaw = String(
    tmdb.overview || "Keine Beschreibung verfügbar."
  )
    .replace(/\s+/g, " ")
    .trim();

  let safeOverview = overviewRaw;

  if (safeOverview.length > 340) {
    safeOverview = safeOverview.slice(0, 340);

    const lastSentenceEnd = Math.max(
      safeOverview.lastIndexOf("."),
      safeOverview.lastIndexOf("!"),
      safeOverview.lastIndexOf("?")
    );

    if (lastSentenceEnd > 180) {
      safeOverview = safeOverview.slice(0, lastSentenceEnd + 1);
    } else {
      safeOverview = safeOverview.slice(0, safeOverview.lastIndexOf(" "));
      safeOverview += " …";
    }
  }

  return (
    `${nexus.header}\n\n` +

    `${nexus.line1}\n` +
    `${nexus.line2}\n\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    `⭐ ${tmdb.rating || "Unbekannt"} IMDb\n` +
    `🎭 ${genreText}\n` +
    `📀 ${extras.quality || "Unbekannt"} • ${extras.fileSize || "Unbekannt"} • ${tmdb.runtime || "Unbekannt"}\n` +
    `🔞 ${tmdb.fsk || "FSK Unbekannt"}\n` +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    "🎥 DIRECTOR\n" +
    `${tmdb.director || "Unbekannt"}\n\n` +

    "👥 CAST MATRIX\n" +
    `${castLines || "Unbekannt"}\n\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    "📖 SYNOPSIS\n\n" +
    `${safeOverview}\n\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    "🧬 ARCHIVE CODE\n" +
    `${extras.libraryId || "Unbekannt"}\n\n` +

    `${genreTags}\n` +
    "@LibraryOfLegends"
  ).slice(0, 4000);
}

function buildMovieArchiveProgressBar(movieCount = 0) {
  const size = 10;
  const percent = movieCount >= 100 ? 1 : movieCount / 100;
  const filled = Math.round(percent * size);

  return "■".repeat(filled) + "□".repeat(size - filled);
}

// =============================
// MOVIE HUB CAPTION
// =============================
async function movieHubCaption(topicName = "", topicId = null) {

  const cleanTopic = String(topicName || "Filme")
    .replace(/^[^\w\d]+/g, "")
    .trim();

  const shortName =
    cleanTopic
      .replace(/filmreihe/gi, "")
      .replace(/archive/gi, "")
      .trim();
      
      const isCollectionHub =
  cleanTopic.match(/filmreihe/i);

  // =============================
// LOAD MOVIES
// =============================
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

    const size =
      String(movie.file_size || "")
        .toUpperCase();

    const gb =
      size.match(/([\d.]+)\s*GB/);

    const mb =
      size.match(/([\d.]+)\s*MB/);

    if (gb) {
      totalSizeMB +=
        parseFloat(gb[1]) * 1024;
    }

    else if (mb) {
      totalSizeMB +=
        parseFloat(mb[1]);
    }

  }

  const totalStorage =
    totalSizeMB >= 1024
      ? `${(totalSizeMB / 1024).toFixed(1)} GB`
      : `${Math.round(totalSizeMB)} MB`;

  const ratings = movies
    .map((m) => {

      const match =
        String(m.rating || "")
          .match(/(\d+(\.\d+)?)/g);

      return match
        ? Number(match.pop())
        : null;

    })
    .filter((r) => Number.isFinite(r));

  const averageRating =
    ratings.length
      ? (
          ratings.reduce((a, b) => a + b, 0) /
          ratings.length
        ).toFixed(1)
      : "Unbekannt";

  const topMovie =
    [...movies]
      .sort((a, b) => {
        return (
          parseFloat(b.rating || 0) -
          parseFloat(a.rating || 0)
        );
      })[0];

  const qualityList =
    [...new Set(
      movies
        .map((m) => m.quality)
        .filter(Boolean)
    )];

  const qualityLine =
    qualityList.length
      ? qualityList.join(" • ")
      : "Unbekannt";

const hubTitle =
  isCollectionHub
    ? `🎞 ${shortName.toUpperCase()} COLLECTION`
    : `🎭 ${cleanTopic.toUpperCase()} GENRE HUB`;

const hubTypeLabel =
  isCollectionHub
    ? "🎬 CINEMATIC COLLECTION HUB"
    : "🎭 GENRE ARCHIVE HUB";

const statusLabel =
  isCollectionHub
    ? "📊 COLLECTION STATUS"
    : "📊 GENRE STATUS";

const statusText =
  isCollectionHub
    ? (
        movieCount >= 3
          ? "🏆 Status: COMPLETE COLLECTION\n"
          : "⚠️ Status: COLLECTION IM AUFBAU\n"
      )
    : `🎭 Genre Filme: ${movieCount}\n`;

let result =
  "━━━━━━━━━━━━━━━━━━\n" +
  `${hubTitle}\n` +
  "━━━━━━━━━━━━━━━━━━\n\n" +

  "🍿 PREMIUM MOVIE ARCHIVE\n" +
  `${hubTypeLabel}\n\n` +

  "━━━━━━━━━━━━━━━━━━\n" +
  `${statusLabel}\n` +
  "━━━━━━━━━━━━━━━━━━\n" +

  `🎬 Filme: ${movieCount}\n` +
  `📅 Zeitraum: ${yearRange}\n` +
  `💾 Speicher: ${totalStorage}\n` +
  `⭐ Ø Rating: ${averageRating}\n` +
  `📀 Qualität: ${qualityLine}\n` +
  statusText +

  (
    topMovie
      ? `👑 Top Film: ${topMovie.title}\n`
      : ""
  ) +

  "\n━━━━━━━━━━━━━━━━━━\n" +
  "📀 FILME\n" +
  "━━━━━━━━━━━━━━━━━━\n\n";

  if (!movies.length) {

    result +=
      "Noch keine Filme gespeichert.\n\n";

  } else {

    movies.forEach((m, index) => {

      result +=
        `${String(index + 1).padStart(2, "0")} • ${m.title}\n`;

      result += "     ";

      if (m.year) {
        result += `${m.year} • `;
      }

      result += `${m.rating || "?"} • `;

      if (m.runtime) {
        result += `⏱ ${m.runtime} • `;
      }

      result += `${m.quality || "?"}\n\n`;

    });

  }

  result +=
    "━━━━━━━━━━━━━━━━━━\n" +
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
    text: await movieHubCaption(topicName, topicId)
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
// CREATE OR UPDATE MOVIE INDEX
// =============================
async function createOrUpdateMovieIndex() {
  const topicId = await createOrGetTopic({
    chatId: MOVIE_GROUP_ID,
    name: "🔤 MOVIE INDEX A–Z",
    type: "movie_index"
  });

  if (!topicId) return null;

  const pages = await buildMovieIndexPages();

  for (let i = 0; i < pages.length; i++) {
    const pageText = pages[i];

    await tg("sendMessage", {
      chat_id: MOVIE_GROUP_ID,
      message_thread_id: topicId,
      text: pageText
    });

    await sleep(1000);
  }

  return true;
}

// =============================
// UPDATE MOVIE HUB
// =============================
async function updateMovieHub({
  topicId,
  topicName
}) {
  const topic =
    await getMovieHubTopic(topicId);

  if (!topic?.movie_hub_message_id) {
    return null;
  }

  return await tg("editMessageText", {
    chat_id: MOVIE_GROUP_ID,
    message_id: topic.movie_hub_message_id,
    text: await movieHubCaption(topicName, topicId)
  });
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
// SERIES CAPTION
// =============================
async function seriesCaption(tmdb, media, extras = {}) {
  const nexus =
    getSeriesNexusMeta(tmdb, media, extras);

  const finalEpisodeTitle =
    tmdb.episodeTitle ||
    media.episodeTitleFromFile ||
    "Episode";

  const genreText = String(tmdb.genre || "Sonstige")
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean)
    .join(" • ");

  const genreTags = String(tmdb.genre || "")
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((g) => `#${g.replace(/\s+/g, "")}`)
    .join(" ");

  const overviewRaw = String(
    tmdb.overview || "Keine Beschreibung verfügbar."
  )
    .replace(/\s+/g, " ")
    .trim();

  let safeOverview = overviewRaw;

  if (safeOverview.length > 340) {
    safeOverview = safeOverview.slice(0, 340);

    const lastSentenceEnd = Math.max(
      safeOverview.lastIndexOf("."),
      safeOverview.lastIndexOf("!"),
      safeOverview.lastIndexOf("?")
    );

    if (lastSentenceEnd > 180) {
      safeOverview =
        safeOverview.slice(0, lastSentenceEnd + 1);
    } else {
      safeOverview =
        safeOverview.slice(0, safeOverview.lastIndexOf(" "));

      safeOverview += " …";
    }
  }

  const totalEpisodes =
  tmdb.seasonEpisodeCount ||
  getKnownSeasonEpisodeCount(
    tmdb.seriesTitle,
    media.season
  ) ||
  media.episode;

  const progressBlocks =
    buildSeriesProgressBar(
      tmdb.seriesTitle,
      media.episode,
      totalEpisodes
    );

  const progressPercent =
    totalEpisodes > 0
      ? Math.round((media.episode / totalEpisodes) * 100)
      : 0;

  const missingEpisodes = [];

  for (let ep = 1; ep <= totalEpisodes; ep++) {
    const exists = db.prepare(`
      SELECT id
      FROM series
      WHERE series_title = ?
      AND season = ?
      AND episode = ?
      LIMIT 1
    `).get(
      tmdb.seriesTitle,
      media.season,
      ep
    );

    if (!exists && ep < media.episode) {
      missingEpisodes.push(
        `E${String(ep).padStart(2, "0")}`
      );
    }
  }

  const castLines = String(tmdb.cast || "Unbekannt")
    .split("•")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((p) => `▸ ${p}`)
    .join("\n");

  return (
    `${nexus.header}\n\n` +

    `${nexus.line1}\n` +
    `${nexus.line2}\n` +
    `${finalEpisodeTitle}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +

    `⭐ ${tmdb.rating || "Unbekannt"} IMDb\n` +
    `🎭 ${genreText}\n` +
    `📀 ${extras.quality || "Unbekannt"} • ${extras.fileSize || "Unbekannt"} • ${tmdb.episodeRuntime || "Unbekannt"}\n` +
    `🔞 ${tmdb.fsk || "FSK Unbekannt"}\n` +

    "━━━━━━━━━━━━━━━━━━\n\n" +

    "📀 EPISODE STATUS\n" +
    `🧩 Progress • ${progressBlocks} ${media.episode}/${totalEpisodes}\n` +
    `📊 Season Archive • ${progressPercent}%\n` +
    (
      missingEpisodes.length
        ? `⚠️ Missing • ${missingEpisodes.join(", ")}\n`
        : "✅ No missing previous episodes\n"
    ) +

    "━━━━━━━━━━━━━━━━━━\n\n" +

    "👥 CAST MATRIX\n" +
    `${castLines || "Unbekannt"}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +

    "📖 EPISODE SYNOPSIS\n\n" +
    `${safeOverview}\n\n` +

    "━━━━━━━━━━━━━━━━━━\n" +

    "🧬 SERIES CODE\n" +
    `${extras.seriesLibraryId || "Unbekannt"}\n\n` +

    `#${String(tmdb.seriesTitle || "").replace(/\s+/g, "")} ${genreTags}\n` +
    "@LibraryOfLegends"
  ).slice(0, 4000);
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

async function seasonCaption(tmdb, seasonData, season) {
  const seasonKey = String(season).padStart(2, "0");
  const theme = getSeasonTheme(season);

  const seriesTheme =
    seriesThemes[tmdb.seriesTitle] || {
      icon: "📺",
      archive: "SERIES ARCHIVE",
      subline: "PREMIUM SERIES FILE",
      status: "🎞 SERIES ACTIVE",
      divider: "━━━━━━━━━━━━━━━━━━"
    };

  const divider = seriesTheme.divider;

  const year = seasonData?.air_date?.slice(0, 4) || "Unbekannt";
  const episodeCount = seasonData?.episodes?.length || "?";

  const overview = String(
    seasonData?.overview ||
    tmdb.overview ||
    "Keine Beschreibung verfügbar."
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 360);

  const showrunner = String(tmdb.createdBy || "Unbekannt").slice(0, 80);
  const castLine = formatCastLine(tmdb.cast);
  const genreLine = formatSeasonGenres(tmdb.genre);

  const savedEpisodes =
  await getSavedSeasonEpisodeCount(
    tmdb.seriesTitle,
    season
  );

const totalEpisodes =
  seasonData?.episodes?.length ||
  savedEpisodes;

const missingEpisodes = [];

for (let ep = 1; ep <= totalEpisodes; ep++) {

  const exists =
    await getSavedEpisode(
      tmdb.seriesTitle,
      season,
      ep
    );

  if (!exists) {
    missingEpisodes.push(
      `E${String(ep).padStart(2, "0")}`
    );
  }
}

  const progressBlocks =
  buildSeriesProgressBar(
    tmdb.seriesTitle,
    savedEpisodes,
    totalEpisodes
  );

const progressPercent =
  totalEpisodes > 0
    ? Math.round((savedEpisodes / totalEpisodes) * 100)
    : 0;

const seasonStatus =
  savedEpisodes >= totalEpisodes
    ? "🏆 SEASON COMPLETE"
    : "⚠️ SEASON INCOMPLETE";

return (
  "███ SEASON NEXUS ███\n\n" +

  `📺 ${String(tmdb.seriesTitle || "").toUpperCase()}\n` +
  `SEASON FILE • S${seasonKey}\n\n` +

  "━━━━━━━━━━━━━━━━━━\n" +
  `⭐ ${tmdb.rating || "Unbekannt"} IMDb\n` +
  `🎞 Episodes • ${savedEpisodes}/${totalEpisodes}\n` +
  `📅 ${year} • 🔞 ${tmdb.fsk || "FSK Unbekannt"}\n` +
  "━━━━━━━━━━━━━━━━━━\n\n" +

  "📀 SEASON STATUS\n" +
  `🧩 Progress • ${progressBlocks} ${savedEpisodes}/${totalEpisodes}\n` +
  `📊 Archive • ${progressPercent}%\n` +
  (
    missingEpisodes.length
      ? `⚠️ Missing • ${missingEpisodes.join(", ")}\n`
      : "✅ Season Archive Complete\n"
  ) +
  `${seasonStatus}\n\n` +

  "━━━━━━━━━━━━━━━━━━\n" +

  "🎬 SHOWRUNNER\n" +
  `${showrunner}\n\n` +

  "👥 CAST MATRIX\n" +
  `${castLine}\n\n` +

  "━━━━━━━━━━━━━━━━━━\n" +

  "📖 SEASON SYNOPSIS\n\n" +
  `${overview}\n\n` +

  "━━━━━━━━━━━━━━━━━━\n" +

  `${genreLine}\n` +
  "@LibraryOfLegends"
).slice(0, 4000);
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

function seriesHubCaption(tmdb) {
  const theme =
    seriesThemes[tmdb.seriesTitle] || {
      icon: "📺",
      archive: "SERIES ARCHIVE",
      subline: "PREMIUM EPISODE DATABASE",
      status: "🎞 SERIES HUB ACTIVE",
      divider: "━━━━━━━━━━━━━━━━━━"
    };

  const divider = theme.divider;
  const genreLine = formatSeasonGenres(tmdb.genre);
  const episodeIndex = buildEpisodeIndex(tmdb.seriesTitle);

  const totalEpisodes = db.prepare(`
    SELECT COUNT(*) AS count
    FROM series
    WHERE series_title = ?
  `).get(tmdb.seriesTitle)?.count || 0;
  
  const knownSeriesTotals = {
  "The Boys": 39,

  "The Mandalorian": 24,
  "Andor": 24,
  "Ahsoka": 8,
  "Loki": 12,
  "WandaVision": 9,
  "Moon Knight": 6,
  "The Falcon and the Winter Soldier": 6,
  "Obi-Wan Kenobi": 6,
  "The Book of Boba Fett": 7
};

const officialTotalEpisodes =
  knownSeriesTotals[tmdb.seriesTitle] ||
  totalEpisodes;
  
  const globalPercent =
  officialTotalEpisodes > 0
    ? Math.round(
        (totalEpisodes / officialTotalEpisodes) * 100
      )
    : 0;

const progressBarSize = 10;

const filledBlocks = Math.round(
  (globalPercent / 100) * progressBarSize
);

const globalProgressBlocks =
  "■".repeat(filledBlocks) +
  "□".repeat(progressBarSize - filledBlocks);
  
  const archiveStatus =
  totalEpisodes >= officialTotalEpisodes
    ? "🏆 STATUS: SERIE KOMPLETT"
    : "⚠️ STATUS: SERIE UNVOLLSTÄNDIG";

const seriesRank = getSeriesRank(
  totalEpisodes,
  officialTotalEpisodes
);

const seriesTags = getSeriesStatusTags(
  totalEpisodes,
  officialTotalEpisodes
);

const progressBar = buildSeriesProgressBar(
  tmdb.seriesTitle,
  totalEpisodes,
  officialTotalEpisodes
);

  const seasonCount = db.prepare(`
    SELECT COUNT(DISTINCT season) AS count
    FROM series
    WHERE series_title = ?
  `).get(tmdb.seriesTitle)?.count || 0;

  const existingSeasons = db.prepare(`
  SELECT DISTINCT season
  FROM series
  WHERE series_title = ?
  ORDER BY season ASC
`).all(tmdb.seriesTitle);

const officialSeasonCount =
  getKnownSeasonCount(
    tmdb.seriesTitle
  ) || seasonCount;

let timeline = "";

for (
  let season = 1;
  season <= officialSeasonCount;
  season++
) {

  const currentEpisodes = db.prepare(`
    SELECT COUNT(*) AS count
    FROM series
    WHERE series_title = ?
    AND season = ?
  `).get(
    tmdb.seriesTitle,
    season
  )?.count || 0;

  const officialEpisodes =
    getKnownSeasonEpisodeCount(
      tmdb.seriesTitle,
      season
    ) || currentEpisodes;

  const seasonProgress =
    buildSeriesProgressBar(
      tmdb.seriesTitle,
      currentEpisodes,
      officialEpisodes
    );

  const completed =
    currentEpisodes >= officialEpisodes;

  timeline +=
    `📀 STAFFEL ${String(season).padStart(2, "0")} • ` +
    `${seasonProgress} ` +
    `${currentEpisodes}/${officialEpisodes} ` +
    `${completed ? "✅" : "⚠️"}\n`;
}

  return (
    `${divider}\n` +
    `${theme.icon} ${String(tmdb.seriesTitle || "").toUpperCase()}\n` +
    `${divider}\n\n` +

    `📁 ${theme.archive}\n` +
    `${theme.subline}\n` +
    `${theme.status}\n\n` +

    `${divider}\n` +
    `⭐ RATING • ${tmdb.seriesRating || tmdb.rating || "Unbekannt"} IMDb\n` +
    `📀 STAFFELN • ${seasonCount}/${officialSeasonCount}\n` +
    `🎞 EPISODEN • ${totalEpisodes}\n` +
    `🧩 ARCHIV STATUS • ${totalEpisodes}/${officialTotalEpisodes} EPISODEN\n` +
    `📊 GESAMT: ${progressBar} ${globalPercent}% • ${totalEpisodes}/${officialTotalEpisodes}\n` +
    `${archiveStatus}\n` +
    `🏅 SERIEN-RANG • ${seriesRank}\n` +
    `🏷 STATUS TAGS • ${seriesTags}\n` +
    `${divider}\n\n` +

    "🛰 TIMELINE\n" +
    `${timeline}\n\n` +

    `${divider}\n` +
    "🧭 STAFFELÜBERSICHT\n" +
    `${divider}\n\n` +

    buildCompactSeasonIndex(tmdb.seriesTitle) + "\n\n" +

    `${divider}\n` +
    "🎭 GENRE\n" +
    `${genreLine}\n` +

    `${divider}\n` +
    "@LibraryOfLegends"
  ).slice(0, 4000);
}

function buildEpisodeIndex(seriesTitle) {
  const episodes = db.prepare(`
    SELECT season, episode, episode_title
    FROM series
    WHERE series_title = ?
    ORDER BY season ASC, episode ASC
  `).all(seriesTitle);

  if (!episodes.length) {
    return "📀 STAFFEL 01 • 0 EPISODEN\n└ Episoden werden automatisch ergänzt";
  }

  const seasons = {};

  for (const ep of episodes) {
    const seasonNumber = Number(ep.season || 0);
    if (!seasons[seasonNumber]) seasons[seasonNumber] = [];
    seasons[seasonNumber].push(ep);
  }

  let result = "";

  for (const seasonNumber of Object.keys(seasons).map(Number).sort((a, b) => a - b)) {
    const seasonEpisodes = seasons[seasonNumber];
    const seasonText = String(seasonNumber).padStart(2, "0");

    if (result) result += "\n";

    result += "━━━━━━━━━━━━━━━━━━\n";
    result += `📀 STAFFEL ${seasonText} • ${seasonEpisodes.length} EPISODEN\n`;
    const tmdbSeasonTotal = getKnownSeasonEpisodeCount(seriesTitle, seasonNumber);
const totalForSeason = tmdbSeasonTotal || seasonEpisodes.length;

const progressBlocks =
  "■".repeat(seasonEpisodes.length) +
  "□".repeat(Math.max(totalForSeason - seasonEpisodes.length, 0));

result += `🧩 Fortschritt: ${progressBlocks} ${seasonEpisodes.length}/${totalForSeason}\n`;
const existingEpisodes = seasonEpisodes.map((ep) => Number(ep.episode));

const missingEpisodes = [];

for (let ep = 1; ep <= totalForSeason; ep++) {
  if (!existingEpisodes.includes(ep)) {
    missingEpisodes.push(ep);
  }
}

if (missingEpisodes.length) {
  result += `⚠️ Fehlend: ${missingEpisodes
    .map((ep) => `E${String(ep).padStart(2, "0")}`)
    .join(", ")}\n`;
  result += "⚠️ STATUS: STAFFEL UNVOLLSTÄNDIG\n";
} else {
  result += "🏆 STATUS: STAFFEL KOMPLETT\n";
}
    result += "━━━━━━━━━━━━━━━━━━\n\n";

    seasonEpisodes.forEach((ep, index) => {
      const epCode =
        `S${String(ep.season).padStart(2, "0")}E${String(ep.episode).padStart(2, "0")}`;

      const prefix = index === seasonEpisodes.length - 1 ? "┗" : "┠";

      result += `${prefix} ${epCode}${ep.episode_title ? ` • ${ep.episode_title}` : ""}\n`;
    });
  }

  return result.trim();
}

function fullEpisodeListCaption(seriesTitle) {
  const episodes = db.prepare(`
    SELECT season, episode, episode_title
    FROM series
    WHERE series_title = ?
    ORDER BY season ASC, episode ASC
  `).all(seriesTitle);

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
    "━━━━━━━━━━━━━━━━━━\n" +
    "📜 EPISODENLISTE\n" +
    `📺 ${seriesTitle.toUpperCase()}\n` +
    "━━━━━━━━━━━━━━━━━━\n\n";

  for (const season of Object.keys(grouped).map(Number).sort((a, b) => a - b)) {
    result += `📀 STAFFEL ${String(season).padStart(2, "0")}\n`;

    grouped[season].forEach((ep, index) => {
      const prefix = index === grouped[season].length - 1 ? "┗" : "┠";

      result += `${prefix} S${String(ep.season).padStart(2, "0")}E${String(ep.episode).padStart(2, "0")}`;

      if (ep.episode_title) result += ` • ${ep.episode_title}`;

      result += "\n";
    });

    result += "\n";
  }

  result +=
    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return result.slice(0, 4000);
}

async function createOrUpdateEpisodeList({
  topicId,
  seriesTitle
}) {
  if (!topicId || !seriesTitle) return null;

  const topic = db.prepare(`
    SELECT *
    FROM topics
    WHERE topic_id = ?
    LIMIT 1
  `).get(topicId);

  if (!topic) return null;

  const text = fullEpisodeListCaption(seriesTitle);

  if (topic.episode_list_message_id) {
    return await tg("editMessageText", {
      chat_id: SERIES_GROUP_ID,
      message_id: topic.episode_list_message_id,
      text
    });
  }

  const msg = await tg("sendMessage", {
    chat_id: SERIES_GROUP_ID,
    message_thread_id: topicId,
    text
  });

  if (msg?.message_id) {
    db.prepare(`
      UPDATE topics
      SET episode_list_message_id = ?
      WHERE topic_id = ?
    `).run(msg.message_id, topicId);
  }

  return msg;
}

function buildCompactSeasonIndex(seriesTitle) {
  const episodes = db.prepare(`
    SELECT season, episode
    FROM series
    WHERE series_title = ?
    ORDER BY season ASC, episode ASC
  `).all(seriesTitle);

  if (!episodes.length) {
    return "Noch keine Episoden gespeichert.";
  }

  const seasons = {};

  for (const ep of episodes) {
    const season = Number(ep.season || 0);
    if (!seasons[season]) seasons[season] = [];
    seasons[season].push(Number(ep.episode || 0));
  }

  let result = "";

  for (const season of Object.keys(seasons).map(Number).sort((a, b) => a - b)) {
    const saved = [...new Set(seasons[season])].length;
    const total = getKnownSeasonEpisodeCount(seriesTitle, season) || saved;
    const bar = buildSeriesProgressBar(seriesTitle, saved, total);

    result += `📀 STAFFEL ${String(season).padStart(2, "0")} • ${bar} ${saved}/${total}\n`;
  }

  return result.trim();
}

function getKnownSeasonEpisodeCount(seriesTitle, seasonNumber) {
  const knownCounts = {

    "The Boys": {
      1: 8,
      2: 8,
      3: 8,
      4: 8,
      5: 7
    },
    
    "Die Ewoks": {
  1: 13,
  2: 22
},

    "The Mandalorian": {
      1: 8,
      2: 8,
      3: 8
    },

    "Andor": {
      1: 12
    },

    "Ahsoka": {
      1: 8
    },

    "Loki": {
      1: 6,
      2: 6
    },

    "WandaVision": {
      1: 9
    },

    "Moon Knight": {
      1: 6
    },

    "The Falcon and the Winter Soldier": {
      1: 6
    },

    "Obi-Wan Kenobi": {
      1: 6
    },

    "The Book of Boba Fett": {
      1: 7
    }
  };

  return knownCounts[seriesTitle]?.[Number(seasonNumber)] || null;
}

function getKnownSeasonCount(seriesTitle) {
  const knownSeasonCounts = {

    "The Boys": 5,

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

function getSeriesHubTopic(topicId) {
  return db.prepare(`
    SELECT *
    FROM topics
    WHERE topic_id = ?
    LIMIT 1
  `).get(topicId);
}

function getSeriesRank(current, total) {

  if (!total || total <= 0) {
    return "📼 ARCHIVED";
  }

  const percent = Math.round((current / total) * 100);

  if (percent >= 100) {
    return "👑 MASTERED";
  }

  if (percent >= 90) {
    return "💎 FULL COLLECTION";
  }

  if (percent >= 60) {
    return "🔥 TRENDING";
  }

  if (percent >= 30) {
    return "📀 GROWING ARCHIVE";
  }

  return "⚠️ INCOMPLETE";
}

function getSeriesStatusTags(current, total) {
  if (!total || total <= 0) {
    return "⚠️ UNKNOWN";
  }

  const percent = Math.round((current / total) * 100);
  const tags = [];

  if (percent >= 100) {
    tags.push("👑 MASTERED");
    tags.push("💎 FULL COLLECTION");
  } else if (percent >= 90) {
    tags.push("💎 FULL COLLECTION");
  } else if (percent >= 60) {
    tags.push("🔥 TRENDING");
  } else if (percent >= 30) {
    tags.push("📀 GROWING ARCHIVE");
  } else {
    tags.push("⚠️ INCOMPLETE");
  }

  if (percent <= 15) {
    tags.push("🌱 STARTER");
  }

  return tags.join(" • ");
}

function getMovieArchiveRank(movieCount = 0) {

  if (movieCount >= 100) {
    return "👑 ELITE ARCHIVE";
  }

  if (movieCount >= 50) {
    return "💎 PREMIUM ARCHIVE";
  }

  if (movieCount >= 25) {
    return "🔥 ADVANCED ARCHIVE";
  }

  if (movieCount >= 10) {
    return "🎬 ACTIVE ARCHIVE";
  }

  return "📁 STARTER ARCHIVE";
}

function buildSeriesProgressBar(seriesTitle, current, total) {
  const styles = {
    "The Boys": {
      filled: "🟥",
      empty: "⬛"
    },

    "Stranger Things": {
      filled: "🟥",
      empty: "⬜"
    },

    "Game of Thrones": {
      filled: "🐉",
      empty: "⬛"
    },

    "The Walking Dead": {
      filled: "🧟",
      empty: "⬛"
    },

    "Dark": {
      filled: "◼",
      empty: "◻"
    },

    default: {
      filled: "■",
      empty: "□"
    }
  };

  const style = styles[seriesTitle] || styles.default;

  const safeTotal = total > 0 ? total : 1;
  const percent = Math.max(0, Math.min(1, current / safeTotal));
  const size = 10;
  const filledCount = Math.round(percent * size);

  return (
    style.filled.repeat(filledCount) +
    style.empty.repeat(size - filledCount)
  );
}

function saveHubMessageId(topicId, messageId) {
  db.prepare(`
    UPDATE topics
    SET hub_message_id = ?
    WHERE topic_id = ?
  `).run(messageId, topicId);
}

async function createSeriesHubIfMissing({ tmdb, topicId }) {
  const topic = getSeriesHubTopic(topicId);

  if (topic?.hub_message_id) {
    return topic.hub_message_id;
  }

  const bannerData = await createSeriesHubBanner(tmdb);

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
    text: seriesHubCaption(tmdb)
  });

  if (hub?.message_id) {
    saveHubMessageId(topicId, hub.message_id);
    return hub.message_id;
  }

  return null;
}

async function updateSeriesHub({ tmdb, topicId }) {
  const topic = getSeriesHubTopic(topicId);

  if (!topic?.hub_message_id) {
    return null;
  }

  return await tg("editMessageText", {
    chat_id: SERIES_GROUP_ID,
    message_id: topic.hub_message_id,
    text: seriesHubCaption(tmdb)
  });
}

// =============================
// SERIES SEASON CARDS
// =============================
async function createSeasonCardIfMissing({ tmdb, topicId, season }) {
  const separators = getSeasonSeparators(topicId);
  const seasonKey = String(season).padStart(2, "0");

  if (season !== 5 && separators[`card_${seasonKey}`]) {
  return separators[`card_${seasonKey}`];
}

  console.log("🎴 CREATE SEASON CARD:", tmdb.seriesTitle, "S" + seasonKey);

  let seasonData = await getSeasonTMDB(tmdb.tmdbId, season);

if (!seasonData) {
  seasonData = {
    air_date: "",
    overview: tmdb.overview || "Keine Beschreibung verfügbar.",
    episodes: Array.from({
      length: getKnownSeasonEpisodeCount(tmdb.seriesTitle, season) || 0
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
  ).slice(0, 950);

  const seasonPoster =
  posterUrl(seasonData?.poster_path) ||
  tmdb.backdropUrl ||
  tmdb.seriesPosterUrl ||
  tmdb.posterUrl ||
  "https://via.placeholder.com/500x750.png?text=No+Cover";

  const brandedSeasonPoster = await createBrandedCover(
  seasonPoster,
  tmdb.seriesTitle,
  `Staffel ${seasonKey}`
);

let card = await tg("sendPhoto", {
  chat_id: SERIES_GROUP_ID,
  message_thread_id: topicId,
  photo: brandedSeasonPoster,
  caption
});

  console.log("🎴 SEASON CARD RESULT:", JSON.stringify(card, null, 2));

  if (!card?.message_id && tmdb.seriesPosterUrl) {
  console.log("⚠️ Staffelposter fehlgeschlagen — versuche Serienposter");

  card = await tg("sendPhoto", {
    chat_id: SERIES_GROUP_ID,
    message_thread_id: topicId,
    photo: tmdb.seriesPosterUrl,
    caption
  });

  console.log("🎴 SEASON CARD FALLBACK RESULT:", JSON.stringify(card, null, 2));
}

  if (card?.message_id) {
    separators[`card_${seasonKey}`] = card.message_id;
    saveSeasonSeparators(topicId, separators);
    return card.message_id;
  }

  return null;
}

function buildSeasonProgressBar(current = 0, total = 0) {
  const size = 10;

  if (!total || total <= 0) {
    return "□□□□□□□□□□";
  }

  const percent =
    Math.max(0, Math.min(1, current / total));

  const filled =
    Math.round(percent * size);

  return (
    "■".repeat(filled) +
    "□".repeat(size - filled)
  );
}

async function updateSeasonCard({ tmdb, topicId, season }) {
  const separators = getSeasonSeparators(topicId);
  const seasonKey = String(season).padStart(2, "0");
  const messageId = separators[`card_${seasonKey}`];

  if (!messageId) return null;

  let seasonData = await getSeasonTMDB(tmdb.tmdbId, season);

if (!seasonData) {
  seasonData = {
    air_date: "",
    overview: tmdb.overview || "Keine Beschreibung verfügbar.",
    episodes: Array.from({
      length: getKnownSeasonEpisodeCount(tmdb.seriesTitle, season) || 0
    }),
    poster_path: null
  };
}

  return await tg("editMessageCaption", {
    chat_id: SERIES_GROUP_ID,
    message_id: messageId,
    caption: seasonCaption(tmdb, seasonData, season).slice(0, 950)
  });
}

function getSeasonSeparators(topicId) {
  const topic = getSeriesHubTopic(topicId);

  try {
    return JSON.parse(topic?.season_separators || "{}");
  } catch {
    return {};
  }
}

function saveSeasonSeparators(topicId, separators) {
  db.prepare(`
    UPDATE topics
    SET season_separators = ?
    WHERE topic_id = ?
  `).run(JSON.stringify(separators), topicId);
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
  const safeCaption = String(caption || "").slice(0, 900);

  const baseData = {
    chat_id: targetChatId,
    from_chat_id: fromChatId,
    message_id: messageId,
    message_thread_id: topicId
  };

  if (safeCaption) {
    baseData.caption = safeCaption;
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

    console.error(
      `❌ Telegram API Fehler (${method}):`
    );

    console.error(
      JSON.stringify(errorData, null, 2)
    );

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

    return {
      __error: true,
      method,
      error: errorData
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
    "🎛 MOVIE COMMAND CENTER",
    "🌌 UNIVERSES",
    "🎞 COLLECTIONS",
    "🎭 GENRES",
    "📅 DECADES",
    "🏆 ELITE ARCHIVE"
  ];

  const seriesCenters = [
    "🎛 SERIES COMMAND CENTER",
    "🌌 UNIVERSES",
    "📺 SERIES LIBRARY",
    "🔥 TRENDING",
    "🧩 INCOMPLETE",
    "🏆 MASTERED"
  ];

  for (const name of movieCenters) {

  await createOrGetTopic({
    chatId: MOVIE_GROUP_ID,
    name,
    type: "system_hub"
  });

  await sleep(1500);
}

for (const bucket of movieTopicBuckets) {

  await createOrGetTopic({
    chatId: MOVIE_GROUP_ID,
    name: bucket.name,
    type: bucket.type
  });

  await sleep(1200);
}

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
    topicName: "🎛 MOVIE COMMAND CENTER",
    caption: await movieCommandCenterCaption()
  });

  await createOrUpdateCommandCenter({
    chatId: SERIES_GROUP_ID,
    topicName: "🎛 SERIES COMMAND CENTER",
    caption: await seriesCommandCenterCaption()
  });
}

// =============================
// MOVIE COMMAND CENTER CAPTION
// =============================
async function movieCommandCenterCaption() {
  let movieCount = 0;
  let universeCount = 0;
  let collectionCount = 0;
  let eliteCount = 0;
  let fskRows = [];
  let genreRows = [];
  let decadeRows = [];

  if (pgPool) {
    movieCount = Number((await pgPool.query(`
      SELECT COUNT(*) AS count
      FROM movies
    `)).rows[0]?.count || 0);

    universeCount = Number((await pgPool.query(`
      SELECT COUNT(DISTINCT universe) AS count
      FROM movies
      WHERE universe IS NOT NULL
    `)).rows[0]?.count || 0);

    collectionCount = Number((await pgPool.query(`
      SELECT COUNT(DISTINCT collection) AS count
      FROM movies
      WHERE collection IS NOT NULL
    `)).rows[0]?.count || 0);

    const eliteMovies = (await pgPool.query(`
      SELECT rating, quality
      FROM movies
    `)).rows;

    eliteCount = eliteMovies.filter(isEliteMovie).length;

    fskRows = (await pgPool.query(`
      SELECT fsk, COUNT(*) AS count
      FROM movies
      WHERE fsk IS NOT NULL
      GROUP BY fsk
      ORDER BY count DESC
    `)).rows;

    genreRows = (await pgPool.query(`
      SELECT genre, COUNT(*) AS count
      FROM movies
      WHERE genre IS NOT NULL
      GROUP BY genre
      ORDER BY count DESC
      LIMIT 8
    `)).rows;

    decadeRows = (await pgPool.query(`
      SELECT year, COUNT(*) AS count
      FROM movies
      WHERE year IS NOT NULL
      GROUP BY year
      ORDER BY year ASC
    `)).rows;
  } else {
    movieCount = db.prepare(`
      SELECT COUNT(*) AS count
      FROM movies
    `).get()?.count || 0;

    universeCount = db.prepare(`
      SELECT COUNT(DISTINCT universe) AS count
      FROM movies
      WHERE universe IS NOT NULL
    `).get()?.count || 0;

    collectionCount = db.prepare(`
      SELECT COUNT(DISTINCT collection) AS count
      FROM movies
      WHERE collection IS NOT NULL
    `).get()?.count || 0;

    const eliteMovies = db.prepare(`
      SELECT rating, quality
      FROM movies
    `).all();

    eliteCount = eliteMovies.filter(isEliteMovie).length;

    fskRows = db.prepare(`
      SELECT fsk, COUNT(*) AS count
      FROM movies
      WHERE fsk IS NOT NULL
      GROUP BY fsk
      ORDER BY count DESC
    `).all();

    genreRows = db.prepare(`
      SELECT genre, COUNT(*) AS count
      FROM movies
      WHERE genre IS NOT NULL
      GROUP BY genre
      ORDER BY count DESC
      LIMIT 8
    `).all();

    decadeRows = db.prepare(`
      SELECT year, COUNT(*) AS count
      FROM movies
      WHERE year IS NOT NULL
      GROUP BY year
      ORDER BY year ASC
    `).all();
  }

  const fskLine =
    fskRows.length
      ? fskRows
          .map((r) => `• ${r.fsk} (${r.count})`)
          .join("\n")
      : "Noch keine FSK-Daten";

  const decadeStats = {};

  for (const row of decadeRows) {
    const decade = getDecadeLabel(row.year);
    decadeStats[decade] =
      (decadeStats[decade] || 0) + Number(row.count || 0);
  }

  const decadeLine =
    Object.entries(decadeStats)
      .map(([decade, count]) => `• ${decade} (${count})`)
      .join("\n") ||
    "Noch keine Jahrzehnte";

  const genreLine =
    genreRows.length
      ? genreRows
          .map((g) => `• ${g.genre} (${g.count})`)
          .join("\n")
      : "Noch keine Genres";

  return (
    "━━━━━━━━━━━━━━━━━━\n" +
    "🎛 MOVIE COMMAND CENTER\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "📁 PREMIUM FILM ARCHIVE\n" +
    "🎬 AUTOMATED MEDIA SYSTEM\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    `🎞 FILME • ${movieCount}\n` +
    `🌌 UNIVERSES • ${universeCount}\n` +
    `🎞 COLLECTIONS • ${collectionCount}\n` +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "🎭 TOP GENRES\n" +
    `${genreLine}\n\n` +
    "📅 DECADES\n" +
    `${decadeLine}\n\n` +
    "🔞 FSK ARCHIVE\n" +
    `${fskLine}\n\n` +

    "🧭 NAVIGATION\n" +
    "🌌 Universes\n" +
    "🎞 Collections\n" +
    `🏆 ELITE ARCHIVE • ${eliteCount}\n` +
    "🎭 Genres\n" +
    "📅 Decades\n" +
    "🔞 FSK Archive\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends"
  );
}

// =============================
// SERIES COMMAND CENTER CAPTION
// =============================
async function seriesCommandCenterCaption() {
  let seriesCount = 0;
  let episodeCount = 0;
  let universeSeriesCount = 0;

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
  }

  return (
    "━━━━━━━━━━━━━━━━━━\n" +
    "🎛 SERIES COMMAND CENTER\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "📁 PREMIUM SERIES ARCHIVE\n" +
    "📺 AUTOMATED EPISODE SYSTEM\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    `📺 SERIEN • ${seriesCount}\n` +
    `🎞 EPISODEN • ${episodeCount}\n` +
    `🌌 UNIVERSES • ${universeSeriesCount}\n` +
    "━━━━━━━━━━━━━━━━━━\n\n" +

    "🧭 NAVIGATION\n" +
    "🌌 Universes\n" +
    "📺 Series Library\n" +
    "🔥 Trending\n" +
    "🧩 Incomplete\n" +
    "🏆 Mastered\n\n" +

    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends"
  );
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
    return null;
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
  try {
    await createOrUpdateCommandCenter({
      chatId: MOVIE_GROUP_ID,
      topicName: "🎛 MOVIE COMMAND CENTER",
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
  const msg = update.message || update.edited_message;
  if (!msg) return;

  const userId = String(msg.from?.id || "");

  console.log("USER ID:", userId);
  console.log("CHAT ID:", msg.chat?.id, "CHAT TITLE:", msg.chat?.title);

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

  await createOrUpdateMovieIndex();

  await tg("answerCallbackQuery", {
    callback_query_id: query.id,
    text: "🔤 Movie Index aktualisiert"
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

// =============================
// COMMAND HANDLER
// =============================
async function handleCommand(msg) {
  const text = msg.text || "";
  
  // =============================
  // ADMIN / START COMMANDS
  // =============================

  if (text === "/start" || text === "/admin") {

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🎛 𝐋𝐈𝐁𝐑𝐀𝐑𝐘 𝐂𝐎𝐍𝐓𝐑𝐎𝐋\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +

      "📁 PREMIUM MEDIA SYSTEM\n" +
      "🎬 CINEMATIC ARCHIVE CORE\n\n" +

      "━━━━━━━━━━━━━━━━━━\n" +
      "🎬 FILM ARCHIVE\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +

      "• /movies — Filmarchiv\n" +
      "• /collections — Filmreihen\n" +
      "• /collection NAME — Collection öffnen\n" +
      "• /universes — Universen anzeigen\n" +
      "• /genres — Genre Archive\n" +
      "• /decades — Jahrzehnte\n" +
      "• /elite — Elite Filme\n" +
      "• /search TITEL — Filmsuche\n\n" +

      "🛠 MOVIE TOOLS\n" +
      "• /fixmovie ALT | NEU | JAHR\n" +
      "• /deletemovie NAME\n" +
      "• /deletetopic NAME\n" +
      "• /rebuildcollections\n" +
      "• /rebuildcommandcenters\n" +
      "• /rebuildmovieindex\n" +
      "• /repairmovies\n\n" +

      "━━━━━━━━━━━━━━━━━━\n" +
      "📺 SERIES ARCHIVE\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +

      "• /series — Serienarchiv\n" +
      "• /seriesaz — Serien A–Z\n" +
      "• /serieshub — Serien Dashboard\n" +
      "• /newseries — Neue Folgen\n" +
      "• /progress NAME\n" +
      "• /missingseries NAME\n" +
      "• /checkseries NAME\n\n" +

      "🛠 SERIES TOOLS\n" +
      "• /series TITEL | S01E01\n" +
      "• /fixseries ALT | NEU\n" +
      "• /deleteseries NAME S01E01\n" +
      "• /rebuildseasoncards NAME\n" +
      "• /rebuildserieshub NAME\n" +
      "• /repairseries\n\n" +

      "━━━━━━━━━━━━━━━━━━\n" +
      "🧹 SYSTEM CONTROL\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +

      "• /dashboard — Premium Dashboard\n" +
      "• /stats — Statistiken\n" +
      "• /health — Systemstatus\n" +
      "• /queue — Upload Queue\n" +
      "• /qualitystats — Qualitätsdaten\n" +
      "• /duplicates — Duplikate\n" +
      "• /smartduplicates — Smart Scan\n" +
      "• /pgstats — Supabase Debug\n\n" +

      "🧠 REPAIR & RECOVERY\n" +
      "• /cleartopicsdb\n" +
      "• /rebuildtopics\n" +
      "• /repairhubs\n" +
      "• /repairindexes\n\n" +

      "━━━━━━━━━━━━━━━━━━\n" +
      "💾 DATABASE\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +

      "• /backup — Backup erstellen\n" +
      "• /restoredb — Backup laden\n\n" +

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
  
  if (text.startsWith("/setseries")) {
  const name = text.replace("/setseries", "").trim();

  if (!name) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "⚠️ Nutzung:\n/setseries Serienname"
    });
    return;
  }

  CURRENT_SERIES_NAME = name;

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "✅ Aktuelle Serie gesetzt:\n\n" +
      `📺 ${CURRENT_SERIES_NAME}`
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

// =============================
// REBUILD STAR WARS HUB
// =============================
if (text === "/rebuildstarwars") {

  await createOrUpdateUniverseHub("🌌 Star Wars Universe");

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🌌 STAR WARS HUB REBUILT\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "✅ Star-Wars-Hub wurde neu erstellt/aktualisiert\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}

if (text === "/clearseries") {
  CURRENT_SERIES_NAME = "";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: "🗑 Serienname zurückgesetzt."
  });

  return;
}

// =============================
// PG STATS DEBUG
// =============================
if (text === "/pgstats") {
  if (!pgPool) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Supabase/pgPool ist nicht aktiv."
    });
    return;
  }

  const movies = await pgPool.query(`SELECT COUNT(*) AS count FROM movies`);
  const collections = await pgPool.query(`
    SELECT COUNT(DISTINCT collection) AS count
    FROM movies
    WHERE collection IS NOT NULL
  `);

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🧪 SUPABASE DEBUG\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `🎬 Filme: ${movies.rows[0].count}\n` +
      `🎞 Collections: ${collections.rows[0].count}\n\n` +
      "━━━━━━━━━━━━━━━━━━"
  });

  return;
}

// =============================
// FIND MOVIE / FILM SUCHEN
// =============================
if (text.startsWith("/findmovie")) {

  const query =
    text.replace("/findmovie", "").trim().toLowerCase();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "⚠️ Nutzung:\n/findmovie Hangover"
    });
    return;
  }

  let rows = [];

  if (pgPool) {
    const result = await pgPool.query(
      `
      SELECT id, title, year, unique_key, file_name, collection, topic_id
      FROM movies
      WHERE LOWER(title) LIKE $1
         OR LOWER(unique_key) LIKE $1
         OR LOWER(file_name) LIKE $1
      ORDER BY created_at DESC
      LIMIT 10
      `,
      [`%${query}%`]
    );

    rows = result.rows;
  }

  if (!rows.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Kein Film gefunden:\n\n" + query
    });
    return;
  }

  let resultText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🔎 FILM GEFUNDEN\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  for (const m of rows) {
    resultText +=
  `🆔 ID: ${m.id}\n` +
  `🎬 Titel: ${m.title}\n` +
  `📅 Jahr: ${m.year || "?"}\n` +
  `🔑 Key: ${m.unique_key}\n` +
  `📁 Datei: ${m.file_name || "?"}\n` +
  `🎞 Collection: ${m.collection || "leer"}\n` +
  `🧵 Topic ID: ${m.topic_id || "leer"}\n\n`;
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: resultText.slice(0, 4000)
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
  await ensureCommandCenters();
  await refreshCommandCenters();

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🎛 COMMAND CENTERS AKTUALISIERT\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "✅ Movie Command Center aktualisiert\n" +
      "✅ Series Command Center aktualisiert\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
  });

  return;
}

// =============================
// DELETE MOVIE / FILM LÖSCHEN
// =============================
if (text.startsWith("/deletemovie")) {

  const query =
    text.replace("/deletemovie", "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n\n" +
        "/deletemovie Filmname\n" +
        "/deletemovie hangover-2009"
    });
    return;
  }

  const search =
    query.toLowerCase();

  let movie = null;

  // =============================
  // SUPABASE SEARCH
  // =============================
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
  }

  // =============================
  // SQLITE FALLBACK
  // =============================
  if (!movie) {
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

  // =============================
  // DELETE FROM SUPABASE
  // =============================
  if (pgPool) {
    await pgPool.query(
      `
      DELETE FROM movies
      WHERE unique_key = $1
      `,
      [movie.unique_key]
    );
  }

  // =============================
  // DELETE FROM SQLITE FALLBACK
  // =============================
  db.prepare(`
    DELETE FROM movies
    WHERE unique_key = ?
  `).run(movie.unique_key);

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🗑 FILM GELÖSCHT\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `🎬 ${movie.title} ${movie.year || ""}\n` +
      `🔑 ${movie.unique_key}\n\n` +
      "✅ Film aus Supabase entfernt\n" +
      "✅ Film aus SQLite entfernt\n\n" +
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

if (text.startsWith("/deleteseries")) {
  const query = text.replace("/deleteseries", "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n" +
        "/deleteseries Tulsa King S01E01"
    });
    return;
  }

  const match = query.match(/(.+)\s+s(\d{1,2})e(\d{1,2})/i);

  if (!match) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Format falsch.\nBeispiel:\n/deleteseries Tulsa King S01E01"
    });
    return;
  }

  const title = match[1].trim();
  const season = Number(match[2]);
  const episode = Number(match[3]);

  const row = db.prepare(`
    SELECT * FROM series
    WHERE LOWER(series_title) = ?
    AND season = ?
    AND episode = ?
    LIMIT 1
  `).get(title.toLowerCase(), season, episode);

  if (!row) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Episode nicht gefunden."
    });
    return;
  }

  db.prepare(`
    DELETE FROM series
    WHERE id = ?
  `).run(row.id);

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "🗑 Episode gelöscht:\n\n" +
      `📺 ${row.series_title} S${String(row.season).padStart(2, "0")}E${String(row.episode).padStart(2, "0")}`
  });

  return;
}

if (text === "/qualitystats") {
  const movies = db.prepare(`
    SELECT quality, COUNT(*) AS count
    FROM movies
    GROUP BY quality
    ORDER BY count DESC
  `).all();

  if (!movies.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "📊 Noch keine Qualitätsdaten gespeichert."
    });
    return;
  }

  let result =
    "━━━━━━━━━━━━━━━━━━\n" +
    "📊 QUALITÄTS-STATISTIK\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  for (const row of movies) {
    result += `• ${row.quality || "Unbekannt"}: ${row.count}\n`;
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: result
  });

  return;
}

if (text === "/health") {
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🩺 SYSTEM HEALTH\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "✅ Bot: Online\n" +
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

if (text.startsWith("/progress")) {
  const query = text.replace("/progress", "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "⚠️ Nutzung:\n/progress Serienname\n\nBeispiel:\n/progress Game of Thrones"
    });
    return;
  }

  const rows = db.prepare(`
    SELECT series_title, season, episode
    FROM series
    WHERE LOWER(series_title) LIKE ?
    ORDER BY season ASC, episode ASC
  `).all(`%${query.toLowerCase()}%`);

  if (!rows.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: `❌ Keine Serie gefunden für:\n${query}`
    });
    return;
  }

  const seriesTitle = rows[0].series_title;
  const seasons = {};

  for (const row of rows) {
    const season = Number(row.season || 0);
    if (!seasons[season]) seasons[season] = [];
    seasons[season].push(Number(row.episode || 0));
  }

  let result =
    "━━━━━━━━━━━━━━━━━━\n" +
    "📈 SERIEN-FORTSCHRITT\n" +
    `📺 ${seriesTitle}\n` +
    "━━━━━━━━━━━━━━━━━━\n\n";

  for (const season of Object.keys(seasons).map(Number).sort((a, b) => a - b)) {
    const episodes = [...new Set(seasons[season])].sort((a, b) => a - b);
    const maxEpisode = Math.max(...episodes);

    result += `📀 Staffel ${String(season).padStart(2, "0")}\n`;
    result += `✅ Vorhanden: ${episodes.length}/${maxEpisode}\n`;

    const missing = [];
    for (let ep = 1; ep <= maxEpisode; ep++) {
      if (!episodes.includes(ep)) missing.push(ep);
    }

    if (missing.length) {
      result += `⚠️ Fehlend: ${missing.map((ep) => `E${String(ep).padStart(2, "0")}`).join(", ")}\n`;
    } else {
      result += "✅ Keine Lücken erkannt\n";
    }

    result += "\n";
  }

  result += "━━━━━━━━━━━━━━━━━━\n@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: result.slice(0, 4000)
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

  const allRows = db.prepare(`
  SELECT *
  FROM series
  ORDER BY series_title ASC, season ASC, episode ASC
`).all();

const queryKey = makeKey(query);

const rows = allRows.filter((row) => {
  const titleKey = makeKey(row.series_title || "");
  return titleKey.includes(queryKey) || queryKey.includes(titleKey);
});

  if (!rows.length) {
  const names = db.prepare(`
    SELECT series_title, COUNT(*) AS count
    FROM series
    GROUP BY series_title
    ORDER BY series_title ASC
    LIMIT 30
  `).all();

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

  const topic = db.prepare(`
    SELECT *
    FROM topics
    WHERE name = ?
    AND type = 'series'
    LIMIT 1
  `).get(first.series_title);

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

  const separators = getSeasonSeparators(topic.topic_id);

  for (const season of seasons) {
    const seasonKey = String(season).padStart(2, "0");

    delete separators[`card_${seasonKey}`];
  }

  saveSeasonSeparators(topic.topic_id, separators);

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

if (text === "/dashboard") {
  const movieCount = db.prepare("SELECT COUNT(*) AS count FROM movies").get().count;
  const seriesCount = db.prepare("SELECT COUNT(*) AS count FROM series").get().count;
  const topicCount = db.prepare("SELECT COUNT(*) AS count FROM topics").get().count;
  const collectionCount = db.prepare("SELECT COUNT(*) AS count FROM collections").get().count;

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🎛 PREMIUM DASHBOARD\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `🎬 Filme: ${movieCount}\n` +
      `🎞 Collections: ${collectionCount}\n` +
      `📺 Serien-Episoden: ${seriesCount}\n` +
      `🧵 Themen: ${topicCount}\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "⚙️ SYSTEM STATUS: ONLINE\n" +
      "@LibraryOfLegends"
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

  if (text.startsWith("/search")) {
    const query = text.replace("/search", "").trim().toLowerCase();

    if (!query) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text: "🔎 Bitte nutze:\n/search tulsa king"
      });
      return;
    }

    const movies = db.prepare(`
      SELECT * FROM movies
      WHERE LOWER(title) LIKE ?
      ORDER BY title ASC
      LIMIT 10
    `).all(`%${query}%`);

    const episodes = db.prepare(`
      SELECT * FROM series
      WHERE LOWER(series_title) LIKE ? OR LOWER(episode_title) LIKE ?
      ORDER BY series_title ASC, season ASC, episode ASC
      LIMIT 15
    `).all(`%${query}%`, `%${query}%`);

    let result = "🔎 𝐒𝐔𝐂𝐇𝐄\n\n";

    if (!movies.length && !episodes.length) {
      result += "❌ Nichts gefunden.";
    }

    if (movies.length) {
      result += "🎬 𝐅𝐈𝐋𝐌𝐄\n\n";
      for (const m of movies) {
        result += `• ${m.title} ${m.year || ""}\n`;
        result += `  🎭 ${m.genre || "Unbekannt"}\n\n`;
      }
    }

    if (episodes.length) {
      result += "📺 𝐒𝐄𝐑𝐈𝐄𝐍\n\n";
      for (const s of episodes) {
        result += `• ${s.series_title} S${String(s.season).padStart(2, "0")}E${String(s.episode).padStart(2, "0")}\n`;
        if (s.episode_title) result += `  🎞 ${s.episode_title}\n`;
        result += `  🎭 ${s.genre || "Unbekannt"}\n\n`;
      }
    }

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: result
    });
    return;
  }

if (text === "/rebuildcollections") {
  const collections = db.prepare(`
    SELECT *
    FROM collections
    WHERE topic_id IS NOT NULL
    ORDER BY collection_name ASC
  `).all();

  let updated = 0;
  let failed = 0;

  for (const c of collections) {
    try {
      const fakeTmdb = {
        collection: c.collection_name,
        collectionId: c.tmdb_collection_id
      };

      await createOrUpdateCollectionHub(fakeTmdb, c.topic_id);
      updated++;

      await new Promise((resolve) => setTimeout(resolve, 700));
    } catch (err) {
      failed++;
      console.error("⚠️ Collection Rebuild Fehler:", err.message);
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
  
  if (text === "/collections") {
  const rows = db.prepare(`
    SELECT 
      c.collection_name,
      c.tmdb_collection_id,
      c.topic_id,
      COUNT(m.id) AS movie_count
    FROM collections c
    LEFT JOIN movies m
      ON m.collection = c.collection_name
    GROUP BY c.tmdb_collection_id
    ORDER BY c.collection_name ASC
  `).all();

  if (!rows.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "🎞 Noch keine Filmreihen gespeichert."
    });
    return;
  }

  let result =
    "╔══════════════════╗\n" +
    "      🎞 FILMREIHEN\n" +
    "╚══════════════════╝\n\n";

  for (const row of rows) {
    result += `🎞 ${row.collection_name}\n`;
    result += `🎬 Filme: ${row.movie_count || 0}\n\n`;
  }

  result +=
    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: result.slice(0, 4000)
  });

  return;
}

if (text.startsWith("/collection")) {
  const query = text.replace("/collection", "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n" +
        "/collection Star Wars\n\n" +
        "Beispiel:\n/collection Stirb langsam"
    });
    return;
  }

  const collection = db.prepare(`
    SELECT *
    FROM collections
    WHERE LOWER(collection_name) LIKE ?
    ORDER BY collection_name ASC
    LIMIT 1
  `).get(`%${query.toLowerCase()}%`);

  if (!collection) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: `❌ Keine Filmreihe gefunden für:\n${query}`
    });
    return;
  }

  const textOut = collectionHubCaption(collection.collection_name);

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: textOut
  });

  return;
}

  if (text === "/movies") {
    const movies = db.prepare(`
      SELECT * FROM movies
      ORDER BY title ASC
      LIMIT 50
    `).all();

    let result = "🎬 𝐅𝐈𝐋𝐌𝐄\n\n";

    if (!movies.length) {
      result += "Noch keine Filme gespeichert.";
    } else {
      for (const m of movies) {
        result += `• ${m.title} ${m.year || ""}\n`;
      }
    }

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: result
    });
    return;
  }

  if (text === "/series") {
  const rows = db.prepare(`
    SELECT series_title, COUNT(*) AS count
    FROM series
    GROUP BY series_title
    ORDER BY series_title ASC
    LIMIT 50
  `).all();

  let result = "📺 𝐒𝐄𝐑𝐈𝐄𝐍\n\n";

  if (!rows.length) {
    result += "Noch keine Serien gespeichert.";
  } else {
    for (const s of rows) {
      result += `• ${s.series_title} — ${s.count} Episode(n)\n`;
    }
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: result
  });

  return;
}

if (text === "/seriesaz") {
  const rows = db.prepare(`
    SELECT series_title, genre, rating, COUNT(*) AS count
    FROM series
    GROUP BY series_title
    ORDER BY series_title ASC
  `).all();

  if (!rows.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "📺 Noch keine Serien gespeichert."
    });
    return;
  }

  let currentLetter = "";
  let result =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🔤 SERIEN A–Z\n" +
    "━━━━━━━━━━━━━━━━━━\n";

  for (const s of rows) {
    const letter = String(s.series_title || "#").charAt(0).toUpperCase();

    if (letter !== currentLetter) {
      currentLetter = letter;
      result += `\n${currentLetter}\n`;
    }

    const genreText = String(s.genre || "Sonstige")
      .split("/")
      .map((g) => g.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(" • ");

    result += `• ${s.series_title}\n`;
    result += `  📀 ${s.count} Episode(n)\n`;
    result += `  🎭 ${genreText}\n`;
    result += `  ⭐ ${s.rating || "Unbekannt"}\n\n`;
  }

  result += "━━━━━━━━━━━━━━━━━━\n";
  result += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: result
  });

  return;
}

if (text === "/newseries") {
  const rows = db.prepare(`
    SELECT series_title, season, episode, episode_title, genre, rating, created_at
    FROM series
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  if (!rows.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "📺 Noch keine neuen Serienfolgen gespeichert."
    });
    return;
  }

  let result =
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

    result += `📺 ${s.series_title}\n`;
    result += `🎞 S${seasonText}E${episodeText}`;
    if (s.episode_title) result += ` • ${s.episode_title}`;
    result += "\n";
    result += `🎭 ${genreText}\n`;
    result += `⭐ ${s.rating || "Unbekannt"}\n\n`;
  }

  result += "━━━━━━━━━━━━━━━━━━\n";
  result += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: result
  });

  return;
}

if (text === "/trendingseries") {
  const rows = db.prepare(`
    SELECT series_title, genre, rating, COUNT(*) AS count
    FROM series
    GROUP BY series_title
    ORDER BY count DESC, series_title ASC
    LIMIT 10
  `).all();

  if (!rows.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "🔥 Noch keine Trending-Serien verfügbar."
    });
    return;
  }

  let result =
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

    result += `#${rank} 📺 ${s.series_title}\n`;
    result += `📀 ${s.count} Episode(n)\n`;
    result += `🎭 ${genreText}\n`;
    result += `⭐ ${s.rating || "Unbekannt"}\n\n`;

    rank++;
  }

  result += "━━━━━━━━━━━━━━━━━━\n";
  result += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: result
  });

  return;
}

if (text === "/featuredseries") {
  const rows = db.prepare(`
    SELECT series_title, genre, rating, COUNT(*) AS count
    FROM series
    GROUP BY series_title
    ORDER BY rating DESC, count DESC, series_title ASC
    LIMIT 10
  `).all();

  if (!rows.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "⭐ Noch keine Featured-Serien verfügbar."
    });
    return;
  }

  let result =
    "━━━━━━━━━━━━━━━━━━\n" +
    "⭐ FEATURED SERIEN\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  for (const s of rows) {
    const genreText = String(s.genre || "Sonstige")
      .split("/")
      .map((g) => g.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(" • ");

    result += `📺 ${s.series_title}\n`;
    result += `📀 ${s.count} Episode(n)\n`;
    result += `🎭 ${genreText}\n`;
    result += `⭐ ${s.rating || "Unbekannt"}\n\n`;
  }

  result += "━━━━━━━━━━━━━━━━━━\n";
  result += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: result
  });

  return;
}

if (text === "/serieshub") {
  const latest = db.prepare(`
    SELECT series_title, season, episode, episode_title
    FROM series
    ORDER BY created_at DESC
    LIMIT 5
  `).all();

  const trending = db.prepare(`
    SELECT series_title, COUNT(*) AS count
    FROM series
    GROUP BY series_title
    ORDER BY count DESC, series_title ASC
    LIMIT 5
  `).all();

  const featured = db.prepare(`
    SELECT series_title, genre, rating, COUNT(*) AS count
    FROM series
    GROUP BY series_title
    ORDER BY rating DESC, count DESC, series_title ASC
    LIMIT 5
  `).all();

  let result =
    "━━━━━━━━━━━━━━━━━━\n" +
    "📺 SERIES HUB\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  result += "🆕 NEUE FOLGEN\n";
  if (!latest.length) {
    result += "Noch keine Folgen gespeichert.\n\n";
  } else {
    for (const s of latest) {
      result += `• ${s.series_title} S${String(s.season).padStart(2, "0")}E${String(s.episode).padStart(2, "0")}`;
      if (s.episode_title) result += ` • ${s.episode_title}`;
      result += "\n";
    }
    result += "\n";
  }

  result += "🔥 TRENDING\n";
  if (!trending.length) {
    result += "Noch keine Trends verfügbar.\n\n";
  } else {
    for (const s of trending) {
      result += `• ${s.series_title} — ${s.count} Episode(n)\n`;
    }
    result += "\n";
  }

  result += "⭐ FEATURED\n";
  if (!featured.length) {
    result += "Noch keine Featured-Serien verfügbar.\n\n";
  } else {
    for (const s of featured) {
      result += `• ${s.series_title} — ${s.rating || "Unbekannt"}\n`;
    }
    result += "\n";
  }

  result += "━━━━━━━━━━━━━━━━━━\n";
  result += "🔤 /seriesaz — Serien A–Z\n";
  result += "🆕 /newseries — Neue Folgen\n";
  result += "🔥 /trendingseries — Trending\n";
  result += "⭐ /featuredseries — Featured\n";
  result += "━━━━━━━━━━━━━━━━━━\n";
  result += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: result
  });

  return;
}

if (text.startsWith("/missingseries")) {
  const query = text.replace("/missingseries", "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "⚠️ Nutzung:\n/missingseries Tulsa King"
    });
    return;
  }

  const rows = db.prepare(`
    SELECT series_title, season, episode
    FROM series
    WHERE LOWER(series_title) LIKE ?
    ORDER BY season ASC, episode ASC
  `).all(`%${query.toLowerCase()}%`);

  if (!rows.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: `❌ Keine Serie gefunden für:\n${query}`
    });
    return;
  }

  const seriesTitle = rows[0].series_title;
  const seasons = {};

  for (const row of rows) {
    const s = Number(row.season);
    if (!seasons[s]) seasons[s] = [];
    seasons[s].push(Number(row.episode));
  }

  let result =
    "━━━━━━━━━━━━━━━━━━\n" +
    `🧩 FEHLENDE EPISODEN\n` +
    `📺 ${seriesTitle}\n` +
    "━━━━━━━━━━━━━━━━━━\n\n";

  let hasMissing = false;

  for (const season of Object.keys(seasons).map(Number).sort((a, b) => a - b)) {
    const episodes = [...new Set(seasons[season])].sort((a, b) => a - b);
    const minEp = episodes[0];
    const maxEp = episodes[episodes.length - 1];

    const missing = [];
    for (let ep = minEp; ep <= maxEp; ep++) {
      if (!episodes.includes(ep)) missing.push(ep);
    }

    result += `📀 Staffel ${String(season).padStart(2, "0")}\n`;

    if (!missing.length) {
      result += "✅ Keine Lücken gefunden\n\n";
    } else {
      hasMissing = true;
      result += `⚠️ Fehlend: ${missing.map((ep) => `E${String(ep).padStart(2, "0")}`).join(", ")}\n\n`;
    }
  }

  result += "━━━━━━━━━━━━━━━━━━\n";
  result += hasMissing ? "⚠️ Sammlung unvollständig" : "✅ Sammlung wirkt vollständig";
  result += "\n@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: result
  });

  return;
}

if (text.startsWith("/checkseries")) {
  const query = text.replace("/checkseries", "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "⚠️ Nutzung:\n" +
        "/checkseries Serienname"
    });
    return;
  }

  const rows = db.prepare(`
    SELECT *
    FROM series
    WHERE LOWER(series_title) LIKE ?
    ORDER BY season ASC, episode ASC
  `).all(`%${query.toLowerCase()}%`);

  if (!rows.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: `❌ Keine Serie gefunden für:\n${query}`
    });
    return;
  }

  const seriesTitle = rows[0].series_title;
  const grouped = {};

  for (const row of rows) {
    const season = Number(row.season || 0);
    if (!grouped[season]) grouped[season] = [];
    grouped[season].push(Number(row.episode || 0));
  }

  const scanTheme =
  seriesThemes[seriesTitle] || {
    icon: "📺",
    archive: "SERIES ARCHIVE",
    subline: "PREMIUM EPISODE DATABASE",
    status: "🎞 SERIES ACTIVE",
    divider: "━━━━━━━━━━━━━━━━━━"
  };

let result =
  `${scanTheme.divider}\n` +
  `🧩 PREMIUM SERIES SCAN\n` +
  `${scanTheme.icon} ${seriesTitle.toUpperCase()}\n` +
  `${scanTheme.divider}\n\n` +
  `📁 ${scanTheme.archive}\n` +
  `${scanTheme.subline}\n` +
  `${scanTheme.status}\n\n` +
  `${scanTheme.divider}\n\n`;

  let totalMissing = 0;
  
  let totalKnownEpisodes = 0;
let totalSavedEpisodes = 0;

  const knownSeasons = getKnownSeasonCount(seriesTitle) ||
  Math.max(...Object.keys(grouped).map(Number));

for (let season = 1; season <= knownSeasons; season++) {
    const existing = [...new Set(grouped[season] || [])]
  .sort((a, b) => a - b);

    const knownCount =
      getKnownSeasonEpisodeCount(seriesTitle, season) || existing.length;
      
      totalKnownEpisodes += knownCount;
totalSavedEpisodes += existing.length;

    const missing = [];

    for (let ep = 1; ep <= knownCount; ep++) {
      if (!existing.includes(ep)) {
        missing.push(`E${String(ep).padStart(2, "0")}`);
      }
    }

    result += `${scanTheme.divider}\n`;
result += `📀 STAFFEL ${String(season).padStart(2, "0")}\n`;

    if (!missing.length) {
  result += "🏆 STATUS: VOLLSTÄNDIG\n\n";
} else {
  totalMissing += missing.length;
  result += `⚠️ FEHLEND • ${formatEpisodeRanges(missing)}\n`;
  result += "⚠️ STATUS: UNVOLLSTÄNDIG\n\n";
}
  }

  result += "━━━━━━━━━━━━━━━━━━\n";

const scanRank = getSeriesRank(
  totalSavedEpisodes,
  totalKnownEpisodes
);

const scanPercent =
  totalKnownEpisodes > 0
    ? Math.round((totalSavedEpisodes / totalKnownEpisodes) * 100)
    : 0;

const scanProgress = buildSeriesProgressBar(
  seriesTitle,
  totalSavedEpisodes,
  totalKnownEpisodes
);

result += "━━━━━━━━━━━━━━━━━━\n";
result += `📊 GESAMT: ${scanProgress} ${scanPercent}% • ${totalSavedEpisodes}/${totalKnownEpisodes}\n`;
result += totalMissing
  ? `⚠️ FEHLENDE EPISODEN: ${totalMissing}\n`
  : "✅ KOMPLETTE SERIE\n";

result += `🏅 SERIEN-RANG: ${scanRank}\n`;
result += "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: result.slice(0, 4000)
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

if (text.startsWith("/seriespick")) {

  const query = text
    .replace("/seriespick", "")
    .trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Nutzung:\n/seriespick Serienname"
    });

    return;
  }

  const search = await tmdbGet("/search/tv", {
    query,
    include_adult: false
  });

  if (!search?.results?.length) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Keine Serien gefunden."
    });

    return;
  }

  const buttons = search.results
    .slice(0, 8)
    .map((s) => [{
      text:
        `${s.name} (${s.first_air_date?.slice(0,4) || "?"})`,
      callback_data:
        `seriespick_${s.id}`
    }]);

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      `📺 TMDB Serien-Auswahl\n\n` +
      `🔎 Suche: ${query}`,
    reply_markup: {
      inline_keyboard: buttons
    }
  });

  return;
}
  
  if (text === "/smartduplicates") {
  const movies = db.prepare(`
    SELECT id, title, year, file_name
    FROM movies
    ORDER BY title ASC
  `).all();

  const series = db.prepare(`
    SELECT id, series_title, season, episode, file_name
    FROM series
    ORDER BY series_title ASC, season ASC, episode ASC
  `).all();

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
    if (!movieMap[key]) movieMap[key] = [];
    movieMap[key].push(m);
  }

  for (const s of series) {
    const key = simpleKey(
      `${s.series_title}-s${String(s.season).padStart(2, "0")}-e${String(s.episode).padStart(2, "0")}`
    );
    if (!seriesMap[key]) seriesMap[key] = [];
    seriesMap[key].push(s);
  }

  let result =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🧹 SMART DUPLIKATE\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  let found = false;

  result += "🎬 FILME\n";

  for (const key of Object.keys(movieMap)) {
    if (movieMap[key].length > 1) {
      found = true;
      result += "\n⚠️ Mögliches Duplikat:\n";
      for (const m of movieMap[key]) {
        result += `• ID ${m.id} — ${m.title} ${m.year || ""}\n`;
      }
    }
  }

  result += "\n📺 SERIEN\n";

  for (const key of Object.keys(seriesMap)) {
    if (seriesMap[key].length > 1) {
      found = true;
      result += "\n⚠️ Mögliches Duplikat:\n";
      for (const s of seriesMap[key]) {
        result += `• ID ${s.id} — ${s.series_title} S${String(s.season).padStart(2, "0")}E${String(s.episode).padStart(2, "0")}\n`;
      }
    }
  }

  if (!found) {
    result += "✅ Keine Smart-Duplikate gefunden.";
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: result.slice(0, 4000)
  });

  return;
}

  if (text === "/duplicates") {
    const movieDupes = db.prepare(`
      SELECT title, year, COUNT(*) AS count
      FROM movies
      GROUP BY title, year
      HAVING count > 1
    `).all();

    const seriesDupes = db.prepare(`
      SELECT series_title, season, episode, COUNT(*) AS count
      FROM series
      GROUP BY series_title, season, episode
      HAVING count > 1
    `).all();

    let result = "🧹 𝐃𝐔𝐏𝐋𝐈𝐊𝐀𝐓𝐄\n\n";

    if (!movieDupes.length && !seriesDupes.length) {
      result += "✅ Keine Duplikate gefunden.";
    }

    if (movieDupes.length) {
      result += "🎬 Filme:\n";
      for (const m of movieDupes) {
        result += `• ${m.title} ${m.year || ""} — ${m.count}x\n`;
      }
    }

    if (seriesDupes.length) {
      result += "\n📺 Serien:\n";
      for (const s of seriesDupes) {
        result += `• ${s.series_title} S${String(s.season).padStart(2, "0")}E${String(s.episode).padStart(2, "0")} — ${s.count}x\n`;
      }
    }

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: result
    });
    return;
  }

  // =============================
// REBUILD COMMAND CENTERS
// =============================
if (text === "/rebuildcommandcenters") {
  await ensureCommandCenters();
  await refreshCommandCenters();

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🎛 COMMAND CENTERS AKTUALISIERT\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "✅ Movie Command Center aktualisiert\n" +
      "✅ Series Command Center aktualisiert\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "@LibraryOfLegends"
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

  const extras = {
    ...getMediaExtras(fileName, msg),
    libraryId: await makeLibraryCode(tmdb.genre)
  };

  const universeData = detectUniverse(
    tmdb.title,
    tmdb.collection
  );
  
  console.log("🌌 UNIVERSE DETECT DEBUG:", {
  title: tmdb.title,
  collection: tmdb.collection,
  universeData
});

  // =============================
// MOVIE TOPIC ROUTING
// =============================
const bucketData =
  await getOrCreateMovieBucketTopic(tmdb);

const useCollectionTopic =
  tmdb.collection &&
  tmdb.collectionId &&
  shouldCreateCollectionTopic(tmdb.collection);

let finalTopicName =
  bucketData?.topicName ||
  tmdb.mainGenre ||
  "Sonstige";

let finalTopicType =
  bucketData?.bucket?.type ||
  "movie_genre";

if (useCollectionTopic) {
  finalTopicName = `🎞 ${tmdb.collection}`;
  finalTopicType = "collection";
}

if (universeData?.universeName) {
  finalTopicName = universeData.universeName;
  finalTopicType = "universe";
}

let topicId =
  universeData?.universeName || useCollectionTopic
    ? await createOrGetTopic({
        chatId: MOVIE_GROUP_ID,
        name: finalTopicName,
        type: finalTopicType
      })
    : bucketData?.topicId ||
      await createOrGetTopic({
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
// MOVIE HUB SETUP
// =============================
if (!universeData?.universeName) {
  await createMovieHubIfMissing({
    topicId,
    topicName: finalTopicName,
    banner:
      useCollectionTopic
        ? getCollectionBanner(tmdb.collection) ||
          tmdb.collectionBackdrop ||
          tmdb.backdropUrl ||
          tmdb.posterUrl ||
          null
        : genreBanners?.[finalTopicName] ||
          genreBanners?.[tmdb.mainGenre] ||
          tmdb.backdropUrl ||
          tmdb.posterUrl ||
          null
  });
}

// =============================
// COLLECTION DB ENTRY
// =============================
if (useCollectionTopic && !universeData?.universeName) {
  const existingCollection =
    await getCollection(tmdb.collectionId);

  if (!existingCollection) {
    await saveCollection({
      collectionName: tmdb.collection,
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
// COPY ORIGINAL MEDIA
// =============================
const copied = await copyOriginalMedia({
  fromChatId: msg.chat.id,
  messageId: msg.message_id,
  targetChatId: MOVIE_GROUP_ID,
  topicId,
  caption: movieCaption(tmdb, {
  ...extras,

  topicName: finalTopicName,

  universe:
    universeData?.universeName || null,

  universePhase:
    universeData?.phase || null,

  collectionMovies:
    tmdb.collectionMovies?.length || 1,

  collectionOrder:
    tmdb.collectionMovies || []
}),
  fileId,
  isVideo: !!msg.video,
  adminChatId: msg.chat.id
});

if (!copied?.message_id) {
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "⚠️ Film-Cover wurde gepostet, aber Datei konnte nicht kopiert werden."
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
  collection: tmdb.collection,
  quality: extras.quality,
  audio: extras.audio,
  source: extras.source,
  fsk: tmdb.fsk,
  director: tmdb.director,
  cast: tmdb.cast,
  libraryId: extras.libraryId,
  resolution: extras.resolution,
  fileSize: extras.fileSize,
  videoCodec: extras.videoCodec,
  audioCodec: extras.audioCodec,
  audioChannels: extras.audioChannels,
  hdr: extras.hdr,
  universe: universeData?.universeName || null,
  universePhase: universeData?.phase || null
});

// =============================
// UPDATE HUBS
// =============================
if (universeData?.universeName) {
  try {
    await createOrUpdateUniverseHub(
      universeData.universeName
    );
  } catch (err) {
    console.error("⚠️ Universe Hub Update Fehler:", err.message);
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
  await refreshCommandCenters();
} catch (err) {
  console.error("⚠️ Command Center Refresh Fehler:", err.message);
}

try {
  await createOrUpdateMovieIndex();
} catch (err) {
  console.error("⚠️ Movie Index Update Fehler:", err.message);
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

    const topicId = await createOrGetTopic({
      chatId: SERIES_GROUP_ID,
      name: tmdb.seriesTitle,
      type: "series"
    });
    
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
  ...getMediaExtras(fileName, msg),
  seriesLibraryId: makeSeriesLibraryCode(tmdb.genre)
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

await saveSeries({
  seriesTitle: tmdb.seriesTitle,
  season: media.season,
  episode: media.episode,
  episodeTitle: tmdb.episodeTitle || media.episodeTitleFromFile || "",
  genre: tmdb.genre,
  rating: tmdb.rating,
  overview: tmdb.overview,
  posterUrl: tmdb.posterUrl,
  fileName,
  fileId,
  uniqueKey: media.uniqueKey,
  telegramMessageId: copied.message_id,
  topicId,
  seriesLibraryId: extras.seriesLibraryId,

  universe: seriesUniverseData?.universeName || null,
  universePhase: seriesUniverseData?.phase || null
});

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
  await createOrUpdateEpisodeList({
    topicId,
    seriesTitle: tmdb.seriesTitle
  });
} catch (err) {
  console.error("⚠️ Episodenliste Update Fehler:", err.message);
}

try {

  if (seriesUniverseData?.universeName) {

    await createOrUpdateUniverseHub(
      seriesUniverseData.universeName
    );

  }

} catch (err) {

  console.error(
    "⚠️ Serien Universe Hub Fehler:",
    err.message
  );

}

await tg("sendMessage", {
  chat_id: msg.chat.id,
  text:
    "✅ Serie erfolgreich einsortiert:\n\n" +
    `📺 ${tmdb.seriesTitle} S${media.seasonText}E${media.episodeText}\n` +
    `🧵 Thema: ${tmdb.seriesTitle}`
});

try {
  await refreshCommandCenters();
} catch (err) {
  console.error("⚠️ Command Center Refresh Fehler:", err.message);
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
  await notifyStartup();
});

if (process.env.CREATE_COMMAND_CENTERS === "true") {
  (async () => {
    try {
      console.log("🎛 Erstelle Command Centers...");
      await ensureCommandCenters();
      console.log("✅ Command Centers bereit");
    } catch (err) {
      console.error("❌ Command Center Fehler:", err.message);
    }
  })();
}

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