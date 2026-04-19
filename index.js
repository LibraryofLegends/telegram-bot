const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const TMDB_KEY = process.env.TMDB_KEY;

const DB_FILE = "films.json";

// ===== DB =====
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE));
}
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ===== CLEAN =====
function cleanName(name) {
  return name
    .replace(/\.(mp4|mkv|avi)$/i, "")
    .replace(/@\w+/g, "")
    .replace(/[._\-]+/g, " ")
    .replace(/\b(1080p|720p|2160p|x264|x265|bluray|web|dl|german|aac|hdrip|hdtv|originale|orginale|tonspur|extended|cut|remastered)\b/gi, "")
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
    return {
      type: "series",
      title: cleanTitle,
      group: cleanTitle,
      season: parseInt(seriesMatch[1]),
      episode: parseInt(seriesMatch[2])
    };
  }

  const year = name.match(/\d{4}/)?.[0];

  return {
    type: "movie",
    title: name.replace(year, "").trim(),
    year
  };
}

// ===== AI MATCHING =====
function generateTitleVariants(title) {
  const clean = title
    .toLowerCase()
    .replace(/\b(der|die|das|und|the|a)\b/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();

  const words = clean.split(" ").filter(w => w.length > 2);

  const variants = new Set([
    clean,
    words.slice(0,2).join(" "),
    words.slice(0,3).join(" "),
    words.slice(0,4).join(" "),
    words[0]
  ]);

  return [...variants].filter(v => v && v.length > 1);
}

// ===== TELEGRAM =====
async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!data.ok) console.error("❌ Telegram Fehler:", data);
  return data;
}

async function sendMessage(chatId, text, extra = {}) {
  return tg("sendMessage", { chat_id: chatId, text, ...extra });
}

async function playMovie(chatId, fileId) {
  return tg("sendVideo", {
    chat_id: chatId,
    video: fileId,
    supports_streaming: true
  });
}

// ===== RATING =====
function getStars(r) {
  const stars = Math.round((r || 0) / 2);
  return "⭐".repeat(stars) + "☆".repeat(5 - stars) + ` (${r?.toFixed(1) || "-"})`;
}

// ===== CARD (NETFLIX STYLE) =====
async function sendCard(chatId, data, fileId, extra = {}) {

  const title = (data.title || data.name || "").toUpperCase();
  const year = (data.release_date || data.first_air_date || "").slice(0,4);

  const genres = (data.genres || [])
    .slice(0,2)
    .map(g => g.name)
    .join(" • ");

  const runtime = data.runtime || "-";

  const episodeInfo = extra.type === "series"
    ? `📦 Staffel ${extra.season} • Folge ${extra.episode}\n`
    : "";

  const text =
`━━━━━━━━━━━━━━━
🎬 ${title} (${year})

${getStars(data.vote_average)}
🔥 ${genres || "-"}

${episodeInfo}⏱ ${runtime} Min

📝 STORY
${(data.overview || "").slice(0,180)}...
━━━━━━━━━━━━━━━`;

  await tg("sendPhoto", {
    chat_id: chatId,
    photo: data.poster_path
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
      : "https://via.placeholder.com/300x450",
    caption: text,
    reply_markup: {
      inline_keyboard: [[
        {
          text: "▶️ Abspielen",
          url: `https://t.me/LIBRARY_OF_LEGENDS_Bot?start=${fileId}`
        }
      ]]
    }
  });
}

// ===== SERIES MENU =====
async function sendSeriesMenu(chatId) {
  const db = loadDB();
  const groups = [...new Set(db.filter(x => x.group).map(x => x.group))];

  await sendMessage(chatId, "📺 Serien:", {
    reply_markup: {
      inline_keyboard: groups.map(g => [{
        text: g,
        callback_data: `open_${g}`
      }])
    }
  });
}

async function sendSeasonMenu(chatId, group) {
  const db = loadDB();
  const seasons = [...new Set(db.filter(x => x.group === group).map(x => x.season))];

  await sendMessage(chatId, `📺 ${group}`, {
    reply_markup: {
      inline_keyboard: seasons.map(s => [{
        text: `Staffel ${s}`,
        callback_data: `season_${group}_${s}`
      }])
    }
  });
}

async function sendEpisodeMenu(chatId, group, season) {
  const db = loadDB();
  const eps = db.filter(x => x.group === group && x.season == season);

  await sendMessage(chatId, `📦 Staffel ${season}`, {
    reply_markup: {
      inline_keyboard: eps.map(e => [{
        text: `▶️ Folge ${e.episode}`,
        callback_data: `play_${e.file_id}`
      }])
    }
  });
}

// ===== SEARCH =====
async function ultraSearch(title, type) {

  // 🔥 Klassiker Fix (DER PATE)
  if (title.toLowerCase().includes("pate")) {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/238?api_key=${TMDB_KEY}&language=de-DE`
    );
    const data = await res.json();
    return [data];
  }

  const variants = generateTitleVariants(title);

  for (const v of variants) {
    if (!v || v.length < 2) continue;

    let res = await fetch(
      `https://api.themoviedb.org/3/search/${type === "series" ? "tv" : "movie"}?api_key=${TMDB_KEY}&query=${encodeURIComponent(v)}&language=de-DE`
    );
    let data = await res.json();

    if (data.results?.length) return data.results;

    res = await fetch(
      `https://api.themoviedb.org/3/search/${type === "series" ? "tv" : "movie"}?api_key=${TMDB_KEY}&query=${encodeURIComponent(v)}&language=en-US`
    );
    data = await res.json();

    if (data.results?.length) return data.results;
  }

  return [];
}

// ===== WEBHOOK =====
app.post(`/bot${TOKEN}`, async (req, res) => {
  try {
    const body = req.body;

    if (body.callback_query) {
      const data = body.callback_query.data;
      const chatId = body.callback_query.message.chat.id;

      if (data.startsWith("play_")) {
        await playMovie(chatId, data.replace("play_", ""));
      }

      if (data === "series") await sendSeriesMenu(chatId);

      if (data.startsWith("open_")) {
        await sendSeasonMenu(chatId, data.replace("open_", ""));
      }

      if (data.startsWith("season_")) {
        const [, group, season] = data.split("_");
        await sendEpisodeMenu(chatId, group, season);
      }

      return res.sendStatus(200);
    }

    const msg = body.message || body.channel_post;
    if (!msg) return res.sendStatus(200);

    if (msg.text?.startsWith("/start")) {
      await sendMessage(msg.chat.id, "🎬 Library of Legends", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "📺 Serien", callback_data: "series" }]
          ]
        }
      });
      return res.sendStatus(200);
    }

    if (msg.document || msg.video) {
      const file = msg.document || msg.video;
      const fileId = file.file_id;
      const fileName = file.file_name || msg.caption || "video";

      console.log("📥 Datei:", fileName);

      const parsed = parseFileName(fileName);

      const results = await ultraSearch(parsed.title, parsed.type);

      if (!results.length) {
        await sendMessage(msg.chat.id, "❌ Nichts gefunden");
        return res.sendStatus(200);
      }

      let best = results[0];

      // 👉 falls nur ID → Details holen
      if (!best.overview) {
        const resDetails = await fetch(
          `https://api.themoviedb.org/3/${parsed.type === "series" ? "tv" : "movie"}/${best.id}?api_key=${TMDB_KEY}&language=de-DE`
        );
        best = await resDetails.json();
      }

      const db = loadDB();
      db.unshift({
        title: best.title || best.name,
        file_id: fileId,
        type: parsed.type,
        group: parsed.group,
        season: parsed.season,
        episode: parsed.episode,
        added: Date.now()
      });
      saveDB(db);

      await sendCard(msg.chat.id, best, fileId, parsed);

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
  console.log("🔥 FINAL NETFLIX BOT AKTIV");
});