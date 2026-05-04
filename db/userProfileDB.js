const fs = require("fs");

const FILE = "userProfile.json";

// ================= CORE LOAD / SAVE =================

function loadUserProfiles() {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE, "utf8") || "{}");
}

function saveUserProfiles(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// ================= INIT USER =================

function ensureUser(db, userId) {
  if (!db[userId]) {
    db[userId] = {
      genres: {},        // Genre weight system
      liked: {},         // liked movies/series
      disliked: {},      // disliked items
      watched: {},       // watch counter
      lastSeen: null,
      updatedAt: Date.now()
    };
  }
  return db[userId];
}

// ================= UPDATE WATCH EVENT =================

function trackWatch(userId, item) {
  const db = loadUserProfiles();
  const user = ensureUser(db, userId);

  const genres = item.genres || [];

  // 📊 Genre Learning
  for (const g of genres) {
    user.genres[g] = (user.genres[g] || 0) + 1;
  }

  // 👁 Watch Tracking
  user.watched[item.display_id] = (user.watched[item.display_id] || 0) + 1;

  user.lastSeen = item.display_id;
  user.updatedAt = Date.now();

  saveUserProfiles(db);
}

// ================= LIKE / DISLIKE =================

function likeItem(userId, itemId) {
  const db = loadUserProfiles();
  const user = ensureUser(db, userId);

  user.liked[itemId] = true;
  delete user.disliked[itemId];

  saveUserProfiles(db);
}

function dislikeItem(userId, itemId) {
  const db = loadUserProfiles();
  const user = ensureUser(db, userId);

  user.disliked[itemId] = true;
  delete user.liked[itemId];

  saveUserProfiles(db);
}

// ================= GET PROFILE =================

function getUserProfile(userId) {
  const db = loadUserProfiles();
  return ensureUser(db, userId);
}

// ================= BUILD AI WEIGHTS =================

function buildPreferenceVector(userId) {
  const user = getUserProfile(userId);

  const vector = {};

  // 🎯 Genres
  for (const [genre, score] of Object.entries(user.genres)) {
    vector[genre] = score * 3;
  }

  // ❤️ Likes boost
  for (const id of Object.keys(user.liked)) {
    vector[`like:${id}`] = 50;
  }

  // 💀 Dislikes penalty
  for (const id of Object.keys(user.disliked)) {
    vector[`dislike:${id}`] = -100;
  }

  return vector;
}

// ================= EXPORT =================

module.exports = {
  loadUserProfiles,
  saveUserProfiles,
  trackWatch,
  likeItem,
  dislikeItem,
  getUserProfile,
  buildPreferenceVector
};