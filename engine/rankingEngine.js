// ================= CONFIG =================

const WEIGHTS = {
  GENRE_MATCH: 5,
  RATING: 1,
  TRENDING: 3,
  RECENT_PENALTY: -50,
  FRESHNESS: 2
};

// ================= HELPERS =================

// 🎯 Genre Match Score
function scoreGenres(itemGenres = [], favGenres = []) {

  let score = 0;

  for (const g of itemGenres) {
    if (favGenres.includes(g)) {
      score += WEIGHTS.GENRE_MATCH;
    }
  }

  return score;
}

// ⭐ Rating Score
function scoreRating(rating = 0) {
  return rating * WEIGHTS.RATING;
}

// 🚫 Already watched
function scoreRecency(itemId, recentIds = []) {
  if (recentIds.includes(itemId)) {
    return WEIGHTS.RECENT_PENALTY;
  }
  return 0;
}

// 🔥 Trending Boost
function scoreTrending(isTrending) {
  return isTrending ? WEIGHTS.TRENDING : 0;
}

// 🆕 Fresh Content (optional)
function scoreFreshness(item) {

  if (!item?.addedAt) return 0;

  const age = Date.now() - item.addedAt;

  const oneDay = 1000 * 60 * 60 * 24;

  if (age < oneDay) return WEIGHTS.FRESHNESS;
  if (age < oneDay * 3) return WEIGHTS.FRESHNESS / 2;

  return 0;
}

// ================= MAIN SCORE =================

function calculateScore(item, context = {}) {

  const {
    favGenres = [],
    recentIds = [],
    isTrending = false
  } = context;

  let score = 0;

  score += scoreGenres(item.genres, favGenres);
  score += scoreRating(item.rating || item.vote_average || 0);
  score += scoreRecency(item.display_id, recentIds);
  score += scoreTrending(isTrending);
  score += scoreFreshness(item);

  return score;
}

// ================= RANK =================

function rankItems(items = [], context = {}) {

  return items
    .map(item => ({
      ...item,
      score: calculateScore(item, context)
    }))
    .sort((a, b) => b.score - a.score);
}

// ================= FILTER DUPLICATES =================

function uniqueItems(items = []) {

  const seen = new Set();

  return items.filter(item => {

    const key = item.display_id || item.id;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

// ================= LIMIT =================

function limitItems(items = [], limit = 10) {
  return items.slice(0, limit);
}

// ================= PIPELINE =================

function rankPipeline(items = [], context = {}, limit = 10) {

  const ranked = rankItems(items, context);
  const unique = uniqueItems(ranked);

  return limitItems(unique, limit);
}

// ================= EXPORT =================

module.exports = {
  calculateScore,
  rankItems,
  rankPipeline,
  uniqueItems
};