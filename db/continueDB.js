const fs = require("fs");

const FILE = "continue.json";

// ================= CORE LOAD / SAVE =================

function loadContinueDB() {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE, "utf8") || "{}");
}

function saveContinueDB(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// ================= SET CONTINUE =================

/**
 * Speichert den aktuellen Serien-/Film-Fortschritt eines Users
 */
function setContinue(userId, payload) {
  const db = loadContinueDB();

  db[userId] = {
    ...payload,
    updatedAt: Date.now()
  };

  saveContinueDB(db);
}

// ================= GET CONTINUE =================

function getContinue(userId) {
  const db = loadContinueDB();
  return db[userId] || null;
}

// ================= CLEAR CONTINUE =================

function clearContinue(userId) {
  const db = loadContinueDB();

  if (db[userId]) {
    delete db[userId];
    saveContinueDB(db);
  }
}

// ================= AUTO NEXT HELPERS =================

function updateContinueAfterWatch(userId, seriesKey, season, episode, id) {
  setContinue(userId, {
    seriesKey,
    season,
    episode,
    id,
    type: "series"
  });
}

// ================= EXPORT =================

module.exports = {
  loadContinueDB,
  saveContinueDB,
  setContinue,
  getContinue,
  clearContinue,
  updateContinueAfterWatch
};