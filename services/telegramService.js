const fetch = require("node-fetch");

const TOKEN = process.env.TOKEN;
const BASE_URL = `https://api.telegram.org/bot${TOKEN}`;

const MAIN_CHANNEL_ID = process.env.MAIN_CHANNEL_ID;
const SERIES_GROUP_ID = process.env.SERIES_GROUP_ID;

// 🎬 FILM
async function sendMoviePost({ file_id, title, year }) {

  const caption = `
🎬 <b>${title}</b>
📅 ${year}

🎥 Qualität: HD
📁 Format: MP4
`;

  await fetch(`${BASE_URL}/sendVideo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: MAIN_CHANNEL_ID,
      video: file_id,
      caption
    })
  });

  console.log("🎬 Film gepostet");
}

// 📺 SERIE
async function sendEpisodePost({ file_id, series, season, episode }) {

  const caption = `
📺 <b>${series}</b>
🎬 Staffel ${season} • Folge ${episode}

🎥 Qualität: HD
`;

  await fetch(`${BASE_URL}/sendVideo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: SERIES_GROUP_ID,
      video: file_id,
      caption
    })
  });

  console.log("📺 Episode gepostet");
}

module.exports = {
  sendMoviePost,
  sendEpisodePost
};