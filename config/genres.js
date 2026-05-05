// ================= MOVIE GENRES =================

const MOVIE_GENRES = {
  28: "Action",
  12: "Abenteuer",
  16: "Animation",
  35: "Komödie",
  80: "Krimi",
  99: "Dokumentation",
  18: "Drama",
  10751: "Familie",
  14: "Fantasy",
  36: "Historie",
  27: "Horror",
  10402: "Musik",
  9648: "Mystery",
  10749: "Romanze",
  878: "Science-Fiction",
  10770: "TV Film",
  53: "Thriller",
  10752: "Kriegsfilm",
  37: "Western"
};

// ================= TV GENRES =================

const TV_GENRES = {
  10759: "Action & Adventure",
  16: "Animation",
  35: "Komödie",
  80: "Krimi",
  99: "Dokumentation",
  18: "Drama",
  10751: "Familie",
  10762: "Kids",
  9648: "Mystery",
  10763: "Nachrichten",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  37: "Western"
};

// ================= MERGED =================

const ALL_GENRES = {
  ...MOVIE_GENRES,
  ...TV_GENRES
};

// ================= HELPERS =================

// 👉 ID → Name
function getGenreName(id) {
  return ALL_GENRES[id] || "Unbekannt";
}

// 👉 mehrere IDs → Names
function getGenreNames(ids = []) {
  return ids.map(id => getGenreName(id));
}

// 👉 Name → ID
function getGenreId(name = "") {

  const lower = name.toLowerCase();

  for (const [id, gName] of Object.entries(ALL_GENRES)) {
    if (gName.toLowerCase() === lower) {
      return parseInt(id);
    }
  }

  return null;
}

// 👉 Filter bekannte Genres
function normalizeGenres(ids = []) {
  return ids.filter(id => ALL_GENRES[id]);
}

// 👉 Hauptgenre bestimmen (für Routing)
function getPrimaryGenre(ids = []) {

  for (const id of ids) {
    if (ALL_GENRES[id]) {
      return id;
    }
  }

  return null;
}

// 👉 Genre Labels (für UI)
function formatGenres(ids = [], limit = 3) {

  return getGenreNames(ids)
    .slice(0, limit)
    .join(" • ");
}

// ================= EXPORT =================

module.exports = {
  MOVIE_GENRES,
  TV_GENRES,
  ALL_GENRES,
  getGenreName,
  getGenreNames,
  getGenreId,
  normalizeGenres,
  getPrimaryGenre,
  formatGenres
};