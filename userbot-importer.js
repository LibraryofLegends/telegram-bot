require("dotenv").config();

const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const { Pool } = require("pg");
const fetch = global.fetch;

const {
    cleanReleaseText,
    cleanEpisodeTitle,
    titleCase,
} = require("./importer/parser-utils");

const {
    parseMediaFileName,
} = require("./importer/parser");

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const session = process.env.USERBOT_SESSION;

const IMPORT_CHAT = process.env.IMPORT_CHAT || process.env.IMPORT_CHAT_ID;
const STAGING_CHAT = process.env.STAGING_CHAT || process.env.STAGING_CHAT_ID;
const DATABASE_URL = process.env.DATABASE_URL || "";

// =========================================================
// TMDB
// =========================================================

const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/original";

const pgPool = DATABASE_URL
    ? new Pool({
          connectionString: DATABASE_URL,
          ssl: {
              rejectUnauthorized: false,
          },
      })
    : null;

const ACTIVE_IMPORTS = new Set();
const IMPORT_SESSIONS = new Map();

function isUserbotEnabled() {
    return String(process.env.USERBOT_ENABLED || "").toLowerCase() === "true";
}

// =========================================================
// Import-Session
// =========================================================

function updateImportSession(parsed) {

    if (!["series", "season"].includes(parsed.type)) {
        return null;
    }

    const key = `${parsed.title}::S${parsed.season}`;

    if (!IMPORT_SESSIONS.has(key)) {

        IMPORT_SESSIONS.set(key, {
            title: parsed.title,
            season: parsed.season,
            type: parsed.type,
            episodes: new Set(),
            duplicates: 0,
            imported: 0,
            started: Date.now(),
            lastUpdate: Date.now(),
        });

    }

    const session = IMPORT_SESSIONS.get(key);

    if (Array.isArray(parsed.episodes) && parsed.episodes.length) {

        for (const ep of parsed.episodes) {

            if (session.episodes.has(ep)) {
                session.duplicates++;
                continue;
            }

            session.episodes.add(ep);
            session.imported++;

        }

    } else if (parsed.episode !== null && parsed.episode !== undefined) {

        if (session.episodes.has(parsed.episode)) {

            session.duplicates++;

        } else {

            session.episodes.add(parsed.episode);
            session.imported++;

        }

    }

    session.lastUpdate = Date.now();

    return session;

}

// =========================================================
// Session automatisch löschen
// =========================================================

function cleanupImportSessions(maxAgeMinutes = 60) {

    const now = Date.now();

    for (const [key, session] of IMPORT_SESSIONS.entries()) {

        const age = now - session.lastUpdate;

        if (age > maxAgeMinutes * 60000) {
            IMPORT_SESSIONS.delete(key);
        }

    }

}

// =========================================================
// Report Builder
// =========================================================

function buildImportReport({

    fileName,
    parsed,
    fileSize,
    mimeType,
    videoMeta,
    importSession = null,

}) {

    let typeLabel = "🎬 Film";

    if (parsed.type === "series")
        typeLabel = "📺 Serie";

    if (parsed.type === "season")
        typeLabel = "📦 Staffel";

    const lines = [];

    lines.push("🧠 USERBOT IMPORT");
    lines.push("━━━━━━━━━━━━━━━━━━━━");
    lines.push(`${typeLabel} erkannt`);
    lines.push("");

    lines.push(`📂 Datei: ${fileName}`);
    lines.push(`🏷 Titel: ${parsed.title}`);

    if (parsed.year)
        lines.push(`📅 Jahr: ${parsed.year}`);

    if (parsed.type === "series") {

        lines.push(
            `📀 Staffel: ${String(parsed.season).padStart(2, "0")}`
        );

        lines.push(
            `🎞 Episode: ${String(parsed.episode).padStart(2, "0")}`
        );

        if (parsed.episodes?.length > 1) {

            lines.push(
                `🎬 Doppelfolge: ${parsed.episodes.join(", ")}`
            );

        }

        if (parsed.special)
            lines.push("⭐ Special");

        if (parsed.ova)
            lines.push("🎌 OVA");

        if (parsed.episodeTitle)
            lines.push(`📝 Titel: ${parsed.episodeTitle}`);

    }

    if (parsed.type === "season") {

        lines.push(
            `📀 Staffel: ${String(parsed.season).padStart(2, "0")}`
        );

    }

    if (parsed.quality)
        lines.push(`🔥 Qualität: ${parsed.quality}`);

    if (parsed.source)
        lines.push(`📡 Quelle: ${parsed.source}`);

    if (parsed.codec)
        lines.push(`🎥 Codec: ${parsed.codec}`);

    if (parsed.audio)
        lines.push(`🔊 Audio: ${parsed.audio}`);

    if (fileSize)
        lines.push(`💾 Größe: ${fileSize}`);

    if (mimeType)
        lines.push(`🧾 MIME: ${mimeType}`);

    if (videoMeta?.width && videoMeta?.height) {

        lines.push(
            `📺 Auflösung: ${videoMeta.width}x${videoMeta.height}`
        );

    }

    if (videoMeta?.duration) {

        lines.push(
            `⏱ Dauer: ${Math.round(videoMeta.duration / 60)} Min.`
        );

    }

    if (importSession) {

        lines.push("");

        lines.push("━━━━━━━━━━━━━━━━━━━━");
        lines.push("📦 STAFFEL-IMPORT");
        lines.push("━━━━━━━━━━━━━━━━━━━━");

        lines.push(`🎬 Serie: ${importSession.title}`);

        lines.push(
            `📀 Staffel: ${String(importSession.season).padStart(2, "0")}`
        );

        lines.push(
            `✅ Erkannte Episoden: ${importSession.episodes.size}`
        );

        lines.push(
            `📥 Neue Episoden: ${importSession.imported}`
        );

        if (importSession.duplicates > 0) {

            lines.push(
                `⚠ Doppelte Episoden: ${importSession.duplicates}`
            );

        }

    }

    lines.push("");
    lines.push("✅ Datei wurde in die Staging-Gruppe weitergeleitet.");

    return lines.join("\n");

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

// =========================================================
// Serienverwaltung
// =========================================================

async function findOrCreateSeries(

    parsed,

    tmdbData = null

) {

    if (!pgPool)

        return null;

    let result = await pgPool.query(

        `

        SELECT *

        FROM series

        WHERE LOWER(title)=LOWER($1)

        LIMIT 1

        `,

        [

            parsed.title

        ]

    );

    if (result.rows.length) {

        return result.rows[0];

    }

    result = await pgPool.query(

    `

    INSERT INTO series(

    title,
    original_title,
    year,
    tmdb_id,
    imdb_id,

    overview,
    poster_path,
    backdrop_path,

    vote_average,
    vote_count,

    genres,

    number_of_seasons,
    number_of_episodes

)

    VALUES(

    $1,
    $2,
    $3,
    $4,
    $5,

    $6,
    $7,
    $8,

    $9,
    $10,

    $11,

    $12,
    $13

)

    RETURNING *

    `,

    [
    tmdbData?.title || parsed.title,

    tmdbData?.originalTitle || null,

    parsed.year || null,

    tmdbData?.tmdbId || null,

    tmdbData?.imdbId || null,

    tmdbData?.overview || null,

    tmdbData?.poster || null,

    tmdbData?.backdrop || null,

    tmdbData?.voteAverage || null,

    tmdbData?.voteCount || null,

    tmdbData?.genres || [],

    tmdbData?.seasons || null,

    tmdbData?.episodes || null
]

);

    console.log("✅ Neue Serie angelegt:", parsed.title);

    return result.rows[0];

}

// =========================================================
// Staffelverwaltung
// =========================================================

async function findOrCreateSeason(seriesId, seasonNumber) {

    if (!pgPool)
        return null;

    let result = await pgPool.query(

        `

        SELECT *

        FROM seasons

        WHERE series_id=$1

        AND season_number=$2

        LIMIT 1

        `,

        [

            seriesId,

            seasonNumber

        ]

    );

    if (result.rows.length) {

        return result.rows[0];

    }

    result = await pgPool.query(

        `

        INSERT INTO seasons(

            series_id,

            season_number

        )

        VALUES(

            $1,

            $2

        )

        RETURNING *

        `,

        [

            seriesId,

            seasonNumber

        ]

    );

    console.log(

        "✅ Staffel erstellt:",

        seasonNumber

    );

    return result.rows[0];

}

// =========================================================
// Episodenverwaltung
// =========================================================

async function findOrCreateEpisode(
    seasonId,
    parsed,
    stagingMessageId = null
) {

    if (!pgPool)
        return null;

    let result = await pgPool.query(

        `
        SELECT *
        FROM episodes
        WHERE season_id=$1
        AND episode_number=$2
        LIMIT 1
        `,

        [
            seasonId,
            parsed.episode
        ]

    );

    // Episode existiert bereits
    if (result.rows.length) {

        await pgPool.query(

            `
            UPDATE episodes
            SET
                staging_message_id=$1,
                imported=TRUE,
                updated_at=NOW()
            WHERE id=$2
            `,

            [
                stagingMessageId,
                result.rows[0].id
            ]

        );

        return {
            ...result.rows[0],
            alreadyExists: true
        };

    }

    // Neue Episode anlegen

    const episodeNumbers =
    parsed.episodes?.length
        ? parsed.episodes
        : [parsed.episode];

let firstEpisode = null;

for (const episodeNumber of episodeNumbers) {

    let existing = await pgPool.query(

        `
        SELECT *
        FROM episodes
        WHERE season_id=$1
        AND episode_number=$2
        LIMIT 1
        `,

        [

            seasonId,
            episodeNumber

        ]

    );

    if (existing.rows.length) {

        await pgPool.query(

            `
            UPDATE episodes
            SET
                staging_message_id=$1,
                imported=TRUE,
                updated_at=NOW()
            WHERE id=$2
            `,

            [

                stagingMessageId,
                existing.rows[0].id

            ]

        );

        if (!firstEpisode) {

            firstEpisode = {

                ...existing.rows[0],
                alreadyExists: true

            };

        }

        continue;

    }

    const inserted = await pgPool.query(

        `
        INSERT INTO episodes(

            season_id,
            episode_number,
            title,
            staging_message_id,
            imported

        )
        VALUES(

            $1,
            $2,
            $3,
            $4,
            TRUE

        )
        RETURNING *
        `,

        [

            seasonId,
            episodeNumber,
            parsed.episodeTitle || null,
            stagingMessageId

        ]

    );

    await pgPool.query(

        `
        UPDATE seasons
        SET
            imported_count = imported_count + 1,
            updated_at = NOW()
        WHERE id=$1
        `,

        [

            seasonId

        ]

    );

    if (!firstEpisode) {

        firstEpisode = {

            ...inserted.rows[0],
            alreadyExists: false

        };

    }

}

return firstEpisode;

    await pgPool.query(

        `
        UPDATE seasons
        SET
            imported_count = imported_count + 1,
            updated_at = NOW()
        WHERE id=$1
        `,

        [

            seasonId

        ]

    );

    return {

        ...result.rows[0],
        alreadyExists: false

    };

}

async function findOrCreateMovie(
    parsed,
    tmdbData,
    stagingMessageId = null
) {

    if (!pgPool)
        return null;

    if (!tmdbData)
        return null;

    let result = await pgPool.query(

        `
        SELECT *
        FROM movies
        WHERE tmdb_id=$1
        LIMIT 1
        `,

        [

            tmdbData.tmdbId

        ]

    );

    if (result.rows.length) {

        return result.rows[0];

    }

    result = await pgPool.query(

        `
        INSERT INTO movies(

            title,
            original_title,
            year,

            tmdb_id,
            imdb_id,

            overview,

            poster_path,
            backdrop_path,

            vote_average,
            vote_count,

            runtime,

            genres,

            quality,
            source,
            codec,
            audio,

            staging_message_id

        )

        VALUES(

            $1,$2,$3,
            $4,$5,
            $6,
            $7,$8,
            $9,$10,
            $11,
            $12,
            $13,$14,$15,$16,
            $17

        )

        RETURNING *

        `,

        [

            tmdbData.title,

            tmdbData.originalTitle,

            parsed.year,

            tmdbData.tmdbId,

            tmdbData.imdbId,

            tmdbData.overview,

            tmdbData.poster,

            tmdbData.backdrop,

            tmdbData.voteAverage,

            tmdbData.voteCount,

            tmdbData.runtime,

            tmdbData.genres,

            parsed.quality,

            parsed.source,

            parsed.codec,

            parsed.audio,

            stagingMessageId

        ]

    );

    return result.rows[0];

}

function extractForwardedMessageId(result) {
  if (!result) return null;

  if (Array.isArray(result)) {
    for (const item of result) {
      const found = extractForwardedMessageId(item);
      if (found) return found;
    }
  }

  if (result.id) return String(result.id);
  if (result.message?.id) return String(result.message.id);

  if (Array.isArray(result.updates)) {
    for (const update of result.updates) {
      const nested = extractForwardedMessageId(update);
      if (nested) return nested;
    }
  }

  if (result.updates?.updates && Array.isArray(result.updates.updates)) {
    for (const update of result.updates.updates) {
      const nested = extractForwardedMessageId(update);
      if (nested) return nested;
    }
  }

  return null;
}

async function saveUserbotImport(data) {
  if (!pgPool) return null;

  try {
    const result = await pgPool.query(
      `
      INSERT INTO userbot_imports (
        unique_key,
        source_chat,
        staging_chat,
        source_message_id,
        staging_message_id,
        media_type,
        title,
        year,
        season,
        episode,
        episode_title,
        file_name,
        file_size,
        mime_type,
        width,
        height,
        duration_minutes,
        quality,
        media_source,
        codec,
        audio,
        status,
        raw_json
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21,
        $22, $23
      )
      ON CONFLICT (unique_key)
      DO UPDATE SET
        staging_message_id = EXCLUDED.staging_message_id,
        media_type = EXCLUDED.media_type,
        title = EXCLUDED.title,
        year = EXCLUDED.year,
        season = EXCLUDED.season,
        episode = EXCLUDED.episode,
        episode_title = EXCLUDED.episode_title,
        file_name = EXCLUDED.file_name,
        file_size = EXCLUDED.file_size,
        mime_type = EXCLUDED.mime_type,
        width = EXCLUDED.width,
        height = EXCLUDED.height,
        duration_minutes = EXCLUDED.duration_minutes,
        quality = EXCLUDED.quality,
        media_source = EXCLUDED.media_source,
        codec = EXCLUDED.codec,
        audio = EXCLUDED.audio,
        raw_json = EXCLUDED.raw_json,
        updated_at = NOW()
      RETURNING id;
      `,
      [
        data.uniqueKey,
        data.sourceChat,
        data.stagingChat,
        data.sourceMessageId,
        data.stagingMessageId,
        data.mediaType,
        data.title,
        data.year,
        data.season,
        data.episode,
        data.episodeTitle,
        data.fileName,
        data.fileSize,
        data.mimeType,
        data.width,
        data.height,
        data.durationMinutes,
        data.quality,
        data.mediaSource,
        data.codec,
        data.audio,
        data.status || "staged",
        data.rawJson,
      ]
    );

    return result.rows[0]?.id || null;
  } catch (error) {
    console.error("❌ Supabase Userbot Import Speicherfehler:", error.message);
    return null;
  }
}

async function resolveChat(client, reference, label) {
  const ref = String(reference || "").trim();

  if (!ref) {
    throw new Error(`${label} fehlt in Render ENV.`);
  }

  try {
    return await client.getEntity(ref);
  } catch (_) {
    // Falls direkte Suche nicht klappt, suchen wir in den sichtbaren Dialogen.
  }

  const dialogs = await client.getDialogs({ limit: 100 });
  const normalizedRef = ref.toLowerCase();

  const match = dialogs.find((dialog) => {
    const name = String(dialog.name || dialog.title || dialog.entity?.title || "").trim();
    const id = String(dialog.id || dialog.entity?.id || "").trim();

    return (
      id === ref ||
      name === ref ||
      name.toLowerCase() === normalizedRef ||
      name.toLowerCase().includes(normalizedRef)
    );
  });

  if (match?.entity) return match.entity;

  const available = dialogs
    .map((dialog) => dialog.name || dialog.title || dialog.entity?.title)
    .filter(Boolean)
    .slice(0, 25)
    .join(", ");

  throw new Error(`${label} konnte nicht gefunden werden: "${ref}". Sichtbare Chats: ${available}`);
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
        parsed,
        tmdbData
    );

}

else if (parsed.type === "series") {

    librarySeries = await findOrCreateSeries(
        parsed,
        tmdbData
    );

    librarySeason = await findOrCreateSeason(
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
        librarySeason.id,
        parsed,
        stagingMessageId
    );

}

const importDbId = await saveUserbotImport({
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