const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const TMDB_KEY = process.env.TMDB_KEY;

const DB_FILE = "films.json";

// ===== GENRES DEUTSCH =====
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
  let name = fileName.replace(".mp4", "");
  name = name.replace(/@\w+/g, "");

  let parts = name.split(".");
  let year = parts.find(p => /^\d{4}$/.test(p));

  let title = parts
    .filter(p => p !== year && p.length > 1)
    .join(" ")
    .trim();

  return { title, year };
}

// ===== TELEGRAM TEXT =====
async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text
    })
  });
}

// ===== GENRES FORMAT =====
function getGenres(ids = []) {
  return ids.map(id => GENRE_MAP[id]).filter(Boolean).join(", ");
}

// ===== MOVIE CARD =====
async function sendMovieCard(chatId, movie, fileId) {
  const genres = getGenres(movie.genre_ids);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "–";

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
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
              url: `https://t.me/LIBRARY_OF_LEGENDS_Bot?start=${fileId}`
            }
          ]
        ]
      }
    })
  });
}

// ===== TMDB (DEUTSCH + FALLBACK) =====
async function fetchMovie(title, year) {
  let res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${title}&year=${year}&language=de-DE`
  );
  let data = await res.json();

  let movie = data.results[0];

  // Fallback auf Englisch
  if (!movie || !movie.overview) {
    res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${title}&year=${year}&language=en-US`
    );
    data = await res.json();
    movie = data.results[0];
  }

  return movie;
}

// ===== WEBHOOK =====
app.post(`/bot${TOKEN}`, async (req, res) => {
  try {
    const msg = req.body.message;

    if (!msg) return res.sendStatus(200);

    // 🎬 Datei oder Video
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🔥 Server läuft auf Port", PORT);
});