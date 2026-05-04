const fs = require("fs");

const FILE = "queue.json";

// ================= STATE =================

function loadQueue() {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE, "utf8") || "{}");
}

function saveQueue(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// In-memory cache (speed boost)
let QUEUE_DB = loadQueue();

// ================= QUEUE CORE =================

function getUserQueue(userId) {
  if (!QUEUE_DB[userId]) QUEUE_DB[userId] = [];
  return QUEUE_DB[userId];
}

// ================= ADD ITEM =================

function addToQueue(userId, item) {

  if (!QUEUE_DB[userId]) QUEUE_DB[userId] = [];

  // Prevent duplicates
  QUEUE_DB[userId] = [
    item,
    ...QUEUE_DB[userId].filter(x => x.display_id !== item.display_id)
  ];

  saveQueue(QUEUE_DB);

  return QUEUE_DB[userId];
}

// ================= REMOVE ITEM =================

function removeFromQueue(userId, display_id) {

  if (!QUEUE_DB[userId]) return [];

  QUEUE_DB[userId] = QUEUE_DB[userId]
    .filter(x => x.display_id !== display_id);

  saveQueue(QUEUE_DB);

  return QUEUE_DB[userId];
}

// ================= CLEAR QUEUE =================

function clearQueue(userId) {
  QUEUE_DB[userId] = [];
  saveQueue(QUEUE_DB);
  return true;
}

// ================= GET NEXT =================

function getNextInQueue(userId) {

  const queue = getUserQueue(userId);

  if (!queue.length) return null;

  // FIFO (first item = next play)
  return queue[0];
}

// ================= POP NEXT (PLAY FLOW) =================

function popNext(userId) {

  const queue = getUserQueue(userId);

  if (!queue.length) return null;

  const next = queue.shift();

  saveQueue(QUEUE_DB);

  return next;
}

// ================= MOVE TO TOP =================

function prioritizeItem(userId, display_id) {

  const queue = getUserQueue(userId);

  const index = queue.findIndex(x => x.display_id === display_id);

  if (index === -1) return queue;

  const [item] = queue.splice(index, 1);

  queue.unshift(item);

  saveQueue(QUEUE_DB);

  return queue;
}

// ================= REORDER =================

function reorderQueue(userId, newOrder) {

  if (!Array.isArray(newOrder)) return [];

  QUEUE_DB[userId] = newOrder;

  saveQueue(QUEUE_DB);

  return QUEUE_DB[userId];
}

// ================= SMART INSERT (AI HOOK READY) =================

function smartAdd(userId, item, mode = "auto") {

  const queue = getUserQueue(userId);

  // MODE 1: auto → append
  if (mode === "auto") {
    return addToQueue(userId, item);
  }

  // MODE 2: next → push after current
  if (mode === "next") {
    queue.splice(1, 0, item);
    saveQueue(QUEUE_DB);
    return queue;
  }

  // MODE 3: top → force next play
  if (mode === "top") {
    queue.unshift(item);
    saveQueue(QUEUE_DB);
    return queue;
  }

  return addToQueue(userId, item);
}

// ================= SERIES AUTO QUEUE =================

function queueSeriesEpisode(userId, seriesKey, season, episode, display_id) {

  return smartAdd(userId, {
    type: "series",
    seriesKey,
    season,
    episode,
    display_id
  }, "auto");
}

// ================= MOVIE QUEUE =================

function queueMovie(userId, item) {

  return smartAdd(userId, {
    type: "movie",
    display_id: item.display_id,
    title: item.title,
    file_id: item.file_id
  }, "auto");
}

// ================= EXPORT =================

module.exports = {
  getUserQueue,
  addToQueue,
  removeFromQueue,
  clearQueue,
  getNextInQueue,
  popNext,
  prioritizeItem,
  reorderQueue,
  smartAdd,
  queueSeriesEpisode,
  queueMovie
};