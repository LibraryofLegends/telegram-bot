/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SeriesCatalog

Architecture Layer..: Domain

Module..............: Catalog

Module ID...........: LOL-MOD-CAT-0002

LOL-ID..............: LOL-CAT-SER-0001

File................: series-catalog.ts

Location............
Library Of Legends/src/domain/catalog/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Represents the structured catalog model for series inside
the Library Of Legends archive system.

The SeriesCatalog combines parsed filename information,
genre information and episode metadata into a normalized
series representation.

This component does not communicate with Telegram,
TMDB or PostgreSQL directly.

===============================================================================
*/

import {
    ParsedFilename,
    FilenameParser
} from "../detection/filename-parser";

import {
    GenreDetector,
    LibraryGenre
} from "../detection/genre-detector";

/**
 * Structured series catalog entry.
 */
export interface SeriesCatalogItem {

    /**
     * Original Telegram filename.
     */
    fileName: string;

    /**
     * Clean series title.
     */
    title: string;

    /**
     * Release year if detected.
     */
    year?: number;

    /**
     * Detected genres.
     */
    genres: LibraryGenre[];

    /**
     * Primary genre.
     */
    primaryGenre: LibraryGenre;

    /**
     * Season number.
     */
    season?: number;

    /**
     * Episode number.
     */
    episode?: number;

    /**
     * Media quality.
     */
    quality?: string;

    /**
     * Video resolution.
     */
    resolution?: string;

    /**
     * Media source.
     */
    source?: string;

    /**
     * Audio information.
     */
    audio?: string;

    /**
     * Video codec.
     */
    videoCodec?: string;

    /**
     * File extension.
     */
    extension?: string;

    /**
     * Media type.
     */
    type: "SERIES";
}

/**
 * Series Catalog
 */
export class SeriesCatalog {

    // =========================================================================
    // CREATE FROM FILENAME
    // =========================================================================

    public static create(
        fileName: string
    ): SeriesCatalogItem {

        const parsed =
            FilenameParser.parse(
                fileName
            );

        return this.createFromParsed(
            parsed
        );
    }

    // =========================================================================
    // CREATE FROM PARSED DATA
    // =========================================================================

    public static createFromParsed(
        parsed: ParsedFilename
    ): SeriesCatalogItem {

        const genres =
            GenreDetector.detect(
                parsed.title
            );

        const primaryGenre =
            GenreDetector.detectPrimary(
                parsed.title
            );

        return {

            fileName:
                parsed.originalFileName,

            title:
                parsed.title,

            year:
                parsed.year,

            genres,

            primaryGenre,

            season:
                parsed.season,

            episode:
                parsed.episode,

            quality:
                parsed.quality,

            resolution:
                parsed.resolution,

            source:
                parsed.source,

            audio:
                parsed.audio,

            videoCodec:
                parsed.videoCodec,

            extension:
                parsed.extension,

            type:
                "SERIES"
        };
    }

    // =========================================================================
    // IS SERIES
    // =========================================================================

    public static isSeries(
        fileName: string
    ): boolean {

        const parsed =
            FilenameParser.parse(
                fileName
            );

        return (
            parsed.type === "SERIES"
        );
    }

    // =========================================================================
    // GET TITLE
    // =========================================================================

    public static getTitle(
        fileName: string
    ): string {

        return this.create(
            fileName
        ).title;
    }

    // =========================================================================
    // GET GENRES
    // =========================================================================

    public static getGenres(
        fileName: string
    ): LibraryGenre[] {

        return this.create(
            fileName
        ).genres;
    }

    // =========================================================================
    // GET PRIMARY GENRE
    // =========================================================================

    public static getPrimaryGenre(
        fileName: string
    ): LibraryGenre {

        return this.create(
            fileName
        ).primaryGenre;
    }

    // =========================================================================
    // GET SEASON
    // =========================================================================

    public static getSeason(
        fileName: string
    ): number | undefined {

        return this.create(
            fileName
        ).season;
    }

    // =========================================================================
    // GET EPISODE
    // =========================================================================

    public static getEpisode(
        fileName: string
    ): number | undefined {

        return this.create(
            fileName
        ).episode;
    }

    // =========================================================================
    // FORMAT EPISODE
    // =========================================================================

    public static formatEpisode(
        season?: number,
        episode?: number
    ): string {

        if (
            season === undefined ||
            episode === undefined
        ) {

            return "";
        }

        return (
            `S${String(season).padStart(2, "0")}` +
            `E${String(episode).padStart(2, "0")}`
        );
    }

    // =========================================================================
    // NORMALIZE TITLE
    // =========================================================================

    public static normalizeTitle(
        title: string
    ): string {

        return title
            .replace(/[._]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    // =========================================================================
    // TO JSON
    // =========================================================================

    public static toJSON(
        series: SeriesCatalogItem
    ): Record<string, unknown> {

        return {

            type:
                series.type,

            title:
                series.title,

            year:
                series.year ?? null,

            genres:
                series.genres,

            primaryGenre:
                series.primaryGenre,

            season:
                series.season ?? null,

            episode:
                series.episode ?? null,

            fileName:
                series.fileName,

            quality:
                series.quality ?? null,

            resolution:
                series.resolution ?? null,

            source:
                series.source ?? null,

            audio:
                series.audio ?? null,

            videoCodec:
                series.videoCodec ?? null,

            extension:
                series.extension ?? null
        };
    }
}