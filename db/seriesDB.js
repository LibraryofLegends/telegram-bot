const fs = require("fs");
const path = require("path");

// ================= CONFIG =================

const FILE = path.join(__dirname, "series.json");

// ================= CORE =================

function safeParse(data) {
  try {
    return JSON.parse(data);
  } catch {
    console.error("❌ SERIES PARSE ERROR → reset");
    return {};
  }
}

function loadSeriesDB() {
  try {
    if (!fs.existsSync(FILE)) return {};

    const raw = fs.readFileSync(FILE, "utf8") || "{}";
    return safeParse(raw);

  } catch (err) {
    console.error("❌ SERIES LOAD ERROR:", err.message);
    return {};
  }
}

// atomisches speichern
function saveSeriesDB(data) {
  try {
    const tmp = FILE + ".tmp";

    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, FILE);

  } catch (err) {
    console.error("❌ SERIES SAVE ERROR:", err.message);
  }
}

// ================= HELPERS =================

function ensureSeries(db, seriesKey) {
  if (!db[seriesKey]) {
    db[seriesKey] = {
      meta: {
        createdAt: Date.now()
      },
      seasons: {}
    };
  }
}

function ensureSeason(db, seriesKey, season) {
  if (!db[seriesKey].seasons[season]) {
    db[seriesKey].seasons[season] = {
      episodes: {},
      _headerSent: false
    };
  }
}

// ================= SAVE EPISODE =================

function saveEpisode(seriesKey, season, episode, payload) {

  if (!seriesKey || !season || !episode || !payload?.file_id) {
    return null;
  }

  const db = loadSeriesDB();

  ensureSeries(db, seriesKey);
  ensureSeason(db, seriesKey, season);

  db[seriesKey].seasons[season].episodes[episode] = {
    ...payload,
    addedAt: Date.now()
  };

  saveSeriesDB(db);

  return true;
}

// ================= GET =================

function getEpisode(seriesKey, season, episode) {

  const db = loadSeriesDB();

  return db?.[seriesKey]?.seasons?.[season]?.episodes?.[episode] || null;
}

// ================= NEXT EPISODE =================

function getNextEpisode(seriesKey, season, episode) {

  const db = loadSeriesDB();

  const s = parseInt(season);
  const e = parseInt(episode);

  const seasons = db?.[seriesKey]?.seasons;
  if (!seasons) return null;

  // 🔥 gleiche Staffel
  if (seasons[s]?.episodes?.[e + 1]) {
    return {
      season: s,
      episode: e + 1,
      data: seasons[s].episodes[e + 1]
    };
  }

  // 🔥 nächste Staffel
  const nextSeason = seasons[s + 1];

  if (nextSeason) {
    const episodes = nextSeason.episodes;

    const firstEp = Object.keys(episodes)
      .map(Number)
      .sort((a, b) => a - b)[0];

    if (firstEp) {
      return {
        season: s + 1,
        episode: firstEp,
        data: episodes[firstEp]
      };
    }
  }

  return null;
}

// ================= HEADER =================

function isHeaderSent(seriesKey, season) {
  const db = loadSeriesDB();
  return db?.[seriesKey]?.seasons?.[season]?._headerSent || false;
}

function markHeaderSent(seriesKey, season) {

  const db = loadSeriesDB();

  ensureSeries(db, seriesKey);
  ensureSeason(db, seriesKey, season);

  db[seriesKey].seasons[season]._headerSent = true;

  saveSeriesDB(db);
}

// ================= LIST =================

// alle Episoden einer Staffel
function getSeasonEpisodes(seriesKey, season) {

  const db = loadSeriesDB();

  const eps = db?.[seriesKey]?.seasons?.[season]?.episodes || {};

  return Object.entries(eps)
    .map(([ep, data]) => ({
      episode: parseInt(ep),
      ...data
    }))
    .sort((a, b) => a.episode - b.episode);
}

// alle Staffeln
function getSeasons(seriesKey) {

  const db = loadSeriesDB();

  const seasons = db?.[seriesKey]?.seasons || {};

  return Object.keys(seasons)
    .map(Number)
    .sort((a, b) => a - b);
}

// ================= EXPORT =================

module.exports = {
  loadSeriesDB,
  saveSeriesDB,

  saveEpisode,
  getEpisode,
  getNextEpisode,

  isHeaderSent,
  markHeaderSent,

  getSeasonEpisodes,
  getSeasons
};