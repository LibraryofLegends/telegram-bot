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

Version.............: 1.1.0

Status..............: Core

Lifecycle...........: Production

Description.........

Central filename parser for Library Of Legends.

Responsibilities:

- Detect movie vs series
- Extract clean title
- Extract release year
- Extract season
- Extract episode
- Extract episode title
- Extract quality
- Extract source
- Remove filename separators
- Normalize titles for TMDB searches

Examples:

Superman - 1978.mp4
→ movie
→ Superman
→ 1978

Breaking.Bad.S01E01.mkv
→ series
→ Breaking Bad
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

export class MediaParser {

    // =========================================================================
    // MAIN PARSE
    // =========================================================================

    public parse(
        fileName: string
    ): ParsedMedia {

        const cleanName =
            this.cleanFileName(
                fileName
            );

        // =====================================================================
        // SERIES DETECTION
        // =====================================================================

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
                this.extractSeriesTitle(
                    cleanName
                );

            const episodeTitle =
                this.extractEpisodeTitle(
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
                    this.extractQuality(
                        cleanName
                    ),

                source:
                    this.extractSource(
                        cleanName
                    )
            };
        }

        // =====================================================================
        // MOVIE DETECTION
        // =====================================================================

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
                this.extractMovieTitle(
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
                    this.extractQuality(
                        cleanName
                    ),

                source:
                    this.extractSource(
                        cleanName
                    )
            };
        }

        // =====================================================================
        // UNKNOWN
        // =====================================================================

        return {

            type:
                "unknown",

            title:
                this.normalizeTitle(
                    cleanName
                ),

            quality:
                this.extractQuality(
                    cleanName
                ),

            source:
                this.extractSource(
                    cleanName
                )
        };
    }

    // =========================================================================
    // CLEAN FILENAME
    // =========================================================================

    private cleanFileName(
        fileName: string
    ): string {

        return String(
            fileName || ""
        )
            // ---------------------------------------------------------------
            // Remove extension
            // ---------------------------------------------------------------
            .replace(
                /\.[^/.]+$/,
                ""
            )

            // ---------------------------------------------------------------
            // Replace common separators
            // ---------------------------------------------------------------
            .replace(
                /[._]+/g,
                " "
            )

            // ---------------------------------------------------------------
            // Normalize dashes
            // ---------------------------------------------------------------
            .replace(
                /[–—]+/g,
                "-"
            )

            // ---------------------------------------------------------------
            // Normalize whitespace
            // ---------------------------------------------------------------
            .replace(
                /\s+/g,
                " "
            )

            .trim();
    }

    // =========================================================================
    // EXTRACT MOVIE TITLE
    // =========================================================================

    private extractMovieTitle(
        input: string,
        yearIndex: number
    ): string {

        /*
         * Everything before the release year belongs
         * to the movie title.
         *
         * Example:
         *
         * Superman - 1978
         *
         * becomes:
         *
         * Superman
         */

        const beforeYear =
            input.slice(
                0,
                yearIndex
            );

        return this.normalizeTitle(
            beforeYear
        );
    }

    // =========================================================================
    // EXTRACT SERIES TITLE
    // =========================================================================

    private extractSeriesTitle(
        input: string
    ): string {

        const match =
            input.match(
                /\bS\d{1,3}E\d{1,4}\b/i
            );

        if (
            !match ||
            match.index ===
                undefined
        ) {

            return this.normalizeTitle(
                input
            );
        }

        const beforeEpisodeCode =
            input.slice(
                0,
                match.index
            );

        return this.normalizeTitle(
            beforeEpisodeCode
        );
    }

    // =========================================================================
    // EXTRACT EPISODE TITLE
    // =========================================================================

    private extractEpisodeTitle(
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

        const qualityMatch =
            cleaned.search(
                /\b(2160p|1080p|720p|576p|480p|4K|UHD|FHD|HD)\b/i
            );

        const sourceMatch =
            cleaned.search(
                /\b(WEB-DL|WEBRip|WEB|BluRay|BDRip|HDTV|DVDRip|HDRip)\b/i
            );

        const cutPositions =
            [
                qualityMatch,
                sourceMatch
            ]
                .filter(
                    value =>
                        value >=
                        0
                );

        let end =
            cleaned.length;

        if (
            cutPositions.length >
            0
        ) {

            end =
                Math.min(
                    ...cutPositions
                );
        }

        const episodeTitle =
            cleaned.slice(
                0,
                end
            );

        const normalized =
            this.normalizeTitle(
                episodeTitle
            );

        return normalized ||
            undefined;
    }

    // =========================================================================
    // EXTRACT QUALITY
    // =========================================================================

    private extractQuality(
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

    // =========================================================================
    // EXTRACT SOURCE
    // =========================================================================

    private extractSource(
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

    // =========================================================================
    // NORMALIZE TITLE
    // =========================================================================

    private normalizeTitle(
        value: string
    ): string {

        return String(
            value || ""
        )

            // ---------------------------------------------------------------
            // Remove brackets
            // ---------------------------------------------------------------
            .replace(
                /[\[\](){}]/g,
                " "
            )

            // ---------------------------------------------------------------
            // Remove leading/trailing dash
            // ---------------------------------------------------------------
            .replace(
                /^\s*[-–—:|]+\s*/,
                ""
            )

            .replace(
                /\s*[-–—:|]+\s*$/,
                ""
            )

            // ---------------------------------------------------------------
            // Remove duplicate separators
            // ---------------------------------------------------------------
            .replace(
                /[-–—]{2,}/g,
                " "
            )

            // ---------------------------------------------------------------
            // Normalize whitespace
            // ---------------------------------------------------------------
            .replace(
                /\s+/g,
                " "
            )

            .trim();
    }
}