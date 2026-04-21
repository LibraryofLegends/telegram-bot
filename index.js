const fetch = global.fetch || require("node-fetch");
const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const TMDB_KEY = process.env.TMDB_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_USERNAME = process.env.BOT_USERNAME || "LIBRARY_OF_LEGENDS_Bot";

const DB_FILE = "films.json";

// ================= DB =================
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8") || "[]");
}

let CACHE = loadDB();

function saveDB(data) {
  CACHE = data;
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ================= TELEGRAM =================
async function tg(method, body) {
  try {
    // 🔥 FIX: verhindert UTF-8 Fehler
    body = JSON.parse(JSON.stringify(body));

    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!data.ok) {
      console.error("TG ERROR:", data);
    }

    return data || { ok: false };

  } catch (err) {
    console.error("TG FETCH ERROR:", err);
    return { ok: false };
  }
}

// ================= PARSER =================
function parseFileName(name = "") {
  const clean = name.replace(/\.(mp4|mkv|avi)$/i, "").replace(/[._\-]+/g, " ");
  const series = clean.match(/S(\d+)E(\d+)/i);

  if (series) {
    return {
      type: "series",
      title: clean.replace(series[0], "").trim(),
      season: parseInt(series[1], 10),
      episode: parseInt(series[2], 10)
    };
  }

  return { type: "movie", title: clean };
}

function cleanTitleAdvanced(name = "") {
  return name
    .replace(/\.(mp4|mkv|avi)$/i, "")
    .replace(/\b(1080p|720p|2160p|4k|uhd)\b/gi, "")
    .replace(/\b(x264|x265|h264|h265)\b/gi, "")
    .replace(/\b(bluray|web|webdl|webrip|hdrip|brrip)\b/gi, "")
    .replace(/\b(german|deutsch|dl|dual|ac3|eac3|aac)\b/gi, "")
    .replace(/- ?[a-z0-9]+$/i, "")
    .replace(/[._\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function smartTitleSplit(title) {
  if (title.includes(" - ")) return title.split(" - ")[0].trim();
  return title;
}

// ================= TMDB =================
async function searchTMDB(title, type = "movie") {
  const url = type === "series" || type === "tv" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/search/${url}?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=de-DE`
  );

  const data = await res.json();
  return data.results?.[0] || null;
}

async function multiSearch(title, type) {
  const variants = [
    title,
    title.split(" ").slice(0, 3).join(" "),
    title.split(" ").slice(0, 2).join(" "),
    title.split(" ")[0]
  ];

  for (const v of variants) {
    if (!v || v.length < 2) continue;
    const res = await searchTMDB(v, type);
    if (res) return res;
  }

  return null;
}

async function getDetails(id, type = "movie") {
  const url = type === "series" || type === "tv" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/${url}/${id}?api_key=${TMDB_KEY}&append_to_response=credits,release_dates&language=de-DE`
  );

  return await res.json();
}

// ================= HELPERS =================
function toBold(text = "") {
  return text; // 🔥 verhindert UTF-Fehler
}

function getCover(data) {
  if (data.poster_path) {
    return `https://image.tmdb.org/t/p/w500${data.poster_path}`;
  }

  if (data.backdrop_path) {
    return `https://image.tmdb.org/t/p/w500${data.backdrop_path}`;
  }

  return "https://via.placeholder.com/500x750?text=No+Image";
}

function detectQuality(name = "") {
  const n = name.toLowerCase();
  if (/2160|4k/.test(n)) return "4K";
  if (/1080/.test(n)) return "1080p";
  if (/720/.test(n)) return "720p";
  return "HD";
}

function detectAudio(name = "") {
  const n = name.toLowerCase();
  if (/deutsch|german/.test(n) && /eng/.test(n)) return "Deutsch • Englisch";
  if (/deutsch|german/.test(n)) return "Deutsch";
  if (/eng/.test(n)) return "Englisch";
  return "Deutsch • Englisch";
}

function detectSource(name = "") {
  const n = name.toLowerCase();
  if (n.includes("bluray")) return "BluRay";
  if (n.includes("web")) return "WEB-DL";
  return "-";
}

function stars(r) {
  const s = Math.round((r || 0) / 2);
  return "⭐".repeat(s) + "☆".repeat(5 - s) + ` (${(r || 0).toFixed(1)})`;
}

// ================= ELITE FEATURES =================

// 🔎 SEARCH (Multi)
async function searchMultiTMDB(query) {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&language=de-DE`
  );
  const data = await res.json();
  return data.results?.slice(0, 5) || [];
}

// 🎬 ÄHNLICHE FILME
async function getSimilar(id, type = "movie") {
  const url = type === "series" || type === "tv" ? "tv" : "movie";

  const res = await fetch(
    `https://api.themoviedb.org/3/${url}/${id}/similar?api_key=${TMDB_KEY}&language=de-DE`
  );

  const data = await res.json();
  return data.results?.slice(0, 5) || [];
}

// 📂 KATEGORIEN
async function getByGenre(genreId) {
  const res = await fetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=${genreId}&language=de-DE`
  );
  const data = await res.json();
  return data.results?.slice(0, 10) || [];
}

// ▶️ CONTINUE WATCHING
const HISTORY_FILE = "history.json";

function saveHistory(userId, filmId) {
  let h = {};

  if (fs.existsSync(HISTORY_FILE)) {
    h = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8") || "{}");
  }

  if (!h[userId]) h[userId] = [];

  h[userId].unshift(filmId);
  h[userId] = [...new Set(h[userId])].slice(0, 10);

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(h, null, 2));
}

// ================= CARD =================
function getFSK(data) {
  try {
    const releases = data.release_dates?.results || [];

    const findCert = (arr) =>
      arr?.release_dates?.find(x => x.certification)?.certification;

    // 🇩🇪 Deutschland
    const de = releases.find(r => r.iso_3166_1 === "DE");
    let cert = findCert(de);

    // 🇺🇸 Fallback
    if (!cert) {
      const us = releases.find(r => r.iso_3166_1 === "US");
      cert = findCert(us);

      // 👉 Mapping US → FSK
      if (cert === "G") cert = "0";
      if (cert === "PG") cert = "6";
      if (cert === "PG-13") cert = "12";
      if (cert === "R") cert = "16";
      if (cert === "NC-17") cert = "18";
    }

    return cert || "-";
  } catch {
    return "-";
  }
}

function generateTags(data) {
  const tags = new Set();

  // 🎬 Titel (2 Wörter max)
  const titleWords = (data.title || data.name || "")
    .replace(/[^\w\s]/gi, "")
    .split(" ")
    .filter(w => w.length > 2)
    .slice(0, 2);

  if (titleWords.length) {
    tags.add(`#${titleWords.join("")}`);
  }

  // 🎭 Genres
  (data.genres || []).slice(0, 2).forEach(g => {
    tags.add(`#${g.name.replace(/\s/g, "")}`);
  });

  // 👥 Actors (nur starke Namen)
  (data.credits?.cast || []).slice(0, 2).forEach(actor => {
    const name = actor.name.split(" ")[0];
    if (name.length > 3) tags.add(`#${name}`);
  });

  return [...tags].slice(0, 6).join(" ");
}

function genreEmoji(name) {
  const map = {
    Action: "🔥",
    Horror: "👻",
    Comedy: "😂",
    Drama: "🎭",
    Thriller: "🔪",
    Adventure: "🗺",
    "Science Fiction": "🚀",
    Crime: "🕵️",
    Animation: "🎨",
    Family: "👨‍👩‍👧‍👦",
    Romance: "❤️"
  };

  return map[name] || "🎬";
}

function buildCard(data, extra = {}, fileName = "", id = "0001") {
  const title = toBold((data.title || data.name || "").toUpperCase());
  const year = (data.release_date || data.first_air_date || "").slice(0, 4);

  const genres = (data.genres || [])
    .slice(0, 2)
    .map(g => `${genreEmoji(g.name)} ${g.name}`)
    .join(" • ");

  const cast =
    data.credits?.cast?.slice(0, 3).map(x => x.name).join(" • ") || "-";

  const director =
    data.credits?.crew?.find(x => x.job === "Director")?.name || "-";

  const runtime =
    data.runtime ||
    (Array.isArray(data.episode_run_time) && data.episode_run_time.length > 0
      ? data.episode_run_time[0]
      : "-");

  const fsk = getFSK(data);
  const tags = generateTags(data);
  const LINE_MAIN = "━━━━━━━━━━━━━━━━━━";
  const LINE_SOFT = "──────────────";

  let story = data.overview?.trim() || "Keine Beschreibung verfügbar.";

  if (story.length > 220) {
    story = story.slice(0, 220);
    const cut = story.lastIndexOf(".");
    if (cut > 100) story = story.slice(0, cut + 1);
    story += "...";
  }

  let text = `
${LINE_MAIN}
🎬 ${title} (${year})
${LINE_SOFT}
🎞 ${genres && genres.length ? genres : "-"}
🔥 ${detectQuality(fileName)} • 🎧 ${detectAudio(fileName)} • 💿 ${detectSource(fileName)}
${LINE_MAIN}
${stars(data.vote_average)}
⏱ ${runtime} Min • 🔞 FSK ${fsk}
🎥 ${director}
👥 ${cast}
${LINE_MAIN}
📖 STORY
${story || "-"}
${LINE_MAIN}
▶️ #${id}
${LINE_SOFT}
${tags}
@LibraryOfLegends
`.trim();

  // 🔥 TELEGRAM LIMIT FIX
  if (text.length > 1024) {
    text = text.slice(0, 1000) + "...";
  }

  return text;
}

// ================= PLAYER =================
function playerUrl(mode, id) {
  return `https://t.me/${BOT_USERNAME}?start=${mode}_${id}`;
}

// ================= START HANDLER =================
async function handleStart(msg, param) {
  // 🔥 SIM zuerst prüfen
  if (param.startsWith("sim_")) {
    const [, id, typeRaw] = param.split("_");
    const type = (typeRaw === "series" || typeRaw === "tv") ? "tv" : "movie";

    const list = await getSimilar(id, type);
    if (!list.length) {
      return tg("sendMessage", {
        chat_id: msg.chat.id,
        text: "❌ Keine Ergebnisse gefunden"
      });
    }

    const buttons = list.map(m => ([
      {
        text: `🎬 ${m.title || m.name}`,
        callback_data: `search_${m.id}_${type}`
      }
    ]));

    return tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "🎬 Ähnliche Filme:",
      reply_markup: { inline_keyboard: buttons }
    });
  }

  // 👉 danach normaler Flow
  const id = param.replace(/str_|dl_/, "");
  const db = CACHE;
  const item = db.find(x => x.display_id === id);

  if (!item) {
    return tg("sendMessage", {
      chat_id: msg.chat.id,
      text: "❌ Datei nicht gefunden"
    });
  }

  saveHistory(msg.chat.id, id);

  return tg("sendVideo", {
    chat_id: msg.chat.id,
    video: item.file_id,
    supports_streaming: true
  });
}

// ================= UPLOAD =================
async function handleUpload(msg) {
  const file = msg.document || msg.video;
  const fileName = file.file_name || msg.caption || "";

  if (!fileName) return;

  const parsed = parseFileName(fileName);

  let searchTitle = smartTitleSplit(
    cleanTitleAdvanced(parsed.title || fileName)
  );

  const result = await multiSearch(searchTitle, parsed.type);

  if (!result || !result.id) {
    return tg("sendMessage", {
      chat_id: msg.chat.id,
      text: `❌ Kein Match gefunden\n${searchTitle}`
    });
  }

  const details = await getDetails(result.id, parsed.type);

  const db = CACHE;

  // 🔥 ID GENERATION (FIXED)
  const lastId = db.length
    ? Math.max(...db.map(x => parseInt(x.display_id || "0", 10)))
    : 0;
  const nextId = String(lastId + 1).padStart(4, "0");

  const item = {
    display_id: nextId,
    file_id: file.file_id,
    tmdb_id: result.id
  };

  db.unshift(item);
  if (db.length > 500) db.length = 500;
  saveDB(db);

  let caption;

  try {
    caption = buildCard(details, parsed, fileName, item.display_id);
  } catch (e) {
    console.error("CARD ERROR:", e);
    caption = "❌ Fehler beim Erstellen der Karte";
  }

  const res = await tg("sendPhoto", {
    chat_id: CHANNEL_ID,
    photo: getCover(details),
    caption,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "▶️ Stream", url: playerUrl("str", item.display_id) },
          { text: "⬇️ Download", url: playerUrl("dl", item.display_id) }
        ],
        [
          { text: "🎬 Ähnliche", callback_data: `search_${item.tmdb_id}_${parsed.type}` }
        ]
      ]
    }
  });

  console.log("CHANNEL RESPONSE:", res);
  if (!res?.ok) {
    console.error("TELEGRAM ERROR:", res);
  }

  await tg("sendMessage", {
    chat_id: msg.chat.id,
    text: "✅ Upload verarbeitet"
  });
}

// ================= WEBHOOK =================
app.post(`/bot${TOKEN}`, async (req, res) => {
  res.sendStatus(200);

  const body = req.body;
  const msg = body.message || body.channel_post;

  try {
    // ================= CALLBACK =================
    if (body.callback_query) {
      const data = body.callback_query.data;
      const chatId = body.callback_query.message.chat.id;

      await tg("answerCallbackQuery", {
        callback_query_id: body.callback_query.id
      });

      // 🎬 ÄHNLICHE
      if (data.startsWith("sim_")) {
        const [, id, typeRaw] = data.split("_");
        const type = (typeRaw === "series" || typeRaw === "tv") ? "tv" : "movie";

        const list = await getSimilar(id, type);

        if (!list.length) {
          return tg("sendMessage", {
            chat_id: chatId,
            text: "❌ Keine Ergebnisse gefunden"
          });
        }

        const buttons = list.map(m => ([
          {
            text: `🎬 ${m.title || m.name}`,
            callback_data: `search_${m.id}_${type}`
          }
        ]));

        return tg("sendMessage", {
          chat_id: chatId,
          text: "🎬 Ähnliche Filme:",
          reply_markup: { inline_keyboard: buttons }
        });
      }

      // 🔎 SEARCH RESULT
      if (data.startsWith("search_")) {
        const [, id, typeRaw] = data.split("_");
        const type = (typeRaw === "series" || typeRaw === "tv") ? "tv" : "movie";

        const details = await getDetails(id, type);

        return tg("sendPhoto", {
          chat_id: chatId,
          photo: getCover(details),
          caption: buildCard(details),
          reply_markup: {
            inline_keyboard: [[
              { text: "🎬 Ähnliche", callback_data: `sim_${id}_${type}` }
            ]]
          }
        });
      }

      // 📂 KATEGORIEN
      if (data.startsWith("cat_")) {
        const genre = data.split("_")[1];
        const list = await getByGenre(genre);

        if (!list.length) {
          return tg("sendMessage", {
            chat_id: chatId,
            text: "❌ Keine Ergebnisse gefunden"
          });
        }

        const buttons = list.map(m => ([
          { text: `🎬 ${m.title}`, callback_data: `search_${m.id}_movie` }
        ]));

        return tg("sendMessage", {
          chat_id: chatId,
          text: "📂 Kategorie:",
          reply_markup: { inline_keyboard: buttons }
        });
      }

      // ▶️ CONTINUE
      if (data === "continue") {
        let h = {};
        if (fs.existsSync(HISTORY_FILE)) {
          h = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8") || "{}");
        }

        const last = Array.isArray(h[chatId]) ? h[chatId][0] : h[chatId];

        if (!last) {
          return tg("sendMessage", {
            chat_id: chatId,
            text: "❌ Kein Verlauf"
          });
        }

        return handleStart({ chat: { id: chatId } }, `str_${last}`);
      }

      return;
    }

    if (!msg) return;
    if (msg.from?.is_bot) return;

    // ================= START PARAM =================
    if (msg.text?.startsWith("/start ")) {
      const param = msg.text.split(" ")[1];
      if (param) return handleStart(msg, param);
    }

    // ================= SEARCH =================
    if (msg.text && !msg.text.startsWith("/")) {
      const results = await searchMultiTMDB(msg.text);

      if (!results.length) {
        return tg("sendMessage", {
          chat_id: msg.chat.id,
          text: "❌ Nichts gefunden"
        });
      }

      const buttons = results
        .filter(r => ["movie", "tv"].includes(r.media_type))
        .map(r => ([
          {
            text: `🎬 ${r.title || r.name || "Unbekannt"}`,
            callback_data: `search_${r.id}_${r.media_type}`
          }
        ]));

      return tg("sendMessage", {
        chat_id: msg.chat.id,
        text: `🔎 Ergebnisse für: "${msg.text}"`,
        reply_markup: { inline_keyboard: buttons }
      });
    }

    // ================= START =================
    if (msg.text === "/start") {
      return tg("sendMessage", {
        chat_id: msg.chat.id,
        text: "🔥 ULTRA SYSTEM",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔥 Action", callback_data: "cat_28" }],
            [{ text: "👻 Horror", callback_data: "cat_27" }],
            [{ text: "😂 Comedy", callback_data: "cat_35" }],
            [{ text: "▶️ Weiter schauen", callback_data: "continue" }]
          ]
        }
      });
    }

    // ================= UPLOAD =================
    if (msg.document || msg.video) {
      await handleUpload(msg);
    }

    } catch (err) {
    console.error("❌ Fehler:", err);
  }
});

// ================= START =================
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 ULTRA FINAL SYSTEM RUNNING");
});