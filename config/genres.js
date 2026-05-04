const GENRES = {
  28: "action",
  12: "adventure",
  16: "animation",
  35: "comedy",
  80: "crime",
  99: "documentary",
  18: "drama",
  10751: "family",
  14: "fantasy",
  36: "history",
  27: "horror",
  10402: "music",
  9648: "mystery",
  10749: "romance",
  878: "sci_fi",
  53: "thriller",
  10752: "war",
  37: "western"
};

function mapGenres(ids = []) {
  return ids.map(id => GENRES[id]).filter(Boolean);
}

module.exports = {
  GENRES,
  mapGenres
};