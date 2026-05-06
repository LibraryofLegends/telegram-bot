// ================= CONFIG =================

const WEIGHTS = {
  GENRE: 5,
  RATING: 1,
  TITLE_MATCH: 2
};

// ================= HELPERS =================

// 🎯 Genre Similarity
function genreSimilarity(a = [], b = []) {

  if (!a.length || !b.length) return 0;

  let matches = 0;

  for (const g of a) {
    if (b.includes(g)) matches++;
  }

  return matches * WEIGHTS.GENRE;
}

// ⭐ Rating Similarity
function ratingSimilarity(a = 0, b = 0) {

  const diff = Math.abs(a - b);

  // je näher, desto besser
  return Math.max(0, (10 - diff)) * WEIGHTS.RATING;
}

// 🔤 Title Similarity (einfach)
function titleSimilarity(a = "", b = "") {

  const wordsA = a.toLowerCase().split(" ");
  const wordsB = b.toLowerCase().split(" ");

  let matches = 0;

  for (const w of wordsA) {
    if (wordsB.includes(w)) matches++;
  }

  return matches * WEIGHTS.TITLE_MATCH;
}

// ================= MAIN =================

function calculateSimilarity(base, candidate) {

  if (!base || !candidate) return 0;

  let score = 0;

  score += genreSimilarity(base.genres, candidate.genres);

  score += ratingSimilarity(
    base.rating || base.vote_average || 0,
    candidate.rating || candidate.vote_average || 0
  );

  score += titleSimilarity(
    base.title || "",
    candidate.title || ""
  );

  return score;
}

// ================= FIND =================

function findSimilar(baseItem, items = [], limit = 10) {

  if (!baseItem) return [];

  const scored = items
    .filter(item => item.display_id !== baseItem.display_id)
    .map(item => ({
      ...item,
      similarity: calculateSimilarity(baseItem, item)
    }));

  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

// ================= HYBRID (LOCAL + TMDB) =================

async function findHybridSimilar(baseItem, localItems, tmdbFn, limit = 10) {

  const local = findSimilar(baseItem, localItems, limit);

  let external = [];

  try {
    if (baseItem?.tmdb_id && tmdbFn) {
      external = await tmdbFn(
        baseItem.tmdb_id,
        baseItem.media_type || "movie",
        limit
      );
    }
  } catch (err) {
    console.error("❌ TMDB SIMILAR ERROR:", err.message);
  }

  // 🔥 merge + dedupe
  const combined = [...local, ...external];

  const seen = new Set();

  const unique = combined.filter(item => {

    const key = item.display_id || item.id;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });

  return unique.slice(0, limit);
}

// ================= EXPORT =================

module.exports = {
  calculateSimilarity,
  findSimilar,
  findHybridSimilar
};