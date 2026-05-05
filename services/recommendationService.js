const { loadDB } = require("../db/database");
const { readHistory } = require("../db/historyDB");

// ================= CONFIG =================

const MAX_HISTORY_WEIGHT = 20;
const RECENT_BOOST = 2;
const GENRE_WEIGHT = 3;
const RATING_WEIGHT = 1.5;
const WATCHED_PENALTY = 50;

// ================= HELPERS =================

function normalizeScore(value, max = 10) {
  return value ? (value / max) : 0;
}

// ================= USER PROFILE =================

function buildUserProfile(history, db) {

  const genreScore = {};
  const recentIds = [];

  history.forEach((entry, index) => {

    const weight = Math.max(MAX_HISTORY_WEIGHT - index, 1);

    recentIds.push(entry.id);

    const item = db.find(x => x.display_id === entry.id);
    if (!item) return;

    (item.genres || []).forEach(g => {
      genreScore[g] = (genreScore[g] || 0) + weight;
    });
  });

  return {
    genreScore,
    recentIds
  };
}

// ================= SCORE ENGINE =================

function calculateScore(item, profile) {

  let score = 0;

  const { genreScore, recentIds } = profile;

  // 🎯 Genre Matching
  (item.genres || []).forEach(g => {
    if (genreScore[g]) {
      score += genreScore[g] * GENRE_WEIGHT;
    }
  });

  // ⭐ Rating Boost
  if (item.rating) {
    score += normalizeScore(item.rating) * 10 * RATING_WEIGHT;
  }

  // 🔥 Recency Boost (neue Inhalte pushen)
  if (item.year) {
    const currentYear = new Date().getFullYear();
    const diff = currentYear - item.year;

    if (diff <= 1) score += 5 * RECENT_BOOST;
    else if (diff <= 3) score += 3 * RECENT_BOOST;
  }

  // 🚫 Already watched penalty
  if (recentIds.includes(item.display_id)) {
    score -= WATCHED_PENALTY;
  }

  return score;
}

// ================= FALLBACK =================

function getFallback(db, limit) {
  return db.slice(0, limit);
}

// ================= MAIN =================

function getRecommendations(userId, limit = 10) {

  const db = loadDB();

  if (!db.length) return [];

  const history = readHistory(userId) || [];

  // 🧊 Cold Start → kein Verlauf
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

// ================= EXPORT =================

module.exports = {
  getRecommendations
};