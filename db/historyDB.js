const fs = require("fs");
const path = require("path");

// ================= CONFIG =================

const FILE = path.join(__dirname, "history.json");
const MAX_ITEMS = 20; // pro User

// ================= CORE =================

function safeParse(data) {
  try {
    return JSON.parse(data);
  } catch {
    console.error("❌ HISTORY PARSE ERROR → reset");
    return {};
  }
}

function load() {
  try {
    if (!fs.existsSync(FILE)) return {};

    const raw = fs.readFileSync(FILE, "utf8") || "{}";
    return safeParse(raw);

  } catch (err) {
    console.error("❌ HISTORY LOAD ERROR:", err.message);
    return {};
  }
}

function save(data) {
  try {
    const tmp = FILE + ".tmp";

    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, FILE);

  } catch (err) {
    console.error("❌ HISTORY SAVE ERROR:", err.message);
  }
}

// ================= ADD =================

/**
 * entry:
 * {
 *   id: "0001",
 *   type: "movie" | "series",
 *   title: "...",
 *   genres: [28, 12],
 *   timestamp?: number
 * }
 */
function saveHistory(userId, entry) {

  if (!userId || !entry?.id) return;

  const db = load();

  if (!db[userId]) db[userId] = [];

  const now = Date.now();

  // ❌ Duplikat entfernen
  const filtered = db[userId].filter(x => x.id !== entry.id);

  // ✅ neu vorne einfügen
  db[userId] = [
    {
      ...entry,
      timestamp: now
    },
    ...filtered
  ].slice(0, MAX_ITEMS);

  save(db);
}

// ================= GET =================

function readHistory(userId) {

  if (!userId) return [];

  const db = load();

  return db[userId] || [];
}

// ================= CLEAR =================

function clearHistory(userId) {

  if (!userId) return;

  const db = load();

  delete db[userId];

  save(db);
}

// ================= STATS =================

// 🔥 Top Genres eines Users
function getTopGenres(userId) {

  const history = readHistory(userId);

  const score = {};

  for (const item of history) {
    for (const g of item.genres || []) {
      score[g] = (score[g] || 0) + 1;
    }
  }

  return Object.entries(score)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => parseInt(id));
}

// 🔥 zuletzt gesehen IDs
function getRecentIds(userId, limit = 10) {

  const history = readHistory(userId);

  return history
    .slice(0, limit)
    .map(x => x.id);
}

// ================= EXPORT =================

module.exports = {
  saveHistory,
  readHistory,
  clearHistory,
  getTopGenres,
  getRecentIds
};