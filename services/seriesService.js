const {
  tg
} = require("./telegramService");

const {
  loadSeriesDB,
  saveSeriesDB
} = require("../db/seriesDB");

const {
  SERIES_GROUP_ID
} = require("../config/threads");

// ================= STATE =================

let SERIES_DB = loadSeriesDB();

// ================= HELPERS =================

function normalizeKey(title = "") {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

// ================= THREAD SYSTEM =================

async function ensureSeriesThread(seriesKey) {

  // später erweiterbar: dynamische Thread-Erstellung via Telegram Forum Topics
  // aktuell: stable mapping

  const db = loadSeriesDB();

  if (!db._threads) db._threads = {};

  if (db._threads[seriesKey]) {
    return db._threads[seriesKey];
  }

  // Default Thread fallback = main series group
  const threadId = SERIES_GROUP_ID;

  db._threads[seriesKey] = threadId;

  saveSeriesDB(db);

  return threadId;
}

// ================= EPISODE SAVE =================

async function saveEpisode(seriesKey, season, episode, payload) {

  const db = loadSeriesDB();

  if (!db[seriesKey]) db[seriesKey] = {};
  if (!db[seriesKey][season]) db[seriesKey][season] = {};

  db[seriesKey][season][episode] = {
    file_id: payload.file_id,
    display_id: payload.display_id || payload.id || null,
    created_at: Date.now()
  };

  saveSeriesDB(db);

  return true;
}

// ================= GET EPISODE =================

function getEpisode(seriesKey, season, episode) {
  const db = loadSeriesDB();
  return db?.[seriesKey]?.[season]?.[episode] || null;
}

// ================= NEXT EPISODE ENGINE =================

function getNextEpisode(seriesKey, season, episode) {

  const db = loadSeriesDB();

  const s = parseInt(season);
  const e = parseInt(episode);

  if (!db?.[seriesKey]) return null;

  // 🔥 gleiche Staffel nächstes Episode
  if (db[seriesKey]?.[s]?.[e + 1]) {
    return {
      seriesKey,
      season: s,
      episode: e + 1,
      data: db[seriesKey][s][e + 1]
    };
  }

  // 🔥 nächste Staffel
  if (db[seriesKey]?.[s + 1]) {
    const nextSeason = db[seriesKey][s + 1];
    const firstEp = Object.keys(nextSeason)[0];

    return {
      seriesKey,
      season: s + 1,
      episode: parseInt(firstEp),
      data: nextSeason[firstEp]
    };
  }

  return null;
}

// ================= SERIES OVERVIEW =================

function getSeriesOverview(seriesKey) {

  const db = loadSeriesDB();
  const series = db[seriesKey];

  if (!series) return null;

  const overview = {
    seriesKey,
    seasons: Object.keys(series)
      .filter(k => k !== "_headerSent")
      .map(season => ({
        season: parseInt(season),
        episodes: Object.keys(series[season]).filter(e => e !== "_headerSent").length
      }))
  };

  return overview;
}

// ================= LAST WATCHED UPDATE =================

function updateLastWatched(userId, seriesKey, season, episode) {

  const db = loadSeriesDB();

  if (!db._lastWatched) db._lastWatched = {};

  db._lastWatched[userId] = {
    seriesKey,
    season,
    episode,
    timestamp: Date.now()
  };

  saveSeriesDB(db);
}

// ================= CONTINUE FUNCTION =================

function getContinueWatching(userId) {

  const db = loadSeriesDB();

  return db._lastWatched?.[userId] || null;
}

// ================= AUTO CLEANUP =================

function cleanupEmptySeries() {

  const db = loadSeriesDB();

  for (const key of Object.keys(db)) {

    if (key.startsWith("_")) continue;

    const seasons = db[key];

    const hasEpisodes = Object.values(seasons || {}).some(season =>
      Object.keys(season || {}).length > 1
    );

    if (!hasEpisodes) {
      delete db[key];
    }
  }

  saveSeriesDB(db);
}

// ================= EXPORT =================

module.exports = {
  normalizeKey,
  ensureSeriesThread,
  saveEpisode,
  getEpisode,
  getNextEpisode,
  getSeriesOverview,
  updateLastWatched,
  getContinueWatching,
  cleanupEmptySeries
};