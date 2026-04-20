const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const TMDB_KEY = process.env.TMDB_KEY;
const OMDB_KEY = process.env.OMDB_KEY || "";
const CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_USERNAME = process.env.BOT_USERNAME || "LIBRARY_OF_LEGENDS_Bot";

const DB_FILE = "films.json";
const HISTORY_FILE = "history.json";

const sessions = {}; // per-chat browse state

// ===== DB =====
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return [];
  const raw = fs.readFileSync(DB_FILE, "utf8");
  const db = raw ? JSON.parse(raw) : [];

  let changed = false;
  db.forEach((item, idx) => {
    if (!item.display_id) {
      item.display_id = String(idx + 1).padStart(4, "0");
      changed = true;
    }
  });

  if (changed) saveDB(db);
  return db;
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ===== HISTORY =====
function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return {};
  const raw = fs.readFileSync(HISTORY_FILE, "utf8");
  return raw ? JSON.parse(raw) : {};
}

function saveHistory(data) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
}

// ===== CLEAN =====
function cleanName(name) {
  return name
    .replace(/\.(mp4|mkv|avi)$/i, "")
    .replace(/@\w+/g, "")
    .replace(/[._\-]+/g, " ")
    .replace(/\b(1080p|720p|2160p|4k|x264|x265|bluray|web|dl|german|aac|hdrip|hdtv|extended|cut|remastered|originale|orginale|tonspur)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSearchTitle(title) {
  return title
    .toLowerCase()
    .replace(/\b(der|die|das|und|the|a|orginale|originale|tonspur|extended|cut|remastered|collection|movie|film)\b/g, "")
    .replace(/\b(19|20)\d{2}\b/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ===== PARSER =====
function parseFileName(name) {
  name = cleanName(name);

  const seriesMatch =
    name.match(/S(\d{1,2})E(\d{1,2})/i) ||
    name.match(/(\d{1,2})x(\d{1,2})/i);

  if (seriesMatch) {
    const cleanTitle = name.replace(seriesMatch[0], "").trim();
    const year = name.match(/\d{4}/)?.[0];

    return {
      type: "series",
      title: cleanTitle,
      group: cleanTitle,
      season: parseInt(seriesMatch[1]),
      episode: parseInt(seriesMatch[2]),
      year
    };
  }

  const year = name.match(/\d{4}/)?.[0];

  return {
    type: "movie",
    title: name.replace(year, "").trim(),
    year
  };
}

function generateTitleVariants(title) {
  const clean = normalizeSearchTitle(title);
  const words = clean.split(" ").filter(w => w.length > 2);

  const variants = new Set([
    clean,
    words.slice(0, 2).join(" "),
    words.slice(0, 3).join(" "),
    words.slice(0, 4).join(" "),
    words[0]
  ]);

  return [...variants].filter(v => v && v.length > 1);
}

// ===== 🔥 AUDIO PRO =====
function detectAudio(name = "") {
  const n = String(name).toLowerCase();

  const hasDE = /german|deutsch|dl|dual|multi/.test(n);
  const hasEN = /english|englisch|eng/.test(n);

  if (hasDE && hasEN) return "Deutsch • Englisch";
  if (hasDE) return "Deutsch";
  if (hasEN) return "Englisch";

  return "Deutsch • Englisch";
}

function detectQuality(name = "") {
  const n = name.toLowerCase();

  if (/2160|4k|uhd/.test(n)) return "4K";
  if (/1080|fullhd/.test(n)) return "1080p";
  if (/720/.test(n)) return "720p";

  // 🔥 SMART FALLBACK (wichtig!)
  if (n.includes("bluray") || n.includes("web") || n.includes("hdrip")) {
    return "HD";
  }

  return "SD";
}

function detectSource(name = "") {
  const n = String(name).toLowerCase();
  if (n.includes("bluray")) return "BluRay";
  if (n.includes("web-dl") || n.includes("webdl")) return "WEB-DL";
  if (n.includes("webrip")) return "WEBRip";
  if (n.includes("hdtv")) return "HDTV";
  if (n.includes("dvdrip")) return "DVD";
  return "-";
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
    Romance: "❤️"
  };
  return map[name] || "🎬";
}

function getStars(r) {
  const stars = Math.round((r || 0) / 2);
  return "⭐".repeat(stars) + "☆".repeat(5 - stars) + ` (${r?.toFixed(1) || "-"})`;
}

function getFSK(data, type) {
  try {
    if (type === "series") {
      const ratings = data.content_ratings?.results || [];
      const de = ratings.find(r => r.iso_3166_1 === "DE");
      const us = ratings.find(r => r.iso_3166_1 === "US");
      return de?.rating || us?.rating || "-";
    }

    const rel = data.release_dates?.results || [];
    const de = rel.find(r => r.iso_3166_1 === "DE");
    const us = rel.find(r => r.iso_3166_1 === "US");

    return de?.release_dates?.[0]?.certification || us?.release_dates?.[0]?.certification || "-";
  } catch {
    return "-";
  }
}

function detectCollection(data) {
  const title = String(data?.title || data?.name || "").toUpperCase();

  if (data?.belongs_to_collection?.name) return data.belongs_to_collection.name;
  if (title.includes("FAST")) return "FAST & FURIOUS COLLECTION";
  if (title.includes("AVENGERS")) return "MARVEL COLLECTION";
  if (title.includes("HARRY POTTER")) return "HARRY POTTER COLLECTION";
  if (title.includes("EXPENDABLES")) return "EXPENDABLES COLLECTION";

  return null;
}

function getDirector(data, type) {
  try {
    if (type === "series") {
      return data.created_by?.[0]?.name || data.credits?.crew?.find(x => x.job === "Director")?.name || "-";
    }
    return data.credits?.crew?.find(x => x.job === "Director")?.name || "-";
  } catch {
    return "-";
  }
}

function getCast(data) {
  try {
    return data.credits?.cast?.slice(0, 3).map(x => x.name).join(" • ") || "-";
  } catch {
    return "-";
  }
}

function generateTags(data) {
  const tags = [];
  const genres = data.genres || [];
  const title = (data.title || data.name || "").split(" ")[0] || "Movie";

  tags.push(`#${title.replace(/[^a-z0-9]/gi, "")}`);

  genres.slice(0, 3).forEach(g => {
    tags.push(`#${g.name.replace(/\s/g, "")}`);
  });

  if (data.belongs_to_collection?.name) {
    tags.push(`#${data.belongs_to_collection.name.replace(/[^a-z0-9]/gi, "")}`);
  }

  const cast = data.credits?.cast?.slice(0, 2) || [];
  cast.forEach(c => {
    const first = c.name.split(" ")[0];
    if (first) tags.push(`#${first.replace(/[^a-z0-9]/gi, "")}`);
  });

  return [...new Set(tags)].slice(0, 6).join(" ");
}

async function fetchIMDbScore(data) {
  try {
    if (!OMDB_KEY) {
      return data.vote_average ? data.vote_average.toFixed(1) : "-";
    }

    const imdbId = data.external_ids?.imdb_id;
    const year = (data.release_date || data.first_air_date || "").slice(0, 4);
    const title = encodeURIComponent(data.title || data.name || "");

    let url = "";
    if (imdbId) {
      url = `https://www.omdbapi.com/?apikey=${OMDB_KEY}&i=${imdbId}`;
    } else {
      url = `https://www.omdbapi.com/?apikey=${OMDB_KEY}&t=${title}${year ? `&y=${year}` : ""}`;
    }

    const res = await fetch(url);
    const omdb = await res.json();

    if (omdb?.imdbRating && omdb.imdbRating !== "N/A") return omdb.imdbRating;
  } catch {}

  return data.vote_average ? data.vote_average.toFixed(1) : "-";
}

// ===== TMDB =====
async function fetchDetailsById(id, type = "movie") {
  const url = type === "series" ? "tv" : "movie";
  const append =
    type === "series"
      ? "credits,external_ids,content_ratings,aggregate_credits"
      : "credits,release_dates,external_ids,belongs_to_collection";

  const res = await fetch(
    `https://api.themoviedb.org/3/${url}/${id}?api_key=${TMDB_KEY}&append_to_response=${append}&language=de-DE`
  );

  return await res.json();
}

async function smartSearch(title, type = "movie", year = "") {
  const normalized = normalizeSearchTitle(title);
  const url = type === "series" ? "tv" : "movie";

  if (/pate|godfather/.test(normalized)) {
    return await fetchDetailsById(238, "movie");
  }

  const variants = generateTitleVariants(normalized);
  const langs = ["de-DE", "en-US"];

  for (const q of variants) {
    for (const lang of langs) {
      const yearParam =
        year && type === "movie"
          ? `&year=${encodeURIComponent(year)}`
          : year && type === "series"
            ? `&first_air_date_year=${encodeURIComponent(year)}`
            : "";

      const res = await fetch(
        `https://api.themoviedb.org/3/search/${url}?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&language=${lang}${yearParam}`
      );

      const data = await res.json();
      const hit = data.results?.[0];

      if (hit?.id) {
        return await fetchDetailsById(hit.id, type);
      }
    }
  }

  return null;
}

// ===== TELEGRAM =====
async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  return res.json();
}

function playerUrl(mode, displayId) {
  return `https://t.me/${BOT_USERNAME}?start=${mode}_${displayId}`;
}

function buildPlaybackButtons(entry, index, listLength) {
  const prev = index > 0 ? { text: "⬅️", callback_data: `nav_${index - 1}` } : { text: "⬅️", callback_data: "noop" };
  const next = index < listLength - 1 ? { text: "➡️", callback_data: `nav_${index + 1}` } : { text: "➡️", callback_data: "noop" };

  return [
    [
      prev,
      { text: "▶️ Stream", url: playerUrl("str", entry.display_id) },
      { text: "⬇️ Download", url: playerUrl("dl", entry.display_id) },
      next
    ]
  ];
}

function buildPlayerOnlyButtons(entry) {
  return [
    [
      { text: "▶️ Stream", url: playerUrl("str", entry.display_id) },
      { text: "⬇️ Download", url: playerUrl("dl", entry.display_id) }
    ]
  ];
}

// ===== CARD =====
async function buildCard(data, fileName, displayId, extra = {}) {
  const title = (data.title || data.name || "").toUpperCase();
  const year = (data.release_date || data.first_air_date || "").slice(0, 4);

  const quality = detectQuality(fileName);
  const source = detectSource(fileName);
  const audio = detectAudio(fileName);

  const genres = (data.genres || [])
    .slice(0, 2)
    .map(g => `${genreEmoji(g.name)} ${g.name}`)
    .join(" • ");

  const collection = detectCollection(data);
  const director = getDirector(data, extra.type || (data.name ? "series" : "movie"));
  const cast = getCast(data);
  const imdb = await fetchIMDbScore(data);
  const fsk = getFSK(data, extra.type || (data.name ? "series" : "movie"));
  const runtime = data.runtime || data.episode_run_time?.[0] || "-";

  let story = data.overview || "Keine Beschreibung verfügbar.";
  if (story.length > 260) {
    story = story.slice(0, 260);
    const cut = story.lastIndexOf(".");
    story = (cut > 100 ? story.slice(0, cut + 1) : story) + "...";
  }

  const mainId = `#${String(displayId).padStart(4, "0")}`;
  const extraId = `#A${String(data.id).slice(-3).padStart(3, "0")}`;
  const tags = generateTags(data);

  const episodeLine =
    extra.type === "series"
      ? `📺 Staffel ${extra.season} • Folge ${extra.episode}\n`
      : "";

  const collectionLine = collection ? `🎞 ${collection}\n` : "";

  return `
━━━━━━━━━━━━━━━━━━
🎬 ${title} (${year})
${collectionLine}━━━━━━━━━━━━━━━━━━
🔥 ${quality} • ${genres || "-"}  
🎧 ${audio}  
💿 ${source}  
━━━━━━━━━━━━━━━━━━
${getStars(data.vote_average)}
${episodeLine}⏱ ${runtime} Min • 🔞 FSK ${fsk}  
🎥 ${director}  
👥 ${cast}  
━━━━━━━━━━━━━━━━━━
📖 STORY  
${story}
━━━━━━━━━━━━━━━━━━
▶️ ${mainId} • ${extraId}
━━━━━━━━━━━━━━━━━━
${tags}
@LibraryOfLegends`.trim();
}

// ===== DB LOOKUP =====
function findByDisplayId(displayId) {
  const db = loadDB();
  return db.find(x => String(x.display_id) === String(displayId)) || null;
}

function ensureSession(chatId, ids) {
  sessions[chatId] = { ids: ids.map(String), index: 0 };
}

function getSessionList(chatId) {
  const session = sessions[chatId];
  if (!session?.ids?.length) return [];
  const db = loadDB();
  return session.ids.map(id => db.find(x => String(x.display_id) === String(id))).filter(Boolean);
}

async function sendBrowseItem(chatId, index, listIds = null) {
  const db = loadDB();

  const ids = listIds?.length
    ? listIds.map(String)
    : sessions[chatId]?.ids?.length
      ? sessions[chatId].ids
      : db.map(x => String(x.display_id));

  const list = ids.map(id => db.find(x => String(x.display_id) === String(id))).filter(Boolean);
  if (!list.length) return;

  const safeIndex = Math.max(0, Math.min(index, list.length - 1));
  ensureSession(chatId, ids);
  sessions[chatId].index = safeIndex;

  const entry = list[safeIndex];
  if (!entry) return;

  const data = entry.tmdb_id
    ? await fetchDetailsById(entry.tmdb_id, entry.type || "movie")
    : await smartSearch(entry.title, entry.type || "movie", entry.year);

  if (!data) {
    await tg("sendMessage", { chat_id: chatId, text: "❌ Nichts gefunden" });
    return;
  }

  const caption = await buildCard(data, entry.file_name || entry.title || "", entry.display_id, {
    type: entry.type,
    season: entry.season,
    episode: entry.episode
  });

  await tg("sendPhoto", {
    chat_id: chatId,
    photo: data.poster_path
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
      : "https://via.placeholder.com/300x450?text=No+Image",
    caption,
    reply_markup: {
      inline_keyboard: buildPlaybackButtons(entry, safeIndex, list.length)
    }
  });
}

async function sendPlayer(chatId, item, mode = "stream") {
  if (!item) return;

  const history = loadHistory();
  history[chatId] = item.display_id;
  saveHistory(history);

  const payload = {
    chat_id: chatId,
    supports_streaming: true
  };

  if (mode === "download") {
    try {
      if (item.source_kind === "document") {
        payload.document = item.file_id;
        return await tg("sendDocument", payload);
      }
      payload.video = item.file_id;
      return await tg("sendVideo", payload);
    } catch {
      payload.video = item.file_id;
      return await tg("sendVideo", payload);
    }
  }

  try {
    payload.video = item.file_id;
    return await tg("sendVideo", payload);
  } catch {
    if (item.source_kind === "document") {
      payload.document = item.file_id;
      delete payload.supports_streaming;
      return await tg("sendDocument", payload);
    }
    throw new Error("Unable to send media");
  }
}

// ===== CATEGORY LOGIC =====
function getCategoryList(type) {
  const db = loadDB();

  if (type === "trending" || type === "new") {
    return [...db].sort((a, b) => (b.added || 0) - (a.added || 0)).slice(0, 10);
  }
  if (type === "top") return [...db].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);
  if (type === "movies") return db.filter(x => x.type === "movie");
  if (type === "series") return db.filter(x => x.type === "series");
  if (type === "action") return db.filter(x => x.genre_ids?.includes(28) || (x.genre_names || []).includes("Action"));
  if (type === "horror") return db.filter(x => x.genre_ids?.includes(27) || (x.genre_names || []).includes("Horror"));
  if (type === "all") return db;

  return db;
}

// ===== FEED =====
async function sendFeed(chatId) {
  await tg("sendMessage", {
    chat_id: chatId,
    text: "🎬 ULTRA PRO MAX",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔥 Trending", callback_data: "cat_trending" }],
        [{ text: "🆕 Neu", callback_data: "cat_new" }],
        [{ text: "⭐ Top", callback_data: "cat_top" }],
        [{ text: "🎬 Filme", callback_data: "cat_movies" }],
        [{ text: "📺 Serien", callback_data: "series" }],
        [{ text: "🔥 Action", callback_data: "cat_action" }],
        [{ text: "👻 Horror", callback_data: "cat_horror" }],
        [{ text: "▶️ Weiter schauen", callback_data: "continue" }]
      ]
    }
  });
}

// ===== SERIES MENUS =====
async function sendSeriesMenu(chatId) {
  const db = loadDB();
  const groups = new Map();

  db.filter(x => x.type === "series").forEach(item => {
    const key = String(item.series_tmdb_id || item.tmdb_id || item.display_id);
    if (!groups.has(key)) {
      groups.set(key, item.series_name || item.title || key);
    }
  });

  const buttons = [...groups.entries()].map(([key, label]) => [
    { text: label, callback_data: `series_${key}` }
  ]);

  await tg("sendMessage", {
    chat_id: chatId,
    text: "📺 Serien:",
    reply_markup: {
      inline_keyboard: buttons.length ? buttons : [[{ text: "Keine Serien", callback_data: "noop" }]]
    }
  });
}

async function sendSeasonMenu(chatId, seriesKey) {
  const db = loadDB();
  const seasons = [...new Set(
    db
      .filter(x => x.type === "series" && String(x.series_tmdb_id || x.tmdb_id) === String(seriesKey))
      .map(x => x.season)
  )].sort((a, b) => a - b);

  const seriesName =
    db.find(x => x.type === "series" && String(x.series_tmdb_id || x.tmdb_id) === String(seriesKey))?.series_name ||
    db.find(x => x.type === "series" && String(x.series_tmdb_id || x.tmdb_id) === String(seriesKey))?.title ||
    "Serie";

  await tg("sendMessage", {
    chat_id: chatId,
    text: `📦 ${seriesName}`,
    reply_markup: {
      inline_keyboard: seasons.length
        ? seasons.map(s => [{ text: `Staffel ${s}`, callback_data: `season_${seriesKey}_${s}` }])
        : [[{ text: "Keine Staffeln", callback_data: "noop" }]]
    }
  });
}

async function sendEpisodeMenu(chatId, seriesKey, season) {
  const db = loadDB();
  const eps = db
    .filter(x => x.type === "series" && String(x.series_tmdb_id || x.tmdb_id) === String(seriesKey) && Number(x.season) === Number(season))
    .sort((a, b) => (a.episode || 0) - (b.episode || 0));

  const seriesName =
    eps[0]?.series_name ||
    eps[0]?.title ||
    "Serie";

  const buttons = eps.map(e => ([
    { text: `▶️ Folge ${e.episode}`, url: playerUrl("str", e.display_id) },
    { text: "⬇️", url: playerUrl("dl", e.display_id) }
  ]));

  await tg("sendMessage", {
    chat_id: chatId,
    text: `📺 ${seriesName} • Staffel ${season}`,
    reply_markup: {
      inline_keyboard: buttons.length ? buttons : [[{ text: "Keine Episoden", callback_data: "noop" }]]
    }
  });
}

// ===== UPLOAD HANDLER =====
async function handleUpload(msg) {
  const file = msg.document || msg.video;
  const fileId = file.file_id;
  const fileName = file.file_name || msg.caption || "";
  const sourceKind = msg.document ? "document" : "video";

  const parsed = parseFileName(fileName);
  const data = await smartSearch(parsed.title, parsed.type, parsed.year);

  if (!data) {
    await tg("sendMessage", { chat_id: msg.chat.id, text: "❌ Nichts gefunden" });
    return;
  }

  const db = loadDB();
  const existing = db.find(x => x.file_id === fileId);

  const displayId = existing?.display_id || String(db.length + 1).padStart(4, "0");

  const item = {
    display_id: displayId,
    tmdb_id: data.id,
    title: data.title || data.name,
    series_name: data.name || data.title,
    rating: data.vote_average,
    imdb: data.vote_average,
    file_id: fileId,
    file_name: fileName,
    source_kind: sourceKind,
    type: parsed.type,
    group: parsed.group,
    series_tmdb_id: parsed.type === "series" ? data.id : null,
    season: parsed.season,
    episode: parsed.episode,
    genre_ids: (data.genres || []).map(g => g.id),
    genre_names: (data.genres || []).map(g => g.name),
    added: Date.now()
  };

  if (existing) {
    Object.assign(existing, item);
  } else {
    db.unshift(item);
  }

  saveDB(db);

  const caption = await buildCard(data, fileName, displayId, {
    type: parsed.type,
    season: parsed.season,
    episode: parsed.episode
  });

  const postButtons = buildPlaybackButtons(item, 0, 1);

  await tg("sendPhoto", {
    chat_id: CHANNEL_ID,
    photo: data.poster_path
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
      : "https://via.placeholder.com/300x450?text=No+Image",
    caption,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "▶️ Stream", url: playerUrl("str", displayId) },
          { text: "⬇️ Download", url: playerUrl("dl", displayId) }
        ]
      ]
    }
  });
}

// ===== START PARAM PLAYER =====
async function handleStartParam(msg, param) {
  let mode = "stream";
  let id = param;

  if (param.startsWith("str_")) {
    mode = "stream";
    id = param.replace("str_", "");
  } else if (param.startsWith("dl_")) {
    mode = "download";
    id = param.replace("dl_", "");
  } else if (param.startsWith("play_")) {
    mode = "stream";
    id = param.replace("play_", "");
  }

  const db = loadDB();
  let item = db.find(x => String(x.display_id) === String(id)) || db.find(x => String(x.file_id) === String(id));

  if (!item) {
    await tg("sendMessage", { chat_id: msg.chat.id, text: "❌ Titel nicht gefunden" });
    return;
  }

  await sendPlayer(msg.chat.id, item, mode);
}

// ===== WEBHOOK =====
app.post(`/bot${TOKEN}`, async (req, res) => {
  try {
    const body = req.body;

    // CALLBACKS
    if (body.callback_query) {
      const data = body.callback_query.data;
      const chatId = body.callback_query.message.chat.id;

      if (data === "noop") return res.sendStatus(200);

      if (data.startsWith("nav_")) {
        const index = parseInt(data.replace("nav_", ""), 10);
        if (Number.isFinite(index)) {
          await sendBrowseItem(chatId, index);
        }
        return res.sendStatus(200);
      }

      if (data.startsWith("cat_")) {
        const type = data.replace("cat_", "");
        const list = getCategoryList(type);

        if (!list.length) {
          await tg("sendMessage", { chat_id: chatId, text: "❌ Keine Einträge gefunden" });
          return res.sendStatus(200);
        }

        ensureSession(chatId, list.map(x => String(x.display_id)));
        await sendBrowseItem(chatId, 0, list.map(x => String(x.display_id)));
        return res.sendStatus(200);
      }

      if (data === "series") {
        await sendSeriesMenu(chatId);
        return res.sendStatus(200);
      }

      if (data.startsWith("series_")) {
        await sendSeasonMenu(chatId, data.replace("series_", ""));
        return res.sendStatus(200);
      }

      if (data.startsWith("season_")) {
        const [, seriesKey, season] = data.split("_");
        await sendEpisodeMenu(chatId, seriesKey, season);
        return res.sendStatus(200);
      }

      if (data === "continue") {
        const history = loadHistory();
        const last = history[chatId];
        if (last) {
          const db = loadDB();
          const item = db.find(x => String(x.display_id) === String(last));
          if (item) {
            await sendPlayer(chatId, item, "stream");
          } else {
            await tg("sendMessage", { chat_id: chatId, text: "❌ Nichts zum Fortsetzen gefunden" });
          }
        } else {
          await tg("sendMessage", { chat_id: chatId, text: "❌ Noch keine Wiedergabe im Verlauf" });
        }
        return res.sendStatus(200);
      }

      return res.sendStatus(200);
    }

    const msg = body.message || body.channel_post;
    if (!msg) return res.sendStatus(200);

    // START
    if (msg.text?.startsWith("/start")) {
      const param = msg.text.split(" ")[1];

      if (param) {
        await handleStartParam(msg, param);
        return res.sendStatus(200);
      }

      await sendFeed(msg.chat.id);
      return res.sendStatus(200);
    }

    // UPLOAD
    if (msg.document || msg.video) {
      await handleUpload(msg);
      return res.sendStatus(200);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Fehler:", err);
    res.sendStatus(200);
  }
});

// ===== START =====
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 ULTRA FINAL SYSTEM AKTIV");
});