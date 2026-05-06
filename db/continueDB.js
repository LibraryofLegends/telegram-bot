const fs = require("fs");
const path = require("path");

// ================= CONFIG =================

const FILE = path.join(__dirname, "continue.json");

// ================= CORE =================

function load() {
  try {
    if (!fs.existsSync(FILE)) return {};
    const raw = fs.readFileSync(FILE, "utf8") || "{}";
    return JSON.parse(raw);
  } catch (err) {
    console.error("❌ CONTINUE LOAD ERROR:", err.message);
    return {};
  }
}

function save(data) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("❌ CONTINUE SAVE ERROR:", err.message);
  }
}

// ================= SET =================

/**
 * payload:
 * {
 *   id: "0001",
 *   type: "movie" | "series",
 *   title: "...",
 *   seriesKey?: "...",
 *   season?: 1,
 *   episode?: 2,
 *   position?: 120, // Sekunden (optional)
 *   updatedAt?: timestamp
 * }
 */
function setContinue(userId, payload) {

  if (!userId || !payload?.id) return;

  const db = load();

  db[userId] = {
    ...payload,
    updatedAt: Date.now()
  };

  save(db);
}

// ================= GET =================

function getContinue(userId) {

  if (!userId) return null;

  const db = load();

  return db[userId] || null;
}

// ================= CLEAR =================

function clearContinue(userId) {

  if (!userId) return;

  const db = load();

  delete db[userId];

  save(db);
}

// ================= UPDATE POSITION =================

function updatePosition(userId, position) {

  const db = load();

  if (!db[userId]) return;

  db[userId].position = position;
  db[userId].updatedAt = Date.now();

  save(db);
}

// ================= EXPORT =================

module.exports = {
  setContinue,
  getContinue,
  clearContinue,
  updatePosition
};