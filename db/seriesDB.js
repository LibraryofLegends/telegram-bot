const fs = require("fs");

const FILE = "series.json";

// ================= CORE LOAD / SAVE =================

function loadSeriesDB() {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE, "utf8") || "{}");
}

function saveSeriesDB(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// In-memory cache (speed boost)
let SERIES_CACHE = loadSeriesDB();

// ================= ENSURE STRUCTURE =================

function ensureStructure(seriesKey, season) {

  if (!SERIES_CACHE[seriesKey]) {
    SERIES_CACHE[seriesKey] = {};
  }

  if (!SERIES_CACHE[seriesKey][season]) {
    SERIES_CACHE[seriesKey][season] = {};
  }
}

// ================= SAVE EPISODE =================

function saveEpisode(seriesKey, season, episode, payload) {

  ensureStructure(seriesKey, season);

  SERIES_CACHE[seriesKey][season][episode] = {
    file_id: payload.file_id,
    display_id: payload.display_id || payload.id || null,
    created_at: Date.now()
  };

  saveSeriesDB(SERIES_CACHE);

  return SERIES_CACHE[seriesKey][season][episode];
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

  // 🔥 same season next episode
  if (db?.[seriesKey]?.[s]?.[e + 1]) {
    return {
      seriesKey,
      season: s,
      episode: e + 1,
      data: db[seriesKey][s][e + 1]
    };
  }

  // 🔥 next season first episode
  if (db?.[seriesKey]?.[s + 1]) {

    const nextSeason = db[seriesKey][s + 1];
    const firstEp = Object.keys(nextSeason)
      .filter(k => k !== "_meta")
      .sort((a, b) => a - b)[0];

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

  const seasons = Object.keys(series)
    .filter(k => k !== "_meta");

  return {
    seriesKey,
    totalSeasons: seasons.length,
    seasons: seasons.map(season => ({
      season: parseInt(season),
      episodes: Object.keys(series[season]).length
    }))
  };
}

// ================= FIND EPISODE BY DISPLAY ID =================

function findEpisodeByDisplayId(display_id) {

  const db = loadSeriesDB();

  for (const [seriesKey, seasons] of Object.entries(db)) {

    for (const [season, episodes] of Object.entries(seasons)) {

      for (const [episode, data] of Object.entries(episodes)) {

        if (data?.display_id === display_id) {
          return {
            seriesKey,
            season: parseInt(season),
            episode: parseInt(episode),
            data
          };
        }
      }
    }
  }

  return null;
}

// ================= LAST WATCHED =================

function setLastWatched(userId, payload) {

  const db = loadSeriesDB();

  if (!db._lastWatched) db._lastWatched = {};

  db._lastWatched[userId] = {
    ...payload,
    timestamp: Date.now()
  };

  saveSeriesDB(db);
}

// ================= CONTINUE WATCHING =================

function getContinueWatching(userId) {

  const db = loadSeriesDB();

  return db._lastWatched?.[userId] || null;
}

// ================= DELETE EPISODE =================

function deleteEpisode(seriesKey, season, episode) {

  const db = loadSeriesDB();

  if (db?.[seriesKey]?.[season]?.[episode]) {
    delete db[seriesKey][season][episode];
  }

  saveSeriesDB(db);

  return true;
}

// ================= CLEAN EMPTY SERIES =================

function cleanEmptySeries() {

  const db = loadSeriesDB();

  for (const seriesKey of Object.keys(db)) {

    if (seriesKey.startsWith("_")) continue;

    const seasons = db[seriesKey];

    const hasAnyEpisodes = Object.values(seasons || {}).some(season =>
      Object.keys(season || {}).length > 0
    );

    if (!hasAnyEpisodes) {
      delete db[seriesKey];
    }
  }

  saveSeriesDB(db);
}

// ================= EXPORT =================

module.exports = {
  loadSeriesDB,
  saveSeriesDB,
  saveEpisode,
  getEpisode,
  getNextEpisode,
  getSeriesOverview,
  findEpisodeByDisplayId,
  setLastWatched,
  getContinueWatching,
  deleteEpisode,
  cleanEmptySeries
};