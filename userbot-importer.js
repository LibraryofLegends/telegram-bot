require("dotenv").config();

const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const { Pool } = require("pg");

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const session = process.env.USERBOT_SESSION;

const IMPORT_CHAT = process.env.IMPORT_CHAT || process.env.IMPORT_CHAT_ID;
const STAGING_CHAT = process.env.STAGING_CHAT || process.env.STAGING_CHAT_ID;
const DATABASE_URL = process.env.DATABASE_URL || "";

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

function normalizeReleaseText(text = "") {
    return String(text)
        .replace(/[_\-.]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function titleCase(text = "") {
    return String(text)
        .split(" ")
        .filter(Boolean)
        .map((word) => {

            if (/^[A-Z0-9]{2,}$/.test(word))
                return word;

            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

        })
        .join(" ");
}

function cleanReleaseText(text = "") {

    return String(text)

        .replace(/\.[a-z0-9]{2,5}$/i, "")
        .replace(/@\w+/g, " ")

        .replace(/\[[^\]]+\]/g, " ")
        .replace(/\([^)]+\)/g, " ")

        .replace(/\b(PROPER|REPACK|READNFO|INTERNAL|LIMITED|UNCUT|COMPLETE)\b/gi, " ")

        .replace(/\b(2160p|1080p|720p|480p|4k|uhd|fhd|hd)\b/gi, " ")

        .replace(/\b(web[- ]?dl|webrip|web|bluray|brrip|hdrip|dvdrip)\b/gi, " ")

        .replace(/\b(x264|x265|h264|h265|hevc|av1)\b/gi, " ")

        .replace(/\b(aac|ac3|ddp|dts|truehd|atmos)\b/gi, " ")

        .replace(/\b(german|deutsch|english|englisch|ger|eng|dual|dl|multi)\b/gi, " ")

        .replace(/[._-]+/g, " ")

        .replace(/\s+/g, " ")

        .trim();

}

function detectQuality(text = "") {

    const t = normalizeReleaseText(text);

    if (/(2160p|4k|uhd)/i.test(t))
        return "UHD / 4K";

    if (/(1080p|fhd)/i.test(t))
        return "FHD / 1080p";

    if (/720p/i.test(t))
        return "HD / 720p";

    if (/480p/i.test(t))
        return "SD / 480p";

    return null;

}

function detectSource(text = "") {

    const t = normalizeReleaseText(text);

    if (/web\s*dl/i.test(t))
        return "WEB-DL";

    if (/web\s*rip/i.test(t))
        return "WEBRip";

    if (/\bweb\b/i.test(t))
        return "WEB";

    if (/blu\s*ray/i.test(t))
        return "BluRay";

    if (/brrip/i.test(t))
        return "BRRip";

    if (/hdrip/i.test(t))
        return "HDRip";

    if (/dvdrip/i.test(t))
        return "DVDRip";

    return null;

}

function detectCodec(text = "") {

    const t = normalizeReleaseText(text);

    if (/(x265|h265|hevc)/i.test(t))
        return "H.265 / HEVC";

    if (/(x264|h264)/i.test(t))
        return "H.264";

    if (/av1/i.test(t))
        return "AV1";

    return null;

}

function detectAudioLanguage(text = "") {

    const t = normalizeReleaseText(text);

    const german = /(german|deutsch|ger)/i.test(t);
    const english = /(english|englisch|eng)/i.test(t);
    const dual = /(dual|dual language|dl|multi)/i.test(t);

    if (dual && german)
        return "Deutsch / Dual Language";

    if (dual)
        return "Dual Language";

    if (german && english)
        return "Deutsch / Englisch";

    if (german)
        return "Deutsch";

    if (english)
        return "Englisch";

    return null;

}

function cleanEpisodeTitle(text = "") {

    return String(text)

        .replace(/\.[a-z0-9]{2,5}$/i, "")
        .replace(/^[:=\-\s]+/, "")
        .replace(/=+$/g, "")
        .replace(/\s+/g, " ")
        .trim();

}

function parseMediaFileName(fileName = "") {

    const original = String(fileName || "").trim();

    const readable = original
        .replace(/\.[a-z0-9]{2,5}$/i, "")
        .replace(/@\w+/g, " ")
        .replace(/[._]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const cleaned = cleanReleaseText(original);

    const yearMatch = readable.match(/\b(19\d{2}|20\d{2})\b/);

    const commonMeta = {
        quality: detectQuality(original),
        source: detectSource(original),
        codec: detectCodec(original),
        audio: detectAudioLanguage(original),
    };

    // =========================================================
    // Staffelpakete
    // =========================================================

    const seasonPack = readable.match(
        /(.+?)\s+(?:season|staffel)\s*(\d{1,2})\s*(?:complete|komplett|pack|全集)?/i
    );

    if (seasonPack) {

        return {

            type: "season",

            title: titleCase(
                seasonPack[1]
                    .replace(/\b(19\d{2}|20\d{2})\b/g, "")
                    .trim()
            ),

            year: yearMatch ? Number(yearMatch[1]) : null,

            season: Number(seasonPack[2]),

            episode: null,

            episodes: [],

            episodeTitle: null,

            ...commonMeta,

        };

    }

    // =========================================================
    // Serienformate
    // =========================================================

    const patterns = [

        // S01E01E02
        {
            regex: /(.+?)\s+s(\d{1,2})e(\d{1,3})e(\d{1,3})(?:\s*[-:=]\s*(.+))?/i,
            multi: true,
        },

        // S01E01
        {
            regex: /(.+?)\s+s(\d{1,2})\s*e(\d{1,3})(?:\s*[-:=]\s*(.+))?/i,
        },

        // S1E1
        {
            regex: /(.+?)\s+s(\d{1,2})e(\d{1,3})(?:\s*[-:=]\s*(.+))?/i,
        },

        // 1x01
        {
            regex: /(.+?)\s+(\d{1,2})x(\d{1,3})(?:\s*[-:=]\s*(.+))?/i,
        },

        // Staffel 1 Folge 2
        {
            regex: /(.+?)\s+staffel\s*(\d{1,2})\s+folge\s*(\d{1,3})(?:\s*[-:=]\s*(.+))?/i,
        },

        // Season 1 Episode 2
        {
            regex: /(.+?)\s+season\s*(\d{1,2})\s+episode\s*(\d{1,3})(?:\s*[-:=]\s*(.+))?/i,
        },

        // Specials
        {
            regex: /(.+?)\s+(?:special|sp)\s*(\d{1,3})/i,
            special: true,
        },

        // OVA
        {
            regex: /(.+?)\s+ova\s*(\d{1,3})/i,
            ova: true,
        },

    ];

    for (const entry of patterns) {

        const match = readable.match(entry.regex);

        if (!match)
            continue;

        let season = 1;
        let episode = null;
        let episodes = [];

        if (entry.special) {

            season = 0;
            episode = Number(match[2]);
            episodes.push(episode);

        }

        else if (entry.ova) {

            season = -1;
            episode = Number(match[2]);
            episodes.push(episode);

        }

        else if (entry.multi) {

            season = Number(match[2]);

            episode = Number(match[3]);

            episodes.push(Number(match[3]));
            episodes.push(Number(match[4]));

        }

        else {

            season = Number(match[2]);

            episode = Number(match[3]);

            episodes.push(episode);

        }

        return {

            type: "series",

            title: titleCase(

                match[1]
                    .replace(/\b(19\d{2}|20\d{2})\b/g, "")
                    .replace(/\s+-\s*$/, "")
                    .trim()

            ),

            year: yearMatch ? Number(yearMatch[1]) : null,

            season,

            episode,

            episodes,

            episodeTitle:

                entry.multi
                    ? cleanEpisodeTitle(match[5] || "")
                    : cleanEpisodeTitle(match[4] || ""),

            special: !!entry.special,

            ova: !!entry.ova,

            ...commonMeta,

        };

    }

    // =========================================================
    // Episode 15
    // =========================================================

    const episodeWord = readable.match(
        /(.+?)\s*[- ]\s*(?:episode|folge|ep)\s*(\d{1,3})(?:\s*[-:=]?\s*(.+))?/i
    );

    if (episodeWord) {

        return {

            type: "series",

            title: titleCase(
                episodeWord[1]
                    .replace(/\b(19\d{2}|20\d{2})\b/g, "")
                    .trim()
            ),

            year: yearMatch ? Number(yearMatch[1]) : null,

            season: 1,

            episode: Number(episodeWord[2]),

            episodes: [Number(episodeWord[2])],

            episodeTitle: cleanEpisodeTitle(episodeWord[3] || ""),

            ...commonMeta,

        };

    }

    // =========================================================
    // Film
    // =========================================================

    let title = cleaned;

    if (yearMatch) {
        title = cleaned.slice(0, yearMatch.index).trim();
    }

    return {

        type: "movie",

        title: titleCase(title || cleaned || original),

        year: yearMatch ? Number(yearMatch[1]) : null,

        season: null,

        episode: null,

        episodes: [],

        episodeTitle: null,

        ...commonMeta,

    };

}

function getDocumentFileName(message) {
  const document = message?.document;
  const attributes = document?.attributes || [];

  for (const attr of attributes) {
    if (attr.fileName) return attr.fileName;
  }

  return null;
}

function getVideoMeta(message) {
  const document = message?.document;
  const attributes = document?.attributes || [];

  let width = null;
  let height = null;
  let duration = null;

  for (const attr of attributes) {
    if (attr.w) width = attr.w;
    if (attr.h) height = attr.h;
    if (attr.duration) duration = attr.duration;
  }

  return { width, height, duration };
}

function formatBytes(value) {
  if (!value) return null;

  const bytes = Number(value);

  if (!Number.isFinite(bytes)) return String(value);

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size = size / 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

function getFileSize(message) {
  const size = message?.document?.size;
  if (!size) return null;
  return formatBytes(size);
}

function getMimeType(message) {
  return message?.document?.mimeType || null;
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