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

  const seriesMatch =
    name.match(/S(\d{1,2})E(\d{1,2})/i) ||
    name.match(/(\d{1,2})x(\d{1,2})/i);

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

// ===== RATING =====
function getRating(r) {
  const stars = Math.round((r || 0) / 2);
  return "⭐".repeat(stars) + "☆".repeat(5 - stars) + ` (${r?.toFixed(1) || "-"})`;
}

// ===== GENRES =====
const GENRES = {
  28: "🔥 Action",
  35: "😂 Comedy",
  27: "👻 Horror",
  53: "🔪 Thriller",
  18: "🎭 Drama",
  878: "🚀 Sci-Fi",
  12: "🗺 Abenteuer",
  80: "🕵️ Krimi"
};

function getGenres(ids = []) {
  return ids.slice(0, 3).map(id => GENRES[id] || "").join(" • ");
}

// ===== TMDB =====
async function searchMulti(title, type) {
  const url = type === "series" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/search/${url}?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=de-DE`
  );

  const data = await res.json();
  return data.results || [];
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

// ===== CARD =====
async function sendCard(chatId, data, fileId, extra = {}) {
  try {
    const title = data.title || data.name;
    const year = (data.release_date || data.first_air_date || "").slice(0,4);

    const text =
`🎬 ${title} (${year})

${getRating(data.vote_average)}
${getGenres(data.genre_ids)}

${(extra.overview || data.overview || "").slice(0,100)}...`;

    const image = data.poster_path
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
      : null;

    if (image) {
      await tg("sendPhoto", {
        chat_id: chatId,
        photo: image,
        caption: text,
        reply_markup: {
          inline_keyboard: [[
            { text: "▶️ Abspielen", callback_data: `play_${fileId}` },
            { text: "ℹ️ Details", callback_data: `info_${fileId}` }
          ]]
        }
      });
    } else {
      await sendMessage(chatId, text);
    }

    console.log("📤 Card gesendet");

  } catch (err) {
    console.error("❌ sendCard Fehler:", err);
    await sendMessage(chatId, "❌ Fehler beim Anzeigen des Films");
  }
}

// ===== DETAILS =====
async function sendDetails(chatId, item) {
  const text =
`🎬 ${item.title}

⭐ ${getRating(item.rating)}

${item.season ? `📺 S${item.season}E${item.episode}` : ""}
📝 ${item.overview || "Keine Beschreibung"}`;

  await sendMessage(chatId, text);
}

// ===== API ROUTE (WICHTIG) =====
app.get("/api/films", (req, res) => {
  try {
    res.json(loadDB());
  } catch (err) {
    res.status(500).json({ error: "Server Fehler" });
  }
});

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

      if (data.startsWith("info_")) {
        const db = loadDB();
        const item = db.find(x => x.file_id === data.replace("info_", ""));
        if (item) await sendDetails(chatId, item);
      }

      return res.sendStatus(200);
    }

    const msg = body.message || body.channel_post;
    if (!msg) return res.sendStatus(200);

    if (msg.document || msg.video) {
      const file = msg.document || msg.video;

      const fileId = file.file_id;
      const fileName = file.file_name || msg.caption || "video";

      console.log("📥 Datei:", fileName);

      const parsed = parseFileName(fileName);

      if (!parsed.title || parsed.title.length < 2) {
        await sendMessage(msg.chat.id, "❌ Dateiname nicht erkannt");
        return res.sendStatus(200);
      }

      const results = await searchMulti(parsed.title, parsed.type);

      if (!results.length) {
        await sendMessage(msg.chat.id, `❌ Nichts gefunden: ${parsed.title}`);
        return res.sendStatus(200);
      }

      const best = results[0];
      const details = await fetchDetails(best.id, parsed.type);

      let save = {
        title: details.title || details.name,
        rating: details.vote_average,
        overview: details.overview,
        cover: `https://image.tmdb.org/t/p/w500${details.poster_path}`,
        genre_ids: details.genre_ids,
        year: (details.release_date || details.first_air_date || "").slice(0,4),
        file_id: fileId,
        type: parsed.type
      };

      if (parsed.type === "series") {
        const ep = await fetchEpisode(details.id, parsed.season, parsed.episode);

        save = {
          ...save,
          group: parsed.group,
          season: parsed.season,
          episode: parsed.episode,
          overview: ep.overview || details.overview
        };
      }

      const db = loadDB();
      db.unshift(save);
      saveDB(db);

      console.log("💾 Gespeichert:", save.title);

      await sendCard(msg.chat.id, details, fileId, save);

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
  console.log("🔥 Server läuft sauber");
});