const fetch = global.fetch || require("node-fetch");
const express = require("express");
const fs = require("fs");

let cloudinary;

try {
  cloudinary = require("cloudinary").v2;

  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET
  });

} catch (err) {
  console.log("⚠️ Cloudinary nicht installiert → Fallback aktiv");
}

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

async function uploadToCloudinary(url){
  if(!cloudinary) return url;

  try{
    const res = await cloudinary.uploader.upload(url,{
      folder:"library_of_legends"
    });
    return res.secure_url;
  }catch{
    return url;
  }
}

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

  const t = encodeURIComponent(title.toUpperCase());

  return `https://image.pollinations.ai/prompt/${t}%20movie%20poster%20cinematic%20dark%20background%20glow%20high%20contrast`;
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
        {text:"🎬 DETAILS",callback_data:`search_${id}_${type}`},
        {text:"➡️",callback_data:`next_${id}_${type}`}
      ],

      [
        {text:"▶️ SOFORT STARTEN",callback_data:`play_${id}`}
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
  type:item.media_type || "movie",
  title:item.title || "",
  timestamp:Date.now()
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

  // 🎬 COLLECTION (optional erkennen)
  let collection = "";
  if(data.belongs_to_collection?.name){
    collection = data.belongs_to_collection.name.toUpperCase();
  }

  // 🎭 GENRES
  const genresArr = (data.genres || []).slice(0,2);
  const genres = genresArr.map(g => g.name).join(" • ") || "-";

  // 🎧 AUDIO
  const audio = /deutsch|german/i.test(fileName)
    ? "Deutsch • Englisch"
    : "Englisch";

  // 💿 SOURCE
  const source = /bluray/i.test(fileName)
    ? "BluRay"
    : /web/i.test(fileName)
    ? "WEB"
    : "-";

  // 🎞 QUALITÄT
  const quality =
    /2160|4k/i.test(fileName) ? "4K" :
    /1080/.test(fileName) ? "Full HD" :
    /720/.test(fileName) ? "HD" :
    "SD";

  // ⭐ RATING
  const ratingValue = data.vote_average || 0;
  const stars = "★".repeat(Math.round(ratingValue / 2)) +
                "☆".repeat(5 - Math.round(ratingValue / 2));

  const rating = `${stars} (${ratingValue.toFixed(1)})`;

  // ⏱ LAUFZEIT
  const runtime = data.runtime ? `${data.runtime} Min` : "-";

  // 🔞 FSK
  let fsk = "-";
  try{
    const rel = data.release_dates?.results || [];
    const de = rel.find(r => r.iso_3166_1 === "DE");
    const cert = de?.release_dates?.find(x => x.certification)?.certification;
    if(cert) fsk = cert;
  }catch{}

  // 🎥 DIRECTOR
  const director = (data.credits?.crew || [])
    .find(c => c.job === "Director")?.name || "-";

  // 👥 CAST
  const cast = (data.credits?.cast || [])
    .slice(0,3)
    .map(c => c.name)
    .join(" • ") || "-";

  // 📖 STORY (SMART CUT + 2 Absätze)
  let story = (data.overview || "Keine Beschreibung verfügbar.").trim();

  if(story.length > 180){
    const mid = Math.floor(story.length / 2);
    const split = story.indexOf(".", mid);

    if(split !== -1){
      story = story.slice(0, split + 1) + "\n\n" + story.slice(split + 1);
    }
  }

  if(story.length > 320){
    story = story.slice(0, 320) + "...";
  }

  // 🏷 TAGS
  const tags = genresArr
    .map(g => `#${g.name.replace(/\s/g,"")}`)
    .join(" ");

  const line = "━━━━━━━━━━━━━━━━━━━━━";

  return `${line}
🎬 𝐅𝐀𝐒𝐓 & 𝐅𝐔𝐑𝐈𝐎𝐔𝐒 𝟏𝟎 (${year})
${collection ? `🎞 ${collection}\n` : ""}${line}
🔥 ${quality} • ${genres}  
🎧 ${audio}  
💿 ${source}  
${line}
${rating}
⏱ ${runtime} • 🔞 FSK ${fsk}  
🎥 ${director}  
👥 ${cast}  
${line}
📖 STORY  
${story}
${line}
▶️ #${id}  
${line}
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

  const data = await tmdbFetch(
    `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=de-DE`
  );

  if(!data?.results?.length) return null;

  const clean = title.toLowerCase();

  // 🔥 BEST MATCH LOGIC
  const scored = data.results.map(item => {

    const name = (item.title || item.name || "").toLowerCase();

    let score = 0;

    // 🎯 exakter Titel Match
    if(name === clean) score += 100;

    // 🎯 enthält Titel
    if(name.includes(clean)) score += 50;

    // 🎯 ähnlich (Teilmatch)
    const words = clean.split(" ");
    const hits = words.filter(w => name.includes(w)).length;
    score += hits * 10;

    // 🎯 Popularität als Bonus
    score += item.popularity || 0;

    return { item, score };
  });

  // 🔥 BESTEN TREFFER NEHMEN
  scored.sort((a,b)=>b.score - a.score);

  return scored[0].item;
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

async function buildHomeRows(){

  return [
    {
      title:"🔥 Trending",
      data: await getTrending()
    },
    {
      title:"📈 Popular",
      data: await getPopular()
    }
  ];
}

function getSmartRecommendations(current, limit = 10){

  if(!current?.genres) return [];

  const genreIds = current.genres.map(g => g.id || g);

  const localMatches = CACHE.filter(x =>
    x.genres?.some(g => genreIds.includes(g))
  );

  return localMatches.slice(0, limit);
}


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
          await sendPosterRow(chatId,row.title,row.data);
        }
      }
    }


    // ================= DEINE FILME =================
    const localRows = buildLocalRows();

    if(localRows.length){

      for(const row of localRows){
        await sendPosterRow(chatId,row.title,row.data);
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
  
  // ================= POSTER ROW (NETFLIX STYLE) =================
async function sendPosterRow(chatId, heading, list){

  if(!list || !list.length) return;

  // Titel der Reihe
  await tg("sendMessage",{
    chat_id: chatId,
    text: `🎬 ${heading}`
  });

  const slice = list.slice(0,5); // max 5 pro Reihe

  for(const item of slice){

    const title = item.title || item.name || "Film";
    const type = item.media_type || "movie";

    await tg("sendPhoto",{
      chat_id: chatId,
      photo: getCover(item), // 🔥 größer als Poster

      caption: `🎬 ${title}`,

      reply_markup:{
        inline_keyboard:[
          [
            { text:"▶️", callback_data:`search_${item.id}_${type}` }
          ]
        ]
      }
    });
  }
}

  // 🧠 STATE SPEICHERN (für Swipe etc.)
  USER_STATE[chatId] = {
    list,
    heading,
    page
  };

  // 🎬 ITEMS RENDERN
  const buttons = [];

for (let i = 0; i < slice.length; i += 2) {

  const row = [];

  const a = slice[i];
  const b = slice[i + 1];

  if (a) {
    row.push({
      text: `🎬 ${a.title || a.name}`,
      callback_data: `search_${a.id}_${a.media_type || "movie"}`
    });
  }

  if (b) {
    row.push({
      text: `🎬 ${b.title || b.name}`,
      callback_data: `search_${b.id}_${b.media_type || "movie"}`
    });
  }

  buttons.push(row);
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
  text:`📂 ${heading}`,
  reply_markup:{
    inline_keyboard:[
      ...buttons,
      [
        {text:"⬅️",callback_data:`page_${page-1}`},
        {text:"➡️",callback_data:`page_${page+1}`}
      ],
      [
        {text:"🏠 Menü",callback_data:"menu"}
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
const clean = parsed.title;

let result = await searchTMDB(clean);

// TYPE FILTER
if(result){
  if(parsed.type === "tv" && result.media_type !== "tv") result = null;
  if(parsed.type === "movie" && result.media_type !== "movie") result = null;
}

// YEAR MATCH
const yearMatch = fileName.match(/(19|20)\d{2}/);
const fileYear = yearMatch ? parseInt(yearMatch[0]) : null;

if(result && fileYear){
  const foundYear = parseInt(
    (result.release_date || result.first_air_date || "").slice(0,4)
  );

  if(foundYear && Math.abs(foundYear - fileYear) > 2){
    result = null;
  }
}

// FALLBACK
if(!result){
  const short = clean.split(" ").slice(0,2).join(" ");
  result = await searchTMDB(short);
}

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
  cover = await uploadToCloudinary(cover);

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
    text:`▶️ Weiter schauen\n\n🎬 ${last.title || "Film"}`,
    reply_markup:{
      inline_keyboard:[
        [{ text: "▶️ Fortsetzen", callback_data: `play_${last.id}` }],
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

  const details = await getDetails(id, type);
  const safeData = details || {};

  const smart = getSmartRecommendations(safeData);

  if(smart.length){
    return sendResultsList(chatId, "🔥 Für dich", smart, 0);
  }

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

  if(!item){
    return tg("sendMessage",{ chat_id:chatId, text:"❌ Nicht gefunden" });
  }

  await tg("sendMessage",{
    chat_id:chatId,
    text:"🎬 Starte Stream..."
  });

  return sendFileById(chatId,item);
}

return;

}
    
  // ================= COMMANDS =================

if (msg?.text?.startsWith("/delete")) {

  const id = msg.text.split(" ")[1];

  CACHE = CACHE.filter(x => x.display_id !== id);
  saveDB(CACHE);

  return tg("sendMessage",{
    chat_id: msg.chat.id,
    text:`🗑 Gelöscht: ${id}`
  });
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