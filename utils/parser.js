 // ================= CLEANING =================

// entfernt typische Release Tags
function stripTags(name = "") {
  return name
    .replace(/\.(mp4|mkv|avi|mov)$/i, "")
    .replace(/\b(1080p|720p|2160p|4k|bluray|web|dl|hdrip|x264|x265|hevc|aac|dts)\b/gi, "")
    .replace(/[._\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ================= AI NORMALIZE =================

function aiNormalize(text = "") {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ================= SERIES DETECTION =================

function detectEpisode(name = "") {

  // S01E01
  let match = name.match(/S(\d{1,2})E(\d{1,2})/i);

  if (match) {
    return {
      season: parseInt(match[1]),
      episode: parseInt(match[2])
    };
  }

  // 1x01
  match = name.match(/(\d{1,2})x(\d{1,2})/i);

  if (match) {
    return {
      season: parseInt(match[1]),
      episode: parseInt(match[2])
    };
  }

  return null;
}

// ================= YEAR =================

function extractYear(name = "") {
  const match = name.match(/(19|20)\d{2}/);
  return match ? parseInt(match[0]) : null;
}

// ================= MAIN PARSE =================

function parseFileName(fileName = "") {

  const cleaned = stripTags(fileName);

  const episodeData = detectEpisode(cleaned);

  const year = extractYear(cleaned);

  if (episodeData) {

    const title = cleaned
      .replace(/S\d{1,2}E\d{1,2}/i, "")
      .replace(/\d{1,2}x\d{1,2}/i, "")
      .trim();

    return {
      type: "tv",
      title,
      season: episodeData.season,
      episode: episodeData.episode,
      year
    };
  }

  return {
    type: "movie",
    title: cleaned,
    year
  };
}

// ================= CLEAN TITLE =================

function ultraCleanTitle(name = "") {

  return stripTags(name)
    .replace(/S\d{1,2}E\d{1,2}/gi, "")
    .replace(/\d{1,2}x\d{1,2}/gi, "")
    .replace(/\b(extended|uncut|remastered)\b/gi, "")
    .trim();
}

// ================= SEARCH VARIANTS =================

function buildSearchVariants(title = "") {

  if (!title) return [];

  const base = title.trim();

  const variants = new Set();

  variants.add(base);

  // ohne Zahlen
  variants.add(base.replace(/\d+/g, "").trim());

  // nur erstes Wort
  const words = base.split(" ");
  if (words.length > 1) {
    variants.add(words.slice(0, 2).join(" "));
  }

  // ohne Sonderzeichen
  variants.add(
    base.replace(/[^\w\s]/g, "")
  );

  return [...variants].filter(Boolean);
}

// ================= EXPORT =================

module.exports = {
  parseFileName,
  ultraCleanTitle,
  aiNormalize,
  buildSearchVariants,
  extractYear
};