const fetch = global.fetch || require("node-fetch");

// OPTIONAL CLOUDINARY (falls genutzt)
let cloudinary = null;
try {
  cloudinary = require("cloudinary").v2;
} catch {}

// ================= HELPERS =================

function formatRating(rating) {
  if (!rating) return "⭐ 0.0";
  return `⭐ ${rating.toFixed(1)}`;
}

function formatYear(data) {
  return (data.release_date || data.first_air_date || "").slice(0, 4);
}

function formatGenres(genres = []) {
  if (!genres.length) return "—";

  return genres
    .map(g => g.name || g)
    .slice(0, 3)
    .join(" • ");
}

function cleanOverview(text = "") {
  if (!text) return "Keine Beschreibung verfügbar.";

  return text.length > 300
    ? text.slice(0, 300) + "..."
    : text;
}

// ================= CARD BUILDER =================

function buildCard(
  data,
  fileName,
  id,
  categoryId,
  width,
  height,
  isSeries = false
) {

  const title = (data.title || data.name || "Unbekannt").toUpperCase();

  const year = formatYear(data);
  const rating = formatRating(data.vote_average);

  const genres = formatGenres(data.genres || []);

  const overview = cleanOverview(
    isSeries
      ? data.episode_overview || data.overview
      : data.overview
  );

  const episodeLine = isSeries
    ? `📺 ${data.episode_code || ""} ${data.episode_name || ""}\n`
    : "";

  const quality =
    width >= 3800 ? "4K" :
    width >= 1900 ? "1080p" :
    width >= 1200 ? "720p" : "SD";

  const sizeInfo = fileName?.includes("GB")
    ? fileName.match(/\d+(\.\d+)?\s?GB/i)?.[0] || ""
    : "";

  return `
🎬 ${title} ${year ? `(${year})` : ""}

${episodeLine}${rating}
🎭 ${genres}

📝 ${overview}

📀 ${quality} ${sizeInfo}

▶️ STREAM • #${id}
`;
}

// ================= COVER =================

function getBestImage(data = {}) {

  if (data.poster_path) {
    return `https://image.tmdb.org/t/p/original${data.poster_path}`;
  }

  if (data.backdrop_path) {
    return `https://image.tmdb.org/t/p/original${data.backdrop_path}`;
  }

  return "https://dummyimage.com/500x750/000/fff&text=No+Image";
}

// ================= CLOUDINARY =================

async function uploadToCloudinary(url, genres = [], rating = 0) {

  if (!cloudinary) return url;

  try {

    const publicId = `media/${Date.now()}`;

    const result = await cloudinary.uploader.upload(url, {
      public_id: publicId,
      transformation: [
        { width: 500, height: 750, crop: "fill" }
      ]
    });

    return result.secure_url;

  } catch (err) {

    console.log("❌ CLOUDINARY ERROR:", err.message);

    return url;
  }
}

// ================= EXPORT =================

module.exports = {
  buildCard,
  getBestImage,
  uploadToCloudinary
};