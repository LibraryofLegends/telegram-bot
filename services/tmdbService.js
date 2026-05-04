const fetch = global.fetch || require("node-fetch");

const TMDB_KEY = process.env.TMDB_KEY;

// ================= CACHE =================

const CACHE = new Map();
const TTL = 1000 * 60 * 60; // 1h

function getCache(url) {
  const entry = CACHE.get(url);
  if (!entry) return null;

  if (Date.now() - entry.time > TTL) {
    CACHE.delete(url);
    return null;
  }

  return entry.data;
}

function setCache(url, data) {
  CACHE.set(url, {
    data,
    time: Date.now()
  });
}

// ================= CORE FETCH =================

async function tmdbFetch(url) {

  const cached = getCache(url);
  if (cached) return cached;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      console.error("❌ TMDB ERROR:", res.status, url);
      return null;
    }

    const data = await res.json();

    setCache(url, data);

    return data;

  } catch (err) {
    console.error("❌ TMDB FETCH ERROR:", err.message);
    return null;
  }
}

// ================= DETAILS =================

async function getDetails(id, type = "movie") {

  if (!id) return null;

  const safeType = type === "tv" ? "tv" : "movie";

  const url = `https://api.themoviedb.org/3/${safeType}/${id}?api_key=${TMDB_KEY}&language=de-DE&append_to_response=credits,videos`;

  return tmdbFetch(url);
}

// ================= EPISODE DETAILS =================

async function getEpisodeDetails(tvId, season, episode) {

  if (!tvId || !season || !episode) return null;

  const url = `https://api.themoviedb.org/3/tv/${tvId}/season/${season}/episode/${episode}?api_key=${TMDB_KEY}&language=de-DE`;

  return tmdbFetch(url);
}

// ================= SMART SEARCH =================

async function searchTMDBUltra(query, year = null, type = null) {

  if (!query) return null;

  const url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&language=de-DE`;

  const res = await tmdbFetch(url);

  if (!res?.results?.length) return null;

  let results = res.results;

  // ================= FILTER TYPE =================

  if (type) {
    results = results.filter(r => r.media_type === type);
  }

  // ================= YEAR SCORING =================

  if (year) {
    results = results
      .map(item => {
        const itemYear = parseInt(
          (item.release_date || item.first_air_date || "").slice(0, 4)
        ) || 0;

        const diff = Math.abs(itemYear - year);

        return {
          ...item,
          score: diff
        };
      })
      .sort((a, b) => a.score - b.score);
  }

  // ================= BEST MATCH =================

  return results[0] || res.results[0];
}

// ================= TRENDING =================

async function getTrending(limit = 10) {

  const url = `https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_KEY}&language=de-DE`;

  const data = await tmdbFetch(url);

  return data?.results?.slice(0, limit) || [];
}

// ================= POPULAR =================

async function getPopular(limit = 10) {

  const url = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=de-DE`;

  const data = await tmdbFetch(url);

  return data?.results?.slice(0, limit) || [];
}

// ================= DISCOVER BY GENRE =================

async function getByGenre(genreId, limit = 10) {

  if (!genreId) return [];

  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=${genreId}&language=de-DE`;

  const data = await tmdbFetch(url);

  return data?.results?.slice(0, limit) || [];
}

// ================= SIMILAR =================

async function getSimilar(id, type = "movie", limit = 10) {

  if (!id) return [];

  const safeType = type === "tv" ? "tv" : "movie";

  const url = `https://api.themoviedb.org/3/${safeType}/${id}/similar?api_key=${TMDB_KEY}&language=de-DE`;

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