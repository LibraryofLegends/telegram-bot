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

Version.............: 3.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Movie catalog system for Library Of Legends.

Responsibilities:

- Create movie catalog entries
- Connect filename parsing with genre detection
- Connect genre detection with routing
- Generate archive IDs
- Normalize movie information
- Preserve Telegram File-ID
- Preserve original filename
- Provide searchable movie data
- Prepare movie data for database storage
- Never lose the original Telegram File-ID

The catalog does NOT directly access Telegram.

The catalog does NOT directly access PostgreSQL.

Those responsibilities belong to the infrastructure and framework layers.

===============================================================================
*/

import {
    ParsedMedia,
    FilenameParser
} from "../detection/filename-parser";

import {
    GenreDetector
} from "../detection/genre-detector";

import {
    LibraryGenre
} from "../detection/genre-detector-types";

import {
    GenreRouter,
    GenreRoute
} from "../../application/routing/genre-router";

import {
    ArchiveIdGenerator
} from "../archive/archive-id-generator";

/**
 * Input required to create a movie catalog entry.
 */
export interface MovieCatalogInput {

    /**
     * Telegram File-ID.
     */
    fileId: string;

    /**
     * Original Telegram filename.
     */
    fileName: string;

    /**
     * Optional file size.
     */
    fileSize?: number;

    /**
     * Optional Telegram chat ID.
     */
    chatId?: string;

    /**
     * Optional Telegram message ID.
     */
    messageId?: number;
}

/**
 * Complete movie catalog entry.
 */
export interface MovieCatalogEntry {

    /**
     * Archive ID.
     */
    archiveId: string;

    /**
     * Media type.
     */
    type: "MOVIE";

    /**
     * Clean title.
     */
    title: string;

    /**
     * Release year.
     */
    year?: number;

    /**
     * Original filename.
     */
    originalFileName: string;

    /**
     * Telegram File-ID.
     */
    fileId: string;

    /**
     * File size.
     */
    fileSize?: number;

    /**
     * Detected genres.
     */
    genres: LibraryGenre[];

    /**
     * Primary genre.
     */
    primaryGenre: LibraryGenre;

    /**
     * Telegram category.
     */
    category: string;

    /**
     * Telegram category title.
     */
    categoryTitle: string;

    /**
     * Archive genre code.
     */
    archiveCode: string;

    /**
     * Quality.
     */
    quality?: string;

    /**
     * Resolution.
     */
    resolution?: string;

    /**
     * Source.
     */
    source?: string;

    /**
     * Audio language.
     */
    audio?: string;

    /**
     * Audio codec.
     */
    audioCodec?: string;

    /**
     * Audio channels.
     */
    audioChannels?: string;

    /**
     * Video codec.
     */
    videoCodec?: string;

    /**
     * HDR.
     */
    hdr?: string;

    /**
     * File extension.
     */
    extension?: string;

    /**
     * Telegram source chat.
     */
    chatId?: string;

    /**
     * Telegram source message.
     */
    messageId?: number;

    /**
     * Creation timestamp.
     */
    createdAt: number;
}

/**
 * Movie Catalog.
 */
export class MovieCatalog {

    // =========================================================================
    // INTERNAL SEQUENCE
    // =========================================================================

    private static sequence =
        0;

    // =========================================================================
    // CREATE
    // =========================================================================

    public static create(
        input: MovieCatalogInput
    ): MovieCatalogEntry {

        // =====================================================================
        // VALIDATE INPUT
        // =====================================================================

        const fileId =
            String(
                input.fileId || ""
            ).trim();

        const fileName =
            String(
                input.fileName || ""
            ).trim();

        if (
            !fileId
        ) {

            throw new Error(
                "MovieCatalog: Telegram File-ID fehlt."
            );
        }

        if (
            !fileName
        ) {

            throw new Error(
                "MovieCatalog: Dateiname fehlt."
            );
        }

        // =====================================================================
        // PARSE FILENAME
        // =====================================================================

        const parsed:
            ParsedMedia =
            FilenameParser.parse(
                fileName
            );

        // =====================================================================
        // ENSURE MOVIE
        // =====================================================================

        if (
            parsed.type !==
            "MOVIE"
        ) {

            throw new Error(
                `MovieCatalog: Datei wurde als ${parsed.type} erkannt und ist kein Film.`
            );
        }

        // =====================================================================
        // GENRE DETECTION
        // =====================================================================

        const genres =
            GenreDetector.detect(
                parsed.title
            );

        const primaryGenre =
            GenreDetector.detectPrimary(
                parsed.title
            );

        // =====================================================================
        // GENRE ROUTING
        // =====================================================================

        const route:
            GenreRoute =
            GenreRouter.route(
                genres
            );

        // =====================================================================
        // ARCHIVE NUMBER
        // =====================================================================

        const number =
            this.nextSequence();

        // =====================================================================
        // ARCHIVE ID
        // =====================================================================

        const archiveId =
            ArchiveIdGenerator.generateMovieId(
                route.archiveCode,
                number
            );

        // =====================================================================
        // BUILD ENTRY
        // =====================================================================

        const entry:
            MovieCatalogEntry = {

            archiveId,

            type:
                "MOVIE",

            title:
                parsed.title,

            year:
                parsed.year,

            originalFileName:
                parsed.originalFileName,

            fileId,

            fileSize:
                input.fileSize,

            genres,

            primaryGenre,

            category:
                route.category,

            categoryTitle:
                route.categoryTitle,

            archiveCode:
                route.archiveCode,

            quality:
                parsed.quality,

            resolution:
                parsed.resolution,

            source:
                parsed.source,

            audio:
                parsed.audio,

            audioCodec:
                parsed.audioCodec,

            audioChannels:
                parsed.audioChannels,

            videoCodec:
                parsed.videoCodec,

            hdr:
                parsed.hdr,

            extension:
                parsed.extension,

            chatId:
                input.chatId,

            messageId:
                input.messageId,

            createdAt:
                Date.now()
        };

        return entry;
    }

    // =========================================================================
    // NEXT SEQUENCE
    // =========================================================================

    private static nextSequence(): number {

        this.sequence++;

        return this.sequence;
    }

    // =========================================================================
    // SET SEQUENCE
    // =========================================================================

    public static setSequence(
        value: number
    ): void {

        const numeric =
            Number(
                value
            );

        if (
            !Number.isFinite(
                numeric
            ) ||
            numeric < 0
        ) {

            return;
        }

        this.sequence =
            Math.floor(
                numeric
            );
    }

    // =========================================================================
    // GET SEQUENCE
    // =========================================================================

    public static getSequence(): number {

        return this.sequence;
    }

    // =========================================================================
    // CREATE FROM PARSED MEDIA
    // =========================================================================

    public static createFromParsed(
        parsed: ParsedMedia,
        fileId: string,
        fileSize?: number,
        chatId?: string,
        messageId?: number
    ): MovieCatalogEntry {

        if (
            parsed.type !==
            "MOVIE"
        ) {

            throw new Error(
                "MovieCatalog: ParsedMedia ist kein Film."
            );
        }

        const genres =
            GenreDetector.detect(
                parsed.title
            );

        const primaryGenre =
            GenreDetector.detectPrimary(
                parsed.title
            );

        const route =
            GenreRouter.route(
                genres
            );

        const archiveNumber =
            this.nextSequence();

        const archiveId =
            ArchiveIdGenerator.generateMovieId(
                route.archiveCode,
                archiveNumber
            );

        return {

            archiveId,

            type:
                "MOVIE",

            title:
                parsed.title,

            year:
                parsed.year,

            originalFileName:
                parsed.originalFileName,

            fileId,

            fileSize,

            genres,

            primaryGenre,

            category:
                route.category,

            categoryTitle:
                route.categoryTitle,

            archiveCode:
                route.archiveCode,

            quality:
                parsed.quality,

            resolution:
                parsed.resolution,

            source:
                parsed.source,

            audio:
                parsed.audio,

            audioCodec:
                parsed.audioCodec,

            audioChannels:
                parsed.audioChannels,

            videoCodec:
                parsed.videoCodec,

            hdr:
                parsed.hdr,

            extension:
                parsed.extension,

            chatId,

            messageId,

            createdAt:
                Date.now()
        };
    }

    // =========================================================================
    // REBUILD
    // =========================================================================

    public static rebuild(
        movie: MovieCatalogEntry
    ): MovieCatalogEntry {

        const genres =
            GenreDetector.detect(
                movie.title
            );

        const primaryGenre =
            GenreDetector.detectPrimary(
                movie.title
            );

        const route =
            GenreRouter.route(
                genres
            );

        return {

            ...movie,

            genres,

            primaryGenre,

            category:
                route.category,

            categoryTitle:
                route.categoryTitle,

            archiveCode:
                route.archiveCode
        };
    }

    // =========================================================================
    // IS MOVIE
    // =========================================================================

    public static isMovie(
        value: MovieCatalogEntry
    ): boolean {

        return (
            value.type ===
            "MOVIE"
        );
    }

    // =========================================================================
    // HAS GENRE
    // =========================================================================

    public static hasGenre(
        movie: MovieCatalogEntry,
        genre: LibraryGenre
    ): boolean {

        return movie.genres.includes(
            genre
        );
    }

    // =========================================================================
    // GET PRIMARY GENRE
    // =========================================================================

    public static getPrimaryGenre(
        movie: MovieCatalogEntry
    ): LibraryGenre {

        return movie.primaryGenre;
    }

    // =========================================================================
    // GET CATEGORY
    // =========================================================================

    public static getCategory(
        movie: MovieCatalogEntry
    ): string {

        return movie.category;
    }

    // =========================================================================
    // GET FILE ID
    // =========================================================================

    public static getFileId(
        movie: MovieCatalogEntry
    ): string {

        return movie.fileId;
    }

    // =========================================================================
    // SEARCH MATCH
    // =========================================================================

    public static matchesSearch(
        movie: MovieCatalogEntry,
        query: string
    ): boolean {

        const normalizedQuery =
            String(
                query || ""
            )
                .toLowerCase()
                .trim();

        if (
            !normalizedQuery
        ) {

            return true;
        }

        const searchable =
            [

                movie.title,

                movie.originalFileName,

                movie.archiveId,

                movie.primaryGenre,

                ...movie.genres

            ]
                .join(
                    " "
                )
                .toLowerCase();

        return searchable.includes(
            normalizedQuery
        );
    }

    // =========================================================================
    // TO DATABASE OBJECT
    // =========================================================================

    public static toDatabaseObject(
        movie: MovieCatalogEntry
    ): Record<string, unknown> {

        return {

            libraryId:
                movie.archiveId,

            title:
                movie.title,

            year:
                movie.year,

            fileName:
                movie.originalFileName,

            fileId:
                movie.fileId,

            type:
                movie.type,

            genre:
                movie.primaryGenre,

            genres:
                movie.genres,

            category:
                movie.category,

            quality:
                movie.quality,

            resolution:
                movie.resolution,

            source:
                movie.source,

            audio:
                movie.audio,

            audioCodec:
                movie.audioCodec,

            audioChannels:
                movie.audioChannels,

            videoCodec:
                movie.videoCodec,

            hdr:
                movie.hdr,

            extension:
                movie.extension,

            fileSize:
                movie.fileSize,

            chatId:
                movie.chatId,

            messageId:
                movie.messageId
        };
    }

    // =========================================================================
    // DISPLAY TITLE
    // =========================================================================

    public static getDisplayTitle(
        movie: MovieCatalogEntry
    ): string {

        if (
            movie.year
        ) {

            return `${movie.title} (${movie.year})`;
        }

        return movie.title;
    }

    // =========================================================================
    // BUILD LOG
    // =========================================================================

    public static describe(
        movie: MovieCatalogEntry
    ): string {

        return [

            "=================================================",

            "🎬 MOVIE CATALOG",

            "=================================================",

            `🆔 Archive-ID: ${
                movie.archiveId
            }`,

            `🎬 Titel: ${
                movie.title
            }`,

            `📅 Jahr: ${
                movie.year ??
                "—"
            }`,

            `🏷️ Genres: ${
                movie.genres.join(
                    ", "
                )
            }`,

            `⭐ Hauptgenre: ${
                movie.primaryGenre
            }`,

            `📂 Kategorie: ${
                movie.categoryTitle
            }`,

            `🔥 Qualität: ${
                movie.quality ??
                "—"
            }`,

            `📺 Auflösung: ${
                movie.resolution ??
                "—"
            }`,

            `💿 Quelle: ${
                movie.source ??
                "—"
            }`,

            `🔊 Audio: ${
                movie.audio ??
                "—"
            }`,

            `🎧 Audio-Codec: ${
                movie.audioCodec ??
                "—"
            }`,

            `🔈 Kanäle: ${
                movie.audioChannels ??
                "—"
            }`,

            `🎥 Video-Codec: ${
                movie.videoCodec ??
                "—"
            }`,

            `🌈 HDR: ${
                movie.hdr ??
                "—"
            }`,

            `🆔 File-ID: ${
                movie.fileId
            }`,

            "================================================="

        ].join(
            "\n"
        );
    }
}