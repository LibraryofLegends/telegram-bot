const fs = require("fs");

const FILE = "history.json";

// ================= CORE LOAD / SAVE =================

function loadHistoryDB() {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE, "utf8") || "{}");
}

function saveHistoryDB(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// In-memory cache (performance boost)
let HISTORY_DB = loadHistoryDB();

// ================= ADD HISTORY ENTRY =================

function saveHistory(userId, entry) {

  if (!HISTORY_DB[userId]) {
    HISTORY_DB[userId] = [];
  }

  const normalizedEntry = {
    id: entry.id,
    type: entry.type || "movie",
    seriesKey: entry.seriesKey || null,
    season: entry.season || null,
    episode: entry.episode || null,
    timestamp: Date.now()
  };

  // Remove duplicates
  HISTORY_DB[userId] = [
    normalizedEntry,
    ...HISTORY_DB[userId].filter(x => x.id !== entry.id)
  ];

  // Limit history size (performance + AI relevance)
  HISTORY_DB[userId] = HISTORY_DB[userId].slice(0, 50);

  saveHistoryDB(HISTORY_DB);

  return HISTORY_DB[userId];
}

// ================= GET HISTORY =================

function readHistory(userId) {
  return HISTORY_DB[userId] || [];
}

// ================= CLEAR HISTORY =================

function clearHistory(userId) {
  HISTORY_DB[userId] = [];
  saveHistoryDB(HISTORY_DB);
  return true;
}

// ================= REMOVE ENTRY =================

function removeHistoryItem(userId, id) {

  if (!HISTORY_DB[userId]) return [];

  HISTORY_DB[userId] = HISTORY_DB[userId]
    .filter(x => x.id !== id);

  saveHistoryDB(HISTORY_DB);

  return HISTORY_DB[userId];
}

// ================= GET LAST WATCHED =================

function getLastWatched(userId) {

  const history = readHistory(userId);

  return history.length ? history[0] : null;
}

// ================= SERIES FILTER =================

function getSeriesHistory(userId, seriesKey) {

  const history = readHistory(userId);

  return history.filter(x =>
    x.seriesKey === seriesKey
  );
}

// ================= MOVIE FILTER =================

function getMovieHistory(userId) {

  const history = readHistory(userId);

  return history.filter(x =>
    !x.seriesKey
  );
}

// ================= WATCH TIME ANALYTICS =================

function getWatchStats(userId) {

  const history = readHistory(userId);

  const stats = {
    total: history.length,
    movies: 0,
    series: 0,
    episodes: 0
  };

  for (const item of history) {

    if (item.type === "movie") {
      stats.movies++;
    }

    if (item.type === "series") {
      stats.series++;
      stats.episodes++;
    }
  }

  return stats;
}

// ================= CLEAN OLD HISTORY =================

function cleanupOldHistory(days = 30) {

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  for (const userId of Object.keys(HISTORY_DB)) {

    HISTORY_DB[userId] = HISTORY_DB[userId].filter(item =>
      item.timestamp > cutoff
    );
  }

  saveHistoryDB(HISTORY_DB);
}

// ================= EXPORT =================

module.exports = {
  saveHistory,
  readHistory,
  clearHistory,
  removeHistoryItem,
  getLastWatched,
  getSeriesHistory,
  getMovieHistory,
  getWatchStats,
  cleanupOldHistory
};