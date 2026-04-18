const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const TMDB_KEY = process.env.TMDB_KEY;

const DB_FILE = "films.json";

// ===== GENRES (DE) =====
const GENRE_MAP = {
  28: "Action",
  35: "Komödie",
  27: "Horror",
  53: "Thriller",
  18: "Drama",
  878: "Sci-Fi",
  12: "Abenteuer",
  16: "Animation",
  80: "Krimi",
  10749: "Romantik"
};

// ===== DB =====
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ===== PARSER =====
function parseFileName(fileName) {
  let name = (fileName || "").replace(".mp4", "");
  name = name.replace(/@\w+/g, "");

  let parts = name.split(".");
  let year = parts.find(p => /^\d{4}$/.test(p));

  let title = parts
    .filter(p => p !== year && p.length > 1)
    .join(" ")
    .trim();

  return { title, year };
}

// ===== TELEGRAM BASICS =====
async function tg(method, body) {
  return fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function sendMessage(chatId, text, extra = {}) {
  return tg("sendMessage", { chat_id: chatId, text, ...extra });
}

async function playMovie(chatId, fileId) {
  // sendVideo für Streaming-UI
  return tg("sendVideo", {
    chat_id: chatId,
    video: fileId,
    supports_streaming: true
  });
}

async function answerCallback(id) {
  return tg("answerCallbackQuery", { callback_query_id: id });
}

// ===== HELPERS =====
function getGenres(ids = []) {
  return ids.map(id => GENRE_MAP[id]).filter(Boolean).join(", ");
}

// ===== TMDB (DE + Fallback EN) =====
async function fetchMovie(title, year) {
  let res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&year=${year || ""}&language=de-DE`
  );
  let data = await res.json();
  let movie = data.results?.[0];

  if (!movie || !movie.overview) {
    res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&year=${year || ""}&language=en-US`
    );
    data = await res.json();
    movie = data.results?.[0];
  }
  return movie;
}

// ===== UI: MOVIE CARD =====
async function sendMovieCard(chatId, movie, fileId) {
  const genres = getGenres(movie.genre_ids);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "–";

  return tg("sendPhoto", {
    chat_id: chatId,
    photo: movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "https://via.placeholder.com/300x450?text=Kein+Bild",
    caption:
`🎬 *${movie.title}* (${movie.release_date?.slice(0,4) || "–"})

⭐ Bewertung: ${rating}
🎭 Genre: ${genres || "–"}

📝 ${movie.overview?.slice(0,140) || "Keine Beschreibung verfügbar"}...`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "▶️ Jetzt ansehen",
            // wichtig: dein Botname
            url: `https://t.me/LIBRARY_OF_LEGENDS_Bot?start=${fileId}`
          }
        ]
      ]
    }
  });
}

// ===== UI: MENÜ =====
async function sendMainMenu(chatId) {
  return sendMessage(chatId, "🎬 *Library of Legends*", {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔥 Neu", callback_data: "new" }],
        [{ text: "🎬 Filme", callback_data: "movies" }],
        [{ text: "📺 Serien", callback_data: "series" }]
      ]
    }
  });
}

async function sendLatest(chatId) {
  const db = loadDB().slice(0, 10);
  if (!db.length) {
    return sendMessage(chatId, "Noch keine Einträge vorhanden.");
  }

  // nur Titel-Liste (leichtgewichtig)
  const text = db.map((m, i) => `${i+1}. ${m.title} (${m.year || "–"})`).join("\n");
  return sendMessage(chatId, `🔥 *Neu hinzugefügt*\n\n${text}`, { parse_mode: "Markdown" });
}

async function sendMoviesList(chatId) {
  const db = loadDB().filter(x => x.type === "movie");
  if (!db.length) return sendMessage(chatId, "Keine Filme vorhanden.");

  // zeige die letzten 10 als kurze Liste
  const list = db.slice(0, 10).map(m => `• ${m.title} (${m.year || "–"})`).join("\n");
  return sendMessage(chatId, `🎬 *Filme*\n\n${list}`, { parse_mode: "Markdown" });
}

// ===== UI: SERIEN =====
async function sendSeriesMenu(chatId) {
  const db = loadDB();
  const groups = [...new Set(db.filter(x => x.type === "series").map(x => x.group))];

  if (!groups.length) {
    return sendMessage(chatId, "Keine Serien vorhanden.");
  }

  const buttons = groups.map(g => [{ text: g, callback_data: `series_${g}` }]);

  return sendMessage(chatId, "📺 Serien auswählen:", {
    reply_markup: { inline_keyboard: buttons }
  });
}

async function sendEpisodes(chatId, group) {
  const db = loadDB();
  const episodes = db
    .filter(x => x.type === "series" && x.group === group)
    .sort((a, b) => (a.season - b.season) || (a.episode - b.episode));

  if (!episodes.length) {
    return sendMessage(chatId, "Keine Episoden gefunden.");
  }

  const buttons = episodes.map(ep => ([
    {
      text: `S${ep.season}E${ep.episode}`,
      callback_data: `play_${ep.file_id}`
    }
  ]));

  return sendMessage(chatId, `📺 ${group}`, {
    reply_markup: { inline_keyboard: buttons }
  });
}

// ===== WEBHOOK =====
app.post(`/bot${TOKEN}`, async (req, res) => {
  try {
    const body = req.body;

    // --- CALLBACKS (Buttons) ---
    if (body.callback_query) {
      const cb = body.callback_query;
      const data = cb.data;
      const chatId = cb.message.chat.id;

      if (data.startsWith("play_")) {
        const fileId = data.replace("play_", "");
        await playMovie(chatId, fileId);
      } else if (data === "new") {
        await sendLatest(chatId);
      } else if (data === "movies") {
        await sendMoviesList(chatId);
      } else if (data === "series") {
        await sendSeriesMenu(chatId);
      } else if (data.startsWith("series_")) {
        const group = data.replace("series_", "");
        await sendEpisodes(chatId, group);
      }

      await answerCallback(cb.id);
      return res.sendStatus(200);
    }

    // --- MESSAGES ---
    const msg = body.message;
    if (!msg) return res.sendStatus(200);

    // ▶️ /start (inkl. Play über Deep-Link)
    if (msg.text && msg.text.startsWith("/start")) {
      const parts = msg.text.split(" ");
      const fileId = parts[1];

      if (fileId) {
        await playMovie(msg.chat.id, fileId);
      } else {
        await sendMainMenu(msg.chat.id);
      }
      return res.sendStatus(200);
    }

    // 🎬 Datei/Video hinzufügen → erkennen + speichern + Card senden
    if (msg.document || msg.video) {
      const file = msg.document || msg.video;
      const fileName = file.file_name || "video";
      const fileId = file.file_id;

      const { title, year } = parseFileName(fileName);
      const movie = await fetchMovie(title, year);

      if (!movie) {
        await sendMessage(msg.chat.id, "❌ Film nicht gefunden oder falscher Dateiname");
        return res.sendStatus(200);
      }

      const db = loadDB();
      db.unshift({
        title: movie.title,
        year: movie.release_date?.slice(0, 4),
        rating: movie.vote_average,
        cover: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        overview: movie.overview,
        genre_ids: movie.genre_ids,
        file_id: fileId,
        type: "movie",
        added: Date.now()
      });
      saveDB(db);

      console.log("✅ Film gespeichert:", movie.title);

      await sendMovieCard(msg.chat.id, movie, fileId);
      return res.sendStatus(200);
    }

    // alles andere ignorieren
    return res.sendStatus(200);

  } catch (err) {
    console.error("❌ Fehler:", err);
    return res.sendStatus(200);
  }
});

// ===== API (für deine Web-App) =====
app.get("/api/films", (req, res) => {
  res.json(loadDB());
});

// ===== START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🔥 Server läuft auf Port", PORT);
});