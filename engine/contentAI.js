const { loadDB } = require("../db/database");
const { readHistory } = require("../db/historyDB");
const { getUserProfile } = require("../db/userProfileDB");
const { getSimilarRanked } = require("../services/similarityEngine");

// ================= CONFIG =================

const AI_WEIGHTS = {
  similarity: 4.0,
  personal: 3.5,
  recency: 2.0,
  seriesBoost: 5.0,
  diversityPenalty: -1.5
};

// ================= HELPERS =================

function getGenreVector(item) {
  const vec = {};
  for (const g of item.genres || []) {
    vec[g] = (vec[g] || 0) + 1;
  }
  return vec;
}

function cosineSimilarity(vecA, vecB) {

  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const k of keys) {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;

    dot += a * b;
    magA += a * a;
    magB += b * b;
  }

  if (magA === 0 || magB === 0) return 0;

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function getRecencyBoost(history) {

  if (!history.length) return 0;

  const last = history[0];

  const diff = Date.now() - (last.timestamp || 0);

  const hours = diff / (1000 * 60 * 60);

  if (hours < 12) return 3;
  if (hours < 48) return 2;
  if (hours < 168) return 1;

  return 0;
}

// ================= CORE AI SCORING =================

function scoreContent(item, userProfile, history) {

  let score = 0;

  const userGenres = userProfile.genres || {};
  const liked = userProfile.liked || {};
  const disliked = userProfile.disliked || {};

  const historyIds = history.map(h => h.id);

  // 🎯 PERSONAL PROFILE MATCH
  for (const g of item.genres || []) {
    if (userGenres[g]) {
      score += userGenres[g] * AI_WEIGHTS.personal;
    }
  }

  // ❤️ Likes boost
  if (liked[item.display_id]) {
    score += 25;
  }

  // 💀 Dislikes penalty
  if (disliked[item.display_id]) {
    score -= 100;
  }

  // 🚫 Already seen penalty
  if (historyIds.includes(item.display_id)) {
    score -= 80;
  }

  // 📺 Series continuation boost
  if (item.media_type === "tv") {
    score += AI_WEIGHTS.seriesBoost;
  }

  return score;
}

// ================= CONTENT AI ENGINE =================

async function getPersonalizedFeed(userId, limit = 10) {

  const db = loadDB();
  const history = readHistory(userId) || [];
  const userProfile = getUserProfile(userId);

  if (!db.length) return [];

  const userVector = getGenreVector(userProfile);

  const scored = [];

  for (const item of db) {

    const itemVector = getGenreVector(item);

    // 🧠 similarity between user & content
    const similarity = cosineSimilarity(userVector, itemVector);

    let score = 0;

    // base AI scoring
    score += scoreContent(item, userProfile, history);

    // similarity boost
    score += similarity * AI_WEIGHTS.similarity;

    // recency boost
    score += getRecencyBoost(history) * AI_WEIGHTS.recency;

    scored.push({
      ...item,
      score,
      similarity
    });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ================= “BECAUSE YOU WATCHED” =================

async function getBecauseYouWatched(userId, limit = 5) {

  const history = readHistory(userId);

  if (!history.length) return [];

  const lastWatched = history[0];

  const similar = await getSimilarRanked(
    lastWatched,
    userId,
    limit * 2
  );

  return similar.slice(0, limit);
}

// ================= TREND MIX =================

function getTrendMix(limit = 10) {

  const db = loadDB();

  const sorted = db
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    .slice(0, limit);

  return sorted;
}

// ================= HYBRID FEED =================

async function getHybridFeed(userId, limit = 10) {

  const personalized = await getPersonalizedFeed(userId, limit);
  const because = await getBecauseYouWatched(userId, 5);
  const trending = getTrendMix(5);

  const mix = [
    ...personalized,
    ...because,
    ...trending
  ];

  // remove duplicates
  const seen = new Set();

  const final = mix.filter(item => {
    if (seen.has(item.display_id)) return false;
    seen.add(item.display_id);
    return true;
  });

  return final.slice(0, limit);
}

// ================= EXPORT =================

module.exports = {
  getPersonalizedFeed,
  getBecauseYouWatched,
  getTrendMix,
  getHybridFeed,
  scoreContent
};