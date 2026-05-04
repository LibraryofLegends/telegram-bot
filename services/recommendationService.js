const { loadDB } = require("../db/database");
const { readHistory } = require("../db/historyDB");

// ================= CONFIG =================

const WEIGHTS = {
  genre: 3.0,
  rating: 1.5,
  recency: 2.0,
  diversityPenalty: 50
};

// ================= USER PROFILE BUILDER =================

function buildUserProfile(history, db) {

  const genreScore = {};
  const recentIds = [];
  const lastWatchedMap = new Map();

  for (const h of history) {

    recentIds.push(h.id);

    const item = db.find(x => x.display_id === h.id);
    if (!item) continue;

    // Genre frequency
    for (const g of item.genres || []) {
      genreScore[g] = (genreScore[g] || 0) + 1;
    }

    lastWatchedMap.set(h.id, Date.now());
  }

  return {
    genreScore,
    recentIds,
    lastWatchedMap
  };
}

// ================= SCORING ENGINE =================

function calculateScore(item, profile) {

  let score = 0;

  // ================= GENRE MATCH =================

  for (const g of item.genres || []) {
    if (profile.genreScore[g]) {
      score += profile.genreScore[g] * WEIGHTS.genre;
    }
  }

  // ================= RATING BOOST =================

  if (item.vote_average || item.rating) {
    score += (item.vote_average || item.rating) * WEIGHTS.rating;
  }

  // ================= RECENCY BOOST (optional future hook) =================

  if (item.release_date || item.first_air_date) {
    const year = parseInt(
      (item.release_date || item.first_air_date || "").slice(0, 4)
    );

    if (year && year >= 2020) {
      score += WEIGHTS.recency;
    }
  }

  // ================= PENALTY: already watched =================

  if (profile.recentIds.includes(item.display_id)) {
    score -= WEIGHTS.diversityPenalty;
  }

  return score;
}

// ================= FALLBACK POPULAR =================

function getFallback(db, limit) {
  return db
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    .slice(0, limit);
}

// ================= MAIN RECOMMENDER =================

function getRecommendations(userId, limit = 10) {

  const db = loadDB();
  if (!db.length) return [];

  const history = readHistory(userId) || [];

  // ================= NEW USER FALLBACK =================

  if (!history.length) {
    return getFallback(db, limit);
  }

  const profile = buildUserProfile(history, db);

  const scored = db.map(item => ({
    ...item,
    score: calculateScore(item, profile)
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ================= SIMILARITY ENGINE =================

function getSimilarItems(itemId, limit = 10) {

  const db = loadDB();

  const base = db.find(x => x.display_id === itemId);
  if (!base) return [];

  const scored = db
    .filter(x => x.display_id !== itemId)
    .map(item => {

      let score = 0;

      // Genre overlap
      const overlap = (item.genres || [])
        .filter(g => base.genres?.includes(g)).length;

      score += overlap * 5;

      // Rating similarity boost
      const diff = Math.abs(
        (item.vote_average || 0) - (base.vote_average || 0)
      );

      score += Math.max(0, 10 - diff);

      return {
        ...item,
        score
      };
    });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ================= TREND BOOSTER =================

function getTrendingBoost(db, limit = 10) {

  return db
    .map(item => ({
      ...item,
      score: (item.vote_average || 0) + (item.popularity || 0) * 0.5
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ================= EXPORT =================

module.exports = {
  getRecommendations,
  getSimilarItems,
  getTrendingBoost
};