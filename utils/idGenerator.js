const fs = require("fs");
const path = require("path");

// ================= CONFIG =================

const FILE = path.join(__dirname, "ids.json");

// ================= CORE =================

function safeParse(data) {
  try {
    return JSON.parse(data);
  } catch {
    console.error("❌ ID PARSE ERROR → reset");
    return {};
  }
}

function load() {
  try {
    if (!fs.existsSync(FILE)) return {};

    const raw = fs.readFileSync(FILE, "utf8") || "{}";
    return safeParse(raw);

  } catch (err) {
    console.error("❌ ID LOAD ERROR:", err.message);
    return {};
  }
}

function save(data) {
  try {
    const tmp = FILE + ".tmp";

    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, FILE);

  } catch (err) {
    console.error("❌ ID SAVE ERROR:", err.message);
  }
}

// ================= GENERATOR =================

function nextId(type = "global", options = {}) {

  const {
    prefix = "",
    pad = 4
  } = options;

  const db = load();

  if (!db[type]) {
    db[type] = 0;
  }

  db[type] += 1;

  save(db);

  const num = String(db[type]).padStart(pad, "0");

  return prefix ? `${prefix}${num}` : num;
}

// ================= BULK =================

function nextBatch(type = "global", count = 10, options = {}) {

  const ids = [];

  for (let i = 0; i < count; i++) {
    ids.push(nextId(type, options));
  }

  return ids;
}

// ================= RESET =================

function reset(type = "global") {

  const db = load();

  db[type] = 0;

  save(db);
}

// ================= GET CURRENT =================

function getCurrent(type = "global") {

  const db = load();

  return db[type] || 0;
}

// ================= EXPORT =================

module.exports = {
  nextId,
  nextBatch,
  reset,
  getCurrent
};