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

// ===== AUDIO =====
function detectAudio(name) {
  name = name.toLowerCase();
  if (name.includes("german")) return "DE";
  if (name.includes("english")) return "EN";
  return "DE/EN";
}

// ===== GENRE EMOJIS =====
function genreEmoji(name) {
  const map = {
    Action: "🔥",
    Horror: "👻",
    Comedy: "😂",
    Drama: "🎭",
    Thriller: "🔪",
    Adventure: "🗺",
    "Science Fiction": "🚀"
  };
  return map[name] || "🎬";
}

// ===== STARS =====
function getStars(r) {
  const stars = Math.round((r || 0) / 2);
  return "⭐".repeat(stars) + "☆".repeat(5 - stars) + ` (${r?.toFixed(1) || "-"})`;
}

// ===== SEARCH =====
async function ultraSearch(title, type) {

  if (title.toLowerCase().includes("pate")) {
    const res = await fetch(`https://api.themoviedb.org/3/movie/238?api_key=${TMDB_KEY}&language=de-DE`);
    return [await res.json()];
  }

  const queries = [
    title,
    title.split(" ")[0],
    title.split(" ").slice(0,2).join(" ")
  ];

  for (const q of queries) {
    let res = await fetch(
      `https://api.themoviedb.org/3/search/${type==="series"?"tv":"movie"}?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&language=de-DE`
    );
    let data = await res.json();
    if (data.results?.length) return data.results;

    res = await fetch(
      `https://api.themoviedb.org/3/search/${type==="series"?"tv":"movie"}?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&language=en-US`
    );
    data = await res.json();
    if (data.results?.length) return data.results;
  }

  return [];
}

// ===== TELEGRAM =====
async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!data.ok) console.error(data);
  return data;
}

// ===== CARD =====
async function sendCard(chatId, data, fileId, extra, fileName) {

  const title = (data.title || data.name || "").toUpperCase();
  const year = (data.release_date || data.first_air_date || "").slice(0,4);

  const genres = (data.genres || [])
    .slice(0,2)
    .map(g => `${genreEmoji(g.name)} ${g.name}`)
    .join(" • ");

  const audio = detectAudio(fileName);

  let story = data.overview || "";
  if (story.length > 300) {
    story = story.slice(0, 300);
    story = story.slice(0, story.lastIndexOf(".")) + "...";
  }

  const id = "#" + (loadDB().length + 1).toString().padStart(4,"0");

  const text =
`━━━━━━━━━━━━━━━
🎬 ${title} (${year})
━━━━━━━━━━━━━━━
${getStars(data.vote_average)}
${genres || "-"}

⏱ ${data.runtime || "-"} Min • 🔞 FSK -
🎧 ${audio}

━━━━━━━━━━━━━━━
📝 STORY
${story}
━━━━━━━━━━━━━━━
▶️ ${id}
#${title.split(" ")[0]}
@LibraryOfLegends`;

  await tg("sendPhoto", {
    chat_id: chatId,
    photo: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
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

// ===== 🎬 NETFLIX FEED (UPGRADE) =====
async function sendFeed(chatId) {

  const db = loadDB();

  const newest = db.slice(0,5);
  const top = [...db].sort((a,b)=>b.rating-a.rating).slice(0,5);

  const action = db.filter(x => x.genre_ids?.includes(28)).slice(0,5);
  const horror = db.filter(x => x.genre_ids?.includes(27)).slice(0,5);

  let text = "🎬 Library of Legends\n\n";

  text += "🔥 Neu:\n";
  newest.forEach(m => text += `• ${m.title}\n`);

  text += "\n⭐ Top:\n";
  top.forEach(m => text += `• ${m.title}\n`);

  text += "\n🔥 Action:\n";
  action.forEach(m => text += `• ${m.title}\n`);

  text += "\n👻 Horror:\n";
  horror.forEach(m => text += `• ${m.title}\n`);

  await tg("sendMessage", {
    chat_id: chatId,
    text
  });
}

// ===== WEBHOOK =====
app.post(`/bot${TOKEN}`, async (req, res) => {
  try {

    const msg = req.body.message || req.body.channel_post;
    if (!msg) return res.sendStatus(200);

    if (msg.text?.startsWith("/start")) {
      await sendFeed(msg.chat.id);
      return res.sendStatus(200);
    }

    if (msg.document || msg.video) {

      const file = msg.document || msg.video;
      const fileId = file.file_id;
      const fileName = file.file_name || msg.caption || "";

      const parsed = parseFileName(fileName);

      const results = await ultraSearch(parsed.title, parsed.type);

      if (!results.length) {
        await tg("sendMessage", { chat_id: msg.chat.id, text: "❌ Nichts gefunden" });
        return res.sendStatus(200);
      }

      let best = results[0];

      // 👉 FULL DETAILS (WICHTIG)
      const resDetails = await fetch(
        `https://api.themoviedb.org/3/${parsed.type==="series"?"tv":"movie"}/${best.id}?api_key=${TMDB_KEY}&language=de-DE`
      );
      best = await resDetails.json();

      const db = loadDB();

      db.unshift({
        title: best.title || best.name,
        rating: best.vote_average,
        genre_ids: best.genres?.map(g=>g.id),
        file_id: fileId
      });

      saveDB(db);

      await sendCard(msg.chat.id, best, fileId, parsed, fileName);

      return res.sendStatus(200);
    }

    res.sendStatus(200);

  } catch (e) {
    console.error(e);
    res.sendStatus(200);
  }
});

// ===== START =====
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 FINAL NETFLIX BOT + KATEGORIEN AKTIV");
});