/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: FilenameParser

Architecture Layer..: Domain

Module..............: Detection

Module ID...........: LOL-MOD-DET-0004

LOL-ID..............: LOL-DET-FNP-0001

File................: filename-parser.ts

Location............
Library Of Legends/src/domain/detection/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Analyzes media filenames and extracts structured metadata
for the Library Of Legends automatic archive system.

Detects:

- Title
- Release year
- Movie / Series
- Season
- Episode
- Quality
- Resolution
- Source
- Audio
- Video codec
- File extension

The parser is intentionally independent from Telegram and TMDB.

===============================================================================
*/

export type ParsedMediaType =
    | "MOVIE"
    | "SERIES"
    | "UNKNOWN";

export interface ParsedFilename {

    originalFileName: string;

    title: string;

    year?: number;

    type: ParsedMediaType;

    season?: number;

    episode?: number;

    quality?: string;

    resolution?: string;

    source?: string;

    audio?: string;

    videoCodec?: string;

    extension?: string;
}

export class FilenameParser {

    // =========================================================================
    // MAIN PARSER
    // =========================================================================

    public static parse(
        fileName: string
    ): ParsedFilename {

        const originalFileName = fileName;

        const extension =
            this.detectExtension(fileName);

        const withoutExtension =
            this.removeExtension(fileName);

        const type =
            this.detectType(withoutExtension);

        const year =
            this.detectYear(withoutExtension);

        const season =
            this.detectSeason(withoutExtension);

        const episode =
            this.detectEpisode(withoutExtension);

        const quality =
            this.detectQuality(withoutExtension);

        const resolution =
            this.detectResolution(withoutExtension);

        const source =
            this.detectSource(withoutExtension);

        const audio =
            this.detectAudio(withoutExtension);

        const videoCodec =
            this.detectVideoCodec(withoutExtension);

        const title =
            this.cleanTitle(
                withoutExtension,
                year,
                season,
                episode
            );

        return {

            originalFileName,

            title,

            year,

            type,

            season,

            episode,

            quality,

            resolution,

            source,

            audio,

            videoCodec,

            extension
        };
    }

    // =========================================================================
    // TYPE
    // =========================================================================

    private static detectType(
        input: string
    ): ParsedMediaType {

        const normalized =
            input.toLowerCase();

        const seriesPattern =
            /(?:s\d{1,2}(?:e\d{1,3})?|season\s*\d+)/i;

        if (seriesPattern.test(normalized)) {
            return "SERIES";
        }

        return "MOVIE";
    }

    // =========================================================================
    // YEAR
    // =========================================================================

    private static detectYear(
        input: string
    ): number | undefined {

        const match =
            input.match(
                /\b(19\d{2}|20\d{2})\b/
            );

        if (!match) {
            return undefined;
        }

        return Number(match[1]);
    }

    // =========================================================================
    // SEASON
    // =========================================================================

    private static detectSeason(
        input: string
    ): number | undefined {

        const match =
            input.match(
                /\bS(\d{1,2})\b/i
            );

        if (match) {
            return Number(match[1]);
        }

        const seasonMatch =
            input.match(
                /\bSeason[\s._-]*(\d{1,2})\b/i
            );

        if (seasonMatch) {
            return Number(seasonMatch[1]);
        }

        return undefined;
    }

    // =========================================================================
    // EPISODE
    // =========================================================================

    private static detectEpisode(
        input: string
    ): number | undefined {

        const match =
            input.match(
                /\bS\d{1,2}E(\d{1,3})\b/i
            );

        if (match) {
            return Number(match[1]);
        }

        return undefined;
    }

    // =========================================================================
    // QUALITY
    // =========================================================================

    private static detectQuality(
        input: string
    ): string | undefined {

        const normalized =
            input.toLowerCase();

        if (
            normalized.includes("2160p") ||
            normalized.includes("4k") ||
            normalized.includes("uhd")
        ) {
            return "4K";
        }

        if (
            normalized.includes("1080p") ||
            normalized.includes("fhd")
        ) {
            return "FHD";
        }

        if (
            normalized.includes("720p") ||
            normalized.includes("hd")
        ) {
            return "HD";
        }

        if (
            normalized.includes("480p") ||
            normalized.includes("sd")
        ) {
            return "SD";
        }

        return undefined;
    }

    // =========================================================================
    // RESOLUTION
    // =========================================================================

    private static detectResolution(
        input: string
    ): string | undefined {

        const match =
            input.match(
                /\b(3840x2160|4096x2160|1920x1080|1280x720|720x480)\b/i
            );

        if (match) {
            return match[1];
        }

        const quality =
            this.detectQuality(input);

        switch (quality) {

            case "4K":
                return "3840x2160";

            case "FHD":
                return "1920x1080";

            case "HD":
                return "1280x720";

            case "SD":
                return "720x480";

            default:
                return undefined;
        }
    }

    // =========================================================================
    // SOURCE
    // =========================================================================

    private static detectSource(
        input: string
    ): string | undefined {

        const normalized =
            input.toLowerCase();

        const sources = [
            "bluray",
            "blu-ray",
            "web-dl",
            "webdl",
            "webrip",
            "web-rip",
            "hdtv",
            "dvdrip",
            "dvd",
            "brrip",
            "remux"
        ];

        for (const source of sources) {

            if (
                normalized.includes(source)
            ) {

                return source
                    .toUpperCase()
                    .replace("WEB-RIP", "WEBRip")
                    .replace("WEB_DL", "WEB-DL");

            }
        }

        return undefined;
    }

    // =========================================================================
    // AUDIO
    // =========================================================================

    private static detectAudio(
        input: string
    ): string | undefined {

        const normalized =
            input.toLowerCase();

        const languages: string[] = [];

        if (
            normalized.includes("german") ||
            normalized.includes("deutsch") ||
            normalized.includes("ger") ||
            normalized.includes("de")
        ) {
            languages.push("Deutsch");
        }

        if (
            normalized.includes("english") ||
            normalized.includes("eng")
        ) {
            languages.push("Englisch");
        }

        if (
            normalized.includes("french") ||
            normalized.includes("fra") ||
            normalized.includes("fr")
        ) {
            languages.push("Französisch");
        }

        if (
            normalized.includes("italian") ||
            normalized.includes("ita")
        ) {
            languages.push("Italienisch");
        }

        if (
            normalized.includes("spanish") ||
            normalized.includes("spa")
        ) {
            languages.push("Spanisch");
        }

        if (languages.length === 0) {
            return undefined;
        }

        return languages.join(" / ");
    }

    // =========================================================================
    // VIDEO CODEC
    // =========================================================================

    private static detectVideoCodec(
        input: string
    ): string | undefined {

        const normalized =
            input.toLowerCase();

        if (
            normalized.includes("av1")
        ) {
            return "AV1";
        }

        if (
            normalized.includes("hevc") ||
            normalized.includes("h.265") ||
            normalized.includes("x265")
        ) {
            return "H.265 / HEVC";
        }

        if (
            normalized.includes("h264") ||
            normalized.includes("h.264") ||
            normalized.includes("x264")
        ) {
            return "H.264";
        }

        if (
            normalized.includes("mpeg-4") ||
            normalized.includes("mpeg4")
        ) {
            return "MPEG-4";
        }

        return undefined;
    }

    // =========================================================================
    // EXTENSION
    // =========================================================================

    private static detectExtension(
        input: string
    ): string | undefined {

        const match =
            input.match(
                /\.([a-zA-Z0-9]{2,5})$/
            );

        if (!match) {
            return undefined;
        }

        return match[1].toLowerCase();
    }

    // =========================================================================
    // REMOVE EXTENSION
    // =========================================================================

    private static removeExtension(
        input: string
    ): string {

        return input.replace(
            /\.[a-zA-Z0-9]{2,5}$/,
            ""
        );
    }

    // =========================================================================
    // CLEAN TITLE
    // =========================================================================

    private static cleanTitle(
        input: string,
        year?: number,
        season?: number,
        episode?: number
    ): string {

        let title = input;

        if (year) {

            title = title.replace(
                new RegExp(
                    `\\b${year}\\b`,
                    "i"
                ),
                ""
            );
        }

        if (season !== undefined) {

            title = title.replace(
                /\bS\d{1,2}(?:E\d{1,3})?\b/gi,
                ""
            );

            title = title.replace(
                /\bSeason[\s._-]*\d{1,2}\b/gi,
                ""
            );
        }

        if (episode !== undefined) {

            title = title.replace(
                /\bEpisode[\s._-]*\d{1,3}\b/gi,
                ""
            );
        }

        const technicalPatterns = [
            /\b2160p\b/gi,
            /\b1080p\b/gi,
            /\b720p\b/gi,
            /\b480p\b/gi,
            /\b4k\b/gi,
            /\buhd\b/gi,
            /\bfhd\b/gi,
            /\bhd\b/gi,
            /\bbluray\b/gi,
            /\bblu-ray\b/gi,
            /\bweb-dl\b/gi,
            /\bwebdl\b/gi,
            /\bwebrip\b/gi,
            /\bhdtv\b/gi,
            /\bdvdrip\b/gi,
            /\bbrrip\b/gi,
            /\bremux\b/gi,
            /\bx264\b/gi,
            /\bx265\b/gi,
            /\bhevc\b/gi,
            /\bh\.264\b/gi,
            /\bh\.265\b/gi
        ];

        for (
            const pattern of technicalPatterns
        ) {

            title = title.replace(
                pattern,
                ""
            );
        }

        title = title
            .replace(/[._]+/g, " ")
            .replace(/\s+/g, " ")
            .replace(
                /^\s*[-–—]+\s*/,
                ""
            )
            .replace(
                /\s*[-–—]+\s*$/,
                ""
            )
            .trim();

        return title;
    }
}