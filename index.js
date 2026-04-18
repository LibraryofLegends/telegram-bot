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

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text
    })
  });
}

// ===== TMDB =====
async function fetchMovie(title, year) {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${title}&year=${year}`
  );
  const data = await res.json();
  return data.results[0];
}

// ===== WEBHOOK =====
app.post(`/bot${TOKEN}`, async (req, res) => {
  try {
    const msg = req.body.message;

    // 🛑 Keine Message → ignorieren
    if (!msg) return res.sendStatus(200);

    // 🎬 Unterstützt Dokument UND Video
    if (msg.document || msg.video) {

      const file = msg.document || msg.video;

      const fileName = file.file_name || "video";
      const fileId = file.file_id;

      const { title, year } = parseFileName(fileName);

      const movie = await fetchMovie(title, year);

      // 🛑 Wenn nichts gefunden → trotzdem sauber beenden
      if (!movie) return res.sendStatus(200);

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
    }

    // 👉 Alles andere ignorieren
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