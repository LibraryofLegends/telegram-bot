// utils/parser.js

// ================= CLEAN TITLE =================

function cleanTitle(name = "") {
  return name
    .replace(/\.(mp4|mkv|avi|mov)$/i, "")
    .replace(/[._\-]+/g, " ")
    .replace(/\b(1080p|720p|4k|2160p|bluray|web|webrip|hdrip|x264|x265|dl)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ================= NORMALIZATION =================

function aiNormalize(text = "") {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ================= FILE PARSER =================

function parseFileName(fileName = "") {
  const clean = fileName.replace(/[._\-]+/g, " ");

  // 🎬 SERIES: S01E01
  let match = clean.match(/S(\d{1,2})E(\d{1,2})/i);

  if (!match) {
    // 🎬 SERIES: 1x01 fallback
    match = clean.match(/(\d{1,2})x(\d{1,2})/i);
  }

  if (match) {
    return {
      type: "tv",
      title: clean
        .replace(match[0], "")
        .replace(/\s+/g, " ")
        .trim(),
      season: parseInt(match[1]),
      episode: parseInt(match[2])
    };
  }

  return {
    type: "movie",
    title: clean.trim()
  };
}

// ================= SEARCH VARIANTS =================

function buildSearchVariants(title = "") {
  const base = aiNormalize(title);

  const variants = [
    base,
    base.replace(/\bthe\b/g, ""),
    base.replace(/\b(a|an|the)\b/g, "").trim(),
    base.split(" ").slice(0, -1).join(" "),
    base.split(" ").slice(0, 3).join(" ")
  ];

  return [...new Set(variants)].filter(Boolean);
}

// ================= SERIES KEY BUILDER =================

function buildSeriesKey(title = "") {
  return aiNormalize(title)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

// ================= EPISODE FORMAT =================

function formatEpisode(season, episode) {
  return `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;
}

// ================= EXTRACT YEAR =================

function extractYear(text = "") {
  const match = text.match(/(19|20)\d{2}/);
  return match ? parseInt(match[0]) : null;
}

// ================= FILE QUALITY DETECTOR =================

function detectQuality(fileName = "") {
  const lower = fileName.toLowerCase();

  if (lower.includes("2160p") || lower.includes("4k")) return "4K";
  if (lower.includes("1080p")) return "1080p";
  if (lower.includes("720p")) return "720p";

  return "SD";
}

// ================= EXPORT =================

module.exports = {
  cleanTitle,
  aiNormalize,
  parseFileName,
  buildSearchVariants,
  buildSeriesKey,
  formatEpisode,
  extractYear,
  detectQuality
};