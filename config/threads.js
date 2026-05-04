const { SERIES_GROUP_ID } = require("./env");
const { mapGenres } = require("./genres");

// 🔥 feste Threads (optional)
const STATIC_THREADS = {
  action: null,
  drama: null,
  comedy: null,
  horror: null,
  sci_fi: null
};

// 🎯 Thread Auswahl basierend auf Genre
function getThreadByGenre(genreIds = []) {
  const names = mapGenres(genreIds);

  for (const g of names) {
    if (STATIC_THREADS[g]) {
      return STATIC_THREADS[g];
    }
  }

  return null;
}

module.exports = {
  getThreadByGenre,
  SERIES_GROUP_ID,
  STATIC_THREADS
};