const { loadDB } = require("../db/database");
const { readHistory } = require("../db/historyDB");
const { getTopGenres } = require("../db/userProfileDB");

const {
  getTrending,
  getSimilar
} = require("./tmdbService");

// ================= SCORE ENGINE =================

function calculateScore(item, ctx) {

  let score = 0;

  const {
    favGenres,
    recentIds,
    boostTrending = false
  } = ctx;

  // 🎯 Genre Match (sehr wichtig)
  for (const g of item.genres || []) {
    if (favGenres.includes(g)) {
      score += 5;
    }
  }

  // 🔥 Bewertung Bonus
  if (item.rating) {
    score += item.rating;
  }

  // 🚫 Schon gesehen
  if (recentIds.includes(item.display_id)) {
    score -= 50;
  }

  // 🚀 Trending Boost
  if (boostTrending) {
    score += 3;
  }

  return score;
}

// ================= CONTEXT =================

function buildContext(userId) {

  const history = readHistory(userId) || [];

  const recentIds = history.map(x => x.id);

  const favGenres = getTopGenres(userId) || [];

  return {
    favGenres,
    recentIds
  };
}

// ================= LOCAL RECOMMENDATIONS =================

function getLocalRecommendations(userId, limit = 10) {

  const db = loadDB();
  if (!db.length) return [];

  const ctx = buildContext(userId);

  const scored = db.map(item => ({
    ...item,
    score: calculateScore(item, ctx)
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ================= TRENDING MIX =================

async function getTrendingMix(userId, limit = 10) {

  const ctx = buildContext(userId);

  const trending = await getTrending(limit);

  return trending.map(item => ({
    ...item,
    score: calculateScore(item, {
      ...ctx,
      boostTrending: true
    })
  }));
}

// ================= SIMILAR =================

async function getSimilarContent(item, limit = 10) {

  if (!item?.tmdb_id) return [];

  return await getSimilar(
    item.tmdb_id,
    item.media_type || "movie",
    limit
  );
}

// ================= HYBRID AI =================

async function getSmartRecommendations(userId, limit = 10) {

  const local = getLocalRecommendations(userId, limit);

  const trending = await getTrendingMix(userId, limit);

  const combined = [...local, ...trending];

  // ❌ Duplikate entfernen
  const unique = [];
  const seen = new Set();

  for (const item of combined) {

    const key = item.id || item.display_id;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit);
}

// ================= EXPORT =================

module.exports = {
  getLocalRecommendations,
  getTrendingMix,
  getSimilarContent,
  getSmartRecommendations
};