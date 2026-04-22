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

// ================= DB =================
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8") || "[]");
  } catch {
    return [];
  }
}

let CACHE = loadDB();

function saveDB(data) {
  CACHE = data;
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ================= UTF / SAFE =================
function sanitizeTelegramText(input = "") {
  try {
    return String(input)
      .normalize("NFC")
      .replace(/\u0000/g, "")
      .replace(/[\uD800-\uDFFF]/g, "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  } catch {
    return String(input || "")
      .replace(/\u0000/g, "")
      .replace(/[\uD800-\uDFFF]/g, "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
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

function mdEscape(text = "") {
  return sanitizeTelegramText(String(text)).replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
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
    if (!data.ok) console.error("TG ERROR:", data);
    return data || { ok: false };
  } catch (err) {
    console.error("TG FETCH ERROR:", err);
    return { ok: false };
  }
}

// ================= PARSER =================
function parseFileName(name = "") {
  const clean = name.replace(/\.(mp4|mkv|avi)$/i, "").replace(/[._\-]+/g, " ");
  const series = clean.match(/S(\d+)E(\d+)/i);

  if (series) {
    return {
      type: "tv",
      title: clean.replace(series[0], "").trim(),
      season: parseInt(series[1], 10),
      episode: parseInt(series[2], 10)
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
    `https://api.themoviedb.org/3/${url}/${id}?api_key=${TMDB_KEY}&append_to_response=credits,release_dates,videos&language=de-DE`
  );
  return await res.json();
}

async function getTrending() {
  const res = await fetch(
    `https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_KEY}&language=de-DE`
  );
  const data = await res.json();
  return data.results?.filter(x => ["movie", "tv"].includes(x.media_type)).slice(0, 10) || [];
}

async function getPopular() {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=de-DE`
  );
  const data = await res.json();
  return data.results?.slice(0, 10) || [];
}

async function getNewReleases() {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_KEY}&language=de-DE`
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

async function getTrailer(id, type = "movie") {
  const url = type === "tv" ? "tv" : "movie";
  const res = await fetch(
    `https://api.themoviedb.org/3/${url}/${id}/videos?api_key=${TMDB_KEY}&language=de-DE`
  );
  const data = await res.json();
  const vid = data.results?.find(v => v.type === "Trailer" && v.site === "YouTube");
  return vid ? `https://www.youtube.com/watch?v=${vid.key}` : null;
}

// ================= HELPERS =================
function stars(r) {
  const s = Math.round((r || 0) / 2);
  return "⭐".repeat(s) + "☆".repeat(5 - s) + ` (${(r || 0).toFixed(1)})`;
}

function getCover(data) {
  if (data.poster_path) return `https://image.tmdb.org/t/p/w500${data.poster_path}`;
  if (data.backdrop_path) return `https://image.tmdb.org/t/p/w500${data.backdrop_path}`;
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

function getFSK(data) {
  try {
    const releases = data.release_dates?.results || [];
    const findCert = (arr) => arr?.release_dates?.find(x => x.certification)?.certification;

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

  const titleWords = (data.title || data.name || "")
    .replace(/[^\w\s]/gi, "")
    .split(" ")
    .filter(w => w.length > 2)
    .slice(0, 2);

  if (titleWords.length) tags.add(`#${titleWords.join("")}`);

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
  const title = (data.title || data.name || "").toUpperCase();
  const year = (data.release_date || data.first_air_date || "").slice(0, 4);

  const genres = (data.genres || [])
    .slice(0, 2)
    .map(g => `${genreEmoji(g.name)} ${g.name}`)
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

  const LINE_MAIN = "━━━━━━━━━━━━━━━━━━";
  const LINE_SOFT = "──────────────";

  let story = data.overview?.trim() || "Keine Beschreibung verfügbar.";

  if (story.length > 220) {
    story = story.slice(0, 220);
    const cut = story.lastIndexOf(".");
    if (cut > 100) story = story.slice(0, cut + 1);
    story += "...";
  }

  const typeLine =
    extra.type === "tv" && extra.season
      ? `📺 S${extra.season}E${extra.episode || "01"}\n`
      : "";

  let text = `
${LINE_MAIN}
🎬 ${title} (${year})
${typeLine}${LINE_SOFT}
🎞 ${genres || "-"}
🔥 ${detectQuality(fileName)} • 🎧 ${detectAudio(fileName)} • 💿 ${detectSource(fileName)}
${LINE_MAIN}
${stars(data.vote_average)}
⏱ ${runtime} Min • 🔞 FSK ${fsk}
🎥 ${director}
👥 ${cast}
${LINE_MAIN}
📖 STORY
${story}
${LINE_MAIN}
▶️ #${id}
${LINE_SOFT}
${tags}
@LibraryOfLegends
`.trim();

  return limitText(text, 1024);
}

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

  const key = `${entry.type}:${entry.id}`;
  h[userId] = [
    { id: String(entry.id), type: entry.type, display_id: String(entry.display_id) },
    ...h[userId].filter(x => `${x.type}:${x.id}` !== key)
  ].slice(0, 10);

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(h, null, 2));
}

function readHistory(userId) {
  let h = {};
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      h = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8") || "{}");
    } catch {
      h = {};
    }
  }
  return h[userId] || [];
}

// ================= UI / NETFLIX MODE =================
function showNetflixMenu(chatId) {
  return tg("sendMessage", {
    chat_id: chatId,
    text: "🎬 ULTRA NETFLIX MODE\nWähle einen Bereich:",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔥 Trending", callback_data: "net_trending" }],
        [{ text: "📈 Popular", callback_data: "net_popular" }],
        [{ text: "🆕 Neu", callback_data: "net_new" }],
        [
          { text: "🔥 Action", callback_data: "genre_28" },
          { text: "👻 Horror", callback_data: "genre_27" }
        ],
        [
          { text: "😂 Comedy", callback_data: "genre_35" },
          { text: "🎭 Drama", callback_data: "genre_18" }
        ],
        [
          { text: "🔪 Thriller", callback_data: "genre_53" },
          { text: "❤️ Romance", callback_data: "genre_10749" }
        ],
        [
          { text: "🚀 Sci-Fi", callback_data: "genre_878" },
          { text: "🗺 Adventure", callback_data: "genre_12" }
        ],
        [{ text: "▶️ Weiter schauen", callback_data: "continue" }]
      ]
    }
  });
}

function sendResultsList(chatId, heading, list, defaultType = "movie") {
  if (!list || !list.length) {
    return tg("sendMessage", {
      chat_id: chatId,
      text: "❌ Keine Ergebnisse gefunden"
    });
  }

  const emojis = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

  const buttons = list.slice(0, 10).map((m, i) => {
    const label = sanitizeTelegramText(m.title || m.name || "Unbekannt");
    const year = (m.release_date || m.first_air_date || "").slice(0, 4);

    return [{
      text: `${emojis[i]} ${label}${year ? ` (${year})` : ""}`,
      callback_data: `search_${m.id}_${m.media_type || defaultType}`
    }];
  });

  return tg("sendMessage", {
    chat_id: chatId,
    text: sanitizeTelegramText(heading),
    reply_markup: { inline_keyboard: buttons }
  });
}

async function sendDetails(chatId, id, type, displayId = null) {
  const details = await getDetails(id, type);
  const trailer = await getTrailer(id, type);

  saveHistory(chatId, {
    id: String(id),
    type,
    display_id: displayId || String(id)
  });

  const keyboard = [
    trailer ? [{ text: "▶️ Trailer", url: trailer }] : [],
    [{ text: "🎬 Ähnliche", callback_data: `sim_${id}_${type}` }],
    [{ text: "🏠 Menü", callback_data: "netflix" }]
  ].filter(row => row.length);

  return tg("sendPhoto", {
    chat_id: chatId,
    photo: getCover(details),
    caption: buildCard(details, { type }, "", displayId || id),
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
}

// ================= START HANDLER =================
async function handleStart(msg, param) {

  // ================= STREAM / DOWNLOAD =================
  if (param.startsWith("str_") || param.startsWith("dl_")) {
    const id = param.replace(/^(str_|dl_)/, "");
    const item = CACHE.find(x => x.display_id === id);

    if (!item) {
      return tg("sendMessage", {
        chat_id: msg.chat.id,
        text: "❌ Datei nicht gefunden"
      });
    }

    saveHistory(msg.chat.id, {
      id: item.tmdb_id,
      type: item.media_type || "movie",
      display_id: item.display_id
    });

    if (item.file_type === "document") {
      return tg("sendDocument", {
        chat_id: msg.chat.id,
        document: item.file_id
      });
    }

    return tg("sendVideo", {
      chat_id: msg.chat.id,
      video: item.file_id,
      supports_streaming: true
    });
  }

  // ================= NETFLIX MENU =================
  if (param === "netflix" || param === "menu") {
    return showNetflixMenu(msg.chat.id);
  }

  // ================= SIMILAR =================
  if (param.startsWith("sim_")) {
    const [, id, typeRaw] = param.split("_");
    const type = typeRaw === "tv" ? "tv" : "movie";

    const list = await getSimilar(id, type);

    if (!list.length) {
      return tg("sendMessage", {
        chat_id: msg.chat.id,
        text: "❌ Keine Ergebnisse gefunden"
      });
    }

    const buttons = list.map(m => ([
      {
        text: `🎬 ${sanitizeTelegramText(m.title || m.name || "Unbekannt")}`,
        callback_data: `search_${m.id}_${m.media_type || type}`
      }
    ]));

    return tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "🎬 Ähnliche Filme:",
      reply_markup: { inline_keyboard: buttons }
    });
  }

  // ================= LIBRARY ITEM =================
  if (param.startsWith("item_")) {
    const id = param.split("_")[1];
    const item = CACHE.find(x => x.display_id === id);

    if (!item) {
      return tg("sendMessage", {
        chat_id: msg.chat.id,
        text: "❌ Datei nicht gefunden"
      });
    }

    return sendDetails(
      msg.chat.id,
      item.tmdb_id,
      item.media_type || "movie",
      item.display_id
    );
  }

  // ================= DIRECT ID =================
  const item = CACHE.find(x => x.display_id === param);

  if (item) {
    return sendDetails(
      msg.chat.id,
      item.tmdb_id,
      item.media_type || "movie",
      item.display_id
    );
  }

  // ================= FALLBACK =================
  return tg("sendMessage", {
    chat_id: msg.chat.id,
    text: "❌ Datei nicht gefunden"
  });
}

// ================= SEARCH / LIBRARY =================
async function handleSearch(msg) {
  const query = msg.text.trim();
  const results = await multiSearch(query, "movie");

  if (!results.length) {
    return tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Nichts gefunden"
    });
  }

  const buttons = results
    .filter(r => ["movie", "tv"].includes(r.media_type))
    .map(r => ([{
      text: `🎬 ${sanitizeTelegramText(r.title || r.name || "Unbekannt")}`,
      callback_data: `search_${r.id}_${r.media_type}`
    }]));

  return tg("sendMessage", {
    chat_id: msg.chat.id,
    text: `🔎 Ergebnisse für: "${sanitizeTelegramText(query)}"`,
    reply_markup: { inline_keyboard: buttons }
  });
}

// ================= CALLBACK HANDLER =================
async function handleCallback(body) {
  const data = body.callback_query.data;
  const chatId = body.callback_query.message.chat.id;

  await tg("answerCallbackQuery", {
    callback_query_id: body.callback_query.id
  });

  if (data === "netflix") {
    return showNetflixMenu(chatId);
  }

  if (data === "net_trending") {
    const list = await getTrending();
    return sendResultsList(chatId, "🔥 Trending:", list);
  }

  if (data === "net_popular") {
    const list = await getPopular();
    return sendResultsList(chatId, "📈 Popular:", list);
  }

  if (data === "net_new") {
    const list = await getNewReleases();
    return sendResultsList(chatId, "🆕 Neu entdeckt:", list);
  }

  if (data.startsWith("genre_")) {
    const genre = data.split("_")[1];
    const list = await getByGenre(genre);
    return sendResultsList(chatId, "📂 Kategorie:", list);
  }

  if (data.startsWith("sim_")) {
    const [, id, typeRaw] = data.split("_");
    const type = typeRaw === "tv" ? "tv" : "movie";

    const list = await getSimilar(id, type);
    if (!list.length) {
      return tg("sendMessage", {
        chat_id: chatId,
        text: "❌ Keine Ergebnisse gefunden"
      });
    }

    const buttons = list.map(m => ([{
      text: `🎬 ${sanitizeTelegramText(m.title || m.name || "Unbekannt")}`,
      callback_data: `search_${m.id}_${m.media_type || type}`
    }]));

    return tg("sendMessage", {
      chat_id: chatId,
      text: "🎬 Ähnliche Filme:",
      reply_markup: { inline_keyboard: buttons }
    });
  }

  if (data.startsWith("search_")) {
    const [, id, typeRaw] = data.split("_");
    const type = typeRaw === "tv" ? "tv" : "movie";
    return sendDetails(chatId, id, type);
  }

  if (data.startsWith("item_")) {
    const displayId = data.split("_")[1];
    const item = CACHE.find(x => x.display_id === displayId);

    if (!item) {
      return tg("sendMessage", {
        chat_id: chatId,
        text: "❌ Datei nicht gefunden"
      });
    }

    return sendDetails(chatId, item.tmdb_id, item.media_type || "movie", item.display_id);
  }

  if (data === "continue") {
    const last = readHistory(chatId)[0];

    if (!last) {
      return tg("sendMessage", {
        chat_id: chatId,
        text: "❌ Kein Verlauf"
      });
    }

    return sendDetails(chatId, last.id, last.type || "movie", last.display_id || last.id);
  }
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
  const lastId = db.length ? Math.max(...db.map(x => parseInt(x.display_id || "0", 10) || 0)) : 0;
  const nextId = String(lastId + 1).padStart(4, "0");

  const item = {
    display_id: nextId,
    file_id: file.file_id,
    file_type: msg.document ? "document" : "video",
    tmdb_id: result.id,
    media_type: result.media_type || parsed.type,
    title: result.title || result.name || parsed.title || fileName,
    created_at: new Date().toISOString()
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

  const res = await tg("sendPhoto", {
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
      { text: "🔎 Details", callback_data: `item_${item.display_id}` }
    ],
    [
      { text: "🎬 Ähnliche", callback_data: `sim_${item.tmdb_id}_${item.media_type}` }
    ],
    [
      { text: "🎬 Netflix Menü", callback_data: "netflix" }
    ]
  ]
}
  });

  console.log("CHANNEL RESPONSE:", res);
  if (!res?.ok) {
    console.error("TELEGRAM ERROR:", res);
  }

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
    if (body.callback_query) {
      return handleCallback(body);
    }

    if (!msg) return;
    if (msg.from?.is_bot) return;

    if (msg.text?.startsWith("/start ")) {
      const param = msg.text.split(" ")[1];
      if (param) return handleStart(msg, param);
    }

    if (msg.text === "/start") {
      return showNetflixMenu(msg.chat.id);
    }

    if (msg.text && !msg.text.startsWith("/")) {
      return handleSearch(msg);
    }

    if (msg.document || msg.video) {
      await handleUpload(msg);
    }
  } catch (err) {
    console.error("❌ Fehler:", err);
  }
});

// ================= START =================
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 ULTRA NETFLIX SYSTEM RUNNING");
});