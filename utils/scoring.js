// ================= CONFIG =================

const DEFAULT_WEIGHTS = {
  GENRE_MATCH: 5,
  RATING: 1,
  POPULARITY: 0.5,
  TRENDING: 3,
  RECENT_PENALTY: -50,
  FRESHNESS: 2,
  RANDOM_BOOST: 0.5
};

// ================= HELPERS =================

// 🎯 Genre Score
function scoreGenres(itemGenres = [], favGenres = [], weights) {

  let score = 0;

  for (const g of itemGenres) {
    if (favGenres.includes(g)) {
      score += weights.GENRE_MATCH;
    }
  }

  return score;
}

// ⭐ Rating Score
function scoreRating(item, weights) {

  const rating = item.rating || item.vote_average || 0;

  return rating * weights.RATING;
}

// 🔥 Popularity (TMDB)
function scorePopularity(item, weights) {

  if (!item.popularity) return 0;

  return item.popularity * weights.POPULARITY;
}

// 🚫 Already seen
function scoreRecency(itemId, recentIds = [], weights) {

  if (recentIds.includes(itemId)) {
    return weights.RECENT_PENALTY;
  }

  return 0;
}

// 🚀 Trending Boost
function scoreTrending(isTrending, weights) {
  return isTrending ? weights.TRENDING : 0;
}

// 🆕 Freshness
function scoreFreshness(item, weights) {

  if (!item?.addedAt) return 0;

  const age = Date.now() - item.addedAt;

  const oneDay = 1000 * 60 * 60 * 24;

  if (age < oneDay) return weights.FRESHNESS;
  if (age < oneDay * 3) return weights.FRESHNESS / 2;

  return 0;
}

// 🎲 Random (für Vielfalt)
function scoreRandom(weights) {
  return Math.random() * weights.RANDOM_BOOST;
}

// ================= MAIN =================

function calculateScore(item, context = {}, customWeights = {}) {

  const weights = { ...DEFAULT_WEIGHTS, ...customWeights };

  const {
    favGenres = [],
    recentIds = [],
    isTrending = false
  } = context;

  let score = 0;

  score += scoreGenres(item.genres || [], favGenres, weights);
  score += scoreRating(item, weights);
  score += scorePopularity(item, weights);
  score += scoreRecency(item.display_id, recentIds, weights);
  score += scoreTrending(isTrending, weights);
  score += scoreFreshness(item, weights);
  score += scoreRandom(weights);

  return score;
}

// ================= BATCH =================

function scoreItems(items = [], context = {}, weights = {}) {

  return items.map(item => ({
    ...item,
    score: calculateScore(item, context, weights)
  }));
}

// ================= NORMALIZE =================

// skaliert Scores zwischen 0–1
function normalizeScores(items = []) {

  if (!items.length) return items;

  const scores = items.map(x => x.score);

  const min = Math.min(...scores);
  const max = Math.max(...scores);

  if (min === max) return items;

  return items.map(item => ({
    ...item,
    normalizedScore: (item.score - min) / (max - min)
  }));
}

// ================= EXPORT =================

module.exports = {
  calculateScore,
  scoreItems,
  normalizeScores,
  DEFAULT_WEIGHTS
};