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
const HISTORY_FILE = "history.json";
const SERIES_DB_FILE = "series.json";

const USER_STATE = {};

// ================= DB =================
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8") || "[]");
  } catch {
    return [];
  }
}

let CACHE = loadDB();

function saveDB(data) {
  CACHE = data;
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ================= SERIES =================
function loadSeriesDB() {
  if (!fs.existsSync(SERIES_DB_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(SERIES_DB_FILE, "utf8") || "{}");
  } catch {
    return {};
  }
}

let SERIES_DB = loadSeriesDB();

function saveSeriesDB(data) {
  SERIES_DB = data;
  fs.writeFileSync(SERIES_DB_FILE, JSON.stringify(data, null, 2));
}

// ================= HISTORY =================
function saveHistory(userId, entry) {
  let h = {};
  if (fs.existsSync(HISTORY_FILE)) {
    try { h = JSON.parse(fs.readFileSync(HISTORY_FILE)); } catch {}
  }

  if (!h[userId]) h[userId] = [];

  h[userId] = [entry, ...h[userId].filter(x => x.id !== entry.id)].slice(0, 15);

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(h, null, 2));
}

function readHistory(userId) {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  return JSON.parse(fs.readFileSync(HISTORY_FILE))[userId] || [];
}

// ================= TELEGRAM =================
async function tg(method, body) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch {
    return { ok: false };
  }
}

// ================= HELPERS =================

// 🎬 NETFLIX BANNER (MIT BADGES IM BILD)
function getNetflixBannerWithBadges(data){

  const title = encodeURIComponent((data.title || data.name || "").toUpperCase());

  const rating = data.vote_average || 0;
  const votes = data.vote_count || 0;
  const popularity = data.popularity || 0;

  let badges = [];

  if(popularity > 100) badges.push("🔥 TRENDING");
  if(rating > 8) badges.push("👑 TOP RATED");
  if(votes > 1000) badges.push("🔥 BELIEBT");

  const badgeText = encodeURIComponent(badges.join(" • "));

  return `https://dummyimage.com/1280x720/000/fff&text=${badgeText}%0A%0A${title}`;
}


// 🎬 NETFLIX TEXT OVERLAY (CAPTION)
function buildNetflixBanner(data){

  const title = (data.title || data.name || "").toUpperCase();
  const year = (data.release_date || data.first_air_date || "").slice(0,4);

  const rating = data.vote_average
    ? `⭐ ${data.vote_average.toFixed(1)}`
    : "";

  let badges = [];

  if(data.popularity > 100) badges.push("🔥 TRENDING");
  if(data.vote_average > 8) badges.push("👑 TOP RATED");
  if(data.vote_count > 1000) badges.push("🔥 BELIEBT");

  const badge = badges.join(" • ");

  return `${badge}\n🎬 ${title} ${year}\n${rating}`;
}


// ================= GENRE SYSTEM =================

const GENRE_MAP = {
  28:"🔥 Action",
  35:"😂 Comedy",
  27:"👻 Horror",
  18:"🎭 Drama",
  878:"🚀 Sci-Fi",
  53:"🔪 Thriller"
};

function getAvailableGenres(){
  const found = new Set();

  for(const item of CACHE){
    (item.genres || []).forEach(g => found.add(g));
  }

  return Array.from(found);
}


// ================= MEDIA HELPERS =================

function getCover(data = {}) {
  if (data?.poster_path) {
    return `https://image.tmdb.org/t/p/w500${data.poster_path}`;
  }

  if (data?.backdrop_path) {
    return `https://image.tmdb.org/t/p/w500${data.backdrop_path}`;
  }

  return "https://dummyimage.com/500x750/000/fff&text=No+Image";
}

function getBanner(data = {}) {

  if(data?.backdrop_path){
    return `https://image.tmdb.org/t/p/original${data.backdrop_path}`;
  }

  if(data?.poster_path){
    return `https://image.tmdb.org/t/p/w780${data.poster_path}`;
  }

  return "https://dummyimage.com/1280x720/000/fff&text=Library+of+Legends";
}

function buildStyledCover(title){
  return `https://dummyimage.com/500x750/000/fff&text=${encodeURIComponent(title)}`;
}


// ================= CHANNEL ROUTING =================

const CHANNELS = {
  default: CHANNEL_ID,
  28: process.env.CHANNEL_ACTION,
  27: process.env.CHANNEL_HORROR,
  35: process.env.CHANNEL_COMEDY
};

function getTargetChannel(genres=[]){
  for(const g of genres){
    if(CHANNELS[g]) return CHANNELS[g];
  }
  return CHANNELS.default;
}


// ================= LOCAL FILTER =================

function getLocalByGenre(genreId){
  return CACHE.filter(x => x.genres?.includes(parseInt(genreId)));
}


// ================= FILE PARSER =================

function parseFileName(name = "") {
  const clean = name.replace(/[._\-]+/g, " ");
  const match = clean.match(/S(\d{1,2})E(\d{1,2})/i);

  if (match) {
    return {
      type: "tv",
      title: clean.replace(match[0], "").trim(),
      season: parseInt(match[1]),
      episode: parseInt(match[2])
    };
  }

  return { type: "movie", title: clean };
}

function cleanTitleAdvanced(name = "") {
  return name
    .replace(/\.(mp4|mkv|avi)$/i, "")
    .replace(/\b(1080p|720p|2160p|4k|uhd)\b/gi, "")
    .replace(/\b(x264|x265|h264|h265)\b/gi, "")
    .replace(/\b(bluray|web|webrip|webdl)\b/gi, "")
    .replace(/\b(german|deutsch|dual|dl)\b/gi, "")
    .replace(/S\d{1,2}E\d{1,2}/gi, "")
    .replace(/[._\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


// ================= META DETECTION =================

function detectQuality(n=""){
  return /4k|2160/i.test(n) ? "4K"
       : /1080/.test(n) ? "1080p"
       : /720/.test(n) ? "720p"
       : "HD";
}

function detectAudio(n=""){
  return /deutsch|german/i.test(n) ? "Deutsch" : "EN";
}

function detectSource(n=""){
  return /bluray/i.test(n) ? "BluRay"
       : /web/i.test(n) ? "WEB"
       : "-";
}

// ================= EXTRA HELPERS =================

// 🎬 DYNAMISCHE GENRE BUTTONS (AUS DEINER DB)
function buildGenreButtons(){

  const genres = getAvailableGenres();

  if(!genres.length){
    return [[{ text:"❌ Keine Genres", callback_data:"noop" }]];
  }

  return genres.map(id => ([
    {
      text: GENRE_MAP[id] || `🎬 Genre ${id}`,
      callback_data:`genre_local_${id}`
    }
  ]));
}


// 🎬 SWIPE NAVIGATION (NETFLIX STYLE)
function buildSwipeNav(id,type){

  return {
    inline_keyboard:[

      [
        {text:"⬅️",callback_data:`prev_${id}_${type}`},
        {text:"▶️ Stream",callback_data:`play_${id}`},
        {text:"➡️",callback_data:`next_${id}_${type}`}
      ],

      [
        {text:"🔥 Ähnliche",callback_data:`sim_${id}_${type}`}
      ],

      [
        {text:"🏠 Menü",callback_data:"menu"}
      ]
    ]
  };
}


// 🎬 VIDEO PLAYER (MIT HISTORY SAVE + SAFE CHECK)
async function sendFileById(chatId,item){

  if(!item){
    return tg("sendMessage",{
      chat_id:chatId,
      text:"❌ Datei nicht gefunden"
    });
  }

  // 🧠 Verlauf speichern
  saveHistory(chatId,{
    id:item.display_id,
    type:item.media_type || "movie"
  });

  return tg("sendVideo",{
    chat_id:chatId,
    video:item.file_id,
    supports_streaming:true
  });
}

// ================= CARD =================
function buildCard(data, fileName="", id="0001"){

  const title = (data.title || data.name || "UNBEKANNT").toUpperCase();
  const year = (data.release_date || data.first_air_date || "").slice(0,4);

  // 🎭 GENRES
  const genres = (data.genres || [])
    .slice(0,2)
    .map(g => g.name)
    .join(" • ") || "-";

  // 👥 CAST
  const cast = (data.credits?.cast || [])
    .slice(0,3)
    .map(c => c.name)
    .join(" • ") || "-";

  // ⭐ RATING
  const rating = data.vote_average
    ? `⭐ ${Math.round(data.vote_average / 2)} / 5  (${data.vote_average.toFixed(1)})`
    : "⭐ -";

  // 🔥 BADGES (NEU)
  let badges = [];

  if(data.popularity > 100) badges.push("🔥 TRENDING");
  if(data.vote_average > 8) badges.push("👑 TOP RATED");
  if(data.vote_count > 1000) badges.push("💥 BELIEBT");

  const badgeLine = badges.length ? badges.join(" • ") : null;

  // 🔞 FSK
  let fsk = "-";
  try{
    const rel = data.release_dates?.results || [];
    const de = rel.find(r => r.iso_3166_1 === "DE");
    const cert = de?.release_dates?.find(x => x.certification)?.certification;
    if(cert) fsk = cert;
  }catch{}

  // 📖 STORY (SMART CUT)
  const storyRaw = data.overview || "Keine Beschreibung verfügbar.";
  let story = storyRaw.trim();

  if (story.length > 220) {
    story = story.slice(0, 220);
    const cut = story.lastIndexOf(".");
    if (cut > 100) story = story.slice(0, cut + 1);
    story += "...";
  }

  // 🎬 META
  const quality = detectQuality(fileName);
  const audio = detectAudio(fileName);
  const source = detectSource(fileName);

  // 🏷 TAGS
  const tags = (data.genres || [])
    .slice(0,3)
    .map(g => `#${g.name.replace(/\s/g,"")}`)
    .join(" ");

  // 🎨 DESIGN
  const LINE = "━━━━━━━━━━━━━━━━━━";
  const SOFT = "──────────────";

  return `${LINE}
🎬 𝐋𝐈𝐁𝐑𝐀𝐑𝐘 𝐎𝐅 𝐋𝐄𝐆𝐄𝐍𝐃𝐒

${title}${year ? ` (${year})` : ""}

${badgeLine ? badgeLine + "\n" : ""}${SOFT}

🎞 ${quality} • ${genres}
🔊 ${audio} • 💿 ${source}

${LINE}
${rating}
⛔ FSK ${fsk}
👥 ${cast}

${LINE}
📖 HANDLUNG
${story}

${LINE}
▶️ ID: ${id}

${SOFT}
${tags}
@LibraryOfLegends`;
}


// ================= PLAYER URL =================
function playerUrl(mode,id){
  return `https://t.me/${BOT_USERNAME}?start=${mode}_${id}`;
}

// ================= TMDB =================

// 🔥 CORE FETCH (MIT STATUS CHECK)
async function tmdbFetch(url){
  try{
    const res = await fetch(url);

    if(!res.ok){
      console.log("❌ TMDB ERROR:", res.status, url);
      return null;
    }

    return await res.json();

  }catch(err){
    console.log("❌ TMDB FETCH FAIL:", err.message);
    return null;
  }
}


// 🔎 SMART SEARCH (MIT PRIORITY + FALLBACKS)
async function searchTMDB(title){

  if(!title) return null;

  const variants = [
    title,
    title.split(" ").slice(0,3).join(" "),
    title.split(" ").slice(0,2).join(" "),
    title.split(" ")[0]
  ].filter(x => x && x.length > 2);

  for(const q of variants){

    const data = await tmdbFetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&language=de-DE`
    );

    if(data?.results?.length){

      // 🧠 BEST MATCH (KEIN RANDOM ERSTER TREFFER)
      const best = data.results.find(x => x.media_type === "movie")
                || data.results.find(x => x.media_type === "tv")
                || data.results[0];

      return best;
    }
  }

  console.log("❌ TMDB NO MATCH:", title);
  return null;
}


// 🎬 DETAILS (MIT FALLBACK TYPE)
async function getDetails(id,type){

  if(!id) return null;

  const safeType = type === "tv" ? "tv" : "movie";

  return await tmdbFetch(
    `https://api.themoviedb.org/3/${safeType}/${id}?api_key=${TMDB_KEY}&append_to_response=credits,release_dates&language=de-DE`
  );
}


// 🔥 TRENDING
async function getTrending(){
  const data = await tmdbFetch(
    `https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_KEY}`
  );

  return data?.results?.slice(0,10) || [];
}


// 📈 POPULAR MOVIES
async function getPopular(){
  const data = await tmdbFetch(
    `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=de-DE`
  );

  return data?.results?.slice(0,10) || [];
}


// 🎭 GENRE DISCOVERY
async function getByGenre(genreId){

  if(!genreId) return [];

  const data = await tmdbFetch(
    `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=${genreId}&language=de-DE`
  );

  return data?.results?.slice(0,10) || [];
}


// 🔤 SORT A-Z (SAFE)
function sortAZ(list){

  if(!Array.isArray(list)) return [];

  return list.sort((a,b)=>{

    const A = (a.title || a.name || "").toLowerCase();
    const B = (b.title || b.name || "").toLowerCase();

    return A.localeCompare(B);
  });
}

// ================= NETFLIX SYSTEM =================


// 🎬 LOKALE REIHEN (AUS DEINER DB)
function buildLocalRows(){

  const genres = getAvailableGenres();
  const rows = [];

  for(const genreId of genres){

    const list = getLocalByGenre(genreId);

    // 🔥 nur anzeigen wenn sinnvoll
    if(!list || list.length < 2) continue;

    rows.push({
      title: GENRE_MAP[genreId] || `🎬 Genre ${genreId}`,
      data: list.slice(0, 10) // max 10 für Performance
    });
  }

  return rows;
}


// 🎬 NETFLIX HOME SCREEN
async function showNetflixHome(chatId){

  try{

    // ================= HERO =================
    const trending = await getTrending();

    if(!trending || !trending.length){
      return tg("sendMessage",{
        chat_id:chatId,
        text:"❌ Keine Inhalte verfügbar"
      });
    }

    const first = trending[0];

    const type = first.media_type === "tv" ? "tv" : "movie";

    const details = await getDetails(first.id, type) || first;

    const banner = getNetflixBannerWithBadges(details);

    // 🎬 BIG NETFLIX HERO
    await tg("sendPhoto",{
      chat_id:chatId,
      photo:banner,
      caption: buildNetflixBanner(details),
      reply_markup:{
        inline_keyboard:[

          [
            {text:"▶️ Play",callback_data:`play_${first.id}`},
            {text:"➕ Merken",callback_data:`fav_${first.id}`}
          ],

          [
            {text:"🔥 Ähnliche",callback_data:`sim_${first.id}_${type}`}
          ],

          [
            {text:"🏠 Menü",callback_data:"menu"}
          ]
        ]
      }
    });


    // ================= TMDB REIHEN =================
    const rows = await buildHomeRows();

    if(rows && rows.length){
      for(const row of rows){
        if(row?.data?.length){
          await sendResultsList(chatId,row.title,row.data,0);
        }
      }
    }


    // ================= DEINE FILME =================
    const localRows = buildLocalRows();

    if(localRows.length){

      for(const row of localRows){
        await sendResultsList(chatId,row.title,row.data,0);
      }

    }else{

      await tg("sendMessage",{
        chat_id:chatId,
        text:"📂 Noch keine eigenen Filme einsortiert"
      });

    }


    // ================= FOOTER =================
    return tg("sendMessage",{
      chat_id:chatId,
      text:"🏠 Home",
      reply_markup:{
        inline_keyboard:[
          [
            {text:"🔄 Refresh",callback_data:"home"},
            {text:"🎬 Menü",callback_data:"menu"}
          ]
        ]
      }
    });

  }catch(err){

    console.log("❌ NETFLIX HOME ERROR:", err.message);

    return tg("sendMessage",{
      chat_id:chatId,
      text:"❌ Fehler beim Laden der Startseite"
    });
  }
}

// ================= UI =================

// 🎬 HAUPTMENÜ
function showMenu(chatId){

  return tg("sendMessage",{
    chat_id:chatId,
    text:`🎬 𝐋𝐈𝐁𝐑𝐀𝐑𝐘 𝐎𝐅 𝐋𝐄𝐆𝐄𝐍𝐃𝐒

Wähle deinen Bereich 👇`,
    reply_markup:{
      inline_keyboard:[

        [
          {text:"🏠 Home",callback_data:"home"},
          {text:"🔥 Trending",callback_data:"net_trending"}
        ],

        [
          {text:"📈 Popular",callback_data:"net_popular"}
        ],

        [
          {text:"🎬 Filme",callback_data:"browse_movies"},
          {text:"📺 Serien",callback_data:"browse_series"}
        ],

        // 🔥 DYNAMISCHE GENRES
        ...buildGenreButtons(),

        [
          {text:"▶️ Weiter schauen",callback_data:"continue"}
        ]
      ]
    }
  });
}


// 🎬 LISTEN VIEW (NETFLIX STYLE)
async function sendResultsList(chatId, heading, list, page = 0){

  if(!list || !list.length){
    return tg("sendMessage",{
      chat_id:chatId,
      text:"❌ Keine Ergebnisse"
    });
  }

  const perPage = 4;
  const totalPages = Math.ceil(list.length / perPage);

  const start = page * perPage;
  const slice = list.slice(start, start + perPage);

  // 🧠 STATE SPEICHERN (für Swipe etc.)
  USER_STATE[chatId] = {
    list,
    heading,
    page
  };

  // 🎬 ITEMS RENDERN
  for(const m of slice){

    const title = m.title || m.name || "Unbekannt";
    const type = m.media_type || "movie";

    await tg("sendPhoto",{
      chat_id:chatId,
      photo:getCover(m),
      caption:`🎬 ${title}`,
      reply_markup:{
        inline_keyboard:[

          [
            {text:"▶️ Öffnen",callback_data:`search_${m.id}_${type}`}
          ],

          [
            {text:"🔥 Ähnliche",callback_data:`sim_${m.id}_${type}`}
          ]
        ]
      }
    });
  }

  // ================= NAVIGATION =================

  const nav = [];

  if(page > 0){
    nav.push({
      text:"⬅️ Zurück",
      callback_data:`page_${page-1}`
    });
  }

  if(page < totalPages - 1){
    nav.push({
      text:"➡️ Weiter",
      callback_data:`page_${page+1}`
    });
  }

  return tg("sendMessage",{
    chat_id:chatId,
    text:`📄 ${heading}\nSeite ${page+1} / ${totalPages}`,
    reply_markup:{
      inline_keyboard:[

        ...(nav.length ? [nav] : []),

        [
          {text:"🏠 Menü",callback_data:"menu"},
          {text:"🔄 Refresh",callback_data:`page_${page}`}
        ]
      ]
    }
  });
}

// ================= UPLOAD =================
async function handleUpload(msg){

  const file = msg.document || msg.video;
  if(!file) return;

  const fileName = file.file_name || "";

  const parsed = parseFileName(fileName);
  const clean = cleanTitleAdvanced(parsed.title);

  let result = await searchTMDB(clean);

  if(!result){
    const short = clean.split(" ").slice(0,2).join(" ");
    result = await searchTMDB(short);
  }

  let details = null;

  if(result?.id){
    const type = result.media_type === "tv" ? "tv" : "movie";
    details = await getDetails(result.id, type);
  }

  const safeData = details || result || {};

  let genreIds = [];

  if(result?.genre_ids){
    genreIds = result.genre_ids;
  }else if(details?.genres){
    genreIds = details.genres.map(g => g.id);
  }

  const id = Date.now().toString();

  if(parsed.type === "tv"){
    const key = parsed.title.toLowerCase().replace(/\s/g,"_");

    if(!SERIES_DB[key]) SERIES_DB[key] = {};
    if(!SERIES_DB[key][parsed.season]) SERIES_DB[key][parsed.season] = {};

    SERIES_DB[key][parsed.season][parsed.episode] = {
      file_id:file.file_id,
      display_id:id
    };

    saveSeriesDB(SERIES_DB);
  }

  const item = {
    display_id:id,
    file_id:file.file_id,
    media_type: result?.media_type || "movie",
    genres: genreIds
  };

  CACHE.unshift(item);
  saveDB(CACHE);

  // ================= COVER FIX =================
  let cover = getCover(safeData);

  if(!safeData || (!details && !result)){
    cover = buildStyledCover(parsed.title);
  }

  try{
    if(!cover || cover.includes("null")){
      throw new Error("Invalid cover");
    }

    const res = await fetch(cover);
    if(!res.ok){
      throw new Error("Cover fetch failed");
    }

  }catch{
    cover = "https://dummyimage.com/500x750/000/fff&text=No+Image";
  }

  if(!details && result){
    details = result;
  }

  const targetChannel = getTargetChannel(genreIds);
  const caption = buildCard(safeData, fileName, id);

  try{
    await tg("sendPhoto",{
      chat_id: targetChannel,
      photo: cover,
      caption: caption,
      reply_markup:{
        inline_keyboard:[
          [{text:"▶️ Stream", url: playerUrl("play", id)}]
        ]
      }
    });

  }catch(err){
    await tg("sendMessage",{
      chat_id: targetChannel,
      text: caption
    });
  }

  return tg("sendMessage",{
    chat_id: msg.chat.id,
    text: "✅ Upload verarbeitet & gepostet"
  });
}

// ================= WEBHOOK =================
app.post(`/bot${TOKEN}`, async (req, res) => {
  res.sendStatus(200);

  const body = req.body;
  const msg = body.message;

  try {

    // ================= CALLBACK =================
    if (body.callback_query) {

      const data = body.callback_query.data;
      const chatId = body.callback_query.message.chat.id;

      await tg("answerCallbackQuery", {
        callback_query_id: body.callback_query.id
      });

      if (data === "home") {
        return showNetflixHome(chatId);
      }

      if (data === "net_trending") {
        return sendResultsList(chatId, "🔥 Trending", await getTrending(), 0);
      }

      if (data === "net_popular") {
        return sendResultsList(chatId, "📈 Popular", await getPopular(), 0);
      }

      if (data === "browse_movies") {
        return sendResultsList(chatId, "🎬 Filme", await getPopular(), 0);
      }

      if (data === "browse_series") {
        const keys = Object.keys(SERIES_DB);

        if (!keys.length) {
          return tg("sendMessage",{ chat_id: chatId, text: "❌ Keine Serien vorhanden" });
        }

        const buttons = keys.map(k => ([{
          text: `📺 ${k.replace(/_/g, " ")}`,
          callback_data: `tv_${k}`
        }]));

        buttons.push([{ text: "🏠 Menü", callback_data: "menu" }]);

        return tg("sendMessage",{
          chat_id: chatId,
          text: "📺 Serien",
          reply_markup:{ inline_keyboard: buttons }
        });
      }

      if (data === "menu") {
        return showMenu(chatId);
      }

      if (data === "continue") {
        const history = readHistory(chatId);

        if (!history.length) {
          return tg("sendMessage",{ chat_id: chatId, text: "❌ Kein Verlauf vorhanden" });
        }

        const last = history[0];

        return tg("sendMessage",{
          chat_id: chatId,
          text: "▶️ Weiter schauen",
          reply_markup:{
            inline_keyboard:[
              [{ text: "🎬 Öffnen", callback_data: `play_${last.id}` }],
              [{ text: "🏠 Menü", callback_data: "menu" }]
            ]
          }
        });
      }

      if (data.startsWith("genre_") && !data.startsWith("genre_local_")) {
        const genre = data.split("_")[1];
        return sendResultsList(chatId, "📂 Kategorie", await getByGenre(genre), 0);
      }

      if (data.startsWith("genre_local_")) {
        const genre = data.split("_")[2];
        return sendResultsList(chatId, "📂 Deine Filme", getLocalByGenre(genre), 0);
      }

      if (data === "movies_az") {
        return sendResultsList(chatId, "🔤 A–Z", sortAZ(await getPopular()), 0);
      }

      if (data.startsWith("page_")) {
        const page = parseInt(data.split("_")[1]);
        const state = USER_STATE[chatId];
        if (!state) return;
        return sendResultsList(chatId, state.heading, state.list, page);
      }

      if (data.startsWith("sim_")) {
        const [, id, type] = data.split("_");

        const res = await tmdbFetch(
          `https://api.themoviedb.org/3/${type}/${id}/similar?api_key=${TMDB_KEY}`
        );

        return sendResultsList(chatId, "🔥 Ähnliche", res?.results || [], 0);
      }

      if (data.startsWith("next_") || data.startsWith("prev_")) {
        const [dir, id, type] = data.split("_");
        const state = USER_STATE[chatId];
        if (!state) return;

        const list = state.list;
        const index = list.findIndex(x => String(x.id) === id);
        if (index === -1) return;

        const newIndex = dir === "next" ? index + 1 : index - 1;
        if (!list[newIndex]) return;

        const item = list[newIndex];
        const details = await getDetails(item.id, type);
        const safeData = details || item || {};

        return tg("sendPhoto",{
          chat_id: chatId,
          photo: getCover(safeData),
          caption: buildCard(safeData, "", item.id),
          reply_markup: buildSwipeNav(item.id, type)
        });
      }

      if (data.startsWith("search_")) {
        const [, id, type] = data.split("_");
        const details = await getDetails(id, type);
        const safeData = details || {};

        return tg("sendPhoto",{
          chat_id: chatId,
          photo: getBanner(safeData),
          caption: buildNetflixBanner(safeData),
          reply_markup: buildSwipeNav(id, type)
        });
      }

      if (data.startsWith("play_")) {
        const id = data.replace("play_", "");
        const item = CACHE.find(x => x.display_id === id);
        return sendFileById(chatId, item);
      }

      return;
    }

    if (msg?.text === "/start") {
      return showMenu(msg.chat.id);
    }

    if (msg?.document || msg?.video) {
      return handleUpload(msg);
    }

  } catch (e) {
    console.error("❌ WEBHOOK ERROR:", e.message, e.stack);
  }
});

// ================= SERVER =================
app.listen(process.env.PORT || 3000, () => {
  console.log("🔥 FULL FINAL SYSTEM RUNNING");
});