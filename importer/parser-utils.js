function cleanReleaseText(text = "") {

    return String(text)

        .replace(/\.[a-z0-9]{2,5}$/i, "")
        .replace(/@\w+/g, " ")

        .replace(/\[[^\]]+\]/g, " ")
        .replace(/\([^)]+\)/g, " ")

        .replace(/\b(PROPER|REPACK|READNFO|INTERNAL|LIMITED|UNCUT|COMPLETE)\b/gi, " ")

        .replace(/\b(2160p|1080p|720p|480p|4k|uhd|fhd|hd)\b/gi, " ")

        .replace(/\b(web[- ]?dl|webrip|web|bluray|brrip|hdrip|dvdrip)\b/gi, " ")

        .replace(/\b(x264|x265|h264|h265|hevc|av1)\b/gi, " ")

        .replace(/\b(aac|ac3|ddp|dts|truehd|atmos)\b/gi, " ")

        .replace(/\b(german|deutsch|english|englisch|ger|eng|dual|dl|multi)\b/gi, " ")

        .replace(/[._-]+/g, " ")

        .replace(/\s+/g, " ")

        .trim();

}

function cleanEpisodeTitle(text = "") {

    return String(text)

        .replace(/\.[a-z0-9]{2,5}$/i, "")
        .replace(/^[:=\-\s]+/, "")
        .replace(/=+$/g, "")
        .replace(/\s+/g, " ")
        .trim();

}

function titleCase(text = "") {
    return String(text)
        .split(" ")
        .filter(Boolean)
        .map((word) => {

            if (/^[A-Z0-9]{2,}$/.test(word))
                return word;

            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

        })
        .join(" ");
}

module.exports = {
    cleanReleaseText,
    cleanEpisodeTitle,
    titleCase,
};