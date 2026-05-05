// ================= LOAD ENV =================

require("dotenv").config();

// ================= HELPERS =================

function required(name) {
  const value = process.env[name];

  if (!value) {
    console.error(`❌ ENV ERROR: ${name} fehlt`);
    process.exit(1);
  }

  return value;
}

function optional(name, fallback = null) {
  return process.env[name] || fallback;
}

function toNumber(value, fallback = null) {
  const n = Number(value);
  return isNaN(n) ? fallback : n;
}

// ================= CORE =================

const ENV = {

  // 🤖 TELEGRAM
  TOKEN: required("TOKEN"),
  BOT_USERNAME: required("BOT_USERNAME"),

  // 🎬 TMDB
  TMDB_KEY: required("TMDB_KEY"),

  // ☁️ CLOUDINARY (optional)
  CLOUDINARY_URL: optional("CLOUDINARY_URL"),

  // 📺 CHANNELS
  MAIN_CHANNEL_ID: toNumber(optional("MAIN_CHANNEL_ID")),
  SERIES_GROUP_ID: toNumber(optional("SERIES_GROUP_ID")),

  // ⚙️ SERVER
  PORT: toNumber(optional("PORT"), 3000),

  // 🚀 SYSTEM
  NODE_ENV: optional("NODE_ENV", "development")
};

// ================= DEBUG =================

function logEnv() {

  console.log("🌍 ENV LOADED:");
  console.log("BOT:", ENV.BOT_USERNAME);
  console.log("PORT:", ENV.PORT);
  console.log("MODE:", ENV.NODE_ENV);

  if (!ENV.MAIN_CHANNEL_ID) {
    console.log("⚠️ MAIN_CHANNEL_ID fehlt");
  }

  if (!ENV.SERIES_GROUP_ID) {
    console.log("⚠️ SERIES_GROUP_ID fehlt");
  }
}

// ================= EXPORT =================

module.exports = {
  ENV,
  logEnv
};