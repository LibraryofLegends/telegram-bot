// services/scoring.js

// ================= CONFIG =================

const WEIGHTS = {
  GENRE_MATCH: 4,
  RATING: 1.5,
  RECENCY_PENALTY: 40,
  POPULARITY: 0.5,
  DIVERSITY_PENALTY: 10
};

// ================= HELPERS =================

function normalizeRating(rating = 0) {
  // TMDB ist 0–10 → normalisieren
  return rating / 10;
}

function normalizePopularity(popularity = 0) {
  // einfache logarithmische Dämpfung
  return Math.log10(popularity + 1);
}

// ================= GENRE SCORE =================

function scoreGenres(item, userProfile) {
  let score = 0;

  for (const g of item.genres || []) {
    if (userProfile.genreScore[g]) {
      score += userProfile.genreScore[g] * WEIGHTS.GENRE_MATCH;
    }
  }

  return score;
}

// ================= RATING SCORE =================

function scoreRating(item) {
  return normalizeRating(item.rating || item.vote_average || 0) * WEIGHTS.RATING;
}

// ================= POPULARITY SCORE =================

function scorePopularity(item) {
  return normalizePopularity(item.popularity || 0) * WEIGHTS.POPULARITY;
}

// ================= RECENCY PENALTY =================

function scoreRecency(item, userProfile) {
  if (userProfile.recentIds.includes(item.display_id)) {
    return -WEIGHTS.RECENCY_PENALTY;
  }
  return 0;
}

// ================= DIVERSITY PENALTY =================

function scoreDiversity(item, topGenres) {
  // verhindert monotone Empfehlungen
  const match = (item.genres || []).some(g => topGenres.includes(g));

  return match ? 0 : -WEIGHTS.DIVERSITY_PENALTY;
}

// ================= MAIN SCORE =================

function calculateScore(item, userProfile) {

  let score = 0;

  // 🎯 Genre Match
  score += scoreGenres(item, userProfile);

  // ⭐ Bewertung
  score += scoreRating(item);

  // 🔥 Popularität
  score += scorePopularity(item);

  // 🚫 Bereits gesehen
  score += scoreRecency(item, userProfile);

  // 🧠 Diversity Control
  const topGenres = Object.keys(userProfile.genreScore)
    .sort((a, b) => userProfile.genreScore[b] - userProfile.genreScore[a])
    .slice(0, 3);

  score += scoreDiversity(item, topGenres);

  return score;
}

// ================= BULK SCORING =================

function rankItems(items = [], userProfile) {

  return items
    .map(item => ({
      ...item,
      score: calculateScore(item, userProfile)
    }))
    .sort((a, b) => b.score - a.score);
}

// ================= EXPORT =================

module.exports = {
  calculateScore,
  rankItems
};