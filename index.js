const fetch = global.fetch || require("node-fetch");
const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const TMDB_KEY = process.env.TMDB_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_USERNAME = process.env.BOT_USERNAME || "LIBRARY_OF_LEGENDS_Bot";

const DB_FILE = "films.json";
const HISTORY_FILE = "history.json";

// ================= GLOBAL UI STATE =================
global.LAST_LIST = null;
global.LAST_HEADING = "";

// ================= DB =================
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8") || "[]");
}

let CACHE = loadDB();

function saveDB(data) {
  CACHE = data;
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const SERIES_DB_FILE = "series.json";

function loadSeriesDB() {
  if (!fs.existsSync(SERIES_DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(SERIES_DB_FILE, "utf8") || "{}");
}

let SERIES_DB = loadSeriesDB();

function saveSeriesDB(data) {
  SERIES_DB = data;
  fs.writeFileSync(SERIES_DB_FILE, JSON.stringify(data, null, 2));
}

// ================= UTF / SAFE =================
function sanitizeTelegramText(input = "") {
  try {
    return String(input)
      .toWellFormed()
      .normalize("NFC")
      .replace(/\u0000/g, "");
  } catch {
    return String(input || "").replace(/\u0000/g, "");
  }
}

function sanitizeDeep(value) {
  if (typeof value === "string") return sanitizeTelegramText(value);
  if (Array.isArray(value)) return value.map(sanitizeDeep);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitizeDeep(v);
    return out;
  }
  return value;
}

function limitText(text = "", max = 1024) {
  const safe = sanitizeTelegramText(text);
  return safe.length > max ? `${safe.slice(0, max - 3)}...` : safe;
}

// ================= TELEGRAM =================
async function tg(method, body) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(sanitizeDeep(body))
    });

    const data = await res.json();

    if (!data.ok) {
      console.error("TG ERROR:", data);
    }

    return data || { ok: false };
  } catch (err) {
    console.error("TG FETCH ERROR:", err);
    return { ok: false };
  }
}

// ================= PARSER =================
function parseFileName(name = "") {
  const clean = name.replace(/\.(mp4|mkv|avi)$/i, "").replace(/[._\-]+/g, " ");

  const match = clean.match(/S(\d+)E(\d+)/i);

  if (match) {
    return {
      type: "tv",
      title: clean.replace(match[0], "").trim(),
      season: parseInt(match[1], 10),
      episode: parseInt(match[2], 10)
    };
  }

  return { type: "movie", title: clean };
}

function cleanTitleAdvanced(name = "") {
  return name
    .replace(/\.(mp4|mkv|avi)$/i, "")
    .replace(/\b(1080p|720p|2160p|4k|uhd)\b/gi, "")
    .replace(/\b(x264|x265|h264|h265)\b/gi, "")
    .replace(/\b(bluray|web|webdl|webrip|hdrip|brrip)\b/gi, "")
    .replace(/\b(german|deutsch|dl|dual|ac3|eac3|aac)\b/gi, "")
    .replace(/[._\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function smartTitleSplit(title) {
  if (title.includes(" - ")) return title.split(" - ")[0].trim();
  return title;
}

// ================= TMDB =================
async function searchTMDB(title, type = "movie") {
  const url = type === "tv" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/search/${url}?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=de-DE`
  );

  const data = await res.json();
  return data.results?.[0] || null;
}

async function multiSearch(title, preferredType = "movie") {
  const variants = [
    title,
    title.split(" ").slice(0, 3).join(" "),
    title.split(" ").slice(0, 2).join(" "),
    title.split(" ")[0]
  ].filter(Boolean);

  const typesToTry = preferredType === "tv" ? ["tv", "movie"] : ["movie", "tv"];

  for (const v of variants) {
    if (v.length < 2) continue;

    for (const type of typesToTry) {
      const res = await searchTMDB(v, type);
      if (res) return res;
    }
  }

  return null;
}

async function getDetails(id, type = "movie") {
  const url = type === "tv" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/${url}/${id}?api_key=${TMDB_KEY}&append_to_response=credits,release_dates&language=de-DE`
  );

  return await res.json();
}

async function getTrending() {
  const res = await fetch(
    `https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_KEY}&language=de-DE`
  );
  const data = await res.json();
  return data.results?.filter(x => x.media_type === "movie" || x.media_type === "tv").slice(0, 10) || [];
}

async function getPopular() {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=de-DE`
  );
  const data = await res.json();
  return data.results?.slice(0, 10) || [];
}

async function getByGenre(genreId) {
  const res = await fetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=${genreId}&sort_by=popularity.desc&language=de-DE`
  );
  const data = await res.json();
  return data.results?.slice(0, 10) || [];
}

async function getSimilar(id, type = "movie") {
  const url = type === "tv" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/${url}/${id}/similar?api_key=${TMDB_KEY}&language=de-DE`
  );

  const data = await res.json();
  return data.results?.slice(0, 10) || [];
}

async function getSeasons(tvId) {
  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_KEY}&language=de-DE`
  );
  const data = await res.json();
  return data.seasons || [];
}

async function getEpisodes(tvId, season) {
  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${tvId}/season/${season}?api_key=${TMDB_KEY}&language=de-DE`
  );
  const data = await res.json();
  return data.episodes || [];
}

// ================= HELPERS =================
function toBold(text = "") {
  const normal = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bold = "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟕𝟖𝟗";

  return sanitizeTelegramText(text).split("").map(c => {
    const i = normal.indexOf(c);
    return i >= 0 ? bold[i] : c;
  }).join("");
}

function getCover(data) {
  if (data.poster_path) {
    return `https://image.tmdb.org/t/p/w500${data.poster_path}`;
  }

  if (data.backdrop_path) {
    return `https://image.tmdb.org/t/p/w500${data.backdrop_path}`;
  }

  return "https://via.placeholder.com/500x750?text=No+Image";
}

function detectQuality(name = "") {
  const n = name.toLowerCase();
  if (/2160|4k/.test(n)) return "4K";
  if (/1080/.test(n)) return "1080p";
  if (/720/.test(n)) return "720p";
  return "HD";
}

function detectAudio(name = "") {
  const n = name.toLowerCase();
  if (/deutsch|german/.test(n) && /eng/.test(n)) return "Deutsch • Englisch";
  if (/deutsch|german/.test(n)) return "Deutsch";
  if (/eng/.test(n)) return "Englisch";
  return "Deutsch • Englisch";
}

function detectSource(name = "") {
  const n = name.toLowerCase();
  if (n.includes("bluray")) return "BluRay";
  if (n.includes("web")) return "WEB-DL";
  return "-";
}

function stars(r) {
  const s = Math.round((r || 0) / 2);
  return "⭐".repeat(s) + "☆".repeat(5 - s) + ` (${(r || 0).toFixed(1)})`;
}

function getFSK(data) {
  try {
    const releases = data.release_dates?.results || [];

    const findCert = (arr) =>
      arr?.release_dates?.find(x => x.certification)?.certification;

    const de = releases.find(r => r.iso_3166_1 === "DE");
    let cert = findCert(de);

    if (!cert) {
      const us = releases.find(r => r.iso_3166_1 === "US");
      cert = findCert(us);

      if (cert === "G") cert = "0";
      if (cert === "PG") cert = "6";
      if (cert === "PG-13") cert = "12";
      if (cert === "R") cert = "16";
      if (cert === "NC-17") cert = "18";
    }

    return cert || "-";
  } catch {
    return "-";
  }
}

function generateTags(data) {
  const tags = new Set();

  const baseTitle = data.title || data.name || "";

  const titleWords = String(baseTitle)
    .replace(/[^\w\s]/gi, "")
    .split(" ")
    .filter(w => w.length > 2)
    .slice(0, 2);

  if (titleWords.length) {
    tags.add(`#${titleWords.join("").replace(/\s/g, "")}`);
  }

  (data.genres || []).slice(0, 3).forEach(g => {
    tags.add(`#${g.name.replace(/\s/g, "")}`);
  });

  (data.credits?.cast || []).slice(0, 2).forEach(actor => {
    const name = actor.name.split(" ")[0];
    if (name.length > 3) tags.add(`#${name}`);
  });

  return [...tags].slice(0, 6).join(" ");
}

function genreEmoji(name) {
  const map = {
    Action: "🔥",
    Horror: "👻",
    Comedy: "😂",
    Drama: "🎭",
    Thriller: "🔪",
    Adventure: "🗺",
    "Science Fiction": "🚀",
    Crime: "🕵️",
    Animation: "🎨",
    Family: "👨‍👩‍👧‍👦",
    Romance: "❤️",
    Mystery: "🕵️‍♂️",
    Fantasy: "✨"
  };

  return map[name] || "🎬";
}

function buildCard(data, extra = {}, fileName = "", id = "0001") {
  const title = toBold((data.title || data.name || "UNBEKANNT").toUpperCase());
  const year = (data.release_date || data.first_air_date || "").slice(0, 4);

  const genres = (data.genres || [])
    .slice(0, 2)
    .map(g => g.name)
    .join(" • ");

  const cast =
    data.credits?.cast?.slice(0, 3).map(x => x.name).join(" • ") || "-";

  const director =
    data.credits?.crew?.find(x => x.job === "Director")?.name ||
    data.created_by?.[0]?.name ||
    "-";

  const runtime =
    data.runtime ||
    (Array.isArray(data.episode_run_time) && data.episode_run_time.length > 0
      ? data.episode_run_time[0]
      : "-");

  const fsk = getFSK(data);
  const tags = generateTags(data);

  // ✅ NEU: QUALITY / AUDIO / SOURCE
  const quality = detectQuality(fileName);
  const audio = detectAudio(fileName);
  const source = detectSource(fileName);

  // ✅ NEU: COLLECTION
  const collection = data.belongs_to_collection?.name || null;

  const collectionLine = collection
    ? `🎞 ${collection.toUpperCase()}`
    : "";

  // STORY
  let story = data.overview?.trim() || "Keine Beschreibung verfügbar.";

  if (story.length > 220) {
    story = story.slice(0, 220);
    const cut = story.lastIndexOf(".");
    if (cut > 100) story = story.slice(0, cut + 1);
    story += "...";
  }

  // SERIES LINE
  const typeLine =
    extra.type === "tv" && extra.season
      ? `📺 S${extra.season}E${extra.episode || "01"}`
      : "";

  const LINE_MAIN = "━━━━━━━━━━━━━━━━━━";
  const LINE_SOFT = "──────────────";

  let text = `${LINE_MAIN}
🎬 𝐋𝐈𝐁𝐑𝐀𝐑𝐘 𝐎𝐅 𝐋𝐄𝐆𝐄𝐍𝐃𝐒
${title}${year ? ` (${year})` : ""}
${collectionLine ? collectionLine + "\n" : ""}${typeLine ? typeLine + "\n" : ""}${LINE_SOFT}
🔥 ${quality} • ${genres || "-"}
🎧 ${audio} • 💿 ${source}
${LINE_MAIN}
${stars(data.vote_average)}
⏱ ${runtime} Min • 🔞 FSK ${fsk}
🎥 ${director}
👥 ${cast}
${LINE_MAIN}
📖 HANDLUNG
${story}
${LINE_MAIN}
▶️ #${id}
${LINE_SOFT}
${tags}
@LibraryOfLegends`;

  // CLEANUP (WICHTIG)
  text = text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n");

  return limitText(text, 1024);
}

// ================= PLAYER =================
function playerUrl(mode, id) {
  return `https://t.me/${BOT_USERNAME}?start=${mode}_${id}`;
}

// ================= HISTORY =================
function saveHistory(userId, entry) {
  let h = {};

  if (fs.existsSync(HISTORY_FILE)) {
    try {
      h = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8") || "{}");
    } catch {
      h = {};
    }
  }

  if (!h[userId]) h[userId] = [];

  h[userId] = [
    entry,
    ...h[userId].filter(x => x.id !== entry.id)
  ].slice(0, 15); // 🔥 mehr History

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(h, null, 2));
}

function readHistory(userId) {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8") || "{}")[userId] || [];
}

// ================= UI / NETFLIX MODE =================
function showNetflixMenu(chatId) {
  return tg("sendMessage", {
    chat_id: chatId,
    text:
`🎬 LIBRARY OF LEGENDS

Wähle deinen Bereich 👇`,
    reply_markup: {
      inline_keyboard: [

        [{ text: "🔥 Trending", callback_data: "net_trending" }],
        [{ text: "📈 Popular", callback_data: "net_popular" }],

        [
          { text: "🎬 Filme A–Z", callback_data: "movies_az" },
          { text: "📺 Serien", callback_data: "series_menu" }
        ],

        [{ text: "▶️ Weiter schauen", callback_data: "continue" }]

      ]
    }
  });
}

function sendResultsList(chatId, heading, list, page = 0, defaultType = "movie") {
  if (!list || !list.length) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Keine Ergebnisse"
    });
  }

  const perPage = 5;
  const start = page * perPage;
  const slice = list.slice(start, start + perPage);

  const emojis = ["🥇","🥈","🥉","4️⃣","5️⃣"];

  const buttons = slice.map((m, i) => {
    const title = sanitizeTelegramText(m.title || m.name || "Unbekannt");
    const year = (m.release_date || m.first_air_date || "").slice(0, 4);

    return [{
      text: `${emojis[i]} ${title}${year ? ` (${year})` : ""}`,
      callback_data: `search_${m.id}_${m.media_type || defaultType}`
    }];
  });

  const nav = [];

  if (page > 0) nav.push({ text: "⬅️", callback_data: `page_${page - 1}` });
  if (start + perPage < list.length) nav.push({ text: "➡️", callback_data: `page_${page + 1}` });

  if (nav.length) buttons.push(nav);

  buttons.push([{ text: "🏠 Menü", callback_data: "netflix" }]);

  return tg("sendMessage", {
    chat_id: chatId,
    text: `🎬 ${heading}\n\n📄 Seite ${page + 1}`,
    reply_markup: { inline_keyboard: buttons }
  });
}

// ================= FILE SEND =================
async function sendFileById(chatId, item) {
  if (!item) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Datei nicht gefunden"
    });
  }

  saveHistory(chatId, item.display_id);

  if (item.file_type === "document") {
    return tg("sendDocument", {
      chat_id: chatId,
      document: item.file_id
    });
  }

  return tg("sendVideo", {
    chat_id: chatId,
    video: item.file_id,
    supports_streaming: true
  });
}

// ================= START HANDLER =================
async function handleStart(msg, param) {

  if (param === "netflix" || param === "browse" || param === "menu") {
    return showNetflixMenu(msg.chat.id);
  }

  // 🔥 TRENDING
  if (param === "net_trending") {
    const list = await getTrending();

    global.LAST_LIST = list;
    global.LAST_HEADING = "🔥 Trending:";

    return sendResultsList(msg.chat.id, global.LAST_HEADING, list, 0);
  }

  // 🔥 POPULAR
  if (param === "net_popular") {
    const list = await getPopular();

    global.LAST_LIST = list;
    global.LAST_HEADING = "📈 Popular:";

    return sendResultsList(msg.chat.id, global.LAST_HEADING, list, 0);
  }

  // 🔥 SIMILAR
  if (param.startsWith("sim_")) {
    const [, id, typeRaw] = param.split("_");
    const type = typeRaw === "tv" ? "tv" : "movie";

    const list = await getSimilar(id, type);

    return sendResultsList(msg.chat.id, "🎬 Ähnliche:", list, 0);
  }

  // 🔥 STREAM / DOWNLOAD
  if (param.startsWith("str_") || param.startsWith("dl_") || param.startsWith("play_")) {
    const id = param.replace(/^(str_|dl_|play_)/, "");
    const item = CACHE.find(x => x.display_id === id);
    return sendFileById(msg.chat.id, item);
  }

  // 🔥 FALLBACK
  const item = CACHE.find(x => x.display_id === param);

  if (!item) {
    return tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Datei nicht gefunden"
    });
  }

  return sendFileById(msg.chat.id, item);
}

// ================= UPLOAD =================
async function handleUpload(msg) {
  const file = msg.document || msg.video;
  const fileName = file.file_name || msg.caption || "";

  if (!fileName) return;

  const parsed = parseFileName(fileName);
  const searchBase = cleanTitleAdvanced(parsed.title || fileName);
  const searchTitle = smartTitleSplit(searchBase) || searchBase;

  const result = await multiSearch(searchTitle, parsed.type);

  if (!result || !result.id) {
    return tg("sendMessage", {
      chat_id: msg.chat.id,
      text: `❌ Kein Match gefunden\n${sanitizeTelegramText(searchTitle)}`
    });
  }

  const details = await getDetails(result.id, result.media_type || parsed.type);

  const db = CACHE;
  const lastId = db.length
    ? Math.max(...db.map(x => parseInt(x.display_id || "0", 10) || 0))
    : 0;

  const nextId = String(lastId + 1).padStart(4, "0");

  // 🔥 SERIES SAVE (RICHTIG PLATZIERT)
  if (parsed.type === "tv") {
    const seriesKey = parsed.title.toLowerCase().replace(/\s/g, "_");

    if (!SERIES_DB[seriesKey]) SERIES_DB[seriesKey] = {};
    if (!SERIES_DB[seriesKey][parsed.season]) SERIES_DB[seriesKey][parsed.season] = {};

    SERIES_DB[seriesKey][parsed.season][parsed.episode] = {
      file_id: file.file_id,
      display_id: nextId
    };

    saveSeriesDB(SERIES_DB);
  }

  // 🔥 CLEAN ITEM
  const item = {
    display_id: nextId,
    file_id: file.file_id,
    file_type: msg.document ? "document" : "video",
    tmdb_id: result.id,
    media_type: result.media_type || parsed.type,
    title: result.title || result.name
  };

  db.unshift(item);
  if (db.length > 500) db.length = 500;
  saveDB(db);

  let caption;
  try {
    caption = buildCard(details, parsed, fileName, item.display_id);
  } catch (e) {
    console.error("CARD ERROR:", e);
    caption = "❌ Fehler beim Erstellen der Karte";
  }

  await tg("sendPhoto", {
    chat_id: CHANNEL_ID,
    photo: getCover(details),
    caption,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "▶️ Stream", url: playerUrl("str", item.display_id) },
          { text: "⬇️ Download", url: playerUrl("dl", item.display_id) }
        ],
        [
          {
            text: "🎬 Ähnliche",
            url: `https://t.me/${BOT_USERNAME}?start=sim_${item.tmdb_id}_${item.media_type}`
          }
        ]
      ]
    }
  });

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: "✅ Upload verarbeitet"
  });
}

// ================= WEBHOOK =================
app.post(`/bot${TOKEN}`, async (req, res) => {
  res.sendStatus(200);

  const body = req.body;
  const msg = body.message || body.channel_post;

  try {
    // ================= CALLBACK =================
    if (body.callback_query) {
  const data = body.callback_query.data;
  const chatId = body.callback_query.message.chat.id;

  await tg("answerCallbackQuery", {
    callback_query_id: body.callback_query.id
  });
  
  // ================= EPISODE =================
if (data.startsWith("episode_")) {
  const [, seriesKey, season, episode] = data.split("_");

  const ep = SERIES_DB?.[seriesKey]?.[season]?.[episode];

  if (!ep) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Episode nicht vorhanden"
    });
  }

  return tg("sendVideo", {
    chat_id: chatId,
    video: ep.file_id,
    supports_streaming: true
  });
}

if (data === "continue") {
  const last = readHistory(chatId)[0];

  if (!last) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Kein Verlauf"
    });
  }

  return tg("sendMessage", {
    chat_id: chatId,
    text: "▶️ Weiter schauen:",
    reply_markup: {
      inline_keyboard: [[
        {
          text: "🎬 Öffnen",
          callback_data: `search_${last.id}_${last.type}`
        }
      ]]
    }
  });
}

  // ================= CONTINUE =================
  if (data === "continue") {
  const history = readHistory(chatId);

  if (!history.length) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Kein Verlauf vorhanden"
    });
  }

  const last = history[0];

  return tg("sendMessage", {
    chat_id: chatId,
    text: `▶️ Weiter schauen:\n\n🎬 Letzter Titel`,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "▶️ Öffnen",
            callback_data: `search_${last.id}_${last.type}`
          }
        ],
        [
          { text: "🏠 Menü", callback_data: "netflix" }
        ]
      ]
    }
  });
}

  // ================= MENU =================
  if (data === "netflix") {
    return showNetflixMenu(chatId);
  }

  // ================= PAGE =================
  if (data.startsWith("page_")) {
    const page = parseInt(data.split("_")[1], 10);

    return sendResultsList(
      chatId,
      global.LAST_HEADING,
      global.LAST_LIST,
      page
    );
  }

  // ================= TRENDING =================
  if (data === "net_trending") {
    const list = await getTrending();
    global.LAST_LIST = list;
    global.LAST_HEADING = "🔥 Trending:";
    return sendResultsList(chatId, global.LAST_HEADING, list, 0);
  }

  // ================= POPULAR =================
  if (data === "net_popular") {
    const list = await getPopular();
    global.LAST_LIST = list;
    global.LAST_HEADING = "📈 Popular:";
    return sendResultsList(chatId, global.LAST_HEADING, list, 0);
  }

  // ================= GENRE =================
  if (data.startsWith("genre_")) {
    const genre = data.split("_")[1];
    const list = await getByGenre(genre);

    global.LAST_LIST = list;
    global.LAST_HEADING = "📂 Kategorie:";

    return sendResultsList(chatId, global.LAST_HEADING, list, 0);
  }

  // ================= SEARCH =================
  if (data.startsWith("search_")) {
    const [, id, typeRaw] = data.split("_");
    const type = typeRaw === "tv" ? "tv" : "movie";

    // 🔥 SERIE → weiter zu Staffel
    if (type === "tv") {
      return tg("sendMessage", {
        chat_id: chatId,
        text: "📺 Serie erkannt – Staffel wählen:",
        reply_markup: {
          inline_keyboard: [[
            { text: "📺 Öffnen", callback_data: `tv_${id}` }
          ]]
        }
      });
    }

    const details = await getDetails(id, type);

    saveHistory(chatId, { id, type });

    return tg("sendPhoto", {
      chat_id: chatId,
      photo: getCover(details),
      caption: buildCard(details, {}, "", id),
      reply_markup: {
        inline_keyboard: [
  [
    { text: "▶️ Stream", url: playerUrl("str", id) },
    { text: "⬇️ Download", url: playerUrl("dl", id) }
  ],
  [
    { text: "🎬 Ähnliche", callback_data: `sim_${id}_${type}` }
  ],
  [
    { text: "🔥 Mehr entdecken", callback_data: "net_trending" }
  ]
]
      }
    });
  }

  // ================= SERIE START =================
  if (data.startsWith("tv_")) {
  const [, seriesKey] = data.split("_");

  const seasons = SERIES_DB[seriesKey];

  if (!seasons) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Keine Staffel vorhanden"
    });
  }

  const buttons = Object.keys(seasons).map(season => ([
    {
      text: `📺 Staffel ${season}`,
      callback_data: `season_${seriesKey}_${season}`
    }
  ]));

  return tg("sendMessage", {
    chat_id: chatId,
    text: "📺 Wähle Staffel:",
    reply_markup: { inline_keyboard: buttons }
  });
}

  // ================= SEASON =================
  if (data.startsWith("season_")) {
  const [, seriesKey, season] = data.split("_");

  const episodes = SERIES_DB?.[seriesKey]?.[season];

  if (!episodes) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Keine Episoden vorhanden"
    });
  }

  const buttons = Object.keys(episodes).map(ep => ([
    {
      text: `🎬 Episode ${ep}`,
      callback_data: `episode_${seriesKey}_${season}_${ep}`
    }
  ]));

  return tg("sendMessage", {
    chat_id: chatId,
    text: `📺 Staffel ${season}`,
    reply_markup: { inline_keyboard: buttons }
  });
}

  // ================= EPISODE =================
if (data.startsWith("episode_")) {
  const [, seriesKey, season, episode] = data.split("_");

  const ep = SERIES_DB?.[seriesKey]?.[season]?.[episode];

  if (!ep) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Episode nicht vorhanden"
    });
  }

  saveHistory(chatId, {
    id: `${seriesKey}_${season}_${episode}`,
    type: "episode"
  });

  return tg("sendMessage", {
    chat_id: chatId,
    text: `🎬 Episode ${episode}\n📺 Staffel ${season}`,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "▶️ Stream",
            callback_data: `play_${seriesKey}_${season}_${episode}`
          },
          {
            text: "⬇️ Download",
            callback_data: `dl_${seriesKey}_${season}_${episode}`
          }
        ],
        [
          {
            text: "⬅️ Zurück",
            callback_data: `season_${seriesKey}_${season}`
          }
        ]
      ]
    }
  });
}

// ================= PLAY EPISODE =================
if (data.startsWith("play_") || data.startsWith("dl_")) {
  const parts = data.split("_");

  const mode = parts[0]; // play oder dl
  const seriesKey = parts[1];
  const season = parts[2];
  const episode = parts[3];

  const ep = SERIES_DB?.[seriesKey]?.[season]?.[episode];

  if (!ep) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Datei nicht gefunden"
    });
  }

  return tg("sendVideo", {
    chat_id: chatId,
    video: ep.file_id,
    supports_streaming: true
  });
}

// ================= MOVIES A-Z =================
if (data === "movies_az") {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const buttons = [];

  for (let i = 0; i < alphabet.length; i += 4) {
    buttons.push(
      alphabet.slice(i, i + 4).map(letter => ({
        text: letter,
        callback_data: `az_${letter}`
      }))
    );
  }

  return tg("sendMessage", {
    chat_id: chatId,
    text: "🎬 Wähle einen Buchstaben:",
    reply_markup: { inline_keyboard: buttons }
  });
}

// ================= FILTER A-Z =================
if (data.startsWith("az_")) {
  const letter = data.split("_")[1];

  const filtered = CACHE.filter(x =>
    (x.title || "").toUpperCase().startsWith(letter)
  );

  if (!filtered.length) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Keine Filme gefunden"
    });
  }

  const buttons = filtered.slice(0, 10).map(x => {
  const title = sanitizeTelegramText(x.title || "Unbekannt");

  return [{
    text: `🎬 ${title}`,
    callback_data: `search_${x.tmdb_id}_${x.media_type}`
  }];
});

  return tg("sendMessage", {
    chat_id: chatId,
    text: `🎬 Filme mit "${letter}"`,
    reply_markup: { inline_keyboard: buttons }
  });
}

// ================= SERIES MENU =================
if (data === "series_menu") {

  const keys = Object.keys(SERIES_DB);

  if (!keys.length) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Keine Serien vorhanden"
    });
  }

  const buttons = keys.map(k => ([
    {
      text: `📺 ${k.replace(/_/g, " ")}`,
      callback_data: `tv_${k}`
    }
  ]));

  return tg("sendMessage", {
    chat_id: chatId,
    text: "📺 Deine Serien:",
    reply_markup: { inline_keyboard: buttons }
  });
}

  // ================= SIMILAR =================
  if (data.startsWith("sim_")) {
    const [, id, typeRaw] = data.split("_");
    const type = typeRaw === "tv" ? "tv" : "movie";

    const list = await getSimilar(id, type);

    global.LAST_LIST = list;
    global.LAST_HEADING = "🎬 Ähnliche:";

    return sendResultsList(chatId, global.LAST_HEADING, list, 0);
  }

  return;
}

    // ================= START PARAM =================
    if (msg.text?.startsWith("/start ")) {
      const param = msg.text.split(" ")[1];
      if (param) return handleStart(msg, param);
    }

    // ================= SEARCH =================
    if (msg.text && !msg.text.startsWith("/")) {
      const result = await multiSearch(msg.text);

if (!result) {
  return tg("sendMessage", {
    chat_id: msg.chat.id,
    text: "❌ Nichts gefunden"
  });
}

return tg("sendMessage", {
  chat_id: msg.chat.id,
  text: "🎬 Ergebnis gefunden – bitte auswählen",
  reply_markup: {
    inline_keyboard: [[
      {
        text: `🎬 ${sanitizeTelegramText(result.title || result.name)}`,
        callback_data: `search_${result.id}_${result.media_type || "movie"}`
      }
    ]]
  }
});

    }

    // ================= START MENU =================
    if (msg.text === "/start") {
      return showNetflixMenu(msg.chat.id);
    }

    // ================= UPLOAD =================
    if (msg.document || msg.video) {
      await handleUpload(msg);
    }
  } catch (err) {
    console.error("❌ Fehler:", err);
  }
});

// ================= START =================
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 ULTRA FINAL SYSTEM RUNNING");
});