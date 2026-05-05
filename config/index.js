const env = require("./env");
const channels = require("./channels");
const threads = require("./threads");
const genres = require("./genres");

module.exports = {
  ...env,
  ...channels,
  ...threads,
  ...genres
};