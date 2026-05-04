require("dotenv").config();

function getEnv(key, fallback = null) {
  if (process.env[key]) return process.env[key];
  if (fallback !== null) return fallback;

  console.warn(`⚠️ ENV missing: ${key}`);
  return null;
}

module.exports = {
  TOKEN: getEnv("TOKEN"),
  BOT_USERNAME: getEnv("BOT_USERNAME"),

  MAIN_CHANNEL_ID: getEnv("MAIN_CHANNEL_ID"),
  SERIES_GROUP_ID: getEnv("SERIES_GROUP_ID"),

  LOG_LEVEL: getEnv("LOG_LEVEL", "dev")
};