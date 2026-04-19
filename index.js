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
    .replace(/\b(1080p|720p|x264|x265|bluray|web|dl|german)\b/gi, "")
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

// ===== TELEGRAM =====
async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!data.ok) {
    console.error("❌ Telegram Fehler:", data);
  }

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

// ===== CARD =====
async function sendCard(chatId, data, fileId) {
  const title = data.title || data.name;
  const year = (data.release_date || data.first_air_date || "").slice(0,4);

  const text =
`🎬 ${title} (${year})
⭐ ${data.vote_average?.toFixed(1) || "-"}

${(data.overview || "").slice(0,100)}...`;

  await tg("sendPhoto", {
    chat_id: chatId,
    photo: data.poster_path
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
      : "https://via.placeholder.com/300x450",
    caption: text,
    reply_markup: {
      inline_keyboard: [[
        { text: "▶️ Abspielen", callback_data: `play_${fileId}` }
      ]]
    }
  });
}

// ===== GENRES =====
function groupByGenre(db) {
  const groups = {};

  db.forEach(m => {
    if (!m.genre_ids) return;

    m.genre_ids.forEach(id => {
      if (!groups[id]) groups[id] = [];
      groups[id].push(m);
    });
  });

  return groups;
}

// ===== NETFLIX FEED =====
async function sendNetflixFeed(chatId) {
  const db = loadDB();

  if (!db.length) {
    return sendMessage(chatId, "📭 Keine Filme vorhanden");
  }

  const newest = [...db].sort((a,b)=>(b.added||0)-(a.added||0)).slice(0,5);
  const top = [...db].sort((a,b)=>(b.rating||0)-(a.rating||0)).slice(0,5);
  const random = [...db].sort(()=>0.5 - Math.random()).slice(0,5);

  let text = `🎬 Library of Legends\n\n`;

  text += `🔥 Neu:\n`;
  newest.forEach(m => text += `• ${m.title}\n`);

  text += `\n⭐ Top:\n`;
  top.forEach(m => text += `• ${m.title}\n`);

  text += `\n🎲 Entdecken:\n`;
  random.forEach(m => text += `• ${m.title}\n`);

  await sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🔥 Neu", callback_data: "feed_new" },
          { text: "⭐ Top", callback_data: "feed_top" }
        ],
        [
          { text: "🎬 Filme", callback_data: "feed_movies" },
          { text: "📺 Serien", callback_data: "feed_series" }
        ],
        [
          { text: "🎭 Genres", callback_data: "feed_genres" }
        ]
      ]
    }
  });
}

// ===== TMDB =====
async function searchMulti(title, type) {
  const url = type === "series" ? "tv" : "movie";

  // 1. DE Suche
  let res = await fetch(
    `https://api.themoviedb.org/3/search/${url}?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=de-DE`
  );
  let data = await res.json();

  if (data.results && data.results.length > 0) {
    return data.results;
  }

  console.log("⚠️ Kein Treffer (DE), versuche EN...");

  // 2. EN FALLBACK
  res = await fetch(
    `https://api.themoviedb.org/3/search/${url}?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=en-US`
  );
  data = await res.json();

  return data.results || [];
}

// ===== WEBHOOK =====
app.post(`/bot${TOKEN}`, async (req, res) => {
  try {
    const body = req.body;

    // CALLBACKS
    if (body.callback_query) {
      const data = body.callback_query.data;
      const chatId = body.callback_query.message.chat.id;

      const db = loadDB();

      if (data.startsWith("play_")) {
        await playMovie(chatId, data.replace("play_", ""));
      }

      if (data === "feed_new") {
        db.slice(0,10).forEach(x => sendCard(chatId, x, x.file_id));
      }

      if (data === "feed_top") {
        [...db].sort((a,b)=>b.rating-a.rating)
          .slice(0,10)
          .forEach(x => sendCard(chatId, x, x.file_id));
      }

      if (data === "feed_movies") {
        db.filter(x=>x.type==="movie")
          .slice(0,10)
          .forEach(x => sendCard(chatId, x, x.file_id));
      }

      if (data === "feed_series") {
        const groups = [...new Set(db.map(x=>x.group).filter(Boolean))];

        await sendMessage(chatId, "📺 Serien", {
          reply_markup: {
            inline_keyboard: groups.map(g => [{
              text: g,
              callback_data: `open_${g}`
            }])
          }
        });
      }

      if (data.startsWith("open_")) {
        const group = data.replace("open_", "");
        const eps = db.filter(x => x.group === group);

        eps.forEach(x => sendCard(chatId, x, x.file_id));
      }

      if (data === "feed_genres") {
        const genres = groupByGenre(db);

        const buttons = Object.keys(genres).map(g => [{
          text: `🎭 ${g}`,
          callback_data: `genre_${g}`
        }]);

        await sendMessage(chatId, "🎭 Genres", {
          reply_markup: { inline_keyboard: buttons }
        });
      }

      if (data.startsWith("genre_")) {
        const id = data.replace("genre_", "");
        const list = groupByGenre(db)[id] || [];

        list.slice(0,10).forEach(x => sendCard(chatId, x, x.file_id));
      }

      return res.sendStatus(200);
    }

    const msg = body.message || body.channel_post;
    if (!msg) return res.sendStatus(200);

    // START → Netflix Feed
    if (msg.text?.startsWith("/start")) {
      await sendNetflixFeed(msg.chat.id);
      return res.sendStatus(200);
    }

    // FILE
    if (msg.document || msg.video) {
      const file = msg.document || msg.video;

      const fileId = file.file_id;
      const fileName = file.file_name || msg.caption || "video";

      const parsed = parseFileName(fileName);

      const results = await searchMulti(parsed.title, parsed.type);
      if (!results.length) {
        await sendMessage(msg.chat.id, "❌ Nichts gefunden");
        return res.sendStatus(200);
      }

      const best = results[0];
      const details = await fetchDetails(best.id, parsed.type);

      const save = {
        title: details.title || details.name,
        rating: details.vote_average,
        overview: details.overview,
        cover: `https://image.tmdb.org/t/p/w500${details.poster_path}`,
        genre_ids: details.genre_ids,
        year: (details.release_date || details.first_air_date || "").slice(0,4),
        file_id: fileId,
        type: parsed.type,
        added: Date.now()
      };

      const db = loadDB();

      if (!db.find(x => x.file_id === fileId)) {
        db.unshift(save);
        saveDB(db);
      }

      await sendMessage(msg.chat.id, `✅ Gespeichert: ${save.title}`);

      return res.sendStatus(200);
    }

    res.sendStatus(200);

  } catch (err) {
    console.error("❌ Fehler:", err);
    res.sendStatus(200);
  }
});

// ===== API =====
app.get("/api/films", (req, res) => {
  res.json(loadDB());
});

// ===== START =====
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 Server läuft sauber");
});