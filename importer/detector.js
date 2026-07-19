function normalizeReleaseText(text = "") {
  return String(text)
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectQuality(text = "") {
  const t = normalizeReleaseText(text);

  if (/(2160p|4k|uhd)/i.test(t)) return "UHD / 4K";
  if (/(1080p|fhd)/i.test(t)) return "FHD / 1080p";
  if (/720p/i.test(t)) return "HD / 720p";
  if (/480p/i.test(t)) return "SD / 480p";

  return null;
}

function detectSource(text = "") {
  const t = normalizeReleaseText(text);

  if (/web\s*dl/i.test(t)) return "WEB-DL";
  if (/web\s*rip/i.test(t)) return "WEBRip";
  if (/\bweb\b/i.test(t)) return "WEB";
  if (/blu\s*ray/i.test(t)) return "BluRay";
  if (/brrip/i.test(t)) return "BRRip";
  if (/hdrip/i.test(t)) return "HDRip";
  if (/dvdrip/i.test(t)) return "DVDRip";

  return null;
}

function detectCodec(text = "") {
  const t = normalizeReleaseText(text);

  if (/(x265|h265|hevc)/i.test(t)) return "H.265 / HEVC";
  if (/(x264|h264)/i.test(t)) return "H.264";
  if (/av1/i.test(t)) return "AV1";

  return null;
}

function detectAudioLanguage(text = "") {
  const t = normalizeReleaseText(text);

  const german = /(german|deutsch|ger)/i.test(t);
  const english = /(english|englisch|eng)/i.test(t);
  const dual = /(dual|dual language|dl|multi)/i.test(t);

  if (dual && german) return "Deutsch / Dual Language";
  if (dual) return "Dual Language";
  if (german && english) return "Deutsch / Englisch";
  if (german) return "Deutsch";
  if (english) return "Englisch";

  return null;
}

module.exports = {
  normalizeReleaseText,
  detectQuality,
  detectSource,
  detectCodec,
  detectAudioLanguage,
};