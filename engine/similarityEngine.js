const { getSimilar } = require("../services/tmdbService");
const { loadDB } = require("../db/database");
const { readHistory } = require("../db/historyDB");

// ================= CONFIG =================

const WEIGHTS = {
  genre: 3.5,
  rating: 1.5,
  keyword: 2.0,
  popularity: 1.2,
  penaltySeen: -80
};

// ================= HELPERS =================

function normalizeGenres(item) {
  return item.genres || [];
}

function extractKeywords(item) {
  const text = `${item.title || ""} ${item.overview || ""}`.toLowerCase();

  const keywords = [];

  const map = [
    ["crime", "crime"],
    ["detective", "crime"],
    ["love", "romance"],
    ["war", "war"],
    ["alien", "sci-fi"],
    ["space", "sci-fi"],
    ["zombie", "horror"],
    ["killer", "thriller"],
    ["mafia", "crime"],
    ["school", "drama"]
  ];

  for (const [key, tag] of map) {
    if (text.includes(key)) {
      keywords.push(tag);
    }
  }

  return keywords;
}

function getYear(item) {
  const date = item.release_date || item.first_air_date;
  return date ? parseInt(date.slice(0, 4)) : null;
}

// ================= CORE SIMILARITY SCORE =================

function scoreSimilarity(baseItem, candidate, historyIds) {

  let score = 0;

  // 🎯 Genre Match
  const baseGenres = normalizeGenres(baseItem);
  const candidateGenres = normalizeGenres(candidate);

  for (const g of candidateGenres) {
    if (baseGenres.includes(g)) {
      score += WEIGHTS.genre;
    }
  }

  // 🔑 Keyword Match
  const baseKeywords = extractKeywords(baseItem);
  const candidateKeywords = extractKeywords(candidate);

  for (const k of candidateKeywords) {
    if (baseKeywords.includes(k)) {
      score += WEIGHTS.keyword;
    }
  }

  // ⭐ Rating Boost
  if (candidate.vote_average) {
    score += candidate.vote_average * WEIGHTS.rating;
  }

  // 📈 Popularity Bias
  if (candidate.popularity) {
    score += Math.min(candidate.popularity / 10, 10) * WEIGHTS.popularity;
  }

  // 🚫 Already seen penalty
  if (historyIds.includes(candidate.id)) {
    score += WEIGHTS.penaltySeen;
  }

  return score;
}

// ================= MAIN SIMILARITY ENGINE =================

async function getSimilarRanked(item, userId, limit = 10) {

  if (!item || !item.id) return [];

  const db = loadDB();
  const history = readHistory(userId) || [];
  const historyIds = history.map(h => h.id || h.display_id);

  // 🎬 TMDB Similar fetch
  const similar = await getSimilar(
    item.tmdb_id || item.id,
    item.media_type || "movie",
    20
  );

  if (!similar.length) return [];

  // 🔥 Merge local DB context
  const enriched = similar.map(s => {
    const local = db.find(x => x.tmdb_id === s.id);

    return {
      ...s,
      display_id: local?.display_id || s.id,
      file_id: local?.file_id || null,
      genres: s.genre_ids || [],
      media_type: s.media_type || item.media_type
    };
  });

  const ranked = enriched.map(candidate => ({
    ...candidate,
    score: scoreSimilarity(item, candidate, historyIds)
  }));

  return ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ================= FAST LOCAL SIMILARITY =================

function getLocalSimilarity(item, limit = 10) {

  const db = loadDB();

  if (!db.length) return [];

  const baseGenres = item.genres || [];

  const scored = db.map(candidate => {

    let score = 0;

    for (const g of candidate.genres || []) {
      if (baseGenres.includes(g)) {
        score += 4;
      }
    }

    if (candidate.vote_average > 7) {
      score += 2;
    }

    return {
      ...candidate,
      score
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ================= EXPORT =================

module.exports = {
  getSimilarRanked,
  getLocalSimilarity,
  scoreSimilarity
};