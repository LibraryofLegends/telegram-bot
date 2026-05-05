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
} = require("../config");

const {
  ensureSeriesThread
} = require("../services/seriesService");

const {
  buildCard
} = require("../services/mediaService");

// OPTIONAL
let uploadToCloudinary = null;
try {
  uploadToCloudinary = require("../services/mediaService").uploadToCloudinary;
} catch {}

// ================= INIT =================

const sendToChannel = createSendToChannel({
  getTargetChannel,
  getThreadByGenre
});

let CACHE = loadDB();
let SERIES_DB = loadSeriesDB();

// ================= HELPERS =================

function getCover(data = {}) {
  if (data?.poster_path) {
    return `https://image.tmdb.org/t/p/original${data.poster_path}`;
  }
  return null;
}

function getBanner(data = {}) {
  if (data?.backdrop_path) {
    return `https://image.tmdb.org/t/p/original${data.backdrop_path}`;
  }
  return null;
}

function buildSeriesKey(title) {
  return aiNormalize(title)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

// ================= MAIN =================

async function handleUpload(msg) {

  try {

    console.log("📥 UPLOAD START");
    console.log("MSG:", JSON.stringify(msg, null, 2));

    // ================= FILE =================

    const file =
      msg.video ||
      msg.document ||
      msg.animation;

    if (!file) {
      console.log("❌ KEIN FILE ERKANNT");

      return tg("sendMessage", {
        chat_id: msg.chat.id,
        text: "❌ Bitte sende ein Video oder eine Datei"
      });
    }

    const chatId = msg.chat.id;
    const width = msg.video?.width;
    const height = msg.video?.height;

    // ================= DUPLICATE =================

    const exists = CACHE.find(x => x.file_id === file.file_id);

    if (exists) {
      return tg("sendMessage", {
        chat_id: chatId,
        text: "⚠️ Datei bereits vorhanden"
      });
    }

    // ================= FILENAME =================

    const fileName =
      file.file_name ||
      msg.caption ||
      "unknown_file";

    console.log("📁 FILE NAME:", fileName);

    // ================= PARSE =================

    const parsed = parseFileName(fileName);
    console.log("🧠 PARSED:", parsed);

    const isSeries = parsed.type === "tv";

    const clean = ultraCleanTitle(fileName);

    const yearMatch = fileName.match(/(19|20)\d{2}/);
    const fileYear = yearMatch ? parseInt(yearMatch[0]) : null;

    // ================= SEARCH =================

    let fixedSearch = aiNormalize(clean)
      .replace(/s\d{1,2}e\d{1,2}/gi, "")
      .replace(/\d{1,2}x\d{1,2}/gi, "")
      .trim();

    const variants = buildSearchVariants(fixedSearch);

    let result = null;

    for (const v of variants) {
      result = await searchTMDBUltra(
        v,
        fileYear,
        isSeries ? "tv" : null
      );
      if (result) break;
    }

    if (!result) {
      result = await searchTMDBUltra(
        fixedSearch,
        fileYear,
        isSeries ? "tv" : null
      );
    }

    console.log("🎬 TMDB RESULT:", result?.title || result?.name);

    // ================= DETAILS =================

    let details = null;
    let episodeDetails = null;

    if (result?.id) {
      details = await getDetails(
        result.id,
        isSeries ? "tv" : "movie"
      );
    }

    if (isSeries && result?.id && parsed.season && parsed.episode) {
      episodeDetails = await getEpisodeDetails(
        result.id,
        parsed.season,
        parsed.episode
      );
    }

    const safeData = details || result || {
      title: clean,
      overview: "Keine Beschreibung verfügbar.",
      vote_average: 0,
      genres: []
    };

    // ================= GENRES =================

    let genreIds = [];

    if (result?.genre_ids) {
      genreIds = result.genre_ids;
    } else if (details?.genres) {
      genreIds = details.genres.map(g => g.id);
    }

    // ================= IDS =================

    const id = generateNextId();
    const categoryId = generateCategoryId(genreIds);

    // ================= COVER =================

    let cover =
      getCover(safeData) ||
      getBanner(safeData) ||
      "https://dummyimage.com/500x750/000/fff&text=No+Image";

    if (uploadToCloudinary) {
      cover = await uploadToCloudinary(
        cover,
        genreIds,
        safeData.vote_average || 0
      );
    }

    // ================= MERGE =================

    const mergedData = {
      ...safeData,
      episode_name: episodeDetails?.name,
      episode_overview: episodeDetails?.overview,
      episode_rating: episodeDetails?.vote_average,
      episode_code: isSeries
        ? `S${String(parsed.season).padStart(2, "0")}E${String(parsed.episode).padStart(2, "0")}`
        : ""
    };

    // ================= CARD =================

    const caption = buildCard(
      mergedData,
      fileName,
      id,
      categoryId,
      width,
      height,
      isSeries
    );

    // ================= SERIES =================

    if (isSeries) {

      if (!parsed.season || !parsed.episode) {
        return tg("sendMessage", {
          chat_id: chatId,
          text: "❌ Season oder Episode fehlt im Dateiname"
        });
      }

      const cleanTitle =
        safeData.name ||
        safeData.title ||
        parsed.title;

      const seriesKey = buildSeriesKey(cleanTitle);

      const threadId = await ensureSeriesThread(seriesKey);

      if (!SERIES_DB[seriesKey]) SERIES_DB[seriesKey] = {};
      if (!SERIES_DB[seriesKey][parsed.season]) {
        SERIES_DB[seriesKey][parsed.season] = {};
      }

      if (!SERIES_DB[seriesKey][parsed.season]._headerSent) {

        await tg("sendMessage", {
          chat_id: SERIES_GROUP_ID,
          message_thread_id: threadId,
          text: `📀 STAFFEL ${parsed.season}\n━━━━━━━━━━`
        });

        SERIES_DB[seriesKey][parsed.season]._headerSent = true;
      }

      SERIES_DB[seriesKey][parsed.season][parsed.episode] = {
        file_id: file.file_id,
        display_id: id
      };

      saveSeriesDB(SERIES_DB);

      await tg("sendVideo", {
        chat_id: SERIES_GROUP_ID,
        message_thread_id: threadId,
        video: file.file_id,
        caption,
        supports_streaming: true
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
      title: safeData.title || clean,
      category_id: categoryId,
      file_id: file.file_id,
      media_type: "movie",
      genres: genreIds,
      cover
    };

    CACHE.unshift(item);
    saveDB(CACHE);

    const buttons = [
      [{ text: "▶️ Stream", url: playerUrl("play", id) }],
      [{ text: "🔥 Ähnliche", url: playerUrl("sim", id) }],
      [{ text: "🏠 Menü", url: `https://t.me/${process.env.BOT_USERNAME}` }]
    ];

    await sendToChannel({
      cover,
      caption,
      buttons,
      genreIds
    });

    return tg("sendMessage", {
      chat_id: chatId,
      text: `✅ Film gespeichert\n\n🎬 ${item.title}\n🆔 ${id}`
    });

  } catch (err) {
    console.error("❌ UPLOAD ERROR:", err);
  }
}

// ================= EXPORT =================

module.exports = {
  handleUpload
};