const fs = require("fs");
const path = require("path");

// ================= CONFIG =================

const FILE = path.join(__dirname, "userProfiles.json");

// ================= CORE =================

function safeParse(data) {
  try {
    return JSON.parse(data);
  } catch {
    console.error("❌ PROFILE PARSE ERROR → reset");
    return {};
  }
}

function load() {
  try {
    if (!fs.existsSync(FILE)) return {};

    const raw = fs.readFileSync(FILE, "utf8") || "{}";
    return safeParse(raw);

  } catch (err) {
    console.error("❌ PROFILE LOAD ERROR:", err.message);
    return {};
  }
}

function save(data) {
  try {
    const tmp = FILE + ".tmp";

    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, FILE);

  } catch (err) {
    console.error("❌ PROFILE SAVE ERROR:", err.message);
  }
}

// ================= INIT =================

function ensureUser(db, userId) {

  if (!db[userId]) {
    db[userId] = {
      createdAt: Date.now(),
      updatedAt: Date.now(),

      stats: {
        totalWatched: 0,
        movies: 0,
        series: 0
      },

      genres: {}, // { 28: 5, 35: 2 }

      lastWatched: null
    };
  }
}

// ================= UPDATE =================

/**
 * payload:
 * {
 *   id: "0001",
 *   type: "movie" | "series",
 *   genres: [28, 12]
 * }
 */
function updateUserProfile(userId, payload) {

  if (!userId || !payload) return;

  const db = load();

  ensureUser(db, userId);

  const user = db[userId];

  // 📊 Stats
  user.stats.totalWatched += 1;

  if (payload.type === "movie") {
    user.stats.movies += 1;
  }

  if (payload.type === "series") {
    user.stats.series += 1;
  }

  // 🎯 Genres
  for (const g of payload.genres || []) {
    user.genres[g] = (user.genres[g] || 0) + 1;
  }

  // 🕒 Last watched
  user.lastWatched = {
    id: payload.id,
    timestamp: Date.now()
  };

  user.updatedAt = Date.now();

  save(db);
}

// ================= GET =================

function getUserProfile(userId) {

  if (!userId) return null;

  const db = load();

  return db[userId] || null;
}

// ================= TOP GENRES =================

function getTopGenres(userId, limit = 5) {

  const user = getUserProfile(userId);

  if (!user) return [];

  return Object.entries(user.genres)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => parseInt(id));
}

// ================= RESET =================

function resetUserProfile(userId) {

  const db = load();

  delete db[userId];

  save(db);
}

// ================= EXPORT =================

module.exports = {
  updateUserProfile,
  getUserProfile,
  getTopGenres,
  resetUserProfile
};