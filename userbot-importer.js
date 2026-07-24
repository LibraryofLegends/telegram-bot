require("dotenv").config();

const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const fetch = global.fetch;

const {
    cleanReleaseText,
    cleanEpisodeTitle,
    titleCase,
} = require("./importer/parser-utils");

const {
    parseMediaFileName,
} = require("./importer/parser");

const {
    buildImportReport,
} = require("./importer/report-builder");

const {
    IMPORT_SESSIONS,
    updateImportSession,
    cleanupImportSessions,
} = require("./importer/import-session");

const {
    extractForwardedMessageId,
} = require("./telegram/message-utils");

const {
    resolveChat,
} = require("./telegram/chat-resolver");

const {
    saveUserbotImport,
} = require("./database/repositories/imports");

const {
    findOrCreateSeason,
} = require("./database/repositories/seasons");

const {
    findOrCreateSeries,
} = require("./database/repositories/series");

const {
    findOrCreateMovie,
} = require("./database/repositories/movies");

const {
    findOrCreateEpisode,
} = require("./database/repositories/episodes");

const {
    pgPool,
} = require("./database/pool");

const {
    initializeDatabase,
} = require("./database/schema");

const {
    hasTMDB,
    searchTMDB,
    getTMDBDetails,
    TMDB_API_KEY,
    TMDB_BASE_URL,
    TMDB_IMAGE_URL,
} = require("./tmdb/client");

const {
    loadTMDBData,
} = require("./importer/tmdb-loader");

const {
    syncLibrary,
} = require("./importer/library-sync");

const {
    enhanceImportReport,
} = require("./importer/report-enhancer");

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const session = process.env.USERBOT_SESSION;

const IMPORT_CHAT = process.env.IMPORT_CHAT || process.env.IMPORT_CHAT_ID;
const STAGING_CHAT = process.env.STAGING_CHAT || process.env.STAGING_CHAT_ID;

// =========================================================
// TMDB
// =========================================================

const ACTIVE_IMPORTS = new Set();

function isUserbotEnabled() {
    return String(process.env.USERBOT_ENABLED || "").toLowerCase() === "true";
}

async function startUserbotImporter() {
  if (!isUserbotEnabled()) {
    console.log("ℹ️ Userbot Importer deaktiviert. USERBOT_ENABLED ist nicht true.");
    return;
  }

  if (!apiId || !apiHash) {
    throw new Error("TELEGRAM_API_ID oder TELEGRAM_API_HASH fehlt.");
  }

  if (!session) {
    throw new Error("USERBOT_SESSION fehlt.");
  }

  if (!IMPORT_CHAT || !STAGING_CHAT) {
    throw new Error("IMPORT_CHAT oder STAGING_CHAT fehlt.");
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 Starte Library of Legends Userbot Importer");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();

  const authorized = await client.checkAuthorization();

  if (!authorized) {
    throw new Error("USERBOT_SESSION ist ungültig oder abgelaufen.");
  }

  const me = await client.getMe();

  console.log("✅ Userbot verbunden als:", me.username || me.firstName || me.id);

  await initializeDatabase(pgPool);

  const importEntity = await resolveChat(client, IMPORT_CHAT, "IMPORT_CHAT");
  const stagingEntity = await resolveChat(client, STAGING_CHAT, "STAGING_CHAT");

  console.log("📥 Import-Chat gefunden:", IMPORT_CHAT);
  console.log("📤 Staging-Chat gefunden:", STAGING_CHAT);
  console.log("👀 Warte auf neue Medien in Import-Gruppe...");

  client.addEventHandler(
    async (event) => {
      const message = event.message;

      if (!message) return;
      if (!message.media) return;

      const importKey = `${message.chatId || "chat"}:${message.id}`;

      if (ACTIVE_IMPORTS.has(importKey)) return;
      ACTIVE_IMPORTS.add(importKey);

      try {
        const fileName =
          getDocumentFileName(message) ||
          message.message ||
          `telegram_media_${message.id}`;

        const parsed = parseMediaFileName(fileName);
const importSession = updateImportSession(parsed);

// =========================================================
// TMDB Informationen laden
// =========================================================

const {
    tmdbSearch,
    tmdbData,
} = await loadTMDBData(
    parsed,
    searchTMDB,
    getTMDBDetails
);

const {
    librarySeries,
    librarySeason,
    libraryMovie,
} = await syncLibrary(
    pgPool,
    parsed,
    tmdbData,
    findOrCreateMovie,
    findOrCreateSeries,
    findOrCreateSeason
);

let libraryEpisode = null;

        const fileSize = getFileSize(message);
        const mimeType = getMimeType(message);
        const videoMeta = getVideoMeta(message);

        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📥 Neue Medien-Datei erkannt");
        console.log("📂 Datei:", fileName);
        console.log("🧠 Parsed:", parsed);

        const forwardedResult = await client.forwardMessages(stagingEntity, {
          messages: [message.id],
          fromPeer: importEntity,
        });

        const stagingMessageId = extractForwardedMessageId(forwardedResult);
        
        if (
    parsed.type === "movie" &&
    libraryMovie
) {

    await pgPool.query(

        `
        UPDATE movies
        SET
            staging_message_id=$1,
            updated_at=NOW()
        WHERE id=$2
        `,

        [

            stagingMessageId,
            libraryMovie.id

        ]

    );

}

// =========================================================
// Library of Legends Datenbank aktualisieren
// =========================================================

if (parsed.type === "series" && librarySeason) {

    libraryEpisode = await findOrCreateEpisode(
    pgPool,
    librarySeason.id,
    parsed,
    stagingMessageId
);

}

const importDbId = await saveUserbotImport(pgPool, {
          uniqueKey: `${String(message.chatId || IMPORT_CHAT)}:${String(message.id)}`,
          sourceChat: String(IMPORT_CHAT),
          stagingChat: String(STAGING_CHAT),
          sourceMessageId: String(message.id),
          stagingMessageId,
          mediaType: parsed.type,
          title: parsed.title || null,
          year: parsed.year || null,
          season: parsed.season || null,
          episode: parsed.episode || null,
          episodeTitle: parsed.episodeTitle || null,
          fileName,
          fileSize,
          mimeType,
          width: videoMeta.width || null,
          height: videoMeta.height || null,
          durationMinutes: videoMeta.duration
            ? Math.round(Number(videoMeta.duration) / 60)
            : null,
          quality: parsed.quality || null,
          mediaSource: parsed.source || null,
          codec: parsed.codec || null,
          audio: parsed.audio || null,
          status: "staged",
          rawJson: {
            parsed,
            fileName,
            fileSize,
            mimeType,
            videoMeta,
          },
        });

        let report = buildImportReport({
  fileName,
  parsed,
  fileSize,
  mimeType,
  videoMeta,
  importSession,
});

        report = enhanceImportReport(report, {
    importDbId,
    librarySeries,
    librarySeason,
    libraryEpisode,
    libraryMovie,
    tmdbData,
});

        await client.sendMessage(stagingEntity, {
  message: report,
});

cleanupImportSessions();

console.log("✅ Datei wurde in Staging weitergeleitet.");

        if (importDbId) {
          console.log("✅ Import in Supabase gespeichert. ID:", importDbId);
        }
      } catch (error) {
        console.error("❌ Fehler beim Userbot-Import:", error);
      } finally {
        setTimeout(() => ACTIVE_IMPORTS.delete(importKey), 60_000);
      }
    },
    new NewMessage({ chats: [String(IMPORT_CHAT)] })
  );

  return client;
}

module.exports = {
  startUserbotImporter,
  parseMediaFileName,
};