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

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Parses filenames into structured media data.

Responsibilities:

- Detect movie vs series
- Extract title
- Extract year
- Extract season/episode (future use)

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
}

// =============================================================================
// PARSER
// =============================================================================

export class MediaParser {

    // =========================================================================
    // MAIN PARSE FUNCTION
    // =========================================================================

    public parse(
        fileName: string
    ): ParsedMedia {

        const cleanName =
            this.cleanFileName(
                fileName
            );

        // =============================================================
        // SERIES DETECTION (S01E01)
        // =============================================================

        const seriesMatch =
            cleanName.match(
                /S(\d{1,2})E(\d{1,2})/i
            );

        if (seriesMatch) {

            const season =
                Number(seriesMatch[1]);

            const episode =
                Number(seriesMatch[2]);

            const title =
                cleanName
                    .split(/S\d{1,2}E\d{1,2}/i)[0]
                    .trim();

            return {
                type: "series",
                title,
                season,
                episode
            };
        }

        // =============================================================
        // MOVIE DETECTION (YEAR)
        // =============================================================

        const yearMatch =
            cleanName.match(
                /(19|20)\d{2}/
            );

        if (yearMatch) {

            const year =
                Number(yearMatch[0]);

            const title =
                cleanName
                    .replace(yearMatch[0], "")
                    .trim();

            return {
                type: "movie",
                title,
                year
            };
        }

        // =============================================================
        // FALLBACK
        // =============================================================

        return {
            type: "unknown",
            title: cleanName
        };
    }

    // =========================================================================
    // CLEAN FILENAME
    // =========================================================================

    private cleanFileName(
        fileName: string
    ): string {

        return fileName
            .replace(/\.[^/.]+$/, "") // remove extension
            .replace(/[\._]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }
}