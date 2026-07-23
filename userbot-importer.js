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

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const session = process.env.USERBOT_SESSION;

const IMPORT_CHAT = process.env.IMPORT_CHAT || process.env.IMPORT_CHAT_ID;
const STAGING_CHAT = process.env.STAGING_CHAT || process.env.STAGING_CHAT_ID;
// =========================================================
// TMDB
// =========================================================

const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/original";

const ACTIVE_IMPORTS = new Set();

function isUserbotEnabled() {
    return String(process.env.USERBOT_ENABLED || "").toLowerCase() === "true";
}

async function ensureUserbotImportTables() {
  if (!pgPool) {
    console.log("ℹ️ Keine DATABASE_URL gesetzt. Userbot-Importe werden nicht in Supabase gespeichert.");
    return;
  }

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS userbot_imports (
      id SERIAL PRIMARY KEY,
      unique_key TEXT UNIQUE,
      source_chat TEXT,
      staging_chat TEXT,
      source_message_id TEXT,
      staging_message_id TEXT,
      media_type TEXT,
      title TEXT,
      year INTEGER,
      season INTEGER,
      episode INTEGER,
      episode_title TEXT,
      file_name TEXT,
      file_size TEXT,
      mime_type TEXT,
      width INTEGER,
      height INTEGER,
      duration_minutes INTEGER,
      quality TEXT,
      media_source TEXT,
      codec TEXT,
      audio TEXT,
      status TEXT DEFAULT 'staged',
      raw_json JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log("✅ Userbot Import Tabelle bereit");
}

// =========================================================
// Library of Legends Tabellen
// =========================================================

async function ensureLibraryTables() {

    if (!pgPool) return;

    await pgPool.query(`

        CREATE TABLE IF NOT EXISTS series (

            id SERIAL PRIMARY KEY,

            title TEXT UNIQUE NOT NULL,

            original_title TEXT,

            year INTEGER,

            tmdb_id INTEGER,

            imdb_id TEXT,

overview TEXT,

poster_path TEXT,

backdrop_path TEXT,

vote_average NUMERIC,

vote_count INTEGER,

genres TEXT[],

number_of_seasons INTEGER,

number_of_episodes INTEGER,

status TEXT DEFAULT 'active',

            created_at TIMESTAMPTZ DEFAULT NOW(),

            updated_at TIMESTAMPTZ DEFAULT NOW()

        );

    `);

    await pgPool.query(`

        CREATE TABLE IF NOT EXISTS seasons (

            id SERIAL PRIMARY KEY,

            series_id INTEGER REFERENCES series(id) ON DELETE CASCADE,

            season_number INTEGER NOT NULL,

            episode_count INTEGER DEFAULT 0,

            imported_count INTEGER DEFAULT 0,

            status TEXT DEFAULT 'active',

            created_at TIMESTAMPTZ DEFAULT NOW(),

            updated_at TIMESTAMPTZ DEFAULT NOW(),

            UNIQUE(series_id, season_number)

        );

    `);

    await pgPool.query(`

    CREATE TABLE IF NOT EXISTS episodes (

        id SERIAL PRIMARY KEY,

        season_id INTEGER REFERENCES seasons(id) ON DELETE CASCADE,

        episode_number INTEGER NOT NULL,

        title TEXT,

        staging_message_id TEXT,

        imported BOOLEAN DEFAULT FALSE,

        created_at TIMESTAMPTZ DEFAULT NOW(),

        updated_at TIMESTAMPTZ DEFAULT NOW(),

        UNIQUE(season_id, episode_number)

    );

`);

await pgPool.query(`
CREATE TABLE IF NOT EXISTS logs (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
`);

// =========================================================
// Filme
// =========================================================

await pgPool.query(`

    CREATE TABLE IF NOT EXISTS movies (

        id SERIAL PRIMARY KEY,

        title TEXT NOT NULL,

        original_title TEXT,

        year INTEGER,

        tmdb_id INTEGER UNIQUE,

        imdb_id TEXT,

        overview TEXT,

        poster_path TEXT,

        backdrop_path TEXT,

        vote_average NUMERIC,

        vote_count INTEGER,

        runtime INTEGER,

        genres TEXT[],

        quality TEXT,

        source TEXT,

        codec TEXT,

        audio TEXT,

        staging_message_id TEXT,

        imported BOOLEAN DEFAULT TRUE,

        created_at TIMESTAMPTZ DEFAULT NOW(),

        updated_at TIMESTAMPTZ DEFAULT NOW()

    );

`);

// =========================================================
// Collections
// =========================================================

await pgPool.query(`

    CREATE TABLE IF NOT EXISTS collections (

        id SERIAL PRIMARY KEY,

        tmdb_collection_id INTEGER UNIQUE,

        name TEXT NOT NULL,

        overview TEXT,

        poster_path TEXT,

        backdrop_path TEXT,

        created_at TIMESTAMPTZ DEFAULT NOW(),

        updated_at TIMESTAMPTZ DEFAULT NOW()

    );

`);

await pgPool.query(`

    CREATE TABLE IF NOT EXISTS movie_collections (

        movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,

        collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,

        PRIMARY KEY(movie_id, collection_id)

    );

`);

console.log("✅ Library Tabellen bereit");

}

// =========================================================
// TMDB aktiv?
// =========================================================

function hasTMDB() {
    return Boolean(TMDB_API_KEY);

}

async function searchTMDB(type, title, year = null) {

    if (!hasTMDB())
        return null;

    try {

        const endpoint =
            type === "movie"
                ? "movie"
                : "tv";

        let url =
            `${TMDB_BASE_URL}/search/${endpoint}` +
            `?api_key=${TMDB_API_KEY}` +
            `&language=de-DE` +
            `&query=${encodeURIComponent(title)}`;

        if (year) {

            if (type === "movie") {

                url += `&year=${year}`;

            } else {

                url += `&first_air_date_year=${year}`;

            }

        }

        const response = await fetch(url);

        if (!response.ok)
            return null;

        const json = await response.json();

        if (!json.results?.length)
            return null;

        return json.results[0];

    } catch (err) {

        console.error("❌ TMDB Suche:", err.message);

        return null;

    }

}

async function getTMDBDetails(type, tmdbId) {

    if (!hasTMDB())
        return null;

    try {

        const endpoint =
            type === "movie"
                ? "movie"
                : "tv";

        const url =
            `${TMDB_BASE_URL}/${endpoint}/${tmdbId}` +
            `?api_key=${TMDB_API_KEY}` +
            `&language=de-DE` +
            `&append_to_response=credits,images`;

        const response = await fetch(url);

        if (!response.ok)
            return null;

        const json = await response.json();

        return {

            tmdbId: json.id,

            imdbId: json.imdb_id || null,

            title:
                json.title ||
                json.name ||
                null,

            originalTitle:
                json.original_title ||
                json.original_name ||
                null,

            overview:
                json.overview ||
                null,

            releaseDate:
                json.release_date ||
                json.first_air_date ||
                null,

            voteAverage:
                json.vote_average ||
                null,

            voteCount:
                json.vote_count ||
                null,

            runtime:
                json.runtime ||
                null,

            seasons:
                json.number_of_seasons ||
                null,

            episodes:
                json.number_of_episodes ||
                null,

            genres:
                (json.genres || []).map(g => g.name),

            poster:

                json.poster_path
                    ? TMDB_IMAGE_URL + json.poster_path
                    : null,

            backdrop:

                json.backdrop_path
                    ? TMDB_IMAGE_URL + json.backdrop_path
                    : null,

            cast:

                (json.credits?.cast || [])
                    .slice(0, 10)
                    .map(actor => actor.name),

            directors:

                (json.credits?.crew || [])
                    .filter(c => c.job === "Director")
                    .map(c => c.name)

        };

    } catch (err) {

        console.error(
            "❌ TMDB Details:",
            err.message
        );

        return null;

    }

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

  await ensureUserbotImportTables();
  await ensureLibraryTables();

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

let tmdbSearch = null;
let tmdbData = null;

if (parsed.type === "movie") {

    tmdbSearch = await searchTMDB(
        "movie",
        parsed.title,
        parsed.year
    );

}

else if (
    parsed.type === "series" ||
    parsed.type === "season"
) {

    tmdbSearch = await searchTMDB(
        "tv",
        parsed.title,
        parsed.year
    );

}

if (tmdbSearch) {

    tmdbData = await getTMDBDetails(

        parsed.type === "movie"
            ? "movie"
            : "tv",

        tmdbSearch.id

    );

    console.log(
        "🎬 TMDB:",
        tmdbData?.title
    );

}

let librarySeries = null;
let librarySeason = null;
let libraryEpisode = null;
let libraryMovie = null;

if (parsed.type === "movie") {

    libraryMovie = await findOrCreateMovie(
    pgPool,
    parsed,
    tmdbData
);

}

else if (parsed.type === "series") {

    librarySeries = await findOrCreateSeries(
    pgPool,
    parsed,
    tmdbData
);

    librarySeason = await findOrCreateSeason(
    pgPool,
    librarySeries.id,
    parsed.season
);

}

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

        if (importDbId) {
          report += `\n🆔 Import-ID: ${importDbId}`;
        }
        
        if (librarySeries) {

    report += `\n📺 Serien-ID: ${librarySeries.id}`;

}

if (librarySeason) {

    report += `\n📀 Staffel-ID: ${librarySeason.id}`;

}

if (libraryEpisode) {

    if (libraryEpisode.alreadyExists) {

        report += `\n♻️ Episode bereits vorhanden`;

    } else {

        report += `\n✅ Neue Episode gespeichert`;

    }

}

if (libraryMovie) {

    report += `\n🎬 Film-ID: ${libraryMovie.id}`;

}

if (tmdbData) {

    report += "\n";
    report += "\n━━━━━━━━━━━━━━━━━━━━";
    report += "\n🎬 TMDB";
    report += "\n━━━━━━━━━━━━━━━━━━━━";

    report += `\n🆔 TMDB-ID: ${tmdbData.tmdbId}`;

    if (tmdbData.imdbId)
        report += `\n🎟 IMDb: ${tmdbData.imdbId}`;

    if (tmdbData.voteAverage)
        report += `\n⭐ Bewertung: ${tmdbData.voteAverage}/10`;

    if (tmdbData.genres?.length)
        report += `\n🎭 Genres: ${tmdbData.genres.join(", ")}`;

    if (tmdbData.runtime)
        report += `\n⏱ Laufzeit: ${tmdbData.runtime} Min.`;

    if (tmdbData.seasons)
        report += `\n📀 Staffeln: ${tmdbData.seasons}`;

    if (tmdbData.episodes)
        report += `\n🎞 Episoden: ${tmdbData.episodes}`;

}

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