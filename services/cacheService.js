const fs = require("fs");

// ================= CONFIG =================

const CACHE_FILE = "cache.json";
const DEFAULT_TTL = 1000 * 60 * 60; // 1h

// In-memory cache (FAST LAYER)
const MEMORY_CACHE = new Map();

// ================= FILE CACHE =================

function loadFileCache() {
  if (!fs.existsSync(CACHE_FILE)) return {};
  return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8") || "{}");
}

function saveFileCache(data) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

// Persistent fallback cache
let FILE_CACHE = loadFileCache();

// ================= CORE GET =================

function get(key) {

  // 1. MEMORY LAYER (ultra fast)
  const mem = MEMORY_CACHE.get(key);

  if (mem && (Date.now() - mem.time) < DEFAULT_TTL) {
    return mem.value;
  }

  // 2. FILE LAYER
  const file = FILE_CACHE[key];

  if (file && (Date.now() - file.time) < DEFAULT_TTL) {
    return file.value;
  }

  return null;
}

// ================= CORE SET =================

function set(key, value, ttl = DEFAULT_TTL) {

  const entry = {
    value,
    time: Date.now(),
    ttl
  };

  // memory
  MEMORY_CACHE.set(key, entry);

  // file
  FILE_CACHE[key] = entry;

  saveFileCache(FILE_CACHE);

  return value;
}

// ================= HAS =================

function has(key) {
  return get(key) !== null;
}

// ================= DELETE =================

function del(key) {

  MEMORY_CACHE.delete(key);
  delete FILE_CACHE[key];

  saveFileCache(FILE_CACHE);
}

// ================= CLEAR =================

function clear() {
  MEMORY_CACHE.clear();
  FILE_CACHE = {};
  saveFileCache(FILE_CACHE);
}

// ================= CLEANUP EXPIRED =================

function cleanup() {

  const now = Date.now();

  for (const [key, value] of Object.entries(FILE_CACHE)) {
    if ((now - value.time) > value.ttl) {
      delete FILE_CACHE[key];
    }
  }

  saveFileCache(FILE_CACHE);
}

// ================= CACHE WRAPPERS =================

// TMDB cache helper
function cacheTMDB(key, fetchFn, ttl = DEFAULT_TTL) {

  return async function () {

    const cached = get(key);

    if (cached) return cached;

    const data = await fetchFn();

    if (data) set(key, data, ttl);

    return data;
  };
}

// ================= SMART CACHE KEY =================

function buildKey(prefix, ...parts) {
  return `${prefix}:${parts.join(":")}`;
}

// ================= SERIES CACHE =================

function cacheSeries(seriesKey, season, episode, data) {

  const key = buildKey("series", seriesKey, season, episode);

  set(key, data);

  return data;
}

function getSeries(seriesKey, season, episode) {

  const key = buildKey("series", seriesKey, season, episode);

  return get(key);
}

// ================= USER CACHE =================

function cacheUser(userId, data) {

  const key = buildKey("user", userId);

  set(key, data, 1000 * 60 * 10); // 10 min

  return data;
}

function getUser(userId) {

  const key = buildKey("user", userId);

  return get(key);
}

// ================= SEARCH CACHE =================

function cacheSearch(query, results) {

  const key = buildKey("search", query.toLowerCase());

  return set(key, results, 1000 * 60 * 30); // 30 min
}

function getSearch(query) {

  const key = buildKey("search", query.toLowerCase());

  return get(key);
}

// ================= EXPORT =================

module.exports = {
  get,
  set,
  has,
  del,
  clear,
  cleanup,
  cacheTMDB,
  buildKey,
  cacheSeries,
  getSeries,
  cacheUser,
  getUser,
  cacheSearch,
  getSearch
};