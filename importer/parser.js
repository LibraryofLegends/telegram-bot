const {
    cleanReleaseText,
    cleanEpisodeTitle,
    titleCase,
} = require("./parser-utils");

const {
    detectQuality,
    detectSource,
    detectCodec,
    detectAudioLanguage,
} = require("./detector");

function parseMediaFileName(fileName = "") {

    const original = String(fileName || "").trim();

    const readable = original
        .replace(/\.[a-z0-9]{2,5}$/i, "")
        .replace(/@\w+/g, " ")
        .replace(/[._]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const cleaned = cleanReleaseText(original);

    const yearMatch = readable.match(/\b(19\d{2}|20\d{2})\b/);

    const commonMeta = {
        quality: detectQuality(original),
        source: detectSource(original),
        codec: detectCodec(original),
        audio: detectAudioLanguage(original),
    };

    // =========================================================
    // Staffelpakete
    // =========================================================

    const seasonPack = readable.match(
        /(.+?)\s+(?:season|staffel)\s*(\d{1,2})\s*(?:complete|komplett|pack|全集)?/i
    );

    if (seasonPack) {

        return {

            type: "season",

            title: titleCase(
                seasonPack[1]
                    .replace(/\b(19\d{2}|20\d{2})\b/g, "")
                    .trim()
            ),

            year: yearMatch ? Number(yearMatch[1]) : null,

            season: Number(seasonPack[2]),

            episode: null,

            episodes: [],

            episodeTitle: null,

            ...commonMeta,

        };

    }

    // =========================================================
    // Serienformate
    // =========================================================

    const patterns = [

        {
            regex: /(.+?)\s+s(\d{1,2})e(\d{1,3})e(\d{1,3})(?:\s*[-:=]\s*(.+))?/i,
            multi: true,
        },

        {
            regex: /(.+?)\s+s(\d{1,2})\s*e(\d{1,3})(?:\s*[-:=]\s*(.+))?/i,
        },

        {
            regex: /(.+?)\s+s(\d{1,2})e(\d{1,3})(?:\s*[-:=]\s*(.+))?/i,
        },

        {
            regex: /(.+?)\s+(\d{1,2})x(\d{1,3})(?:\s*[-:=]\s*(.+))?/i,
        },

        {
            regex: /(.+?)\s+staffel\s*(\d{1,2})\s+folge\s*(\d{1,3})(?:\s*[-:=]\s*(.+))?/i,
        },

        {
            regex: /(.+?)\s+season\s*(\d{1,2})\s+episode\s*(\d{1,3})(?:\s*[-:=]\s*(.+))?/i,
        },

        {
            regex: /(.+?)\s+(?:special|sp)\s*(\d{1,3})/i,
            special: true,
        },

        {
            regex: /(.+?)\s+ova\s*(\d{1,3})/i,
            ova: true,
        },

    ];

    for (const entry of patterns) {

        const match = readable.match(entry.regex);

        if (!match)
            continue;

        let season = 1;
        let episode = null;
        let episodes = [];

        if (entry.special) {

            season = 0;
            episode = Number(match[2]);
            episodes.push(episode);

        }

        else if (entry.ova) {

            season = -1;
            episode = Number(match[2]);
            episodes.push(episode);

        }

        else if (entry.multi) {

            season = Number(match[2]);

            episode = Number(match[3]);

            episodes.push(Number(match[3]));
            episodes.push(Number(match[4]));

        }

        else {

            season = Number(match[2]);

            episode = Number(match[3]);

            episodes.push(episode);

        }

        return {

            type: "series",

            title: titleCase(

                match[1]
                    .replace(/\b(19\d{2}|20\d{2})\b/g, "")
                    .replace(/\s+-\s*$/, "")
                    .trim()

            ),

            year: yearMatch ? Number(yearMatch[1]) : null,

            season,

            episode,

            episodes,

            episodeTitle:

                entry.multi
                    ? cleanEpisodeTitle(match[5] || "")
                    : cleanEpisodeTitle(match[4] || ""),

            special: !!entry.special,

            ova: !!entry.ova,

            ...commonMeta,

        };

    }

    // =========================================================
    // Episode 15
    // =========================================================

    const episodeWord = readable.match(
        /(.+?)\s*[- ]\s*(?:episode|folge|ep)\s*(\d{1,3})(?:\s*[-:=]?\s*(.+))?/i
    );

    if (episodeWord) {

        return {

            type: "series",

            title: titleCase(
                episodeWord[1]
                    .replace(/\b(19\d{2}|20\d{2})\b/g, "")
                    .trim()
            ),

            year: yearMatch ? Number(yearMatch[1]) : null,

            season: 1,

            episode: Number(episodeWord[2]),

            episodes: [Number(episodeWord[2])],

            episodeTitle: cleanEpisodeTitle(episodeWord[3] || ""),

            ...commonMeta,

        };

    }

    // =========================================================
    // Film
    // =========================================================

    let title = cleaned;

    if (yearMatch) {
        title = cleaned.slice(0, yearMatch.index).trim();
    }

    return {

        type: "movie",

        title: titleCase(title || cleaned || original),

        year: yearMatch ? Number(yearMatch[1]) : null,

        season: null,

        episode: null,

        episodes: [],

        episodeTitle: null,

        ...commonMeta,

    };

}

module.exports = {
    parseMediaFileName,
};