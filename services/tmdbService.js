const fetch = global.fetch || require("node-fetch");

const TMDB_KEY = process.env.TMDB_KEY;

// ================= CONFIG =================

const BASE_URL = "https://api.themoviedb.org/3";
const LANGUAGE = "de-DE";
const CACHE_TTL = 1000 * 60 * 60; // 1h
const MAX_RETRIES = 2;

// ================= CACHE =================

const CACHE = new Map();

function getCache(key) {
  const entry = CACHE.get(key);

  if (!entry) return null;

  const valid = (Date.now() - entry.time) < CACHE_TTL;

  return valid ? entry.data : null;
}

function setCache(key, data) {
  CACHE.set(key, {
    data,
    time: Date.now()
  });
}

// ================= CORE FETCH =================

async function tmdbFetch(url, retries = MAX_RETRIES) {

  const cached = getCache(url);
  if (cached) return cached;

  try {

    const res = await fetch(url);

    if (!res.ok) {
      console.log("❌ TMDB HTTP ERROR:", res.status);

      if (retries > 0) {
        return tmdbFetch(url, retries - 1);
      }

      return null;
    }

    const data = await res.json();

    setCache(url, data);

    return data;

  } catch (err) {

    console.log("❌ TMDB FETCH ERROR:", err.message);

    if (retries > 0) {
      return tmdbFetch(url, retries - 1);
    }

    return null;
  }
}

// ================= HELPERS =================

function buildUrl(path, params = {}) {

  const query = new URLSearchParams({
    api_key: TMDB_KEY,
    language: LANGUAGE,
    ...params
  });

  return `${BASE_URL}${path}?${query}`;
}

function extractYear(item) {
  return (item.release_date || item.first_air_date || "").slice(0, 4);
}

// ================= DETAILS =================

async function getDetails(id, type = "movie") {

  if (!id) return null;

  const safeType = type === "tv" ? "tv" : "movie";

  const url = buildUrl(`/${safeType}/${id}`, {
    append_to_response: "credits"
  });

  return await tmdbFetch(url);
}

// ================= EPISODE =================

async function getEpisodeDetails(tvId, season, episode) {

  if (!tvId || !season || !episode) return null;

  const url = buildUrl(
    `/tv/${tvId}/season/${season}/episode/${episode}`
  );

  return await tmdbFetch(url);
}

// ================= SEARCH ULTRA =================

async function searchTMDBUltra(title, year = null, type = null) {

  if (!title) return null;

  const url = buildUrl("/search/multi", {
    query: title
  });

  const data = await tmdbFetch(url);

  if (!data?.results?.length) return null;

  let results = data.results;

  // 🎯 FILTER TYPE
  if (type) {
    results = results.filter(x => x.media_type === type);
  }

  // 🎯 REMOVE PEOPLE RESULTS
  results = results.filter(x => x.media_type !== "person");

  // 🎯 SORT BY RELEVANCE
  results = results.sort((a, b) => {

    let scoreA = a.popularity || 0;
    let scoreB = b.popularity || 0;

    // YEAR MATCH BOOST
    if (year) {

      const yA = extractYear(a);
      const yB = extractYear(b);

      if (yA == year) scoreA += 50;
      if (yB == year) scoreB += 50;
    }

    return scoreB - scoreA;
  });

  return results[0] || null;
}

// ================= TRENDING =================

async function getTrending(limit = 10) {

  const url = buildUrl("/trending/all/week");

  const data = await tmdbFetch(url);

  return data?.results?.slice(0, limit) || [];
}

// ================= POPULAR =================

async function getPopular(limit = 10) {

  const url = buildUrl("/movie/popular");

  const data = await tmdbFetch(url);

  return data?.results?.slice(0, limit) || [];
}

// ================= GENRE =================

async function getByGenre(genreId, limit = 10) {

  if (!genreId) return [];

  const url = buildUrl("/discover/movie", {
    with_genres: genreId
  });

  const data = await tmdbFetch(url);

  return data?.results?.slice(0, limit) || [];
}

// ================= SIMILAR =================

async function getSimilar(id, type = "movie", limit = 10) {

  if (!id) return [];

  const safeType = type === "tv" ? "tv" : "movie";

  const url = buildUrl(`/${safeType}/${id}/similar`);

  const data = await tmdbFetch(url);

  return data?.results?.slice(0, limit) || [];
}

// ================= EXPORT =================

module.exports = {
  tmdbFetch,
  getDetails,
  getEpisodeDetails,
  searchTMDBUltra,
  getTrending,
  getPopular,
  getByGenre,
  getSimilar
};