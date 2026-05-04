const {
  tg,
  createSendToChannel,
  playerUrl
} = require("../services/telegramService");

const {
  searchTMDBUltra,
  getDetails,
  getEpisodeDetails
} = require("../services/tmdbService");

const {
  parseFileName,
  ultraCleanTitle,
  aiNormalize,
  buildSearchVariants
} = require("../utils/parser");

const {
  generateNextId,
  generateCategoryId,
  loadDB,
  saveDB
} = require("../db/database");

const {
  loadSeriesDB,
  saveSeriesDB
} = require("../db/seriesDB");

const {
  getTargetChannel,
  getThreadByGenre,
  SERIES_GROUP_ID
} = require("../config/threads");

const {
  ensureSeriesThread
} = require("../services/seriesService");

const { buildCard } = require("../services/mediaService");

// optional CDN
let uploadToCloudinary = null;
try {
  uploadToCloudinary = require("../services/mediaService").uploadToCloudinary;
} catch {}

const sendToChannel = createSendToChannel({
  getTargetChannel,
  getThreadByGenre
});

// ================= STATE =================

let CACHE = loadDB();
let SERIES_DB = loadSeriesDB();

// ================= HELPERS =================

const getCover = (data = {}) =>
  data?.poster_path
    ? `https://image.tmdb.org/t/p/original${data.poster_path}`
    : null;

const getBanner = (data = {}) =>
  data?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
    : null;

const buildSeriesKey = (title) =>
  aiNormalize(title)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

// ================= PIPELINE STEPS =================

async function stepValidate(file) {
  if (!file) throw new Error("NO_FILE");
  return file;
}

function stepParse(file) {
  const fileName = file.file_name || "";
  const parsed = parseFileName(fileName);

  return {
    fileName,
    parsed,
    isSeries: parsed.type === "tv",
    clean: ultraCleanTitle(fileName),
    year: (fileName.match(/(19|20)\d{2}/) || [])[0] || null
  };
}

function stepDuplicate(file) {
  return CACHE.find(x => x.file_id === file.file_id);
}

async function stepTMDB({ clean, year, isSeries }) {

  let fixed = aiNormalize(clean)
    .replace(/s\d{1,2}e\d{1,2}/gi, "")
    .replace(/\d{1,2}x\d{1,2}/gi, "")
    .trim();

  const variants = buildSearchVariants(fixed);

  let result = null;

  for (const v of variants) {
    result = await searchTMDBUltra(v, year, isSeries ? "tv" : null);
    if (result) break;
  }

  if (!result) {
    result = await searchTMDBUltra(fixed, year, isSeries ? "tv" : null);
  }

  return result;
}

async function stepDetails(result, parsed) {

  let details = null;
  let episodeDetails = null;

  if (result?.id) {
    details = await getDetails(result.id, result.media_type || "movie");
  }

  if (parsed.isSeries && parsed.parsed.season && parsed.parsed.episode) {
    episodeDetails = await getEpisodeDetails(
      result.id,
      parsed.parsed.season,
      parsed.parsed.episode
    );
  }

  return { details, episodeDetails };
}

function stepGenres(result, details) {

  if (result?.genre_ids) return result.genre_ids;
  if (details?.genres) return details.genres.map(g => g.id);

  return [];
}

async function stepCover(data, genreIds) {

  let cover =
    getCover(data) ||
    getBanner(data) ||
    "https://dummyimage.com/500x750/000/fff&text=No+Image";

  if (uploadToCloudinary) {
    cover = await uploadToCloudinary(
      cover,
      genreIds,
      data.vote_average || 0
    );
  }

  return cover;
}

// ================= MAIN WORKER =================

async function handleUpload(msg) {

  try {

    const file = await stepValidate(msg.document || msg.video);

    const chatId = msg.chat.id;

    // 1. parse
    const parsedData = stepParse(file);

    // 2. duplicate
    if (stepDuplicate(file)) {
      return tg("sendMessage", {
        chat_id: chatId,
        text: "⚠️ Datei bereits vorhanden"
      });
    }

    // 3. TMDB
    const result = await stepTMDB(parsedData);

    // 4. details
    const { details, episodeDetails } =
      await stepDetails(result, parsedData);

    const safeData = details || result || {
      title: parsedData.clean,
      overview: "Keine Beschreibung verfügbar.",
      vote_average: 0,
      genres: []
    };

    // 5. genres
    const genreIds = stepGenres(result, details);

    // 6. IDs
    const id = generateNextId();
    const categoryId = generateCategoryId(genreIds);

    // 7. cover
    const cover = await stepCover(safeData, genreIds);

    // 8. merge
    const merged = {
      ...safeData,
      episode_name: episodeDetails?.name,
      episode_overview: episodeDetails?.overview,
      episode_rating: episodeDetails?.vote_average,
      episode_code: parsedData.isSeries
        ? `S${String(parsedData.parsed.season).padStart(2, "0")}E${String(parsedData.parsed.episode).padStart(2, "0")}`
        : ""
    };

    // 9. caption
    const caption = buildCard(
      merged,
      parsedData.fileName,
      id,
      categoryId
    );

    // ================= SERIES =================

    if (parsedData.isSeries) {

      const cleanTitle = safeData.name || safeData.title || parsedData.parsed.title;
      const seriesKey = buildSeriesKey(cleanTitle);

      const threadId = await ensureSeriesThread(seriesKey);

      if (!SERIES_DB[seriesKey]) SERIES_DB[seriesKey] = {};
      if (!SERIES_DB[seriesKey][parsedData.parsed.season]) {
        SERIES_DB[seriesKey][parsedData.parsed.season] = {};
      }

      SERIES_DB[seriesKey][parsedData.parsed.season][parsedData.parsed.episode] = {
        file_id: file.file_id,
        display_id: id
      };

      saveSeriesDB(SERIES_DB);

      await tg("sendVideo", {
        chat_id: SERIES_GROUP_ID,
        message_thread_id: threadId,
        video: file.file_id,
        caption
      });

      return tg("sendMessage", {
        chat_id: chatId,
        text: `✅ Episode gespeichert\n\n📺 ${cleanTitle}\n🆔 ${id}`
      });
    }

    // ================= MOVIE =================

    const item = {
      display_id: id,
      tmdb_id: result?.id || null,
      title: safeData.title || parsedData.clean,
      file_id: file.file_id,
      media_type: "movie",
      genres: genreIds,
      cover
    };

    CACHE.unshift(item);
    saveDB(CACHE);

    await sendToChannel({
      cover,
      caption,
      buttons: [
        [{ text: "▶️ Stream", url: playerUrl("play", id) }]
      ],
      genreIds
    });

    return tg("sendMessage", {
      chat_id: chatId,
      text: `✅ Film gespeichert\n\n🎬 ${item.title}\n🆔 ${id}`
    });

  } catch (err) {
    console.error("UPLOAD WORKER ERROR:", err.message);
  }
}

module.exports = { handleUpload };