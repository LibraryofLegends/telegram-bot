const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const TMDB_KEY = process.env.TMDB_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_USERNAME = process.env.BOT_USERNAME || "LIBRARY_OF_LEGENDS_Bot";

const DB_FILE = "films.json";

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
  const clean = name.replace(/\.(mp4|mkv|avi)$/i, "").replace(/[._\-]+/g, " ");
  const series = clean.match(/S(\d+)E(\d+)/i);

  if (series) {
    return {
      type: "series",
      title: clean.replace(series[0], "").trim(),
      season: parseInt(series[1]),
      episode: parseInt(series[2])
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
    .replace(/- ?[a-z0-9]+$/i, "")
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
  const url = type === "series" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/search/${url}?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=de-DE`
  );

  const data = await res.json();
  return data.results?.[0] || null;
}

async function multiSearch(title, type) {
  const variants = [
    title,
    title.split(" ").slice(0, 3).join(" "),
    title.split(" ").slice(0, 2).join(" "),
    title.split(" ")[0]
  ];

  for (const v of variants) {
    if (!v || v.length < 2) continue;
    const res = await searchTMDB(v, type);
    if (res) return res;
  }

  return null;
}

async function getDetails(id, type = "movie") {
  const url = type === "series" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/${url}/${id}?api_key=${TMDB_KEY}&append_to_response=credits,release_dates&language=de-DE`
  );

  return await res.json();
}

// ================= HELPERS =================
function getCover(data) {
  return data.poster_path
    ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";
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

// ================= CARD =================
function buildCard(data, extra = {}, fileName = "", id = "0001") {
  const title = (data.title || data.name || "").toUpperCase();
  const year = (data.release_date || data.first_air_date || "").slice(0, 4);

  const genres = (data.genres || [])
    .slice(0, 2)
    .map(g => g.name)
    .join(" • ");

  const cast =
    data.credits?.cast?.slice(0, 3).map(x => x.name).join(" • ") || "-";

  const director =
    data.credits?.crew?.find(x => x.job === "Director")?.name || "-";

  const runtime = data.runtime || "-";

  const story = (data.overview || "").slice(0, 250);

  return `
━━━━━━━━━━━━━━━━━━━━━
🎬 ${title} (${year})
━━━━━━━━━━━━━━━━━━━━━
🔥 ${detectQuality(fileName)} • ${genres}
🎧 ${detectAudio(fileName)}
💿 ${detectSource(fileName)}
━━━━━━━━━━━━━━━━━━━━━
${stars(data.vote_average)}
⏱ ${runtime} Min
🎥 ${director}
👥 ${cast}
━━━━━━━━━━━━━━━━━━━━━
📖 STORY
${story}
━━━━━━━━━━━━━━━━━━━━━
▶️ #${id}
━━━━━━━━━━━━━━━━━━━━━
@LibraryOfLegends
`.trim();
}

// ================= PLAYER =================
function playerUrl(mode, id) {
  return `https://t.me/${BOT_USERNAME}?start=${mode}_${id}`;
}

// ================= UPLOAD =================
async function handleUpload(msg) {
  const file = msg.document || msg.video;
  const fileName = file.file_name || msg.caption || "";

  if (!fileName) return;

  const parsed = parseFileName(fileName);

  let searchTitle = smartTitleSplit(
    cleanTitleAdvanced(parsed.title || fileName)
  );

  const result = await multiSearch(searchTitle, parsed.type);

  if (!result) {
    return tg("sendMessage", {
      chat_id: msg.chat.id,
      text: `❌ Kein Match gefunden\n${searchTitle}`
    });
  }

  const details = await getDetails(result.id, parsed.type);

  const db = loadDB();

  const item = {
    display_id: String(db.length + 1).padStart(4, "0"),
    file_id: file.file_id,
    tmdb_id: result.id
  };

  db.unshift(item);
  saveDB(db);

  const caption = buildCard(details, parsed, fileName, item.display_id);

  const res = await tg("sendPhoto", {
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

  console.log("CHANNEL RESPONSE:", res);

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: "✅ Upload verarbeitet"
  });
}

// ================= WEBHOOK =================
app.post(`/bot${TOKEN}`, async (req, res) => {
  res.sendStatus(200);

  const msg = req.body.message || req.body.channel_post;
  if (!msg) return;

  if (msg.document || msg.video) {
    await handleUpload(msg);
  }

  if (msg.text?.startsWith("/start")) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "🔥 ULTRA SYSTEM READY"
    });
  }
});

// ================= START =================
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 ULTRA FINAL SYSTEM RUNNING");
});