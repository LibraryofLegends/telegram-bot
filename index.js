const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const TMDB_KEY = process.env.TMDB_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;

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
    .replace(/[._\-]+/g, " ")
    .replace(/\b(1080p|720p|2160p|x264|x265|bluray|web|dl|german)\b/gi, "")
    .trim();
}

// ===== PARSER =====
function parseFileName(name) {
  name = cleanName(name);

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
  if (name.includes("german")) return "Deutsch";
  if (name.includes("english")) return "Englisch";
  return "Deutsch • Englisch";
}

// ===== COLLECTION =====
function detectCollection(title) {
  if (!title) return null;

  if (title.includes("FAST")) return "FAST & FURIOUS COLLECTION";
  if (title.includes("AVENGERS")) return "MARVEL COLLECTION";
  if (title.includes("HARRY POTTER")) return "HARRY POTTER COLLECTION";

  return null;
}

// ===== GENRE =====
function genreList(genres=[]) {
  return genres.slice(0,2).map(g => g.name).join(" • ");
}

// ===== STARS =====
function getStars(r) {
  const stars = Math.round((r || 0) / 2);
  return "⭐".repeat(stars) + "☆".repeat(5 - stars) + ` (${r?.toFixed(1) || "-"})`;
}

// ===== HASHTAGS =====
function generateTags(data) {
  const tags = [];

  if (data.genres) {
    data.genres.forEach(g => tags.push(`#${g.name.replace(/\s/g,"")}`));
  }

  const main = (data.title || "").split(" ")[0];
  tags.push(`#${main}`);

  return tags.join(" ");
}

// ===== SEARCH =====
async function searchTMDB(title) {

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=de-DE`
  );

  const data = await res.json();
  if (!data.results?.length) return null;

  const id = data.results[0].id;

  const details = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_KEY}&append_to_response=credits&language=de-DE`
  );

  return await details.json();
}

// ===== CARD =====
function buildCard(data, fileName, idNum) {

  const title = (data.title || "").toUpperCase();
  const year = (data.release_date || "").slice(0,4);

  const audio = detectAudio(fileName);
  const genres = genreList(data.genres);
  const collection = detectCollection(title);

  const director = data.credits?.crew?.find(x=>x.job==="Director")?.name || "-";

  const cast = data.credits?.cast
    ?.slice(0,3)
    .map(x=>x.name)
    .join(" • ");

  let story = data.overview || "";
  if (story.length > 400) {
    story = story.slice(0, story.lastIndexOf(".")) + "...";
  }

  const id = "#" + idNum.toString().padStart(4,"0");
  const extraId = "#A" + Math.floor(Math.random()*999);

  const tags = generateTags(data);

  return `
━━━━━━━━━━━━━━━━━━
🎬 ${title} (${year})
${collection ? "🎞 " + collection : ""}
━━━━━━━━━━━━━━━━━━
🔥 SD • ${genres || "-"}  
🎧 ${audio}  
💿 BluRay  
━━━━━━━━━━━━━━━━━━
${getStars(data.vote_average)}
⏱ ${data.runtime || "-"} Min • 🔞 FSK -  
🎥 ${director}  
👥 ${cast || "-"}  
━━━━━━━━━━━━━━━━━━
📖 STORY  
${story}
━━━━━━━━━━━━━━━━━━
▶️ ${id} • ${extraId}
━━━━━━━━━━━━━━━━━━
${tags}
@LibraryOfLegends`;
}

// ===== TELEGRAM =====
async function tg(method, body) {
  return fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

// ===== WEBHOOK =====
app.post(`/bot${TOKEN}`, async (req, res) => {

  const msg = req.body.message || req.body.channel_post;
  if (!msg) return res.sendStatus(200);

  if (msg.document || msg.video) {

    const file = msg.document || msg.video;
    const fileId = file.file_id;
    const fileName = file.file_name || "";

    const parsed = parseFileName(fileName);
    const data = await searchTMDB(parsed.title);

    if (!data) {
      await tg("sendMessage", { chat_id: msg.chat.id, text: "❌ Nichts gefunden" });
      return res.sendStatus(200);
    }

    const db = loadDB();

    db.unshift({
      title: data.title,
      rating: data.vote_average,
      file_id: fileId,
      added: Date.now()
    });

    saveDB(db);

    const text = buildCard(data, fileName, db.length);

    await tg("sendPhoto", {
      chat_id: CHANNEL_ID,
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

    return res.sendStatus(200);
  }

  res.sendStatus(200);
});

// ===== START =====
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 PREMIUM LAYOUT AKTIV");
});