const { ENV } = require("./env");

// ================= CORE =================

// 📺 Serien Gruppe (Forum!)
const SERIES_GROUP_ID = ENV.SERIES_GROUP_ID;

// ================= STATIC THREADS =================
// (Optional: feste Threads für Navigation, Menü etc.)

const STATIC_THREADS = {
  MAIN: 1,
  TRENDING: 2,
  TOP: 3
};

// ================= GENRE THREAD MAP =================
// 👉 Nur wenn dein Channel ein Forum ist!

const GENRE_THREAD_MAP = {
  28: 101, // Action
  12: 102, // Abenteuer
  16: 103, // Animation
  35: 104, // Comedy
  80: 105, // Crime
  18: 106, // Drama
  27: 107, // Horror
  878: 108, // Sci-Fi
  53: 109  // Thriller
};

// ================= CORE FUNCTIONS =================

// 🎯 Thread nach Genre bestimmen
function getThreadByGenre(genreIds = []) {

  for (const g of genreIds) {
    if (GENRE_THREAD_MAP[g]) {
      return GENRE_THREAD_MAP[g];
    }
  }

  return null; // fallback → kein Thread
}

// 📺 Serien Thread (dynamisch)
function buildSeriesThreadName(seriesKey) {
  return `📺 ${seriesKey.replace(/_/g, " ").toUpperCase()}`;
}

// ================= EXPORT =================

module.exports = {
  SERIES_GROUP_ID,
  STATIC_THREADS,
  GENRE_THREAD_MAP,
  getThreadByGenre,
  buildSeriesThreadName
};