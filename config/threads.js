const SERIES_GROUP_ID = process.env.SERIES_GROUP_ID || "";

// Beispiel Threads Mapping
const STATIC_THREADS = {
  action: null,
  drama: null,
  comedy: null
};

// 🎯 Ziel Channel bestimmen
function getTargetChannel(genres = []) {
  return process.env.MAIN_CHANNEL_ID;
}

// 🎯 Thread nach Genre
function getThreadByGenre(genres = []) {
  return null; // optional später erweitern
}

module.exports = {
  getTargetChannel,
  getThreadByGenre,
  SERIES_GROUP_ID,
  STATIC_THREADS
};