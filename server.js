const express = require("express");
const axios = require("axios");
const Database = require("better-sqlite3");
const sharp = require("sharp");
const fs = require("fs");

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
    .replace(/\b(german|deutsch|ger|english|englisch|eng|multi|dubbed|subbed|dl|dual|dts|ddp|aac|ac3|x264|x265|h264|h265|hevc|bluray|brrip|webrip|web|webdl|web-dl|hdrip|dvdrip|remux|uhd|fhd|fullhd|hd|sd|4k|2160p|1080p|720p|576p|480p|original|orginal|originale|orginale|alte|tonspur|line|mic|md|proper|repack)\b/gi, "")
    .replace(/[()[\]{}]/g, " ")
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
  const normalized = raw.replace(/[._-]+/g, " ");

  const patterns = [
    /\bS\s?(\d{1,2})\s?E\s?(\d{1,3})\b/i,
    /\bS\s?(\d{1,2})\s*[-_. ]\s?E\s?(\d{1,3})\b/i,
    /\b(\d{1,2})x(\d{1,3})\b/i,
    /\bStaffel\s*(\d{1,2})\s*Folge\s*(\d{1,3})\b/i,
    /\bSeason\s*(\d{1,2})\s*Episode\s*(\d{1,3})\b/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;

    const season = parseInt(match[1], 10);
    const episode = parseInt(match[2], 10);

    const beforeCode = normalized.slice(0, match.index);

let titleClean = cleanFileName(beforeCode);

if (!titleClean && CURRENT_SERIES_NAME) {
  titleClean = CURRENT_SERIES_NAME;
}
titleClean = titleClean.replace(/\b(19\d{2}|20\d{2})\b/g, "").replace(/\s+/g, " ").trim();

    return {
      isSeries: true,
      seriesTitle: normalizeTitle(titleClean),
      season,
      episode,
      seasonText: String(season).padStart(2, "0"),
      episodeText: String(episode).padStart(2, "0")
    };
  }

  return { isSeries: false };
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
  return {
    quality: detectQuality(fileName, msg.video),
    resolution: detectResolution(msg.video),
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

// =============================
// TMDB API
// =============================

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

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

async function searchMovieTMDB(title, year = "") {
  const search = await tmdbGet("/search/movie", {
    query: title,
    year: year || undefined,
    include_adult: false
  });

  if (!search?.results?.length) return null;

  const best = search.results[0];

  const details = await tmdbGet(`/movie/${best.id}`, {
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
    title: details.title || title,
    year: details.release_date ? details.release_date.slice(0, 4) : year,
    genre: formatGenres(details.genres),
    mainGenre: getMainGenre(details.genres),
    rating: formatRating(details.vote_average),
    runtime: details.runtime ? `${details.runtime} Min.` : "Unbekannt",
    overview: details.overview || "Keine Beschreibung verfügbar.",
    posterUrl: posterUrl(details.poster_path),
    collection: details.belongs_to_collection?.name || "",
    director,
    cast,
    fsk: fsk ? `FSK ${fsk}` : "FSK Unbekannt"
  };
}

async function searchSeriesTMDB(title, season, episode) {
  const search = await tmdbGet("/search/tv", {
    query: title,
    include_adult: false
  });

  if (!search?.results?.length) return null;

  const best = search.results[0];

  const details = await tmdbGet(`/tv/${best.id}`);

  let episodeDetails = null;

  try {
    episodeDetails = await tmdbGet(
      `/tv/${best.id}/season/${season}/episode/${episode}`
    );
  } catch (err) {
    episodeDetails = null;
  }

  return {
    tmdbId: details.id,
    seriesTitle: details.name || title,
    episodeTitle: episodeDetails?.name || "",
    genre: formatGenres(details.genres),
    mainGenre: getMainGenre(details.genres),
    rating: formatRating(details.vote_average),
    overview:
      episodeDetails?.overview ||
      details.overview ||
      "Keine Beschreibung verfügbar.",
    posterUrl: posterUrl(episodeDetails?.still_path || details.poster_path)
  };
}

async function createBrandedCover(posterUrl, title = "") {
  try {
    console.log("LOGO CHECK logo.png.PNG:", fs.existsSync("logo.png.PNG"));
    console.log("WATERMARK CHECK watermark.png.PNG:", fs.existsSync("watermark.png.PNG"));

    const imageRes = await axios.get(posterUrl, {
      responseType: "arraybuffer"
    });

    const inputBuffer = Buffer.from(imageRes.data);

    const logo = await sharp("logo.png.PNG")
      .resize(260)
      .png()
      .toBuffer();

    const watermark = await sharp("watermark.png.PNG")
      .resize(70)
      .png()
      .toBuffer();

    const gradient = Buffer.from(`
      <svg width="500" height="750">
        <defs>
          <linearGradient id="g" x1="0" y1="450" x2="0" y2="750">
            <stop offset="0%" stop-color="black" stop-opacity="0"/>
            <stop offset="100%" stop-color="black" stop-opacity="0.85"/>
          </linearGradient>
        </defs>
        <rect x="0" y="450" width="500" height="300" fill="url(#g)"/>
      </svg>
    `);

    const outputPath = `/tmp/cover-${Date.now()}.jpg`;

    await sharp(inputBuffer)
      .resize(500, 750)
      .composite([
        { input: gradient, top: 0, left: 0 },
        { input: logo, gravity: "south" },
        { input: watermark, gravity: "southeast" }
      ])
      .jpeg({ quality: 95 })
      .toFile(outputPath);

    return outputPath;
  } catch (err) {
    console.error("❌ Branding Cover Fehler:", err.message);
    console.error("LOGO CHECK logo.png.PNG:", fs.existsSync("logo.png.PNG"));
    console.error("WATERMARK CHECK watermark.png.PNG:", fs.existsSync("watermark.png.PNG"));

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

function movieCaption(tmdb, extras = {}) {
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

  const mediaLines = [];

  mediaLines.push(`🔥 ${extras.quality || "Unbekannt"} • ${extras.fileSize || "Unbekannt"}`);
  mediaLines.push(`🎭 ${genreText}`);

  if (extras.resolution && extras.resolution !== "Unbekannt") {
    mediaLines.push(`🎞 ${extras.resolution}`);
  }

  if (extras.source && extras.source !== "Unbekannt") {
    mediaLines.push(`💿 ${extras.source}`);
  }

  if (extras.audio && extras.audio !== "Unbekannt") {
    mediaLines.push(`🎧 ${extras.audio}`);
  }

  return (
    "━━━━━━━━━━━━━━━━━━\n" +
    `🎬 𝐇𝐀𝐕𝐎𝐂 (${tmdb.year || "Unbekannt"})\n`
      .replace("𝐇𝐀𝐕𝐎𝐂", tmdb.title.toUpperCase()) +
    "━━━━━━━━━━━━━━━━━━\n" +
    mediaLines.join("\n") + "\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    `⭐ ${tmdb.rating}\n` +
    `⏱ ${tmdb.runtime} • 🔞 ${tmdb.fsk}\n` +
    `🎥 ${tmdb.director}\n` +
    `👥 ${tmdb.cast}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    "📖 STORY\n" +
    `${String(tmdb.overview || "Keine Beschreibung verfügbar.").slice(0, 600)}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    `🏷 ${extras.libraryId}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    `${genreTags}\n` +
    "@LibraryOfLegends"
  );
}

function seriesCaption(tmdb, media, extras = {}) {
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

  const episodeTitle = tmdb.episodeTitle
    ? ` • ${tmdb.episodeTitle}`
    : "";

  const mediaLines = [];

  mediaLines.push(`🔥 ${extras.quality || "Unbekannt"} • ${extras.fileSize || "Unbekannt"}`);
  mediaLines.push(`🎭 ${genreText}`);

  if (extras.resolution && extras.resolution !== "Unbekannt") {
    mediaLines.push(`🎞 ${extras.resolution}`);
  }

  if (extras.source && extras.source !== "Unbekannt") {
    mediaLines.push(`💿 ${extras.source}`);
  }

  if (extras.audio && extras.audio !== "Unbekannt") {
    mediaLines.push(`🎧 ${extras.audio}`);
  }

  return (
    "━━━━━━━━━━━━━━━━━━\n" +
    `📺 ${tmdb.seriesTitle.toUpperCase()}\n` +
    `🎞 S${media.seasonText}E${media.episodeText}${episodeTitle}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    mediaLines.join("\n") + "\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    `⭐ ${tmdb.rating || "Unbekannt"}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    "📖 STORY\n" +
    `${String(tmdb.overview || "Keine Beschreibung verfügbar.").slice(0, 600)}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    `#${tmdb.seriesTitle.replace(/\s+/g, "")} ${genreTags}\n` +
    "@LibraryOfLegends"
  );
}

// =============================
// SERIES HUB LAYOUT
// =============================
function seriesHubCaption(tmdb) {
  const genreText = String(tmdb.genre || "Sonstige")
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean)
    .join(" • ");

  const tags = String(tmdb.genre || "")
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((g) => `#${g.replace(/\s+/g, "")}`)
    .join(" ");

  const episodeIndex = buildEpisodeIndex(tmdb.seriesTitle);

  return (
    "━━━━━━━━━━━━━━━━━━\n" +
    `📺 ${tmdb.seriesTitle.toUpperCase()}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    `🎭 ${genreText}\n` +
    `⭐ ${tmdb.rating || "Unbekannt"}\n` +
    "━━━━━━━━━━━━━━━━━━\n" +
    "🧭 STAFFELHUB\n\n" +
    episodeIndex + "\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    `#${tmdb.seriesTitle.replace(/\s+/g, "")} ${tags}\n` +
    "@LibraryOfLegends"
  );
}

function buildEpisodeIndex(seriesTitle) {
  const episodes = db.prepare(`
    SELECT season, episode, episode_title
    FROM series
    WHERE series_title = ?
    ORDER BY season ASC, episode ASC
  `).all(seriesTitle);

  if (!episodes.length) {
    return "📀 Staffel 01 — 0 Episode(n)\n└ Episoden werden automatisch ergänzt";
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

    result += `📀 Staffel ${seasonText} — ${seasonEpisodes.length} Episode(n)\n`;

    seasonEpisodes.forEach((ep, index) => {
      const epCode =
        `S${String(ep.season).padStart(2, "0")}E${String(ep.episode).padStart(2, "0")}`;

      const prefix = index === seasonEpisodes.length - 1 ? "└" : "├";

      result += `${prefix} ${epCode}${ep.episode_title ? ` • ${ep.episode_title}` : ""}\n`;
    });
  }

  return result.trim();
}

function getSeriesHubTopic(topicId) {
  return db.prepare(`
    SELECT * FROM topics
    WHERE topic_id = ?
  `).get(topicId);
}

function saveHubMessageId(topicId, messageId) {
  db.prepare(`
    UPDATE topics
    SET hub_message_id = ?
    WHERE topic_id = ?
  `).run(messageId, topicId);
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

async function createSeriesHubIfMissing({ tmdb, topicId }) {
  const topic = getSeriesHubTopic(topicId);

  if (topic?.hub_message_id) {
    return topic.hub_message_id;
  }

  await tg("sendPhoto", {
    chat_id: SERIES_GROUP_ID,
    message_thread_id: topicId,
    photo:
      tmdb.posterUrl ||
      "https://via.placeholder.com/500x750.png?text=No+Cover"
  });
  
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

async function createSeasonSeparatorIfMissing({ topicId, season }) {
  const separators = getSeasonSeparators(topicId);
  const seasonKey = String(season).padStart(2, "0");

  if (separators[seasonKey]) {
    return separators[seasonKey];
  }

  const msg = await tg("sendMessage", {
    chat_id: SERIES_GROUP_ID,
    message_thread_id: topicId,
    text:
      "━━━━━━━━━━━━━━━━━━\n" +
      `📀 STAFFEL ${seasonKey}\n` +
      "━━━━━━━━━━━━━━━━━━"
  });

  if (msg?.message_id) {
    separators[seasonKey] = msg.message_id;
    saveSeasonSeparators(topicId, separators);
    return msg.message_id;
  }

  return null;
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

// =============================
// COPY MEDIA TO TARGET GROUP
// =============================
async function copyOriginalMedia({ fromChatId, messageId, targetChatId, topicId, caption = "" }) {
  const data = {
    chat_id: targetChatId,
    from_chat_id: fromChatId,
    message_id: messageId,
    message_thread_id: topicId
  };

  if (caption) {
    data.caption = String(caption).slice(0, 1000);
  }

  let result = await tg("copyMessage", data);

  if (result?.__error && caption) {
    console.log("⚠️ Copy mit Caption fehlgeschlagen — versuche ohne Caption");

    const fallbackData = {
      chat_id: targetChatId,
      from_chat_id: fromChatId,
      message_id: messageId,
      message_thread_id: topicId
    };

    result = await tg("copyMessage", fallbackData);

    if (result?.message_id) {
      await tg("sendMessage", {
        chat_id: targetChatId,
        message_thread_id: topicId,
        text: String(caption).slice(0, 4000)
      });
    }
  }

  console.log("COPY RESULT:", JSON.stringify(result, null, 2));
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
        "/movies\n" +
        "/series\n" +
        "/az\n" +
        "/duplicates\n" +
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

  if (text === "/admin") {
  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "🎛 𝐀𝐃𝐌𝐈𝐍 𝐏𝐀𝐍𝐄𝐋\n\n" +
      "🎬 /movies — Filme anzeigen\n" +
      "📺 /series — Serien anzeigen\n" +
      "📺 /serieshub — Serien Dashboard\n" +
      "🧩 /missingseries titel — Fehlende Episoden\n" +
      "🔎 /search titel — Suche\n" +
      "🔤 /az — A–Z Liste\n" +
      "🆕 /newseries — Neue Folgen\n" +
      "🔥 /trendingseries — Trending Serien\n" +
      "⭐ /featuredseries — Featured Serien\n" +
      "🔤 /seriesaz — Serien A–Z\n" +
      "🔥 /featuredseries — Featured Serien\n" +
      "🧹 /duplicates — Duplikate prüfen\n" +
      "📊 /stats — Statistik\n"
  });

  return;
}

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: "⚠️ Unbekannter Befehl. Nutze /admin"
  });
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
        "🔎 Serie erkannt — suche TMDB-Daten...\n\n" +
        `📺 ${media.seriesTitle} S${media.seasonText}E${media.episodeText}`
    });

    const tmdb = await searchSeriesTMDB(
      media.seriesTitle,
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

    const extras = getMediaExtras(fileName, msg);

await createSeriesHubIfMissing({
  tmdb,
  topicId
});

const copied = await copyOriginalMedia({
  fromChatId: msg.chat.id,
  messageId: msg.message_id,
  targetChatId: SERIES_GROUP_ID,
  topicId,
  caption: ""
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
      episodeTitle: tmdb.episodeTitle || "",
      genre: tmdb.genre,
      rating: tmdb.rating,
      overview: tmdb.overview,
      posterUrl: tmdb.posterUrl,
      fileName,
      fileId,
      uniqueKey: media.uniqueKey,
      telegramMessageId: copied.message_id,
      topicId
    });
    
    try {
  await updateSeriesHub({
    tmdb,
    topicId
  });
} catch (err) {
  console.error("⚠️ Hub Update Fehler:", err.message);
}

await createSeasonSeparatorIfMissing({
  topicId,
  season: media.season
});

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
        "🔎 Film erkannt — suche TMDB-Daten...\n\n" +
        `🎬 ${media.title} ${media.year || ""}`
    });

    const tmdb = await searchMovieTMDB(media.title, media.year);

    if (!tmdb) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "❌ Keine TMDB-Daten gefunden:\n\n" +
          `🎬 ${media.title}`
      });
      return;
    }

    const extras = {
      ...getMediaExtras(fileName, msg),
      libraryId: makeLibraryCode(tmdb.genre)
    };

    const genreTopicName = tmdb.mainGenre || "Sonstige";

    const topicId = await createOrGetTopic({
      chatId: MOVIE_GROUP_ID,
      name: genreTopicName,
      type: "movie_genre"
    });

    if (!topicId) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text:
          "❌ Film-Genre-Thema konnte nicht erstellt werden.\n\n" +
          "Prüfe MOVIE_GROUP_ID, Bot-Adminrechte und Forum-Themen."
      });
      return;
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
      caption: movieCaption(tmdb, extras)
    });

    if (!copied?.message_id) {
      await tg("sendMessage", {
        chat_id: msg.chat.id,
        text: "⚠️ Film-Cover wurde gepostet, aber Datei konnte nicht kopiert werden."
      });
      return;
    }

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
hdr: extras.hdr
    });

    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text:
        "✅ Film erfolgreich einsortiert:\n\n" +
        `🎬 ${tmdb.title}\n` +
        `🎭 Thema: ${genreTopicName}\n` +
        `🏷 ${extras.libraryId}`
    });

    logToDb("movie_saved", `${tmdb.title} ${tmdb.year || ""}`);
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