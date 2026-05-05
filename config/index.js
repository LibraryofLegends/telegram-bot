// ================= CORE CONFIG =================

const { ENV, logEnv } = require("./env");

// ================= CHANNELS =================

const {
  MAIN_CHANNEL_ID,
  SERIES_GROUP_ID,
  getTargetChannel,
  getThreadByGenre
} = require("./channels");

// ================= GENRES =================

const {
  MOVIE_GENRES,
  TV_GENRES,
  ALL_GENRES,
  getGenreName,
  getGenreNames,
  getGenreId,
  normalizeGenres,
  getPrimaryGenre,
  formatGenres
} = require("./genres");

// ================= SYSTEM FLAGS =================

const CONFIG = {

  // ENV
  ENV,

  // CHANNELS
  MAIN_CHANNEL_ID,
  SERIES_GROUP_ID,

  // HELPERS
  getTargetChannel,
  getThreadByGenre,

  // GENRES
  MOVIE_GENRES,
  TV_GENRES,
  ALL_GENRES,

  // GENRE HELPERS
  getGenreName,
  getGenreNames,
  getGenreId,
  normalizeGenres,
  getPrimaryGenre,
  formatGenres
};

// ================= INIT =================

function initConfig() {

  console.log("⚙️ CONFIG INITIALIZED");

  logEnv();

  console.log("📡 MAIN CHANNEL:", MAIN_CHANNEL_ID);
  console.log("📺 SERIES GROUP:", SERIES_GROUP_ID);

  if (!MAIN_CHANNEL_ID) {
    console.log("⚠️ WARN: MAIN_CHANNEL_ID fehlt");
  }

  if (!SERIES_GROUP_ID) {
    console.log("⚠️ WARN: SERIES_GROUP_ID fehlt");
  }
}

// ================= EXPORT =================

module.exports = {
  ...CONFIG,
  initConfig
};