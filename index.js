const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const TMDB_KEY = process.env.TMDB_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_USERNAME = process.env.BOT_USERNAME || "LIBRARY_OF_LEGENDS_Bot";

const DB_FILE = "films.json";

const sessions = {};

// ================= DB =================
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8") || "[]");
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ================= TELEGRAM =================
async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res.json();
}

// ================= PARSER =================
function parseFileName(name = "") {
  if (!name || name.length < 2) {
    return { type: "movie", title: "", year: "" };
  }

  const clean = name
    .replace(/\.(mp4|mkv|avi)$/i, "")
    .replace(/[._\-]+/g, " ");

  const series = clean.match(/S(\d+)E(\d+)/i);

  if (series) {
    return {
      type: "series",
      title: clean.replace(series[0], "").trim(),
      season: parseInt(series[1]),
      episode: parseInt(series[2])
    };
  }

  const year = clean.match(/\d{4}/)?.[0];

  return {
    type: "movie",
    title: clean.replace(year, "").trim(),
    year
  };
}

// ================= TMDB =================
async function searchTMDB(title, type = "movie") {
  if (!title) return null;

  const url = type === "series" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/search/${url}?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=de-DE`
  );

  const data = await res.json();
  return data.results?.[0] || null;
}

async function getDetails(id, type = "movie") {
  const url = type === "series" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/${url}/${id}?api_key=${TMDB_KEY}&append_to_response=credits,release_dates&language=de-DE`
  );

  return await res.json();
}

// ================= COVER =================
function getCover(data) {
  if (data.poster_path)
    return `https://image.tmdb.org/t/p/w500${data.poster_path}`;
  return "https://via.placeholder.com/500x750?text=No+Image";
}

// ================= CARD =================
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

function getStars(rating) {
  const r = rating || 0;
  const stars = Math.round(r / 2);
  return "⭐".repeat(stars) + "☆".repeat(5 - stars) + ` (${r.toFixed(1)})`;
}

function detectQuality(name = "") {
  const n = name.toLowerCase();
  if (/2160|4k|uhd/.test(n)) return "4K";
  if (/1080/.test(n)) return "1080p";
  if (/720/.test(n)) return "720p";
  return "HD";
}

function detectAudio(name = "") {
  const n = name.toLowerCase();
  if (/german|deutsch/.test(n) && /eng/.test(n)) return "Deutsch • Englisch";
  if (/german|deutsch/.test(n)) return "Deutsch";
  if (/eng/.test(n)) return "Englisch";
  return "Deutsch • Englisch";
}

function toBold(text = "") {
  const normal = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bold   = "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟕𝟖𝟗";

  return text.split("").map(c => {
    const i = normal.indexOf(c);
    return i >= 0 ? bold[i] : c;
  }).join("");
}

function buildCard(data, extra = {}, fileName = "", displayId = "0001") {

  const title = toBold((data.title || data.name || "").toUpperCase());
  const year = (data.release_date || data.first_air_date || "").slice(0, 4);

  // ===== BASIC =====
  const quality = detectQuality(fileName);
  const source = detectSource(fileName);
  const audio = detectAudio(fileName);

  // ===== GENRES =====
  const genres = (data.genres || [])
    .slice(0, 2)
    .map(g => g.name)
    .join(" • ");

  // ===== COLLECTION =====
  let collection = data.belongs_to_collection?.name || "";
  if (collection) collection = `🎞 ${toBold(collection.toUpperCase())}\n`;

  // ===== CREW =====
  const director =
    data.credits?.crew?.find(x => x.job === "Director")?.name || "-";

  const cast =
    data.credits?.cast?.slice(0, 3).map(x => x.name).join(" • ") || "-";

  // ===== RATING =====
  const rating = getStars(data.vote_average);

  // ===== RUNTIME =====
  const runtime = data.runtime || data.episode_run_time?.[0] || "-";

  // ===== FSK =====
  const fsk = data.release_dates?.results?.[0]?.release_dates?.[0]?.certification || "-";

  // ===== STORY =====
  let story = data.overview || "Keine Beschreibung verfügbar.";
  if (story.length > 300) {
    story = story.slice(0, 300);
    const cut = story.lastIndexOf(".");
    story = (cut > 100 ? story.slice(0, cut + 1) : story) + "...";
  }

  // ===== IDS =====
  const mainId = `#${String(displayId).padStart(4, "0")}`;
  const extraId = `#A${String(data.id).slice(-3)}`;

  // ===== TAGS =====
  const tags = (data.genres || [])
    .slice(0, 2)
    .map(g => `#${g.name.replace(/\s/g, "")}`)
    .join(" ");

  const episodeLine =
    extra.season
      ? `📺 Staffel ${extra.season} • Folge ${extra.episode}\n`
      : "";

  return `
━━━━━━━━━━━━━━━━━━━━━
🎬 ${title} (${year})
${collection}━━━━━━━━━━━━━━━━━━━━━
🔥 ${quality} • ${genres || "-"}  
🎧 ${audio}  
💿 ${source}  
━━━━━━━━━━━━━━━━━━━━━
${rating}
${episodeLine}⏱ ${runtime} Min • 🔞 FSK ${fsk}  
🎥 ${director}  
👥 ${cast}  
━━━━━━━━━━━━━━━━━━━━━
📖 STORY  
${story}
━━━━━━━━━━━━━━━━━━━━━
▶️ ${mainId} • ${extraId}
━━━━━━━━━━━━━━━━━━━━━
${tags}
@LibraryOfLegends
`.trim();
}

// ================= TRENDING =================
async function fetchTrending() {
  const res = await fetch(
    `https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_KEY}`
  );
  const data = await res.json();
  return data.results || [];
}

async function sendTrending(chatId) {
  const list = await fetchTrending();

  const buttons = list.slice(0, 10).map(m => ([
    { text: `🎬 ${m.title}`, callback_data: `trend_${m.id}` }
  ]));

  await tg("sendMessage", {
    chat_id: chatId,
    text: "🔥 Trending",
    reply_markup: { inline_keyboard: buttons }
  });
}

// ================= PLAYER =================
function playerUrl(mode, id) {
  return `https://t.me/${BOT_USERNAME}?start=${mode}_${id}`;
}

// ================= UPLOAD =================
async function handleUpload(msg) {
  const file = msg.document || msg.video;
  const fileId = file.file_id;

  // 🔥 bessere Quellen sammeln
  let fileName =
    file.file_name ||
    msg.caption ||
    msg.video?.file_name ||
    "";

  // 👉 fallback wenn forward (kein name vorhanden)
  if (!fileName || fileName.length < 3) {
    return tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Kein Titel erkannt\n👉 Bitte Datei mit Namen oder Caption senden"
    });
  }

  const parsed = parseFileName(fileName);

  // 🔥 extra cleaning
  let searchTitle = parsed.title
    .replace(/\b(1080p|720p|2160p|x264|x265|bluray|web|dl|german|aac)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!searchTitle || searchTitle.length < 2) {
    return tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Titel unbrauchbar erkannt"
    });
  }

  // 🔥 FIRST TRY
  let result = await searchTMDB(searchTitle, parsed.type);

  // 🔥 SECOND TRY (nur erstes Wort)
  if (!result) {
    const short = searchTitle.split(" ").slice(0, 2).join(" ");
    result = await searchTMDB(short, parsed.type);
  }

  // 🔥 THIRD TRY (nur 1 Wort)
  if (!result) {
    const one = searchTitle.split(" ")[0];
    result = await searchTMDB(one, parsed.type);
  }

  if (!result) {
    return tg("sendMessage", {
      chat_id: msg.chat.id,
      text: `❌ Kein Match gefunden\n\n🔎 Gesucht: ${searchTitle}`
    });
  }

  const details = await getDetails(result.id, parsed.type);

  const db = loadDB();

  const item = {
    display_id: String(db.length + 1).padStart(4, "0"),
    file_id: fileId,
    title: result.title || result.name,
    tmdb_id: result.id,
    type: parsed.type,
    season: parsed.season,
    episode: parsed.episode,
    added: Date.now()
  };

  db.unshift(item);
  saveDB(db);

  const caption = buildCard(details, parsed, fileName, item.display_id);

  await tg("sendPhoto", {
    chat_id: CHANNEL_ID,
    photo: getCover(details),
    caption,
    reply_markup: {
      inline_keyboard: [[
        { text: "▶️ Stream", url: playerUrl("str", item.display_id) },
        { text: "⬇️ Download", url: playerUrl("dl", item.display_id) }
      ]]
    }
  });

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: "✅ Upload verarbeitet"
  });
}

// ================= START =================
async function handleStart(msg, param) {
  const id = param.replace(/str_|dl_/, "");
  const db = loadDB();
  const item = db.find(x => x.display_id === id);

  if (!item) return;

  await tg("sendVideo", {
    chat_id: msg.chat.id,
    video: item.file_id,
    supports_streaming: true
  });
}

// ================= FEED =================
async function sendFeed(chatId) {
  await tg("sendMessage", {
    chat_id: chatId,
    text: "🎬 PREMIUM SYSTEM",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔥 Trending", callback_data: "trending" }]
      ]
    }
  });
}

// ================= WEBHOOK =================
app.post(`/bot${TOKEN}`, async (req, res) => {
  res.sendStatus(200); // ✅ SOFORT antworten

  const body = req.body;

  try {
    if (body.callback_query) {
      await tg("answerCallbackQuery", {
        callback_query_id: body.callback_query.id
      });

      const data = body.callback_query.data;
      const chatId = body.callback_query.message.chat.id;

      if (data === "trending") {
        await sendTrending(chatId);
      }

      if (data.startsWith("trend_")) {
        const id = data.replace("trend_", "");
        const movie = await getDetails(id);

        await tg("sendPhoto", {
          chat_id: chatId,
          photo: getCover(movie),
          caption: buildCard(movie)
        });
      }

      return;
    }

    const msg = body.message || body.channel_post;
    if (!msg) return;

    if (msg.from?.is_bot) return;

    if (msg.text?.startsWith("/start")) {
      const param = msg.text.split(" ")[1];
      if (param) return await handleStart(msg, param);
      return await sendFeed(msg.chat.id);
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
  console.log("🔥 PREMIUM SYSTEM FIXED & READY");
});