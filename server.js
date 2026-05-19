const express = require("express");
const axios = require("axios");
const Database = require("better-sqlite3");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

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

let CURRENT_SERIES_NAME = "";

let LAST_RESTORE_FILE_ID = "";

const PENDING_MOVIE_UPLOADS = new Map();

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
      telegram_message_id, topic_id,
      collection, quality, audio, source, fsk, director, cast, library_id,
      resolution, file_size, video_codec, audio_codec, audio_channels, hdr
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    data.hdr
  );
}

function saveSeries(data) {
  return db.prepare(`
    INSERT OR IGNORE INTO series
    (
      series_title, season, episode, episode_title,
      genre, rating, overview, poster_url,
      file_name, file_id, unique_key,
      telegram_message_id, topic_id,
      series_library_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    data.seriesLibraryId
  );
}

function getCollection(tmdbCollectionId) {
  return db.prepare(`
    SELECT * FROM collections
    WHERE tmdb_collection_id = ?
  `).get(tmdbCollectionId);
}

function saveCollection(data) {
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

function getCollectionById(tmdbCollectionId) {
  return db.prepare(`
    SELECT * FROM collections
    WHERE tmdb_collection_id = ?
  `).get(tmdbCollectionId);
}

function saveCollectionHubMessageId(tmdbCollectionId, messageId) {
  db.prepare(`
    UPDATE collections
    SET hub_message_id = ?
    WHERE tmdb_collection_id = ?
  `).run(messageId, tmdbCollectionId);
}

function bourneHubCaption() {
  const rows = db.prepare(`
    SELECT title, year, library_id
    FROM movies
    WHERE LOWER(title) LIKE '%bourne%'
       OR LOWER(collection) LIKE '%bourne%'
    ORDER BY year ASC, title ASC
  `).all();

  let text =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🕶️ JASON BOURNE UNIVERSE\n" +
    "━━━━━━━━━━━━━━━━━━\n\n" +
    "📁 CIA ARCHIVE\n" +
    "🧠 TREADSTONE • BLACKBRIAR • OUTCOME\n" +
    "⚠️ STATUS: CLASSIFIED\n\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    "📀 FILMREIHENFOLGE\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!rows.length) {
    text += "Noch keine Bourne-Filme gespeichert.\n";
  } else {
    rows.forEach((m, index) => {
      text += `${String(index + 1).padStart(2, "0")} • ${m.title} (${m.year || "Unbekannt"})\n`;
      if (m.library_id) text += `     🏷 ${m.library_id}\n`;
    });
  }

  const timeline = rows.length
  ? rows
      .map((m, index) => {
        const nr = String(index + 1).padStart(2, "0");
        return nr;
      })
      .join(" → ")
  : "Noch keine Timeline verfügbar";

const totalBourneMovies = 5;
const savedBourneMovies = Math.min(rows.length, totalBourneMovies);
const missingBourneSlots = Math.max(totalBourneMovies - savedBourneMovies, 0);

const progressBlocks =
  "█".repeat(savedBourneMovies) +
  "░".repeat(missingBourneSlots);

const requiredBourneMovies = [
  { title: "Die Bourne Identität", year: "2002" },
  { title: "Die Bourne Verschwörung", year: "2004" },
  { title: "Das Bourne Ultimatum", year: "2007" },
  { title: "Das Bourne Vermächtnis", year: "2012" },
  { title: "Jason Bourne", year: "2016" }
];

const storedYears = rows.map((m) => String(m.year || ""));

const missingMovies = requiredBourneMovies.filter((m) => {
  return !storedYears.includes(m.year);
});

let missingText = "";

if (missingMovies.length) {
  missingText =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🧩 FEHLENDE MISSIONEN\n" +
    missingMovies
      .map((m) => `• ${m.title} (${m.year})`)
      .join("\n") +
    "\n";
}

const collectionStatus =
  missingMovies.length === 0
    ? "🏆 STATUS: KOMPLETT"
    : "⚠️ STATUS: UNVOLLSTÄNDIG";

text +=
  "\n━━━━━━━━━━━━━━━━━━\n" +
  "🛰️ TIMELINE\n" +
  `${timeline}\n` +
  "━━━━━━━━━━━━━━━━━━\n" +
  `🧩 Sammlung: ${progressBlocks} ${savedBourneMovies}/${totalBourneMovies}\n` +
  `🎬 Filme im Archiv: ${rows.length}\n` +
  missingText +
  `${collectionStatus}\n` +
  `🕒 UPDATE: ${new Date().toLocaleString("de-DE")}\n` +
  "━━━━━━━━━━━━━━━━━━\n" +
  "@LibraryOfLegends";

  return text.slice(0, 4000);
}

async function createOrUpdateBourneHub(topicId) {
  const topic = db.prepare(`
    SELECT *
    FROM topics
    WHERE topic_id = ?
    AND chat_id = ?
    LIMIT 1
  `).get(topicId, String(MOVIE_GROUP_ID));

  const text = bourneHubCaption();

  if (topic?.hub_message_id) {
    return await tg("editMessageText", {
      chat_id: MOVIE_GROUP_ID,
      message_id: topic.hub_message_id,
      text
    });
  }

  const hub = await tg("sendMessage", {
    chat_id: MOVIE_GROUP_ID,
    message_thread_id: topicId,
    text
  });

  if (hub?.message_id) {
    db.prepare(`
      UPDATE topics
      SET hub_message_id = ?
      WHERE topic_id = ?
      AND chat_id = ?
    `).run(hub.message_id, topicId, String(MOVIE_GROUP_ID));

    await tg("pinChatMessage", {
      chat_id: MOVIE_GROUP_ID,
      message_id: hub.message_id,
      disable_notification: true
    });
  }

  return hub;
}

const chronologyRegistry = {

  "Terminator Filmreihe": [
    "1984",
    "1991",
    "2003",
    "2009",
    "2015",
    "2019"
  ],

  "Bourne Filmreihe": [
    "2002",
    "2004",
    "2007",
    "2012",
    "2016"
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
  ]
};

const universeRegistry = {
  "Terminator Universe": [
    "Terminator Filmreihe"
  ],

  "Bourne Universe": [
    "Bourne Filmreihe"
  ],

  "Matrix Universe": [
    "Matrix Filmreihe"
  ]
};

const universeThemes = {
  "Terminator Universe": {
    icon: "🌍",
    archive: "MULTIVERSE DATABASE",
    status: "🔴 SKYNET GLOBAL NETWORK"
  },

  "Matrix Universe": {
    icon: "🧬",
    archive: "MACHINE MAINFRAME",
    status: "🟢 MATRIX SYSTEM ACTIVE"
  }
};

const spinOffRegistry = {
  "Breaking Bad Universe": [
    "Breaking Bad",
    "Better Call Saul",
    "El Camino"
  ],

  "Conjuring Universe": [
    "Conjuring Filmreihe",
    "Annabelle Filmreihe",
    "The Nun Filmreihe"
  ]
};

const collectionThemes = {
  "Terminator Filmreihe": {
    icon: "🤖",
    archive: "SKYNET ARCHIVE",
    subline: "JUDGMENT DAY PROTOCOL",
    status: "SKYNET ACTIVE"
  },

  "Bourne Filmreihe": {
    icon: "🕶️",
    archive: "CIA ARCHIVE",
    subline: "TREADSTONE • BLACKBRIAR • OUTCOME",
    status: "⚫ CLASSIFIED DOSSIER"
  },

  "Matrix Filmreihe": {
    icon: "💊",
    archive: "ZION ARCHIVE",
    subline: "THE ONE • MACHINE WAR",
    status: "🟢 MATRIX DETECTED"
  },

  "John Wick Filmreihe": {
    icon: "🩸",
    archive: "HIGH TABLE ARCHIVE",
    subline: "EXCOMMUNICADO DOSSIER",
    status: "🟡 HIGH TABLE ALERT"
  },

  "Mission: Impossible Filmreihe": {
    icon: "🎯",
    archive: "IMF ARCHIVE",
    subline: "CLASSIFIED FIELD OPERATIONS",
    status: "🔵 IMF SECURE CHANNEL"
  }
};

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
      "the flash"
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
      "andor",
      "ahsoka"
    ],

    phases: {
      "SKYWALKER SAGA": [
        "Star Wars: Episode I",
        "Star Wars: Episode II",
        "Star Wars: Episode III",
        "Star Wars: Episode IV",
        "Star Wars: Episode V",
        "Star Wars: Episode VI",
        "Star Wars: Episode VII",
        "Star Wars: Episode VIII",
        "Star Wars: Episode IX"
      ],

      "STANDALONE": [
        "Rogue One",
        "Solo"
      ]
    },

    series: [
      "The Mandalorian",
      "Andor",
      "Ahsoka",
      "Obi-Wan Kenobi",
      "The Book of Boba Fett"
    ]
  }
};

function detectUniverse(title = "", collection = "") {

  const search =
    `${title} ${collection}`
      .toLowerCase();

  for (const [key, config] of Object.entries(universeConfigs)) {

    const matched =
      config.aliases.some((alias) =>
        search.includes(
          String(alias).toLowerCase()
        )
      );

    if (matched) {

      let detectedPhase = null;

      for (const [phase, movies] of Object.entries(config.phases || {})) {

        const phaseMatch =
          movies.some((movieTitle) =>
            search.includes(
              String(movieTitle).toLowerCase()
            )
          );

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

const collectionCinemaCards = {
  "Terminator Filmreihe": [
    "🤖 SKYNET CORE",
    "Threat Level: RED",
    "Temporal Breaches: DETECTED",
    "Resistance Activity: ACTIVE"
  ],

  "Bourne Filmreihe": [
    "🕶️ CIA DOSSIER",
    "Operation: TREADSTONE",
    "Asset Status: ROGUE",
    "Clearance: BLACK"
  ]
};

const collectionBanners = {
  "Terminator Filmreihe":
    "https://image.tmdb.org/t/p/original/9pkZesKMnblFfKxEhQx45YQ2kIe.jpg",

  "Bourne Filmreihe":
    "https://image.tmdb.org/t/p/original/lWslWelH3j6Ow23k25o66as8PGs.jpg",

  "Matrix Filmreihe":
    "https://image.tmdb.org/t/p/original/7u3pxc0K1wx32IleAkLv78MKgrw.jpg"
};

function buildCollectionData(collectionName = "") {
  const rows = db.prepare(`
    SELECT title, year, library_id, rating, runtime, file_size
    FROM movies
    WHERE collection = ?
    ORDER BY year ASC, title ASC
  `).all(collectionName);

  const requiredMovies = collectionRegistry[collectionName] || [];

  const officialTotal = requiredMovies.length || rows.length;
  const savedMovies = rows.length;
  const ratingValues = rows
  .map((m) => {
    const match = String(m.rating || "").match(/(\d+(\.\d+)?)/g);
    return match ? Number(match[match.length - 1]) : null;
  })
  .filter((n) => Number.isFinite(n));

const franchiseRating = ratingValues.length
  ? (ratingValues.reduce((sum, n) => sum + n, 0) / ratingValues.length).toFixed(1)
  : "Unbekannt";

const bestMovie = ratingValues.length
  ? rows
      .filter((m) => String(m.rating || "").match(/(\d+(\.\d+)?)/g))
      .sort((a, b) => {
        const ar = Number(String(a.rating).match(/(\d+(\.\d+)?)/g).pop());
        const br = Number(String(b.rating).match(/(\d+(\.\d+)?)/g).pop());
        return br - ar;
      })[0]
  : null;
  
  const totalRuntimeMinutes = rows.reduce((sum, m) => {
  const match = String(m.runtime || "").match(/\d+/);
  return sum + (match ? Number(match[0]) : 0);
}, 0);

const runtimeHours = Math.floor(totalRuntimeMinutes / 60);
const runtimeMinutes = totalRuntimeMinutes % 60;

const totalRuntimeText =
  totalRuntimeMinutes > 0
    ? `${runtimeHours}h ${runtimeMinutes}m`
    : "Unbekannt";

const fileSizes = rows
  .map((m) => parseFloat(String(m.file_size || "0")))
  .filter((n) => Number.isFinite(n));

const largestFile =
  fileSizes.length
    ? `${Math.max(...fileSizes).toFixed(2)} GB`
    : "Unbekannt";

const years = rows
  .map((m) => Number(m.year))
  .filter((y) => Number.isFinite(y));

const universePeriod =
  years.length
    ? `${Math.min(...years)} → ${Math.max(...years)}`
    : "Unbekannt";

  const missingSlots = Math.max(officialTotal - savedMovies, 0);

  const progressBlocks =
  "■".repeat(savedMovies) +
  "□".repeat(missingSlots);

  const storedYears = rows.map((m) => String(m.year || ""));

  const missingMovies = requiredMovies.filter((m) => {
    return !storedYears.includes(String(m.year));
  });

  const chronology = chronologyRegistry[collectionName] || [];

const sortedRows = chronology.length
  ? rows.sort((a, b) => {
      const aIndex = chronology.indexOf(String(a.year));
      const bIndex = chronology.indexOf(String(b.year));

      return aIndex - bIndex;
    })
  : rows;

const timeline = sortedRows.length
  ? sortedRows
      .map((m, index) => `${String(index + 1).padStart(2, "0")}•${m.year || "????"}`)
      .join(" ══▶ ")
  : "Keine Filme";

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

function collectionHubCaption(collectionName) {
  const data = buildCollectionData(collectionName);

  const theme =
    collectionThemes[collectionName] || {
      icon: "🎞",
      archive: "COLLECTION ARCHIVE",
      subline: "PREMIUM FILM COLLECTION",
      status: "🎬 FILMREIHE"
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
    (data.missingMovies.length
      ? "\n🧩 FEHLENDE FILME\n" +
        data.missingMovies.map((m) => `• ${m.title} (${m.year})`).join("\n") +
        "\n"
      : "") +
    `🕒 UPDATE: ${new Date().toLocaleString("de-DE")}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return result.slice(0, 4000);
}

async function createOrUpdateCollectionHub(tmdb, topicId) {
  if (!tmdb.collection || !tmdb.collectionId) return null;

  const collection = getCollectionById(tmdb.collectionId);
  if (!collection) return null;

  const hubText = collectionHubCaption(tmdb.collection);

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

    // The Boys
    theboys: "The Boys",
    theboy: "The Boys",

    // Stranger Things
    strangerthings: "Stranger Things",

    // Game of Thrones
    gameofthrones: "Game of Thrones",
    got: "Game of Thrones",

    // Breaking Bad
    breakingbad: "Breaking Bad",

    // The Walking Dead
    thewalkingdead: "The Walking Dead",
    twd: "The Walking Dead",

    // House of the Dragon
    houseofthedragon: "House of the Dragon",
    hotd: "House of the Dragon"
  };

  return fixes[key] || title;
}

function isBourneMovie(tmdb = {}, fileName = "") {
  const text = `${tmdb.title || ""} ${tmdb.collection || ""} ${fileName || ""}`.toLowerCase();

  return (
    text.includes("bourne") ||
    text.includes("treadstone") ||
    text.includes("blackbriar")
  );
}

function getBourneProgram(title = "") {
  const t = String(title || "").toLowerCase();

  if (t.includes("legacy") || t.includes("vermächtnis")) return "OUTCOME";
  if (t.includes("ultimatum")) return "BLACKBRIAR";
  return "TREADSTONE";
}

function bourneButtons() {
  return {
    inline_keyboard: [
      [
        { text: "📁 CIA DOSSIER", callback_data: "bourne_dossier" },
        { text: "🧠 PROGRAMME", callback_data: "bourne_programs" }
      ],
      [
        { text: "🛰️ BOURNE ARCHIVE", callback_data: "bourne_archive" }
      ]
    ]
  };
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

    // Fall 1:
    // Game of Thrones S01E09 Baelor
    if (titleClean) {
      episodeTitleFromFile = cleanFileName(afterCode);
    }

    // Fall 2:
    // S01E09 Game of Thrones - Baelor
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
      seriesTitle: normalizeTitle(titleClean),
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

function getBourneAgentCode(title = "") {
  const t = String(title).toLowerCase();

  if (t.includes("ident")) {
    return "TREADSTONE-001";
  }

  if (t.includes("verschw")) {
    return "BLACKBRIAR-002";
  }

  if (t.includes("ultimatum")) {
    return "OUTCOME-003";
  }

  if (t.includes("verm")) {
    return "LEGACY-004";
  }

  if (t.includes("jason bourne")) {
    return "CROSS-005";
  }

  return "CLASSIFIED-000";
}

function getBourneCollectionNumber(title = "") {
  const t = String(title || "").toLowerCase();

  if (t.includes("ident")) return "01/05";
  if (t.includes("verschw") || t.includes("supremacy")) return "02/05";
  if (t.includes("ultimatum")) return "03/05";
  if (t.includes("verm") || t.includes("legacy")) return "04/05";
  if (t.includes("jason bourne")) return "05/05";

  return "??/05";
}

function makeLibraryId(id) {
  return `#${String(id || 0).padStart(4, "0")}`;
}

function makeGenreCode(genre = "") {
  const g = String(genre).split("/")[0].trim().toUpperCase();
  return `#${g.slice(0, 3)}001`;
}

function makeLibraryCode(genre = "") {
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

  const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM movies
    WHERE library_id LIKE ?
  `).get(`LIB-${prefix}-%`);

  const nextNumber = Number(row.count || 0) + 1;

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
// TMDB API
// =============================

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const TMDB_IMAGE_ORIGINAL = "https://image.tmdb.org/t/p/original";

async function tmdbGet(path, params = {}) {
  try {
    const res = await axios.get(`${TMDB_BASE}${path}`, {
      params: {
        api_key: TMDB_KEY,
        language: "de-DE",
        ...params
      }
    });

    return res.data;
  } catch (err) {
    console.error("❌ TMDB Fehler:", err.response?.data || err.message);
    return null;
  }
}

function formatGenres(genres = []) {
  if (!Array.isArray(genres) || genres.length === 0) return "Sonstige";
  return genres.map((g) => g.name).join(" / ");
}

function getMainGenre(genres = []) {
  if (!Array.isArray(genres) || genres.length === 0) return "Sonstige";
  return genres[0].name || "Sonstige";
}

function formatRating(vote = 0) {
  const rating = Number(vote || 0).toFixed(1);
  const stars = Math.round(Number(vote || 0) / 2);

  return "★".repeat(stars) + "☆".repeat(5 - stars) + ` • ${rating}`;
}

function posterUrl(path) {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}${path}`;
}

function backdropUrl(path) {
  if (!path) return "";
  return `${TMDB_IMAGE_ORIGINAL}${path}`;
}

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

  if (year) {
    return await searchMovieTMDBChoices(title, "");
  }

  return [];
}

async function getMovieDetailsById(tmdbId) {
  const details = await tmdbGet(`/movie/${tmdbId}`, {
    append_to_response: "credits,release_dates"
  });

  if (!details) return null;

  const director =
    details.credits?.crew?.find((p) => p.job === "Director")?.name ||
    "Unbekannt";

  const cast =
    details.credits?.cast
      ?.slice(0, 3)
      .map((p) => p.name)
      .join(" • ") || "Unbekannt";

  const deRelease = details.release_dates?.results?.find(
    (r) => r.iso_3166_1 === "DE"
  );

  const fsk =
    deRelease?.release_dates?.find((r) => r.certification)?.certification ||
    "";

  return {
    tmdbId: details.id,
    title: details.title || details.original_title || "Unbekannt",
    year: details.release_date ? details.release_date.slice(0, 4) : "",
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
    fsk: fsk ? `FSK ${fsk}` : "FSK Unbekannt"
  };
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

    if (!details) continue;

    const director =
      details.credits?.crew?.find((p) => p.job === "Director")?.name ||
      "Unbekannt";

    const cast =
      details.credits?.cast
        ?.slice(0, 3)
        .map((p) => p.name)
        .join(" • ") || "Unbekannt";

    const deRelease = details.release_dates?.results?.find(
      (r) => r.iso_3166_1 === "DE"
    );

    const fsk =
      deRelease?.release_dates?.find((r) => r.certification)?.certification ||
      "";

    return {
      tmdbId: details.id,
      title: details.title || queryTitle,
      year: details.release_date ? details.release_date.slice(0, 4) : year,
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
      fsk: fsk ? `FSK ${fsk}` : "FSK Unbekannt"
    };
  }

  if (year) {
    return await searchMovieTMDB(title, "");
  }

  return null;
}

const SERIES_TMDB_OVERRIDES = {
  "robin hood": 258918
};

async function searchSeriesTMDB(title, season, episode) {
  const overrideId = SERIES_TMDB_OVERRIDES[String(title || "").toLowerCase().trim()];

let best = null;

if (overrideId) {
  best = { id: overrideId };
} else {
  const search = await tmdbGet("/search/tv", {
    query: title,
    include_adult: false
  });

  if (!search?.results?.length) return null;

  best = search.results[0];
}

  const details = await tmdbGet(`/tv/${best.id}`, {
    append_to_response: "credits,content_ratings"
  });

  if (!details) return null;

  let episodeDetails = null;

  try {
    episodeDetails = await tmdbGet(
      `/tv/${best.id}/season/${season}/episode/${episode}`
    );
  } catch (err) {
    episodeDetails = null;
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
      .join(" • ") || "Unbekannt";

  const deRating = details.content_ratings?.results?.find(
    (r) => r.iso_3166_1 === "DE"
  );

  const usRating = details.content_ratings?.results?.find(
    (r) => r.iso_3166_1 === "US"
  );

  const fsk =
    deRating?.rating
      ? `FSK ${deRating.rating}`
      : usRating?.rating
        ? usRating.rating
        : "FSK Unbekannt";

  return {
    tmdbId: details.id,
    seriesTitle: details.name || title,
    episodeTitle: episodeDetails?.name || "",
    genre: formatGenres(details.genres),
    mainGenre: getMainGenre(details.genres),
    rating: formatRating(episodeDetails?.vote_average || details.vote_average),
    seriesRating: formatRating(details.vote_average),
    episodeRating: episodeDetails?.vote_average
      ? formatRating(episodeDetails.vote_average)
      : "",
    overview:
      episodeDetails?.overview ||
      details.overview ||
      "Keine Beschreibung verfügbar.",
    posterUrl: posterUrl(episodeDetails?.still_path || details.poster_path),
    seriesPosterUrl: posterUrl(details.poster_path),
    backdropUrl: posterUrl(details.backdrop_path),
    seriesBackdropUrl: backdropUrl(details.backdrop_path),
    createdBy,
    cast,
    fsk
  };
}

async function getSeasonTMDB(tvId, season) {
  if (!tvId || !season) return null;

  return await tmdbGet(`/tv/${tvId}/season/${season}`);
}

function getSeasonTheme(season = 1) {
  const themes = {
    1: {
      name: "ICE BLUE",
      color: "#4DA6FF",
      emoji: "❄️"
    },
    2: {
      name: "ROYAL GOLD",
      color: "#D4AF37",
      emoji: "👑"
    },
    3: {
      name: "BLOOD RED",
      color: "#8B0000",
      emoji: "🩸"
    },
    4: {
      name: "MIDNIGHT PURPLE",
      color: "#4B0082",
      emoji: "🌌"
    },
    5: {
      name: "FOREST GREEN",
      color: "#228B22",
      emoji: "🌲"
    },
    6: {
      name: "EMBER ORANGE",
      color: "#FF6A00",
      emoji: "🔥"
    },
    7: {
      name: "STEEL SILVER",
      color: "#A9A9A9",
      emoji: "⚔️"
    },
    8: {
      name: "NIGHT BLACK",
      color: "#111111",
      emoji: "🌑"
    }
  };

  return themes[Number(season)] || {
    name: "CLASSIC",
    color: "#000000",
    emoji: "🎬"
  };
}

async function createBrandedCover(posterUrl, title = "", subtitle = "") {
  try {
    console.log("LOGO CHECK logo.png.PNG:", fs.existsSync("logo.png.PNG"));
    console.log("WATERMARK CHECK watermark.png.PNG:", fs.existsSync("watermark.png.PNG"));

    const imageRes = await axios.get(posterUrl, {
      responseType: "arraybuffer"
    });

    const inputBuffer = Buffer.from(imageRes.data);

    const logo = await sharp("logo.png.PNG")
      .resize(230)
      .png()
      .toBuffer();

    const watermark = await sharp("watermark.png.PNG")
      .resize(70)
      .png()
      .toBuffer();

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
    <linearGradient id="g" x1="0" y1="360" x2="0" y2="750" gradientUnits="userSpaceOnUse">
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
      .composite([
        { input: overlay, top: 0, left: 0 },
        { input: logo, gravity: "south" },
        { input: watermark, gravity: "southeast" }
      ])
      .jpeg({ quality: 95 })
      .toFile(outputPath);

    return outputPath;
  } catch (err) {
    console.error("❌ Branding Cover Fehler:", err.message);
    return posterUrl;
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

const movieThemes = {
  "Terminator Filmreihe": {
    icon: "🤖",
    archive: "📼 SKYNET ARCHIVE ENTRY",
    status: "🔴 THREAT LEVEL: EXTREME",
    subline: "🛰 TEMPORAL BREACH DETECTED",
    mode: "scifi"
  },

  "Bourne Filmreihe": {
    icon: "🕶️",
    archive: "📁 CIA DOSSIER",
    status: "⚫ ROGUE ASSET",
    subline: "🧠 TREADSTONE ACTIVE",
    mode: "classified"
  },

  "Matrix Filmreihe": {
    icon: "💊",
    archive: "📟 ZION MAINFRAME ENTRY",
    status: "🟢 MATRIX SIGNAL DETECTED",
    subline: "🧬 THE ONE PROTOCOL",
    mode: "scifi"
  },

  "John Wick Filmreihe": {
    icon: "🩸",
    archive: "🪙 HIGH TABLE DOSSIER",
    status: "🟡 EXCOMMUNICADO",
    subline: "🔫 CONTRACT ACTIVE",
    mode: "classified"
  },

  "Harry Potter Filmreihe": {
    icon: "🪄",
    archive: "📚 HOGWARTS ARCHIVE",
    status: "✨ WIZARDING WORLD",
    subline: "⚡ THE BOY WHO LIVED",
    mode: "prestige"
  }
};

const cardModes = {
  cinema: {
    divider: "━━━━━━━━━━━━━━━━━━",
    label: "🎞 CINEMA MODE"
  },

  vhs: {
    divider: "════ VHS ════",
    label: "📼 VHS ARCHIVE"
  },

  scifi: {
  divider: "━━━━━━━━━━━━━━",
  label: "🛰 SCI-FI DOSSIER"
},

  classified: {
    divider: "⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛",
    label: "⚫ CLASSIFIED FILE"
  },

  prestige: {
    divider: "👑════════════👑",
    label: "👑 PRESTIGE COLLECTION"
  },

  horror: {
    divider: "🩸🩸🩸🩸🩸🩸🩸🩸",
    label: "🧟 HORROR CASEFILE"
  }
};

function movieCaption(tmdb, extras = {}) {
  const theme = movieThemes[tmdb.collection] || {};

  const mode =
    cardModes[theme.mode] || cardModes.cinema;

  const divider = mode.divider;

  const mainGenre = String(tmdb.genre || "Sonstige")
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean)[0] || "Sonstige";

  const genreEmojiMap = {
    Action: "💥",
    Thriller: "🔪",
    Sciencefiction: "🚀",
    Drama: "🎭",
    Horror: "👻",
    Krimi: "🕵️",
    Abenteuer: "🗺️",
    Fantasy: "🐉",
    Komödie: "😂",
    Animation: "🎨",
    Familie: "👨‍👩‍👧",
    Mystery: "🧩",
    Romanze: "❤️"
  };

  const genreEmoji = genreEmojiMap[mainGenre] || "🎬";

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

  const ratingNumber =
    Number(String(tmdb.rating || "").match(/(\d+(\.\d+)?)/g)?.pop() || 0);

  const releaseBadge =
    ratingNumber >= 8
      ? "🏆 CULT CLASSIC"
      : ratingNumber >= 7
        ? "🎖 PREMIUM RELEASE"
        : "🎞 ARCHIVE ENTRY";

  const threatLevel =
    ratingNumber >= 8
      ? "🔴 THREAT LEVEL: EXTREME"
      : ratingNumber >= 7
        ? "🟠 THREAT LEVEL: HIGH"
        : "🟡 THREAT LEVEL: MODERATE";

  const castLines = String(tmdb.cast || "Unbekannt")
    .split("•")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((p) => `▸ ${p}`)
    .join("\n");

  const cleanResolution = String(extras.resolution || "")
    .replace("3840x2160", "2160p")
    .replace("1920x1080", "1080p")
    .replace("1280x720", "720p");

  const techLine = [
    extras.quality || "Unbekannt",

    cleanResolution && cleanResolution !== "Unbekannt"
      ? cleanResolution
      : null,

    extras.audio && extras.audio !== "Unbekannt"
      ? extras.audio
      : null,

    extras.fileSize || "Unbekannt"
  ]
    .filter(Boolean)
    .join(" • ");

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
      safeOverview = safeOverview.slice(
        0,
        safeOverview.lastIndexOf(" ")
      );

      safeOverview += " …";
    }
  }

  return (
    `${divider}\n` +
    `${theme.icon || genreEmoji} ${String(
      tmdb.title || ""
    ).toUpperCase()} • ${tmdb.year || "Unbekannt"}\n` +
    `${divider}\n` +

    (theme.archive
      ? `${theme.archive}\n${theme.status || threatLevel}\n${theme.subline || ""}\n`
      : `${threatLevel}\n`) +

    `${genreEmoji} ${genreText}\n` +
    `🎞 ${techLine}\n` +

    `${divider}\n` +

    `⭐ RATING: ${tmdb.rating || "Unbekannt"} IMDb\n` +
    `🎖 CLASSIFICATION: ${releaseBadge
      .replace("🏆 ", "")
      .replace("🎖 ", "")
      .replace("🎞 ", "")}\n` +

    `⏱ ${tmdb.runtime || "Unbekannt"} • 🔞 ${tmdb.fsk || "FSK Unbekannt"}\n` +

    `${divider}\n` +

    "🎥 REGIE\n" +
    `${tmdb.director || "Unbekannt"}\n\n` +

    "👥 STARRING\n" +
    `${castLines || "Unbekannt"}\n` +

    `${divider}\n` +

    "📖 STORY FILE\n" +
    `╰➤ ${safeOverview}\n` +

    `${divider}\n` +

    `🧬 ARCHIVE ID • ${extras.libraryId || "Unbekannt"}\n` +

    (theme.archive
      ? "📡 FRANCHISE DB\n"
      : "") +

    `${divider}\n` +

    `${genreTags}\n` +
    "@LibraryOfLegends"
  ).slice(0, 4000);
}

function getNextBourneMovie(title = "") {
  const t = String(title || "").toLowerCase();

  if (t.includes("ident")) return "➡️ NÄCHSTER FILM: VERSCHWÖRUNG";
  if (t.includes("verschw") || t.includes("supremacy")) return "➡️ NÄCHSTER FILM: ULTIMATUM";
  if (t.includes("ultimatum")) return "➡️ NÄCHSTER FILM: VERMÄCHTNIS";
  if (t.includes("verm") || t.includes("legacy")) return "➡️ NÄCHSTER FILM: JASON BOURNE";
  if (t.includes("jason bourne")) return "🏁 SAGA ABSCHLIESSEN";

  return "➡️ NÄCHSTER FILM";
}

function bourneKeyboard(title = "") {
  return {
    inline_keyboard: [
      [
        {
          text: "🛰️ BOURNE ARCHIVE",
          callback_data: "bourne_archive"
        }
      ],
      [
        {
          text: "🧠 TREADSTONE",
          callback_data: "bourne_programs"
        },
        {
          text: "🎞 FILMREIHE",
          callback_data: "bourne_collection"
        }
      ],
      [
        {
          text: getNextBourneMovie(title),
          callback_data: "bourne_next"
        }
      ]
    ]
  };
}

function buildMovieArchiveProgressBar(movieCount = 0) {
  const size = 10;
  const percent = movieCount >= 100 ? 1 : movieCount / 100;
  const filled = Math.round(percent * size);

  return "■".repeat(filled) + "□".repeat(size - filled);
}

function movieHubCaption(topicName = "") {
  const cleanTopic = String(topicName || "Filme")
    .replace(/^🎞\s*/g, "")
    .replace(/^🎬\s*/g, "")
    .trim();

  const genreTheme =
    genreThemes[cleanTopic] || {
      icon: "🎬",
      archive: "MOVIE ARCHIVE HUB",
      subline: "PREMIUM FILM DATABASE",
      status: "🎞 MOVIE HUB ACTIVE"
    };

  const movies = db.prepare(`
    SELECT title, year, rating, runtime, quality, file_size, collection, library_id
    FROM movies
    WHERE topic_id = (
      SELECT topic_id
      FROM topics
      WHERE name = ?
      LIMIT 1
    )
    ORDER BY title ASC, year ASC
  `).all(topicName);

  const movieCount = movies.length;
  
  const qualityStats = {};

for (const movie of movies) {

  const q =
    movie.quality || "Unbekannt";

  qualityStats[q] =
    (qualityStats[q] || 0) + 1;

}

const qualityLine =
  Object.entries(qualityStats)
    .map(([quality, count]) =>
      `${quality}: ${count}`
    )
    .join(" • ") ||
  "Keine Daten";
  
  const topMovie =
  [...movies]
    .sort((a, b) => {
      return (
        parseFloat(b.rating || 0) -
        parseFloat(a.rating || 0)
      );
    })[0];
    
    const collectionCount =
  new Set(
    movies
      .map((m) => m.collection)
      .filter(Boolean)
  ).size;
  
  const years = movies
  .map((m) => Number(m.year))
  .filter((y) => Number.isFinite(y));

const yearRange =
  years.length
    ? `${Math.min(...years)} → ${Math.max(...years)}`
    : "Unbekannt";
    
    const archiveRank =
  getMovieArchiveRank(movieCount);

const archiveProgress =
  buildMovieArchiveProgressBar(movieCount);

let totalSizeMB = 0;

for (const movie of movies) {

  const size =
    String(movie.file_size || "")
      .toUpperCase()
      .trim();

  const gbMatch =
    size.match(/([\d.]+)\s*GB/);

  const mbMatch =
    size.match(/([\d.]+)\s*MB/);

  if (gbMatch) {

    totalSizeMB +=
      parseFloat(gbMatch[1]) * 1024;

  }

  else if (mbMatch) {

    totalSizeMB +=
      parseFloat(mbMatch[1]);

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

const collectionStats = {};

for (const movie of movies) {

  if (!movie.collection) continue;

  collectionStats[movie.collection] =
    (collectionStats[movie.collection] || 0) + 1;

}

const topCollections =
  Object.entries(collectionStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

let result =
  "━━━━━━━━━━━━━━━━━━\n" +
  `${genreTheme.icon} ${cleanTopic.toUpperCase()} ARCHIVE\n` +
  "━━━━━━━━━━━━━━━━━━\n\n" +

  `📁 ${genreTheme.archive}\n` +
  `${genreTheme.subline}\n` +
  `${genreTheme.status}\n\n` +

  "━━━━━━━━━━━━━━━━━━\n" +

  `🎞 FILME • ${movieCount}\n` +
  `🎞 COLLECTIONS • ${collectionCount}\n` +
  `📅 ZEITRAUM • ${yearRange}\n` +

  `🏅 ARCHIV-RANG • ${archiveRank}\n` +
  `📊 ARCHIV POWER • ${archiveProgress} ${Math.min(movieCount, 100)}%\n` +

  `💾 SPEICHER • ${totalStorage}\n` +
  `⭐ Ø IMDb • ${averageRating}\n` +

  (
    topCollections.length
      ? `🏆 TOP COLLECTIONS • ${topCollections
          .map(([name, count]) =>
            `${name} (${count})`
          )
          .join(" • ")}\n`
      : ""
  ) +

  `📊 QUALITÄT • ${qualityLine}\n` +

  (
    topMovie
      ? `👑 TOP FILM • ${topMovie.title} • ⭐ ${topMovie.rating}\n`
      : ""
  ) +

  "━━━━━━━━━━━━━━━━━━\n\n";

  if (!movies.length) {
    result += "Noch keine Filme gespeichert.\n\n";
  } else {
    movies.forEach((m, index) => {
      result += `${String(index + 1).padStart(2, "0")} • ${m.title}`;
      if (m.year) result += ` (${m.year})`;
      result += "\n";

      result += `⭐ ${m.rating || "Unbekannt"}`;
      if (m.runtime) result += ` • ⏱ ${m.runtime}`;
      if (m.quality) result += ` • ${m.quality}`;
      if (m.file_size) result += ` • ${m.file_size}`;
      result += "\n";

      if (m.collection) result += `🎞 ${m.collection}\n`;
      if (m.library_id) result += `🏷 ${m.library_id}\n`;

      result += "\n";
    });
  }

  result +=
    "━━━━━━━━━━━━━━━━━━\n" +
    "@LibraryOfLegends";

  return result.slice(0, 4000);
}

function getMovieHubTopic(topicId) {
  return db.prepare(`
    SELECT *
    FROM topics
    WHERE topic_id = ?
    LIMIT 1
  `).get(topicId);
}

function saveMovieHubMessageId(topicId, messageId) {
  db.prepare(`
    UPDATE topics
    SET movie_hub_message_id = ?
    WHERE topic_id = ?
  `).run(messageId, topicId);
}

async function createMovieHubIfMissing({
  topicId,
  topicName,
  banner
}) {

  const topic = getMovieHubTopic(topicId);

  if (topic?.movie_hub_message_id) {
    return topic.movie_hub_message_id;
  }

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

      db.prepare(`
        UPDATE topics
        SET movie_banner_message_id = ?
        WHERE topic_id = ?
      `).run(bannerMsg.message_id, topicId);

    }
  }

  const hub = await tg("sendMessage", {
  chat_id: MOVIE_GROUP_ID,
  message_thread_id: topicId,
  text: movieHubCaption(topicName)
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
}

if (hub?.message_id) {
  saveMovieHubMessageId(
    topicId,
    hub.message_id
  );

  return hub.message_id;
}

  return null;
}

async function updateMovieHub({
  topicId,
  topicName
}) {
  const topic = getMovieHubTopic(topicId);

  if (!topic?.movie_hub_message_id) {
    return null;
  }

  return await tg("editMessageText", {
    chat_id: MOVIE_GROUP_ID,
    message_id: topic.movie_hub_message_id,
    text: movieHubCaption(topicName)
  });
}

function bourneMovieCaption(tmdb, extras = {}) {
  const safeOverview = String(tmdb.overview || "Keine Beschreibung verfügbar.")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 360);

  const program = getBourneProgram(tmdb.title);
  
  const agentCode = getBourneAgentCode(tmdb.title);
  
  const collectionNumber = getBourneCollectionNumber(tmdb.title);

  return (
    "━━━━━━━━━━━━━━━━━━\n" +
    `🕶️ ${String(tmdb.title || "").toUpperCase()} (${tmdb.year || "Unbekannt"})\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    "📁 CIA ARCHIVE • CLASSIFIED\n" +
    `🧠 PROGRAMM: ${program}\n` +
    `🛰️ AGENT CODE: ${agentCode}\n` +
    `📀 COLLECTION: ${collectionNumber}\n` +
    `🔥 ${extras.quality || "Unbekannt"} • ${extras.fileSize || "Unbekannt"}\n` +
    `🎭 ${String(tmdb.genre || "Action / Thriller").replace(/\s*\/\s*/g, " • ")}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    `⭐ ${tmdb.rating || "Unbekannt"}\n` +
    `⏱ ${tmdb.runtime || "Unbekannt"} • 🔞 ${tmdb.fsk || "FSK Unbekannt"}\n` +
    `🎥 ${tmdb.director || "Unbekannt"}\n` +
    `👥 ${tmdb.cast || "Unbekannt"}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    "📖 MISSION FILE\n" +
    `${safeOverview}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    `🏷 ${extras.libraryId || ""}\n` +
    "⚠️ STATUS: CLASSIFIED\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    "#JasonBourne #Bourne #CIA #Treadstone #Action #Thriller\n" +
    "@LibraryOfLegends"
  ).slice(0, 900);
}

function getQualityBadge(quality = "") {
  const q = String(quality || "").toUpperCase();

  if (q === "UHD") return "💎 UHD";
  if (q === "FHD") return "🔥 FHD";
  if (q === "HD") return "⚡ HD";
  if (q === "SD") return "📼 SD";

  return "🎞 Qualität unbekannt";
}

function seriesCaption(tmdb, media, extras = {}) {

  const seriesTheme =
    seriesThemes[tmdb.seriesTitle] || {
      icon: "📺",
      archive: "SERIES ARCHIVE",
      subline: "PREMIUM EPISODE DATABASE",
      status: "🎞 SERIES ACTIVE",
      divider: "━━━━━━━━━━━━━━━━━━"
    };

  const divider = seriesTheme.divider;

  const finalEpisodeTitle =
    tmdb.episodeTitle ||
    media.episodeTitleFromFile ||
    "Episode";

  const overview = String(
    tmdb.overview ||
    "Keine Beschreibung verfügbar."
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 320);

  const genreTags = String(tmdb.genre || "")
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((g) => `#${g.replace(/\s+/g, "")}`)
    .join(" ");

  const totalEpisodes =
    getKnownSeasonEpisodeCount(
      tmdb.seriesTitle,
      media.season
    ) || media.episode;

  const progressBlocks =
    "■".repeat(media.episode) +
    "□".repeat(
      Math.max(totalEpisodes - media.episode, 0)
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

  return (
    `${divider}\n` +
    `${seriesTheme.icon} ${String(tmdb.seriesTitle || "").toUpperCase()}\n` +
    `S${media.seasonText}E${media.episodeText} • ${finalEpisodeTitle}\n` +
    `${divider}\n\n` +

    `📁 ${seriesTheme.archive}\n` +
    `${seriesTheme.subline}\n` +
    `${seriesTheme.status}\n\n` +

    `⭐ ${tmdb.rating || "Unbekannt"} IMDb\n` +
    `🏷 ${getQualityBadge(extras.quality)} • ${extras.fileSize || "Unbekannt"}\n` +

    (extras.resolution && extras.resolution !== "Unbekannt"
      ? `🎬 ${extras.resolution}\n`
      : "") +

    (extras.audio && extras.audio !== "Unbekannt"
      ? `🎧 ${extras.audio}\n`
      : "") +

    `${divider}\n` +
    "📀 EPISODEN STATUS\n" +
    `🧩 Fortschritt • ${progressBlocks} ${media.episode}/${totalEpisodes}\n` +
    `📊 Sammlung • ${progressPercent}%\n` +

    (
      missingEpisodes.length
        ? `⚠️ Fehlend • ${missingEpisodes.join(", ")}\n`
        : "✅ Keine fehlenden Episoden\n"
    ) +

    `${divider}\n` +
    "📖 EPISODEN-STORY\n\n" +
    `${overview}\n` +

    `${divider}\n` +
    `🧬 SERIES ID • ${extras.seriesLibraryId || "Unbekannt"}\n` +

    `${divider}\n` +
    `#${String(tmdb.seriesTitle || "").replace(/\s+/g, "")} ${genreTags}\n` +
    "@LibraryOfLegends"
  ).slice(0, 1400);
}

function getSeriesRank(totalEpisodes, officialTotalEpisodes) {
  if (!officialTotalEpisodes || officialTotalEpisodes <= 0) {
    return "⚠️ INCOMPLETE";
  }

  const percent =
    Math.round((totalEpisodes / officialTotalEpisodes) * 100);

  if (percent >= 100) {
    return "💎 FULL COLLECTION";
  }

  if (percent >= 75) {
    return "👑 MASTERED";
  }

  if (percent >= 35) {
    return "🔥 TRENDING";
  }

  return "⚠️ INCOMPLETE";
}

function buildSeriesProgressBar(seriesTitle, current, total) {

  const themes = {
    "The Boys": {
      filled: "■",
      empty: "□"
    },

    "Matrix": {
      filled: "⬢",
      empty: "⬡"
    },

    "Bourne": {
      filled: "⬛",
      empty: "⬜"
    }
  };

  const theme =
    themes[seriesTitle] || {
      filled: "■",
      empty: "□"
    };

  const safeTotal = Math.max(total || 1, 1);

  const percent =
    Math.max(
      0,
      Math.min(1, current / safeTotal)
    );

  const totalBars = 10;

  const filledBars =
    Math.round(percent * totalBars);

  return (
    theme.filled.repeat(filledBars) +
    theme.empty.repeat(totalBars - filledBars)
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

function seasonCaption(tmdb, seasonData, season) {
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

  const savedEpisodes = db.prepare(`
    SELECT COUNT(*) AS count
    FROM series
    WHERE series_title = ?
    AND season = ?
  `).get(tmdb.seriesTitle, season)?.count || 0;

  const totalEpisodes =
    seasonData?.episodes?.length ||
    savedEpisodes;

  const missingEpisodes = [];

  for (let ep = 1; ep <= totalEpisodes; ep++) {
    const exists = db.prepare(`
      SELECT id
      FROM series
      WHERE series_title = ?
      AND season = ?
      AND episode = ?
      LIMIT 1
    `).get(tmdb.seriesTitle, season, ep);

    if (!exists) {
      missingEpisodes.push(`E${String(ep).padStart(2, "0")}`);
    }
  }

  const progressBlocks =
    "■".repeat(savedEpisodes) +
    "□".repeat(Math.max(totalEpisodes - savedEpisodes, 0));

  const progressPercent =
    totalEpisodes > 0
      ? Math.round((savedEpisodes / totalEpisodes) * 100)
      : 0;

  const seasonStatus =
    savedEpisodes >= totalEpisodes
      ? "🏆 STAFFEL VOLLSTÄNDIG"
      : "⚠️ STAFFEL UNVOLLSTÄNDIG";

  return (
    `${divider}\n` +
    `${seriesTheme.icon} ${String(tmdb.seriesTitle || "").toUpperCase()}\n` +
    `${theme.emoji} STAFFEL ${seasonKey}\n` +
    `${divider}\n\n` +

    `📁 ${seriesTheme.archive}\n` +
    `${seriesTheme.subline}\n` +
    `${seriesTheme.status}\n\n` +

    `${divider}\n` +
    `⭐ ${tmdb.rating || "Unbekannt"} IMDb • 🎞 ${episodeCount} Episoden\n` +
    `📅 ${year} • 🔞 ${tmdb.fsk || "FSK Unbekannt"}\n` +

    `${divider}\n` +
    "📀 STAFFEL STATUS\n" +
    `🧩 Fortschritt • ${progressBlocks} ${savedEpisodes}/${totalEpisodes}\n` +
    `📊 Sammlung • ${progressPercent}%\n` +
    (
      missingEpisodes.length
        ? `⚠️ Fehlend • ${missingEpisodes.join(", ")}\n`
        : "✅ Keine fehlenden Episoden\n"
    ) +
    `${seasonStatus}\n` +

    `${divider}\n` +
    "🎬 SHOWRUNNER\n" +
    `${showrunner}\n` +

    `${divider}\n` +
    "👑 CAST\n" +
    `${castLine}\n` +

    `${divider}\n` +
    "📖 ÜBER DIE STAFFEL\n\n" +
    `${overview}\n` +

    `${divider}\n` +
    `${genreLine}\n` +

    `${divider}\n` +
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
  Action: "DEIN_ACTION_BANNER_LINK",
  Abenteuer: "DEIN_ABENTEUER_BANNER_LINK",
  Komödie: "DEIN_KOMÖDIE_BANNER_LINK",
  Drama: null,
  Familie: "DEIN_FAMILIE_BANNER_LINK",
  Fantasy: "DEIN_FANTASY_BANNER_LINK",
  Krimi: "DEIN_KRIMI_BANNER_LINK",
  Horror: "DEIN_HORROR_BANNER_LINK",
  Thriller: "DEIN_THRILLER_BANNER_LINK",
  Mystery: "DEIN_MYSTERY_BANNER_LINK",
  "Science Fiction": "DEIN_SCIENCE_FICTION_BANNER_LINK",
  Kriegsfilme: "DEIN_KRIEGSFILME_BANNER_LINK",
  Dokumentarfilme: "DEIN_DOKUMENTARFILME_BANNER_LINK",
  Historie: "DEIN_HISTORIE_BANNER_LINK",
  Liebesfilme: "DEIN_LIEBESFILME_BANNER_LINK"
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
  "The Boys": 39
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

const timeline =
  existingSeasons.length
    ? existingSeasons
        .map((s) =>
          `S${String(s.season).padStart(2, "0")}`
        )
        .join(" ══▶ ")
    : "Noch keine Staffeln";

  return (
    `${divider}\n` +
    `${theme.icon} ${String(tmdb.seriesTitle || "").toUpperCase()}\n` +
    `${divider}\n\n` +

    `📁 ${theme.archive}\n` +
    `${theme.subline}\n` +
    `${theme.status}\n\n` +

    `${divider}\n` +
    `⭐ RATING • ${tmdb.seriesRating || tmdb.rating || "Unbekannt"} IMDb\n` +
    `📀 STAFFELN • ${seasonCount}\n` +
    `🎞 EPISODEN • ${totalEpisodes}\n` +
    `🧩 ARCHIV STATUS • ${totalEpisodes}/${officialTotalEpisodes} EPISODEN\n` +
    `📊 GESAMT: ${progressBar} ${globalPercent}% • ${totalEpisodes}/${officialTotalEpisodes}\n` +
    `${archiveStatus}\n` +
    `🏅 SERIEN-RANG • ${seriesRank}\n` +
    `${divider}\n\n` +

    "🛰 TIMELINE\n" +
    `${timeline}\n\n` +

    `${divider}\n` +
    "🧭 STAFFELÜBERSICHT\n" +
    `${divider}\n\n` +

    episodeIndex + "\n\n" +

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

function getKnownSeasonEpisodeCount(seriesTitle, seasonNumber) {
  const knownCounts = {
    "The Boys": {
      1: 8,
      2: 8,
      3: 8,
      4: 8,
      5: 7
    }
  };

  return knownCounts[seriesTitle]?.[Number(seasonNumber)] || null;
}

function getKnownSeasonCount(seriesTitle) {
  const knownSeasonCounts = {
    "The Boys": 5
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

  const caption = seasonCaption(tmdb, seasonData, season).slice(0, 950);

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
// TELEGRAM API HELPER
// =============================
async function tg(method, data = {}) {
  try {
    const res = await axios.post(`${BASE_URL}/${method}`, data);
    return res.data.result;
  } catch (err) {
    const errorData = err.response?.data || err.message;

    console.error(`❌ Telegram API Fehler bei ${method}:`);
    console.error(JSON.stringify(errorData, null, 2));

    return {
      __error: true,
      method,
      error: errorData
    };
  }
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

  const existing = getTopic(uniqueKey);
  if (existing) {
    return existing.topic_id;
  }

  const topic = await tg("createForumTopic", {
    chat_id: chatId,
    name: name
  });

  if (!topic?.message_thread_id) {
  console.error("❌ Thema konnte nicht erstellt werden:", name);
  console.error("Telegram Antwort:", JSON.stringify(topic, null, 2));
  return null;
}

  saveTopic({
    name,
    type,
    chatId,
    topicId: topic.message_thread_id,
    uniqueKey
  });

  console.log("✅ Thema erstellt:", name, topic.message_thread_id);

  return topic.message_thread_id;
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

  if (callback) {
    const userId = String(callback.from?.id || "");

    console.log("🔘 Button gedrückt:", callback.data);
    console.log("USER ID:", userId);

    if (userId !== ADMIN_ID) {
      console.log("⛔ Button ignored - nicht Admin");
      return;
    }

    await handleCallback(callback);
    return;
  }

  const msg = update.message || update.edited_message;
  if (!msg) return;

  const userId = String(msg.from?.id || "");

  console.log("USER ID:", userId);
  console.log("CHAT ID:", msg.chat?.id, "CHAT TITLE:", msg.chat?.title);

  if (userId !== ADMIN_ID) {
    console.log("⛔ Ignored - nicht Admin");
    return;
  }

  if (msg.text) {
    await handleCommand(msg);
    return;
  }

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

if (msg.video || msg.document) {
  console.log("🎥 Video/Datei erkannt");
  await handleUpload(msg);
  return;
}

  console.log("⚠️ Unbekannter Nachrichtentyp");
}

async function handleCallback(callback) {
  const data = callback.data;
  const chatId = callback.message.chat.id;

  await tg("answerCallbackQuery", {
    callback_query_id: callback.id
  });

  console.log("✅ Callback verarbeitet:", data);
  
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
  
  if (data.startsWith("seriespick_")) {
  const tmdbId = data.replace("seriespick_", "");

  const details = await tmdbGet(`/tv/${tmdbId}`, {
    append_to_response: "credits,content_ratings"
  });

  if (!details) {
    await tg("answerCallbackQuery", {
      callback_query_id: callback.id,
      text: "❌ Serie nicht gefunden"
    });
    return;
  }

  const poster =
    details.poster_path
      ? posterUrl(details.poster_path)
      : "https://via.placeholder.com/500x750.png?text=No+Poster";

  await tg("sendPhoto", {
    chat_id: callback.message.chat.id,
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

  await tg("answerCallbackQuery", {
    callback_query_id: callback.id,
    text: "✅ Serie geladen"
  });

  return;
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

if (data === "bourne_dossier") {
  return await tg("sendMessage", {
    chat_id: chatId,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "📁 CIA DOSSIER\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "🕶️ SUBJECT: Jason Bourne\n" +
      "📛 REAL NAME: David Webb\n" +
      "🧠 PROGRAM: TREADSTONE\n" +
      "⚠️ STATUS: ROGUE AGENT\n" +
      "🎯 CLEARANCE: BLACK\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "Er weiß nicht, wer er ist.\n" +
      "Aber sie haben Angst davor.\n" +
      "━━━━━━━━━━━━━━━━━━"
  });
}

if (data === "bourne_programs") {
  return await tg("sendMessage", {
    chat_id: chatId,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🧠 BOURNE PROGRAMME\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "01 • TREADSTONE\n" +
      "Geheimes CIA-Programm zur Ausbildung perfekter Attentäter.\n\n" +
      "02 • BLACKBRIAR\n" +
      "Nachfolger von Treadstone — aggressiver, geheimer, gefährlicher.\n\n" +
      "03 • OUTCOME\n" +
      "Erweitertes Agentenprogramm mit körperlicher und mentaler Optimierung.\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "⚠️ STATUS: CLASSIFIED"
  });
}

if (data === "bourne_archive") {
  const rows = db.prepare(`
    SELECT title, year, library_id
    FROM movies
    WHERE LOWER(title) LIKE '%bourne%'
       OR LOWER(collection) LIKE '%bourne%'
    ORDER BY year ASC, title ASC
  `).all();

  let text =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🛰️ BOURNE ARCHIVE\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!rows.length) {
    text += "Noch keine Bourne-Filme gespeichert.\n";
  } else {
    rows.forEach((m, index) => {
      text += `${String(index + 1).padStart(2, "0")} • ${m.title} (${m.year || "Unbekannt"})\n`;
      if (m.library_id) text += `     🏷 ${m.library_id}\n`;
    });
  }

  text +=
    "\n━━━━━━━━━━━━━━━━━━\n" +
    `🎬 Filme im Archiv: ${rows.length}\n` +
    "⚠️ STATUS: CLASSIFIED";

  return await tg("sendMessage", {
    chat_id: chatId,
    text: text.slice(0, 4000)
  });
}

if (data === "bourne_collection") {
  return await tg("sendMessage", {
    chat_id: chatId,
    text: bourneHubCaption()
  });
}

if (data === "bourne_next") {
  return await tg("sendMessage", {
    chat_id: chatId,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "➡️ NÄCHSTE MISSION\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "Öffne das Bourne Archive, um den nächsten gespeicherten Film in der Collection zu finden.\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "🛰️ Tipp: Nutze den Button BOURNE ARCHIVE\n" +
      "⚠️ STATUS: CLASSIFIED"
  });
}

if (data === "panel_missing_bourne") {
  return await handleCommand({ chat: { id: chatId }, text: "/missingbourne" });
}

if (data === "panel_bourne") {
  return await handleCommand({ chat: { id: chatId }, text: "/bourne" });
}

if (data === "panel_bourne_hub") {
  return await handleCommand({ chat: { id: chatId }, text: "/rebuildbournehub" });
}

if (data === "panel_rebuild_collections") {
  return await handleCommand({ chat: { id: chatId }, text: "/rebuildcollections" });
}

  if (data === "panel_movies") {
    return await handleCommand({ chat: { id: chatId }, text: "/movies" });
  }

  if (data === "panel_series") {
    return await handleCommand({ chat: { id: chatId }, text: "/series" });
  }

  if (data === "panel_serieshub") {
    return await handleCommand({ chat: { id: chatId }, text: "/serieshub" });
  }

  if (data === "panel_seriesaz") {
    return await handleCommand({ chat: { id: chatId }, text: "/seriesaz" });
  }

  if (data === "panel_newseries") {
    return await handleCommand({ chat: { id: chatId }, text: "/newseries" });
  }

  if (data === "panel_trending") {
    return await handleCommand({ chat: { id: chatId }, text: "/trendingseries" });
  }

  if (data === "panel_featured") {
    return await handleCommand({ chat: { id: chatId }, text: "/featuredseries" });
  }

  if (data === "panel_az") {
    return await handleCommand({ chat: { id: chatId }, text: "/az" });
  }

  if (data === "panel_duplicates") {
    return await handleCommand({ chat: { id: chatId }, text: "/duplicates" });
  }
  
  if (data === "panel_dashboard") {
  return await handleCommand({ chat: { id: chatId }, text: "/dashboard" });
}

  if (data === "panel_stats") {
    return await handleCommand({ chat: { id: chatId }, text: "/stats" });
  }

  if (data === "panel_missing_help") {
    return await tg("sendMessage", {
      chat_id: chatId,
      text: "🧩 Nutzung:\n/missingseries Serienname\n\nBeispiel:\n/missingseries Game of Thrones"
    });
  }

  if (data === "panel_search_help") {
    return await tg("sendMessage", {
      chat_id: chatId,
      text: "🔎 Nutzung:\n/search titel\n\nBeispiel:\n/search Game of Thrones"
    });
  }

  if (data === "panel_setseries_help") {
    return await tg("sendMessage", {
      chat_id: chatId,
      text: "📌 Nutzung:\n/setseries Serienname\n\nBeispiel:\n/setseries Timon und Pumbaa"
    });
  }

  if (data === "panel_clearseries") {
    return await handleCommand({ chat: { id: chatId }, text: "/clearseries" });
  }

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

  if (text === "/start" || text === "/admin") {
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "🎛 𝐋𝐈𝐁𝐑𝐀𝐑𝐘 𝐂𝐎𝐍𝐓𝐑𝐎𝐋\n\n" +

      "🎬 FILME\n" +
"• /movies — Filme anzeigen\n" +
"• /collections — Filmreihen anzeigen\n" +
"• /collection name — Filmreihe Details\n" +
"• /bourne — Bourne Archiv anzeigen\n" +
"• /bournehelp — Bourne Hilfe anzeigen\n" +
"• /missingbourne — Fehlende Bourne Filme\n" +
"• /rebuildbournehub — Bourne Hub neu erstellen\n" +
"• /bournesetup — Bourne System aktualisieren\n" +
"• /rebuildcollections — Alle Collection Hubs aktualisieren\n" +
"• /fixmovie alt | neu | jahr — Film korrigieren\n\n" +

      "📺 SERIEN\n" +
      "• /series — Serien anzeigen\n" +
      "• /seriesaz — Serien A–Z\n" +
      "• /serieshub — Serien Dashboard\n" +
      "• /newseries — Neue Folgen\n" +
      "• /progress name — Serien-Fortschritt\n" +
      "• /missingseries name — Fehlende Episoden\n" +
      "• /checkseries name — Premium Serien-Scan\n" +
      "• /rebuildseasoncards name — Staffelkarten neu erstellen\n" +
      "• /fixseries alt | neu — Serie korrigieren\n\n" +

      "🧹 VERWALTUNG\n" +
      "• /az — Gesamt A–Z\n" +
      "• /duplicates — Duplikate prüfen\n" +
      "• /smartduplicates — Smart-Duplikate\n" +
      "• /deletemovie name — Film löschen\n" +
      "• /deleteseries name S01E01 — Episode löschen\n\n" +

      "📊 SYSTEM\n" +
      "• /dashboard — Premium Dashboard\n" +
      "• /stats — Statistik\n" +
      "• /qualitystats — Qualitäts-Statistik\n" +
      "• /search titel — Suche\n" +
      "• /backup — Datenbank sichern"
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

if (text === "/clearseries") {
  CURRENT_SERIES_NAME = "";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: "🗑 Serienname zurückgesetzt."
  });

  return;
}

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
    const backupPath = path.join("/tmp", `library-backup-${Date.now()}.db`);

    await db.backup(backupPath);

    const stats = {
      movies: db.prepare("SELECT COUNT(*) AS count FROM movies").get().count,
      series: db.prepare("SELECT COUNT(*) AS count FROM series").get().count,
      topics: db.prepare("SELECT COUNT(*) AS count FROM topics").get().count
    };

    const FormData = require("form-data");
    const form = new FormData();

    form.append("chat_id", msg.chat.id);
    form.append("document", fs.createReadStream(backupPath), "library.db");
    form.append(
      "caption",
      "✅ Datenbank Backup\n\n" +
      `🎬 Filme: ${stats.movies}\n` +
      `📺 Serien-Episoden: ${stats.series}\n` +
      `🧵 Themen: ${stats.topics}`
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

if (text.startsWith("/deletemovie")) {
  const query = text.replace("/deletemovie", "").trim();

  if (!query) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "⚠️ Nutzung:\n/deletemovie Filmname"
    });
    return;
  }

  const movie = db.prepare(`
    SELECT * FROM movies
    WHERE LOWER(title) LIKE ?
    LIMIT 1
  `).get(`%${query.toLowerCase()}%`);

  if (!movie) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Film nicht gefunden."
    });
    return;
  }

  db.prepare(`
    DELETE FROM movies
    WHERE id = ?
  `).run(movie.id);

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "🗑 Film gelöscht:\n\n" +
      `🎬 ${movie.title} ${movie.year || ""}`
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

  const bourneCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM movies
    WHERE LOWER(title) LIKE '%bourne%'
       OR LOWER(collection) LIKE '%bourne%'
  `).get().count;

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🎛 PREMIUM DASHBOARD\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `🎬 Filme: ${movieCount}\n` +
      `🎞 Collections: ${collectionCount}\n` +
      `🕶️ Bourne Archiv: ${bourneCount}/5\n` +
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
  
  if (text === "/bournehelp") {
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🕶️ BOURNE COMMAND CENTER\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      "🛰️ /bourne — Bourne Archiv anzeigen\n" +
      "🧩 /missingbourne — Fehlende Bourne Filme prüfen\n" +
      "📌 /rebuildbournehub — Bourne Hub neu erstellen\n" +
      "⚙️ /bournesetup — Bourne System aktualisieren\n" +
      "🎛 /dashboard — Premium Dashboard\n\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "⚠️ STATUS: CLASSIFIED\n" +
      "@LibraryOfLegends"
  });

  return;
}
  
  if (text === "/bournesetup") {
  const topic = db.prepare(`
    SELECT *
    FROM topics
    WHERE name = ?
    AND chat_id = ?
    LIMIT 1
  `).get("🎞 Bourne Filmreihe", String(MOVIE_GROUP_ID));

  if (topic?.topic_id) {
    await createOrUpdateBourneHub(topic.topic_id);
  }

  const bourneCount = db.prepare(`
    SELECT COUNT(*) AS count
    FROM movies
    WHERE LOWER(title) LIKE '%bourne%'
       OR LOWER(collection) LIKE '%bourne%'
  `).get().count;

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      "🕶️ BOURNE SETUP\n" +
      "━━━━━━━━━━━━━━━━━━\n\n" +
      `📌 Hub: ${topic?.topic_id ? "Aktualisiert" : "Nicht gefunden"}\n` +
      `🎬 Filme: ${bourneCount}/5\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "Nutze danach:\n" +
      "/missingbourne\n" +
      "/bourne\n" +
      "/dashboard\n" +
      "━━━━━━━━━━━━━━━━━━"
  });

  return;
}
  
  if (text === "/missingbourne") {
  const required = [
    { title: "Die Bourne Identität", year: "2002" },
    { title: "Die Bourne Verschwörung", year: "2004" },
    { title: "Das Bourne Ultimatum", year: "2007" },
    { title: "Das Bourne Vermächtnis", year: "2012" },
    { title: "Jason Bourne", year: "2016" }
  ];

  const rows = db.prepare(`
    SELECT title, year
    FROM movies
    WHERE LOWER(title) LIKE '%bourne%'
       OR LOWER(collection) LIKE '%bourne%'
  `).all();

  const stored = rows.map((m) => `${String(m.title).toLowerCase()}-${m.year}`);

  const missing = required.filter((m) => {
    return !stored.some((s) => s.includes(String(m.year)));
  });

  let result =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🧩 FEHLENDE BOURNE FILME\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!missing.length) {
    result += "🏆 Bourne Collection vollständig.\n";
  } else {
    missing.forEach((m, index) => {
      result += `${index + 1}. ${m.title} (${m.year})\n`;
    });
  }

  result +=
    "\n━━━━━━━━━━━━━━━━━━\n" +
    `✅ Vorhanden: ${savedBourneMovies}/${totalBourneMovies}\n` +
    `⚠️ Fehlend: ${missing.length}/5\n` +
    "@LibraryOfLegends";

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: result
  });

  return;
}
  
  if (text === "/bourne") {
  const rows = db.prepare(`
    SELECT title, year, rating, runtime, library_id
    FROM movies
    WHERE LOWER(title) LIKE '%bourne%'
       OR LOWER(collection) LIKE '%bourne%'
    ORDER BY year ASC, title ASC
  `).all();

  let result =
    "━━━━━━━━━━━━━━━━━━\n" +
    "🕶️ JASON BOURNE ARCHIVE\n" +
    "━━━━━━━━━━━━━━━━━━\n\n";

  if (!rows.length) {
    result += "Noch keine Bourne-Filme gespeichert.\n";
  } else {
    rows.forEach((m, index) => {
      result += `${String(index + 1).padStart(2, "0")} • ${m.title} (${m.year || "Unbekannt"})\n`;
      result += `⭐ ${m.rating || "Unbekannt"} • ⏱ ${m.runtime || "Unbekannt"}\n`;
      if (m.library_id) result += `🏷 ${m.library_id}\n`;
      result += "\n";
    });
  }

  result +=
    "━━━━━━━━━━━━━━━━━━\n" +
    `🎬 Filme: ${rows.length}\n` +
    "⚠️ STATUS: CLASSIFIED\n" +
    "@LibraryOfLegends";

  await tg("sendMessage", {
  chat_id: msg.chat.id,
  text: result.slice(0, 4000),
  reply_markup: {
    inline_keyboard: [
      [
        { text: "📌 HUB AKTUALISIEREN", callback_data: "panel_bourne_hub" }
      ],
      [
        { text: "🧩 FEHLENDE FILME", callback_data: "panel_missing_bourne" },
        { text: "🎛 DASHBOARD", callback_data: "panel_dashboard" }
      ]
    ]
  }
});

  return;
}

if (text === "/rebuildbournehub") {
  const topic = db.prepare(`
    SELECT *
    FROM topics
    WHERE name = ?
    AND chat_id = ?
    LIMIT 1
  `).get("🎞 Bourne Filmreihe", String(MOVIE_GROUP_ID));

  if (!topic?.topic_id) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Bourne-Thema nicht gefunden. Lade zuerst einen Bourne-Film hoch."
    });
    return;
  }

  await createOrUpdateBourneHub(topic.topic_id);

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: "✅ Premium Bourne-Hub wurde erstellt/aktualisiert."
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
  { text: "🕶️ Bourne Archiv", callback_data: "panel_bourne" },
  { text: "🔄 Bourne Hub", callback_data: "panel_bourne_hub" }
],
[
  { text: "🎞 Collections Rebuild", callback_data: "panel_rebuild_collections" }
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

  const extras = {
    ...getMediaExtras(fileName, msg),
    libraryId: makeLibraryCode(tmdb.genre)
  };

  const isBourne = isBourneMovie(tmdb, fileName);

const genreTopicName = tmdb.mainGenre || "Sonstige";

let finalTopicName = genreTopicName;
let finalTopicType = "movie_genre";

if (isBourne) {
  finalTopicName = "🎞 Bourne Filmreihe";
  finalTopicType = "collection";
} else if (tmdb.collection && tmdb.collectionId) {
  finalTopicName = `🎞 ${tmdb.collection}`;
  finalTopicType = "collection";
}

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
  
  await createMovieHubIfMissing({
  topicId,
  topicName: finalTopicName,
  banner:
    genreBanners?.[finalTopicName] ||
    genreBanners?.[tmdb.mainGenre] ||
    null
});
  
  if (tmdb.collection && tmdb.collectionId) {
  const existingCollection = getCollection(tmdb.collectionId);

  if (!existingCollection) {
    saveCollection({
      collectionName: tmdb.collection,
      tmdbCollectionId: tmdb.collectionId,
      topicId,
      posterUrl: tmdb.collectionPoster || tmdb.posterUrl
    });
  }
}

if (tmdb.collection && tmdb.collectionId) {
  const collection = getCollection(tmdb.collectionId);

  if (true) {
    const theme =
      collectionThemes[tmdb.collection] || {};

    const banner =
      collectionBanners[tmdb.collection] ||
      tmdb.collectionBackdrop ||
      tmdb.collectionPoster ||
      tmdb.posterUrl;

    const finalBanner = banner;

    console.log("🖼️ COLLECTION BANNER INPUT:", banner);
console.log("🖼️ COLLECTION BANNER FINAL:", finalBanner);

const bannerCaption =
  "━━━━━━━━━━━━━━━━━━\n" +
  `${theme.icon || "🎞"} ${String(tmdb.collection || "").toUpperCase()}\n` +
  "━━━━━━━━━━━━━━━━━━\n\n" +
  `📁 ${theme.archive || "COLLECTION ARCHIVE"}\n` +
  `${theme.subline || "PREMIUM FILM COLLECTION"}\n` +
  `${theme.status || "🎬 FILMREIHE"}\n\n` +
  "━━━━━━━━━━━━━━━━━━\n" +
  "@LibraryOfLegends";

let bannerMsg = null;

if (String(finalBanner).startsWith("/tmp/")) {

  bannerMsg = await sendLocalPhoto({
    chatId: MOVIE_GROUP_ID,
    topicId,
    photoPath: finalBanner,
    caption: bannerCaption
  });

} else {

  bannerMsg = await tg("sendPhoto", {
    chat_id: MOVIE_GROUP_ID,
    message_thread_id: topicId,
    photo: finalBanner,
    caption: bannerCaption
  });

}

if (!bannerMsg?.message_id) {
  console.error("⚠️ Generated Banner fehlgeschlagen, versuche Original:", JSON.stringify(bannerMsg, null, 2));

  bannerMsg = await tg("sendPhoto", {
    chat_id: MOVIE_GROUP_ID,
    message_thread_id: topicId,
    photo: banner,
    caption: bannerCaption
  });
}

    if (bannerMsg?.message_id) {
      db.prepare(`
        UPDATE collections
        SET banner_message_id = ?
        WHERE tmdb_collection_id = ?
      `).run(bannerMsg.message_id, tmdb.collectionId);
    }
  }

  await createOrUpdateCollectionHub(tmdb, topicId);
}

if (isBourne) {
  try {
    await createOrUpdateBourneHub(topicId);
  } catch (err) {
    console.error("⚠️ Bourne Hub Vorab-Update Fehler:", err.message);
  }
}

  await tg("sendPhoto", {
    chat_id: MOVIE_GROUP_ID,
    message_thread_id: topicId,
    photo:
      tmdb.posterUrl ||
      "https://via.placeholder.com/500x750.png?text=No+Cover"
  });

const copied = await copyOriginalMedia({
  fromChatId: msg.chat.id,
  messageId: msg.message_id,
  targetChatId: MOVIE_GROUP_ID,
  topicId,
  caption: isBourne
    ? bourneMovieCaption(tmdb, extras)
    : movieCaption(tmdb, extras),
    fileId,
isVideo: !!msg.video,
adminChatId: msg.chat.id,
replyMarkup: isBourne ? bourneKeyboard(tmdb.title) : null
});

  if (!copied?.message_id) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "⚠️ Film-Cover wurde gepostet, aber Datei konnte nicht kopiert werden."
    });
    return;
  }
  
  const universeData =
  detectUniverse(
    tmdb.title,
    tmdb.collection
  );

saveMovie({
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

try {
  await updateMovieHub({
    topicId,
    topicName: finalTopicName
  });
} catch (err) {
  console.error("⚠️ Movie Hub Update Fehler:", err.message);
}

try {
  if (isBourne) {
    await createOrUpdateBourneHub(topicId);
  } else if (tmdb.collection && tmdb.collectionId) {
    await createOrUpdateCollectionHub(tmdb, topicId);
  }
} catch (err) {
  console.error("⚠️ Collection/Bourne Hub Update Fehler:", err.message);
}

await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "✅ Film erfolgreich einsortiert:\n\n" +
      `🎬 ${tmdb.title}\n` +
      `🎭 Thema: ${finalTopicName}\n` +
      (tmdb.collection ? `🎞 Filmreihe: ${tmdb.collection}\n` : "") +
      `🏷 ${extras.libraryId}`
  });

  logToDb("movie_saved", `${tmdb.title} ${tmdb.year || ""}`);
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

  const manualMovie = parseManualMovieCaption(msg.caption || "");

const media = manualMovie || parseMedia(fileName);

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

const captionText = seriesCaption(tmdb, media, extras);

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

    saveSeries({
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
  seriesLibraryId: extras.seriesLibraryId
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

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "✅ Serie erfolgreich einsortiert:\n\n" +
        `📺 ${tmdb.seriesTitle} S${media.seasonText}E${media.episodeText}\n` +
        `🧵 Thema: ${tmdb.seriesTitle}`
    });

    logToDb("series_saved", `${tmdb.seriesTitle} S${media.seasonText}E${media.episodeText}`);
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
}

// =============================
// SERVER START
// =============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server läuft auf Port ${PORT}`);
});