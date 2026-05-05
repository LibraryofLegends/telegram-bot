const fs = require("fs");
const path = require("path");

const { tg } = require("./telegramService");
const { SERIES_GROUP_ID } = require("../config");

// ================= CONFIG =================

const FILE = path.join(__dirname, "../data/seriesThreads.json");

// In-Memory Cache
let THREAD_CACHE = loadCache();

// ================= CACHE =================

function loadCache() {
  try {
    if (!fs.existsSync(FILE)) return {};
    return JSON.parse(fs.readFileSync(FILE, "utf8") || "{}");
  } catch {
    return {};
  }
}

function saveCache() {
  try {
    fs.writeFileSync(FILE, JSON.stringify(THREAD_CACHE, null, 2));
  } catch (err) {
    console.log("❌ THREAD CACHE SAVE ERROR:", err.message);
  }
}

// ================= KEY NORMALIZER =================

function normalizeKey(name = "") {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

// ================= THREAD CREATE =================

async function createThread(title) {

  try {

    const res = await tg("createForumTopic", {
      chat_id: SERIES_GROUP_ID,
      name: title
    });

    if (!res?.ok) {
      console.log("❌ THREAD CREATE FAILED:", res);
      return null;
    }

    return res.result.message_thread_id;

  } catch (err) {
    console.log("❌ THREAD CREATE ERROR:", err.message);
    return null;
  }
}

// ================= MAIN =================

async function ensureSeriesThread(seriesName) {

  const key = normalizeKey(seriesName);

  // 🔥 CACHE HIT
  if (THREAD_CACHE[key]) {
    return THREAD_CACHE[key];
  }

  console.log("🧵 CREATE NEW THREAD:", seriesName);

  const threadId = await createThread(seriesName);

  if (!threadId) {
    console.log("❌ FAILED TO CREATE THREAD");
    return null;
  }

  THREAD_CACHE[key] = threadId;

  saveCache();

  return threadId;
}

// ================= OPTIONAL =================

// Falls du Threads manuell entfernen willst
function removeThread(seriesName) {

  const key = normalizeKey(seriesName);

  if (THREAD_CACHE[key]) {
    delete THREAD_CACHE[key];
    saveCache();
  }
}

// Debug / Übersicht
function getAllThreads() {
  return THREAD_CACHE;
}

// ================= EXPORT =================

module.exports = {
  ensureSeriesThread,
  removeThread,
  getAllThreads
};