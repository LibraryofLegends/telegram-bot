const { MAIN_CHANNEL_ID } = require("./env");

// später erweiterbar (z.B. mehrere Channels)
const CHANNELS = {
  default: MAIN_CHANNEL_ID
};

function getTargetChannel(genres = []) {
  // aktuell alles auf main
  return CHANNELS.default;
}

module.exports = {
  getTargetChannel,
  CHANNELS
};