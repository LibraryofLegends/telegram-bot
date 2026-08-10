/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MovieCatalog

Architecture Layer..: Domain

Module..............: Catalog

Module ID...........: LOL-MOD-CAT-0001

LOL-ID..............: LOL-CAT-MOV-0001

File................: movie-catalog.ts

Location............
Library Of Legends/src/domain/catalog/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Represents the structured catalog model for movies inside
the Library Of Legends archive system.

The MovieCatalog combines parsed filename information,
genre information and archive metadata into a normalized
movie representation.

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
 * Structured movie catalog entry.
 */
export interface MovieCatalogItem {

    /**
     * Original Telegram filename.
     */
    fileName: string;

    /**
     * Clean movie title.
     */
    title: string;

    /**
     * Release year.
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
    type: "MOVIE";
}

/**
 * Movie Catalog
 */
export class MovieCatalog {

    // =========================================================================
    // CREATE FROM FILENAME
    // =========================================================================

    public static create(
        fileName: string
    ): MovieCatalogItem {

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
    ): MovieCatalogItem {

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
                "MOVIE"
        };
    }

    // =========================================================================
    // IS MOVIE
    // =========================================================================

    public static isMovie(
        fileName: string
    ): boolean {

        const parsed =
            FilenameParser.parse(
                fileName
            );

        return (
            parsed.type === "MOVIE"
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
        movie: MovieCatalogItem
    ): Record<string, unknown> {

        return {

            type:
                movie.type,

            title:
                movie.title,

            year:
                movie.year ?? null,

            genres:
                movie.genres,

            primaryGenre:
                movie.primaryGenre,

            fileName:
                movie.fileName,

            quality:
                movie.quality ?? null,

            resolution:
                movie.resolution ?? null,

            source:
                movie.source ?? null,

            audio:
                movie.audio ?? null,

            videoCodec:
                movie.videoCodec ?? null,

            extension:
                movie.extension ?? null
        };
    }
}