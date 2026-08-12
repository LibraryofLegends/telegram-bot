/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MediaParser

Architecture Layer..: Application

Module..............: Parser

Module ID...........: LOL-MOD-APP-PARSER-0001

LOL-ID..............: LOL-PARSER-CORE-0001

File................: media-parser.ts

Location............
Library Of Legend/src/application/parser/

Version.............: 1.2.0

Status..............: Core

Lifecycle...........: Production

Description.........

Central media filename parser for Library Of Legends.

Responsibilities:

- Detect movies
- Detect series
- Extract clean title
- Extract release year
- Extract season
- Extract episode
- Extract episode title
- Extract quality
- Extract source
- Normalize filenames
- Provide one consistent ParsedMedia structure

Examples:

Superman - 1978.mp4
→ movie
→ Superman
→ 1978

The Equalizer 3 - The Final Chapter - 2023.mp4
→ movie
→ The Equalizer 3 - The Final Chapter
→ 2023

The Mandalorian S01E01.mkv
→ series
→ The Mandalorian
→ S01E01

===============================================================================
*/

// =============================================================================
// TYPES
// =============================================================================

export type MediaType =
    | "movie"
    | "series"
    | "unknown";

export interface ParsedMedia {

    type:
        MediaType;

    title:
        string;

    year?:
        number;

    season?:
        number;

    episode?:
        number;

    episodeTitle?:
        string;

    quality?:
        string;

    source?:
        string;
}

// =============================================================================
// MEDIA PARSER
// =============================================================================

export function parseMedia(
    fileName: string
): ParsedMedia {

    const cleanName =
        cleanFileName(
            fileName
        );

    // =========================================================================
    // SERIES DETECTION
    // =========================================================================

    const seriesMatch =
        cleanName.match(
            /\bS(\d{1,3})E(\d{1,4})\b/i
        );

    if (
        seriesMatch
    ) {

        const season =
            Number(
                seriesMatch[1]
            );

        const episode =
            Number(
                seriesMatch[2]
            );

        const title =
            extractSeriesTitle(
                cleanName,
                seriesMatch.index ??
                    0
            );

        const episodeTitle =
            extractEpisodeTitle(
                cleanName,
                seriesMatch.index ??
                    0,
                seriesMatch[0]
            );

        return {

            type:
                "series",

            title,

            season,

            episode,

            episodeTitle,

            quality:
                extractQuality(
                    cleanName
                ),

            source:
                extractSource(
                    cleanName
                )
        };
    }

    // =========================================================================
    // MOVIE DETECTION
    // =========================================================================

    const yearMatch =
        cleanName.match(
            /\b(19\d{2}|20\d{2})\b/
        );

    if (
        yearMatch
    ) {

        const year =
            Number(
                yearMatch[1]
            );

        const title =
            extractMovieTitle(
                cleanName,
                yearMatch.index ??
                    0
            );

        return {

            type:
                "movie",

            title,

            year,

            quality:
                extractQuality(
                    cleanName
                ),

            source:
                extractSource(
                    cleanName
                )
        };
    }

    // =========================================================================
    // UNKNOWN
    // =========================================================================

    return {

        type:
            "unknown",

        title:
            normalizeTitle(
                cleanName
            ),

        quality:
            extractQuality(
                cleanName
            ),

        source:
            extractSource(
                cleanName
            )
    };
}

// =============================================================================
// CLEAN FILENAME
// =============================================================================

function cleanFileName(
    fileName: string
): string {

    return String(
        fileName ||
        ""
    )
        // ---------------------------------------------------------------------
        // Remove file extension
        // ---------------------------------------------------------------------
        .replace(
            /\.[^/.]+$/,
            ""
        )

        // ---------------------------------------------------------------------
        // Replace dots and underscores with spaces
        // ---------------------------------------------------------------------
        .replace(
            /[._]+/g,
            " "
        )

        // ---------------------------------------------------------------------
        // Normalize long dash characters
        // ---------------------------------------------------------------------
        .replace(
            /[–—]+/g,
            "-"
        )

        // ---------------------------------------------------------------------
        // Normalize whitespace
        // ---------------------------------------------------------------------
        .replace(
            /\s+/g,
            " "
        )

        .trim();
}

// =============================================================================
// EXTRACT MOVIE TITLE
// =============================================================================

function extractMovieTitle(
    input: string,
    yearIndex: number
): string {

    const beforeYear =
        input.slice(
            0,
            yearIndex
        );

    return normalizeTitle(
        beforeYear
    );
}

// =============================================================================
// EXTRACT SERIES TITLE
// =============================================================================

function extractSeriesTitle(
    input: string,
    episodeIndex: number
): string {

    const beforeEpisodeCode =
        input.slice(
            0,
            episodeIndex
        );

    return normalizeTitle(
        beforeEpisodeCode
    );
}

// =============================================================================
// EXTRACT EPISODE TITLE
// =============================================================================

function extractEpisodeTitle(
    input: string,
    episodeIndex: number,
    episodeCode: string
): string | undefined {

    const afterCode =
        input.slice(
            episodeIndex +
                episodeCode.length
        );

    const cleaned =
        afterCode
            .replace(
                /^\s*[-–—:]+\s*/,
                ""
            )
            .trim();

    if (
        !cleaned
    ) {

        return undefined;
    }

    // -------------------------------------------------------------------------
    // Find technical metadata boundaries
    // -------------------------------------------------------------------------

    const qualityIndex =
        cleaned.search(
            /\b(2160p|1080p|720p|576p|480p|4K|UHD|FHD|HD)\b/i
        );

    const sourceIndex =
        cleaned.search(
            /\b(WEB-DL|WEBRip|WEB|BluRay|BDRip|HDTV|DVDRip|HDRip)\b/i
        );

    const cutPositions =
        [
            qualityIndex,
            sourceIndex
        ]
            .filter(
                value =>
                    value >=
                    0
            );

    let endIndex =
        cleaned.length;

    if (
        cutPositions.length >
        0
    ) {

        endIndex =
            Math.min(
                ...cutPositions
            );
    }

    const episodeTitle =
        cleaned.slice(
            0,
            endIndex
        );

    const normalized =
        normalizeTitle(
            episodeTitle
        );

    return normalized ||
        undefined;
}

// =============================================================================
// EXTRACT QUALITY
// =============================================================================

function extractQuality(
    input: string
): string | undefined {

    const match =
        input.match(
            /\b(2160p|1080p|720p|576p|480p|4K|UHD|FHD|HD)\b/i
        );

    if (
        !match
    ) {

        return undefined;
    }

    return match[1];
}

// =============================================================================
// EXTRACT SOURCE
// =============================================================================

function extractSource(
    input: string
): string | undefined {

    const match =
        input.match(
            /\b(WEB-DL|WEBRip|WEB|BluRay|BDRip|HDTV|DVDRip|HDRip)\b/i
        );

    if (
        !match
    ) {

        return undefined;
    }

    return match[1];
}

// =============================================================================
// NORMALIZE TITLE
// =============================================================================

function normalizeTitle(
    value: string
): string {

    return String(
        value ||
        ""
    )
        // ---------------------------------------------------------------------
        // Remove brackets
        // ---------------------------------------------------------------------
        .replace(
            /[\[\](){}]/g,
            " "
        )

        // ---------------------------------------------------------------------
        // Remove leading separators
        // ---------------------------------------------------------------------
        .replace(
            /^\s*[-–—:|]+\s*/,
            ""
        )

        // ---------------------------------------------------------------------
        // Remove trailing separators
        // ---------------------------------------------------------------------
        .replace(
            /\s*[-–—:|]+\s*$/,
            ""
        )

        // ---------------------------------------------------------------------
        // Normalize duplicate separators
        // ---------------------------------------------------------------------
        .replace(
            /[-–—]{2,}/g,
            " "
        )

        // ---------------------------------------------------------------------
        // Normalize whitespace
        // ---------------------------------------------------------------------
        .replace(
            /\s+/g,
            " "
        )

        .trim();
}