const fs = require("fs");
const path = require("path");

// ================= CONFIG =================

const FILE = path.join(__dirname, "films.json");

// ================= CORE =================

function safeParse(data) {
  try {
    return JSON.parse(data);
  } catch {
    console.error("❌ DB PARSE ERROR → Datei wird zurückgesetzt");
    return [];
  }
}

function loadDB() {
  try {
    if (!fs.existsSync(FILE)) return [];

    const raw = fs.readFileSync(FILE, "utf8") || "[]";
    return safeParse(raw);

  } catch (err) {
    console.error("❌ DB LOAD ERROR:", err.message);
    return [];
  }
}

// atomisches Speichern (verhindert kaputte Dateien)
function saveDB(data = []) {
  try {
    const tempFile = FILE + ".tmp";

    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
    fs.renameSync(tempFile, FILE);

  } catch (err) {
    console.error("❌ DB SAVE ERROR:", err.message);
  }
}

// ================= ID SYSTEM =================

function generateNextId(data = []) {

  if (!data.length) return "0001";

  const max = Math.max(
    ...data.map(x => parseInt(x.display_id) || 0)
  );

  return String(max + 1).padStart(4, "0");
}

// optional: Kategorie-ID (für UI / Routing)
function generateCategoryId(genres = []) {

  if (!genres.length) return "000";

  // einfache Hash-Logik
  const base = genres.reduce((acc, g) => acc + g, 0);

  return String(base).slice(0, 3);
}

// ================= INDEX HELPERS =================

// 🔍 nach ID finden
function findById(id) {
  const db = loadDB();
  return db.find(x => x.display_id === id) || null;
}

// 🔍 nach TMDB ID
function findByTMDB(tmdbId) {
  const db = loadDB();
  return db.find(x => x.tmdb_id === tmdbId) || null;
}

// 🔍 nach File ID (Duplikate vermeiden)
function findByFileId(fileId) {
  const db = loadDB();
  return db.find(x => x.file_id === fileId) || null;
}

// ➕ neuen Film speichern
function insertItem(item) {

  if (!item?.display_id) return;

  const db = loadDB();

  // Duplikat Check
  const exists = db.find(x => x.file_id === item.file_id);
  if (exists) return exists;

  db.unshift(item);

  saveDB(db);

  return item;
}

// 🗑 löschen
function removeItem(id) {

  const db = loadDB();

  const filtered = db.filter(x => x.display_id !== id);

  saveDB(filtered);
}

// ================= EXPORT =================

module.exports = {
  loadDB,
  saveDB,
  generateNextId,
  generateCategoryId,

  // helpers
  findById,
  findByTMDB,
  findByFileId,
  insertItem,
  removeItem
};