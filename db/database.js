const fs = require("fs");

// ================= CONFIG =================

const DB_FILE = "films.json";

// ================= CORE LOAD / SAVE =================

function loadDB() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8") || "[]");
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ================= ID GENERATION =================

function generateNextId(data = null) {

  const db = data || loadDB();

  if (!db.length) return "0001";

  const max = Math.max(
    ...db
      .map(x => parseInt(x.display_id || x.id || 0))
      .filter(n => !isNaN(n))
  );

  return String(max + 1).padStart(4, "0");
}

// ================= CATEGORY SYSTEM =================

function generateCategoryId(genreIds = []) {

  if (!Array.isArray(genreIds) || genreIds.length === 0) {
    return "uncategorized";
  }

  // stable deterministic category hash
  return genreIds
    .slice()
    .sort((a, b) => a - b)
    .join("-");
}

// ================= FIND ITEM =================

function findById(id) {

  const db = loadDB();

  return db.find(
    x =>
      x.display_id === id ||
      x.id === id
  ) || null;
}

// ================= UPSERT ITEM =================

function upsertItem(item) {

  const db = loadDB();

  const index = db.findIndex(x =>
    x.display_id === item.display_id
  );

  if (index !== -1) {
    db[index] = {
      ...db[index],
      ...item,
      updated_at: Date.now()
    };
  } else {
    db.unshift({
      ...item,
      created_at: Date.now()
    });
  }

  saveDB(db);

  return item;
}

// ================= DELETE ITEM =================

function deleteItem(id) {

  let db = loadDB();

  db = db.filter(x =>
    x.display_id !== id &&
    x.id !== id
  );

  saveDB(db);

  return true;
}

// ================= BULK INSERT =================

function insertMany(items = []) {

  const db = loadDB();

  const cleaned = items.map(item => ({
    ...item,
    created_at: Date.now()
  }));

  const merged = [...cleaned, ...db];

  saveDB(merged);

  return merged;
}

// ================= SEARCH =================

function searchDB(query = "") {

  const db = loadDB();

  const q = query.toLowerCase();

  return db.filter(item => {

    const title = (item.title || "").toLowerCase();

    return title.includes(q);
  });
}

// ================= GENRE FILTER =================

function getByGenre(genreId) {

  const db = loadDB();

  return db.filter(item =>
    (item.genres || []).includes(genreId)
  );
}

// ================= STATS =================

function getStats() {

  const db = loadDB();

  const total = db.length;

  const movies = db.filter(x => x.media_type === "movie").length;
  const series = db.filter(x => x.media_type === "tv").length;

  const genres = {};

  for (const item of db) {
    for (const g of item.genres || []) {
      genres[g] = (genres[g] || 0) + 1;
    }
  }

  return {
    total,
    movies,
    series,
    genres
  };
}

// ================= CLEAN INVALID =================

function cleanInvalid() {

  let db = loadDB();

  db = db.filter(item =>
    item &&
    item.file_id &&
    item.display_id
  );

  saveDB(db);

  return db;
}

// ================= EXPORT =================

module.exports = {
  loadDB,
  saveDB,
  generateNextId,
  generateCategoryId,
  findById,
  upsertItem,
  deleteItem,
  insertMany,
  searchDB,
  getByGenre,
  getStats,
  cleanInvalid
};