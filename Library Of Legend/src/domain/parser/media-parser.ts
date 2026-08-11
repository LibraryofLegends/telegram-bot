/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MediaParser

Architecture Layer..: Domain

Module..............: Parser

Module ID...........: LOL-MOD-DOMAIN-PARSER-0001

LOL-ID..............: LOL-PARSER-MEDIA-0001

File................: media-parser.ts

Location............
Library Of Legend/src/domain/parser/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Lightweight filename parser for media detection.

Responsibilities:

- Detect Movie vs Series
- Extract title
- Extract year (movies)
- Extract season/episode (series)
- Extract episode title (optional)
- Extract quality (optional)
- Extract source (optional)

Important:

- No external APIs
- No database
- No validation against TMDB
- Pure string parsing only

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

    type: MediaType;

    title: string;

    year?: number;

    season?: number;

    episode?: number;

    episodeTitle?: string;

    quality?: string;

    source?: string;
}

// =============================================================================
// PARSER
// =============================================================================

export class MediaParser {

    // =========================================================================
    // ENTRY
    // =========================================================================

    public static parse(
        fileName: string
    ): ParsedMedia {

        const cleaned =
            this.cleanFileName(
                fileName
            );

        // =============================================================
        // SERIES DETECTION
        // =============================================================

        const seriesMatch =
            cleaned.match(
                /S(\d{1,2})E(\d{1,2})/i
            );

        if (seriesMatch) {

            const season =
                Number(
                    seriesMatch[1]
                );

            const episode =
                Number(
                    seriesMatch[2]
                );

            const title =
                this.extractTitleBefore(
                    cleaned,
                    seriesMatch.index || 0
                );

            return {

                type: "series",

                title,

                season,

                episode,

                episodeTitle:
                    this.extractEpisodeTitle(
                        cleaned,
                        seriesMatch[0]
                    ),

                quality:
                    this.extractQuality(
                        cleaned
                    ),

                source:
                    this.extractSource(
                        cleaned
                    )
            };
        }

        // =============================================================
        // MOVIE DETECTION
        // =============================================================

        const yearMatch =
            cleaned.match(
                /(19\d{2}|20\d{2})/
            );

        if (yearMatch) {

            const year =
                Number(
                    yearMatch[1]
                );

            const title =
                this.extractTitleBefore(
                    cleaned,
                    yearMatch.index || 0
                );

            return {

                type: "movie",

                title,

                year,

                quality:
                    this.extractQuality(
                        cleaned
                    ),

                source:
                    this.extractSource(
                        cleaned
                    )
            };
        }

        // =============================================================
        // UNKNOWN
        // =============================================================

        return {

            type: "unknown",

            title:
                this.normalizeTitle(
                    cleaned
                )
        };
    }

    // =========================================================================
    // CLEAN FILENAME
    // =========================================================================

    private static cleanFileName(
        fileName: string
    ): string {

        return fileName
            .replace(/\.[^.]+$/, "") // extension entfernen
            .replace(/[._]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    // =========================================================================
    // TITLE EXTRACTION
    // =========================================================================

    private static extractTitleBefore(
        input: string,
        index: number
    ): string {

        return this.normalizeTitle(
            input.slice(
                0,
                index
            )
        );
    }

    private static normalizeTitle(
        value: string
    ): string {

        return value
            .replace(/[-–—]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    // =========================================================================
    // EPISODE TITLE
    // =========================================================================

    private static extractEpisodeTitle(
        input: string,
        code: string
    ): string | undefined {

        const index =
            input.indexOf(
                code
            );

        if (index === -1) return undefined;

        const after =
            input
                .slice(
                    index + code.length
                )
                .trim();

        if (!after) return undefined;

        // Stop words (quality / source)
        const stop =
            after.split(
                /(720p|1080p|2160p|WEB|WEB-DL|BluRay|HDR|DV)/i
            )[0];

        return this.normalizeTitle(
            stop
        );
    }

    // =========================================================================
    // QUALITY
    // =========================================================================

    private static extractQuality(
        input: string
    ): string | undefined {

        const match =
            input.match(
                /(2160p|1080p|720p|480p)/i
            );

        return match
            ? match[1]
            : undefined;
    }

    // =========================================================================
    // SOURCE
    // =========================================================================

    private static extractSource(
        input: string
    ): string | undefined {

        const match =
            input.match(
                /(WEB-DL|WEB|BluRay|HDRip|DVDRip)/i
            );

        return match
            ? match[1]
            : undefined;
    }
}