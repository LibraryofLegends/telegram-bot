// ================= CONFIG =================

// 🎯 MAIN CHANNEL (Fallback)
const MAIN_CHANNEL_ID = -1001234567890;

// 📺 SERIES GROUP (Forum aktiv!)
const SERIES_GROUP_ID = -1009876543210;

// ================= GENRE MAP =================

// TMDB Genre IDs:
// 28 = Action, 35 = Comedy, 18 = Drama, 27 = Horror etc.

const GENRE_CHANNEL_MAP = {
  28: -1001111111111, // Action
  35: -1002222222222, // Comedy
  18: -1003333333333, // Drama
  27: -1004444444444  // Horror
};

// ================= THREAD MAP =================

// Optional: Threads pro Genre (falls Forum Channels genutzt werden)

const GENRE_THREAD_MAP = {
  28: 101, // Action Thread
  35: 102, // Comedy Thread
  18: 103,
  27: 104
};

// ================= CORE =================

// 🎯 Channel bestimmen
function getTargetChannel(genreIds = []) {

  for (const g of genreIds) {
    if (GENRE_CHANNEL_MAP[g]) {
      return GENRE_CHANNEL_MAP[g];
    }
  }

  return MAIN_CHANNEL_ID;
}

// 🧵 Thread bestimmen
function getThreadByGenre(genreIds = []) {

  for (const g of genreIds) {
    if (GENRE_THREAD_MAP[g]) {
      return GENRE_THREAD_MAP[g];
    }
  }

  return null;
}

// ================= EXPORT =================

module.exports = {
  MAIN_CHANNEL_ID,
  SERIES_GROUP_ID,
  getTargetChannel,
  getThreadByGenre
};