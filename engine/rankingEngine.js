const { loadDB } = require("../db/database");
const { readHistory } = require("../db/historyDB");
const { getUserProfile } = require("../db/userProfileDB");
const { loadSeriesDB } = require("../db/seriesDB");

// ================= CONFIG =================

const WEIGHTS = {
  genre: 3.0,
  rating: 1.2,
  recency: 2.0,
  continuation: 5.0,
  popularity: 1.5,
  penaltySeen: -100,
  dislikePenalty: -80
};

// ================= HELPERS =================

function getYear(item) {
  const date = item.release_date || item.first_air_date;
  if (!date) return null;
  return parseInt(date.slice(0, 4));
}

function getRecencyBoost(item) {
  const year = getYear(item);
  if (!year) return 0;

  const diff = new Date().getFullYear() - year;

  if (diff <= 1) return 5;
  if (diff <= 3) return 3;
  if (diff <= 7) return 1;
  return 0;
}

function normalizeGenres(item) {
  return item.genres || [];
}

// ================= CORE SCORING =================

function scoreItem(item, userProfile, historyIds) {
  let score = 0;

  const userGenres = userProfile.genres || {};
  const liked = userProfile.liked || {};
  const disliked = userProfile.disliked || {};

  // 🎯 GENRE MATCH
  for (const g of normalizeGenres(item)) {
    if (userGenres[g]) {
      score += userGenres[g] * WEIGHTS.genre;
    }
  }

  // ⭐ RATING BOOST
  if (item.vote_average) {
    score += item.vote_average * WEIGHTS.rating;
  }

  // 🔥 RECENCY BOOST
  score += getRecencyBoost(item) * WEIGHTS.recency;

  // ❤️ LIKE BOOST
  if (liked[item.display_id]) {
    score += 20;
  }

  // 💀 DISLIKE PENALTY
  if (disliked[item.display_id]) {
    score += WEIGHTS.dislikePenalty;
  }

  // 🚫 ALREADY SEEN
  if (historyIds.includes(item.display_id)) {
    score += WEIGHTS.penaltySeen;
  }

  return score;
}

// ================= SERIES CONTINUATION BOOST =================

function getSeriesContinuationBoost(item, userContinue) {
  if (!userContinue) return 0;

  if (!item.media_type || item.media_type !== "tv") return 0;

  if (item.seriesKey === userContinue.seriesKey) {
    return WEIGHTS.continuation;
  }

  return 0;
}

// ================= MAIN ENGINE =================

function getRankedRecommendations(userId, limit = 10) {

  const db = loadDB();
  const history = readHistory(userId) || [];
  const userProfile = getUserProfile(userId);

  const historyIds = history.map(h => h.id || h.display_id);

  const seriesDB = loadSeriesDB();
  const userContinue = require("../db/continueDB").getContinue(userId);

  if (!db.length) return [];

  const ranked = db.map(item => {

    let score = scoreItem(item, userProfile, historyIds);

    // 🎬 CONTINUATION BOOST (Netflix-style)
    score += getSeriesContinuationBoost(item, userContinue);

    // 📈 POPULARITY BONUS (light heuristic)
    if (item.vote_average > 7.5) {
      score += WEIGHTS.popularity;
    }

    return {
      ...item,
      score
    };
  });

  return ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ================= EXPLANATION ENGINE =================

function explainRecommendation(item, userProfile) {

  const reasons = [];

  const userGenres = userProfile.genres || {};

  for (const g of item.genres || []) {
    if (userGenres[g]) {
      reasons.push("🎯 Genre Match");
    }
  }

  if (item.vote_average > 7) {
    reasons.push("⭐ High Rating");
  }

  if (item.media_type === "tv") {
    reasons.push("📺 Series Match");
  }

  return reasons;
}

// ================= EXPORT =================

module.exports = {
  getRankedRecommendations,
  scoreItem,
  explainRecommendation
};