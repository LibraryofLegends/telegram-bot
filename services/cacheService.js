const DEFAULT_TTL = 1000 * 60 * 60; // 1 Stunde

// ================= STORAGE =================

const CACHE = new Map();

// ================= CORE =================

function set(key, value, ttl = DEFAULT_TTL) {

  CACHE.set(key, {
    value,
    expires: Date.now() + ttl
  });
}

function get(key) {

  const entry = CACHE.get(key);

  if (!entry) return null;

  const isValid = Date.now() < entry.expires;

  if (!isValid) {
    CACHE.delete(key);
    return null;
  }

  return entry.value;
}

function del(key) {
  CACHE.delete(key);
}

function clear() {
  CACHE.clear();
}

// ================= WRAPPER =================

async function remember(key, fn, ttl = DEFAULT_TTL) {

  const cached = get(key);

  if (cached !== null) return cached;

  const result = await fn();

  if (result !== null && result !== undefined) {
    set(key, result, ttl);
  }

  return result;
}

// ================= STATS =================

function stats() {

  let valid = 0;
  let expired = 0;

  const now = Date.now();

  for (const [, entry] of CACHE) {
    if (entry.expires > now) valid++;
    else expired++;
  }

  return {
    size: CACHE.size,
    valid,
    expired
  };
}

// ================= CLEANUP =================

function cleanup() {

  const now = Date.now();

  for (const [key, entry] of CACHE) {
    if (entry.expires < now) {
      CACHE.delete(key);
    }
  }
}

// Auto Cleanup alle 10 Minuten
setInterval(cleanup, 1000 * 60 * 10);

// ================= EXPORT =================

module.exports = {
  set,
  get,
  del,
  clear,
  remember,
  stats
};