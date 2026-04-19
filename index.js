const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const TMDB_KEY = process.env.TMDB_KEY;

const DB_FILE = "films.json";
const LEARN_FILE = "learning.json";

// ===== LEARNING =====
function loadLearning() {
  if (!fs.existsSync(LEARN_FILE)) return {};
  return JSON.parse(fs.readFileSync(LEARN_FILE));
}

function saveLearning(data) {
  fs.writeFileSync(LEARN_FILE, JSON.stringify(data, null, 2));
}

function normalizeKey(title) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

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
    .replace(/\b(1080p|720p|2160p|x264|x265|bluray|web|dl|german|aac|hdrip|hdtv)\b/gi, "")
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

// ===== TMDB SEARCH =====
async function searchMulti(title, type) {
  const url = type === "series" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/search/${url}?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}`
  );

  const data = await res.json();
  return data.results || [];
}

// ===== ULTRA SEARCH =====
async function ultraSearch(title, type) {
  const learn = loadLearning();
  const key = normalizeKey(title);

  if (learn[key]) {
    return [{ id: learn[key].id }];
  }

  const url = type === "series" ? "tv" : "movie";

  let res = await fetch(
    `https://api.themoviedb.org/3/search/${url}?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=de-DE`
  );
  let data = await res.json();

  if (data.results?.length) {
    saveLearningResult(title, data.results[0]);
    return data.results;
  }

  res = await fetch(
    `https://api.themoviedb.org/3/search/${url}?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=en-US`
  );
  data = await res.json();

  if (data.results?.length) {
    saveLearningResult(title, data.results[0]);
    return data.results;
  }

  return [];
}

function saveLearningResult(input, result) {
  const learn = loadLearning();
  const key = normalizeKey(input);

  learn[key] = {
    id: result.id,
    title: result.title || result.name
  };

  saveLearning(learn);
}

// ===== SUGGESTIONS =====
async function sendSuggestions(chatId, results) {
  const buttons = results.slice(0,5).map(r => [{
    text: r.title || r.name,
    callback_data: `select_${r.id}`
  }]);

  await sendMessage(chatId, "❓ Meintest du:", {
    reply_markup: { inline_keyboard: buttons }
  });
}

// ===== FETCH DETAILS =====
async function fetchDetails(id, type) {
  const url = type === "series" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/${url}/${id}?api_key=${TMDB_KEY}&language=de-DE`
  );

  return res.json();
}

// ===== WEBHOOK =====
app.post(`/bot${TOKEN}`, async (req, res) => {
  try {
    const body = req.body;

    // CALLBACKS
    if (body.callback_query) {
      const data = body.callback_query.data;
      const chatId = body.callback_query.message.chat.id;

      if (data.startsWith("play_")) {
        await playMovie(chatId, data.replace("play_", ""));
      }

      if (data.startsWith("select_")) {
        const id = data.replace("select_", "");
        const details = await fetchDetails(id, "movie");
        await sendCard(chatId, details, "manual");
      }

      return res.sendStatus(200);
    }

    const msg = body.message || body.channel_post;
    if (!msg) return res.sendStatus(200);

    if (msg.document || msg.video) {
      const file = msg.document || msg.video;

      const fileId = file.file_id;
      const fileName = file.file_name || msg.caption || "video";

      const parsed = parseFileName(fileName);

      const results = await ultraSearch(parsed.title, parsed.type);

      if (!results.length) {
        const fallback = await searchMulti(parsed.title, parsed.type);

        if (fallback.length) {
          await sendSuggestions(msg.chat.id, fallback);
        } else {
          await sendMessage(msg.chat.id, "❌ Nichts gefunden");
        }

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