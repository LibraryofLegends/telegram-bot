// utils/idGenerator.js

const fs = require("fs");

const FILE = "ids.json";

// ================= LOAD / SAVE =================

function load() {
  if (!fs.existsSync(FILE)) {
    return {
      global: 0,
      categories: {},
      series: {}
    };
  }

  return JSON.parse(fs.readFileSync(FILE, "utf8") || "{}");
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// ================= GLOBAL ID =================

function generateNextId() {
  const db = load();

  db.global = (db.global || 0) + 1;

  save(db);

  return String(db.global).padStart(4, "0");
}

// ================= CATEGORY ID =================

function generateCategoryId(genreIds = []) {
  const db = load();

  const key = (genreIds || [])
    .sort((a, b) => a - b)
    .join("_") || "default";

  if (!db.categories[key]) {
    db.categories[key] = Object.keys(db.categories).length + 1;
    save(db);
  }

  return String(db.categories[key]).padStart(3, "0");
}

// ================= SERIES ID =================

function generateSeriesId(seriesKey) {
  const db = load();

  if (!db.series[seriesKey]) {
    db.series[seriesKey] = Object.keys(db.series).length + 1;
    save(db);
  }

  return String(db.series[seriesKey]).padStart(3, "0");
}

// ================= SAFE RESET (DEV ONLY) =================

function resetIds() {
  const empty = {
    global: 0,
    categories: {},
    series: {}
  };

  save(empty);
}

// ================= EXPORT =================

module.exports = {
  generateNextId,
  generateCategoryId,
  generateSeriesId,
  resetIds
};