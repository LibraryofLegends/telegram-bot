require("dotenv").config();

const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const session = process.env.USERBOT_SESSION;

const IMPORT_CHAT = process.env.IMPORT_CHAT || process.env.IMPORT_CHAT_ID;
const STAGING_CHAT = process.env.STAGING_CHAT || process.env.STAGING_CHAT_ID;

const ACTIVE_IMPORTS = new Set();

function isUserbotEnabled() {
  return String(process.env.USERBOT_ENABLED || "").toLowerCase() === "true";
}

function titleCase(text = "") {
  return text
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (/^[A-Z0-9]{2,}$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function cleanReleaseText(text = "") {
  return String(text)
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/@\w+/g, " ")
    .replace(/\b(2160p|1080p|720p|480p|uhd|fhd|hd|4k)\b/gi, " ")
    .replace(/\b(web-dl|webrip|bluray|brrip|hdrip|dvdrip|x264|x265|h264|h265|hevc|aac|dts|ddp|truehd)\b/gi, " ")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectQuality(text = "") {
  const source = String(text);

  if (/\b(2160p|4k|uhd)\b/i.test(source)) return "UHD / 4K";
  if (/\b(1080p|fhd)\b/i.test(source)) return "FHD / 1080p";
  if (/\b720p\b/i.test(source)) return "HD / 720p";
  if (/\b480p\b/i.test(source)) return "SD / 480p";

  return null;
}

function detectSource(text = "") {
  const source = String(text);

  if (/\bweb[-_. ]?dl\b/i.test(source)) return "WEB-DL";
  if (/\bweb[-_. ]?rip\b/i.test(source)) return "WEBRip";
  if (/\bblu[-_. ]?ray\b/i.test(source)) return "BluRay";
  if (/\bbrrip\b/i.test(source)) return "BRRip";
  if (/\bhdrip\b/i.test(source)) return "HDRip";
  if (/\bdvdrip\b/i.test(source)) return "DVDRip";

  return null;
}

function detectCodec(text = "") {
  const source = String(text);

  if (/\b(x265|h265|hevc)\b/i.test(source)) return "H.265 / HEVC";
  if (/\b(x264|h264)\b/i.test(source)) return "H.264";
  if (/\bav1\b/i.test(source)) return "AV1";

  return null;
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

  // Standard-Serienformat: S01E02
  const seriesMatch = readable.match(/(.+?)\s+s(\d{1,2})\s*e(\d{1,3})(?:\s*[-:=]\s*(.+))?/i);

  if (seriesMatch) {
    return {
      type: "series",
      title: titleCase(
        seriesMatch[1]
          .replace(/\b(19\d{2}|20\d{2})\b/g, "")
          .replace(/\s+-\s*$/, "")
          .trim()
      ),
      year: yearMatch ? Number(yearMatch[1]) : null,
      season: Number(seriesMatch[2]),
      episode: Number(seriesMatch[3]),
      episodeTitle: cleanEpisodeTitle(seriesMatch[4] || ""),
      quality: detectQuality(original),
      source: detectSource(original),
      codec: detectCodec(original),
    };
  }

  // Alternative Schreibweise: 1x02
  const xMatch = readable.match(/(.+?)\s+(\d{1,2})x(\d{1,3})(?:\s*[-:=]\s*(.+))?/i);

  if (xMatch) {
    return {
      type: "series",
      title: titleCase(
        xMatch[1]
          .replace(/\b(19\d{2}|20\d{2})\b/g, "")
          .replace(/\s+-\s*$/, "")
          .trim()
      ),
      year: yearMatch ? Number(yearMatch[1]) : null,
      season: Number(xMatch[2]),
      episode: Number(xMatch[3]),
      episodeTitle: cleanEpisodeTitle(xMatch[4] || ""),
      quality: detectQuality(original),
      source: detectSource(original),
      codec: detectCodec(original),
    };
  }

  // Deutsche/englische Schreibweise: Episode 2 / Folge 2 / Ep 2
  const episodeWordMatch = readable.match(
    /(.+?)\s*[- ]\s*(?:episode|folge|ep)\s*(\d{1,3})(?:\s*[-:=]?\s*(.+))?/i
  );

  if (episodeWordMatch) {
    return {
      type: "series",
      title: titleCase(
        episodeWordMatch[1]
          .replace(/\b(19\d{2}|20\d{2})\b/g, "")
          .replace(/\s+-\s*$/, "")
          .trim()
      ),
      year: yearMatch ? Number(yearMatch[1]) : null,

      // Wenn kein Sxx im Dateinamen steht, nehmen wir sicherheitshalber Staffel 1.
      // Später können wir das über Serien-Datenbank/TMDB genauer machen.
      season: 1,

      episode: Number(episodeWordMatch[2]),
      episodeTitle: cleanEpisodeTitle(episodeWordMatch[3] || ""),
      quality: detectQuality(original),
      source: detectSource(original),
      codec: detectCodec(original),
    };
  }

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
    episodeTitle: null,
    quality: detectQuality(original),
    source: detectSource(original),
    codec: detectCodec(original),
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

function buildImportReport({ fileName, parsed, fileSize, mimeType, videoMeta }) {
  const typeLabel = parsed.type === "series" ? "📺 Serie" : "🎬 Film";

  const lines = [
    "🧠 USERBOT IMPORT",
    "━━━━━━━━━━━━━━━━━━━━",
    `${typeLabel} erkannt`,
    "",
    `📂 Datei: ${fileName}`,
    `🏷 Titel: ${parsed.title || "Unbekannt"}`,
  ];

  if (parsed.year) lines.push(`📅 Jahr: ${parsed.year}`);

  if (parsed.type === "series") {
  lines.push(`📀 Staffel: ${String(parsed.season).padStart(2, "0")}`);
  lines.push(`🎞 Episode: ${String(parsed.episode).padStart(2, "0")}`);

  if (parsed.episodeTitle) {
    lines.push(`📝 Episodentitel: ${parsed.episodeTitle}`);
  }
}

  if (parsed.quality) lines.push(`🔥 Qualität: ${parsed.quality}`);
  if (parsed.source) lines.push(`📡 Quelle: ${parsed.source}`);
  if (parsed.codec) lines.push(`🎥 Codec: ${parsed.codec}`);
  if (fileSize) lines.push(`💾 Größe: ${fileSize}`);
  if (mimeType) lines.push(`🧾 MIME: ${mimeType}`);

  if (videoMeta.width && videoMeta.height) {
    lines.push(`📺 Auflösung: ${videoMeta.width}x${videoMeta.height}`);
  }

  if (videoMeta.duration) {
    lines.push(`⏱ Dauer: ${Math.round(Number(videoMeta.duration) / 60)} Min.`);
  }

  lines.push("");
  lines.push("✅ Datei wurde in die Staging-Gruppe weitergeleitet.");

  return lines.join("\n");
}

async function resolveChat(client, reference, label) {
  const ref = String(reference || "").trim();

  if (!ref) {
    throw new Error(`${label} fehlt in Render ENV.`);
  }

  try {
    return await client.getEntity(ref);
  } catch (_) {
    // Wenn direkte Suche nicht klappt, suchen wir in den sichtbaren Dialogen.
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

  throw new Error(
    `${label} konnte nicht gefunden werden: "${ref}". Sichtbare Chats: ${available}`
  );
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

  const client = new TelegramClient(
    new StringSession(session),
    apiId,
    apiHash,
    {
      connectionRetries: 5,
    }
  );

  await client.connect();

  const authorized = await client.checkAuthorization();

  if (!authorized) {
    throw new Error("USERBOT_SESSION ist ungültig oder abgelaufen.");
  }

  const me = await client.getMe();

  console.log("✅ Userbot verbunden als:", me.username || me.firstName || me.id);

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
        const fileSize = getFileSize(message);
        const mimeType = getMimeType(message);
        const videoMeta = getVideoMeta(message);

        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📥 Neue Medien-Datei erkannt");
        console.log("📂 Datei:", fileName);
        console.log("🧠 Parsed:", parsed);

        await client.forwardMessages(stagingEntity, {
          messages: [message.id],
          fromPeer: importEntity,
        });

        await client.sendMessage(stagingEntity, {
          message: buildImportReport({
            fileName,
            parsed,
            fileSize,
            mimeType,
            videoMeta,
          }),
        });

        console.log("✅ Datei wurde in Staging weitergeleitet.");
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