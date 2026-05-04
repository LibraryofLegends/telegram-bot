function buildCaption(data = {}, id) {
  const title = (data.title || data.name || "Unbekannt").toUpperCase();

  const yearRaw = data.release_date || data.first_air_date || "";
  const year = yearRaw ? yearRaw.slice(0, 4) : "----";

  const rating = Number(data.vote_average || 0);
  const votes = data.vote_count || 0;

  const isSeries = !!data.first_air_date;

  const typeLabel = isSeries ? "📺 SERIE" : "🎬 FILM";

  return `
${typeLabel}

🎞️ ${title} (${year})
⭐ ${rating.toFixed(1)} / 10   👥 ${votes}

▶️ PLAY ID: #${id}
`.trim();
}

// ================= COVER =================

function getCover(data = {}) {
  if (data?.poster_path) {
    return `https://image.tmdb.org/t/p/original${data.poster_path}`;
  }

  if (data?.backdrop_path) {
    return `https://image.tmdb.org/t/p/original${data.backdrop_path}`;
  }

  return "https://dummyimage.com/500x750/000/fff&text=No+Image";
}

// ================= EXPORT =================

module.exports = {
  buildCaption,
  getCover
};