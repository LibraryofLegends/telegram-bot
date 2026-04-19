const express = require("express");
const fetch = require("node-fetch");
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

  const seriesMatch = name.match(/S(\d{1,2})E(\d{1,2})/i)
    || name.match(/(\d{1,2})x(\d{1,2})/i);

  if (seriesMatch) {
    return {
      type: "series",
      title: name.replace(seriesMatch[0], "").trim(),
      group: name.replace(seriesMatch[0], "").trim(),
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
  return fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function sendMessage(chatId, text) {
  return tg("sendMessage", { chat_id: chatId, text });
}

async function playMovie(chatId, fileId) {
  return tg("sendVideo", {
    chat_id: chatId,
    video: fileId,
    supports_streaming: true
  });
}

// ===== TMDB =====
async function searchMulti(title, type) {
  const url = type === "series" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/search/${url}?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=de-DE`
  );
  const data = await res.json();
  return data.results.slice(0, 5);
}

async function fetchDetails(id, type) {
  const url = type === "series" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/${url}/${id}?api_key=${TMDB_KEY}&language=de-DE`
  );
  return res.json();
}

async function fetchEpisode(tvId, season, episode) {
  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${tvId}/season/${season}/episode/${episode}?api_key=${TMDB_KEY}&language=de-DE`
  );
  return res.json();
}

// ===== UI =====
async function sendMovieCard(chatId, data, fileId) {
  return tg("sendPhoto", {
    chat_id: chatId,
    photo: data.poster_path
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
      : "https://via.placeholder.com/300x450",
    caption:
`🎬 ${data.title || data.name}
⭐ ${data.vote_average || "-"}

${data.overview?.slice(0,120) || ""}...`,
    reply_markup: {
      inline_keyboard: [[{
        text: "▶️ Jetzt ansehen",
        url: `https://t.me/LIBRARY_OF_LEGENDS_Bot?start=${fileId}`
      }]]
    }
  });
}

async function sendSelection(chatId, results, type, fileId, parsed) {
  const buttons = results.map(r => [{
    text: `${r.title || r.name} (${(r.release_date || r.first_air_date || "").slice(0,4)})`,
    callback_data: JSON.stringify({
      action: "select",
      type,
      id: r.id,
      fileId,
      parsed
    })
  }]);

  return sendMessage(chatId, "❓ Meintest du:", {
    reply_markup: { inline_keyboard: buttons }
  });
}

async function sendMenu(chatId) {
  return tg("sendMessage", {
    chat_id: chatId,
    text: "🎬 Library of Legends",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔥 Neu", callback_data: "new" }],
        [{ text: "🎬 Filme", callback_data: "movies" }],
        [{ text: "📺 Serien", callback_data: "series" }]
      ]
    }
  });
}

// ===== WEBHOOK =====
app.post(`/bot${TOKEN}`, async (req, res) => {
  try {
    const body = req.body;

    // CALLBACK
    if (body.callback_query) {
      const cb = body.callback_query;
      const data = JSON.parse(cb.data);
      const chatId = cb.message.chat.id;

      if (data.action === "select") {
        const details = await fetchDetails(data.id, data.type);

        let save = {
          title: details.title || details.name,
          year: (details.release_date || details.first_air_date || "").slice(0,4),
          rating: details.vote_average,
          cover: `https://image.tmdb.org/t/p/w500${details.poster_path}`,
          overview: details.overview,
          file_id: data.fileId,
          type: data.type,
          added: Date.now()
        };

        if (data.type === "series") {
          const ep = await fetchEpisode(details.id, data.parsed.season, data.parsed.episode);

          save = {
            ...save,
            title: `${details.name} S${data.parsed.season}E${data.parsed.episode}`,
            episode_title: ep.name,
            group: data.parsed.group,
            season: data.parsed.season,
            episode: data.parsed.episode,
            overview: ep.overview || details.overview
          };
        }

        const db = loadDB();
        db.unshift(save);
        saveDB(db);

        await sendMovieCard(chatId, details, data.fileId);
      }

      return res.sendStatus(200);
    }

    const msg = body.message;
    if (!msg) return res.sendStatus(200);

    // START / PLAY
    if (msg.text?.startsWith("/start")) {
      const fileId = msg.text.split(" ")[1];

      if (fileId) {
        await playMovie(msg.chat.id, fileId);
      } else {
        await sendMenu(msg.chat.id);
      }

      return res.sendStatus(200);
    }

    // FILE UPLOAD
    if (msg.document || msg.video) {
      const file = msg.document || msg.video;
      const parsed = parseFileName(file.file_name || "");
      const fileId = file.file_id;

      const results = await searchMulti(parsed.title, parsed.type);

      if (!results.length) {
        await sendMessage(msg.chat.id, "❌ Nichts gefunden");
        return res.sendStatus(200);
      }

      await sendSelection(msg.chat.id, results, parsed.type, fileId, parsed);
      return res.sendStatus(200);
    }

    res.sendStatus(200);

  } catch (e) {
    console.error(e);
    res.sendStatus(200);
  }
});

// ===== API =====
app.get("/api/films", (req, res) => {
  res.json(loadDB());
});

// ===== START =====
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 Server läuft");
});