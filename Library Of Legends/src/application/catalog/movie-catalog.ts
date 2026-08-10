/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MovieCatalog

Architecture Layer..: Application

Module..............: Catalog

Module ID...........: LOL-MOD-CAT-0001

LOL-ID..............: LOL-CAT-MOV-0001

File................: movie-catalog.ts

Location............
Library Of Legends/src/application/catalog/

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Central movie catalog service for Library Of Legends.

Responsibilities:

- Create movie catalog entries
- Detect genres
- Determine archive category
- Generate Archive-ID
- Prepare Telegram post data
- Keep movie metadata together
- Provide normalized movie information
- Connect Detection, Routing and Post Builder layers

===============================================================================
*/

import {
    GenreDetector,
    LibraryGenre
} from "../../domain/detection/genre-detector";

import {
    GenreRouter,
    GenreRoute
} from "../../application/routing/genre-router";

import {
    ArchiveIdGenerator
} from "../archive/archive-id-generator";

import {
    MoviePostBuilder,
    MoviePostData
} from "../post-builder/movie-post-builder";

/**
 * Input data for a movie.
 */
export interface MovieCatalogInput {

    title: string;

    year?: number;

    fileName?: string;

    fileId?: string;

    quality?: string;

    resolution?: string;

    source?: string;

    audio?: string;

    audioCodec?: string;

    audioChannels?: string;

    videoCodec?: string;

    hdr?: string;

    fileSize?: number | string;

    country?: string;

    runtime?: number | string;

    fsk?: string | number;

    director?: string;

    cast?: string;

    overview?: string;

    originalLanguage?: string;

    tmdbId?: string | number;

    tmdbRating?: string | number;
}

/**
 * Normalized movie catalog entry.
 */
export interface MovieCatalogEntry
    extends MovieCatalogInput {

    title: string;

    year?: number;

    genres: LibraryGenre[];

    primaryGenre: LibraryGenre;

    category: string;

    categoryId: string;

    archiveId: string;

    post: string;
}

/**
 * Movie Catalog
 */
export class MovieCatalog {

    // =========================================================================
    // CREATE
    // =========================================================================

    public static create(
        input: MovieCatalogInput
    ): MovieCatalogEntry {

        const title =
            this.clean(
                input.title
            ) ||
            "Unbekannter Film";

        // =====================================================================
        // GENRE DETECTION
        // =====================================================================

        const genres =
            GenreDetector.detect(
                title
            );

        const primaryGenre =
            GenreDetector.detectPrimary(
                title
            );

        // =====================================================================
        // ROUTING
        // =====================================================================

        const route:
            GenreRoute =
                GenreRouter.route(
                    genres
                );

        // =====================================================================
        // ARCHIVE ID
        // =====================================================================

        const archiveId =
            ArchiveIdGenerator.generate(
                primaryGenre
            );

        // =====================================================================
        // POST DATA
        // =====================================================================

        const postData:
            MoviePostData = {

            title,

            year:
                input.year,

            archiveId,

            genre:
                genres.join(
                    " / "
                ),

            category:
                route.categoryTitle,

            quality:
                input.quality,

            resolution:
                input.resolution,

            source:
                input.source,

            audio:
                input.audio,

            audioCodec:
                input.audioCodec,

            audioChannels:
                input.audioChannels,

            videoCodec:
                input.videoCodec,

            hdr:
                input.hdr,

            fileSize:
                input.fileSize,

            country:
                input.country,

            runtime:
                input.runtime,

            fsk:
                input.fsk,

            director:
                input.director,

            cast:
                input.cast,

            overview:
                input.overview,

            originalLanguage:
                input.originalLanguage,

            tmdbId:
                input.tmdbId,

            tmdbRating:
                input.tmdbRating,

            fileName:
                input.fileName,

            telegramFileId:
                input.fileId
        };

        const post =
            MoviePostBuilder.build(
                postData
            );

        return {

            ...input,

            title,

            genres,

            primaryGenre,

            category:
                route.categoryTitle,

            categoryId:
                route.category,

            archiveId,

            post
        };
    }

    // =========================================================================
    // DETECT GENRES
    // =========================================================================

    public static detectGenres(
        title: string
    ): LibraryGenre[] {

        return GenreDetector.detect(
            title
        );
    }

    // =========================================================================
    // DETECT PRIMARY GENRE
    // =========================================================================

    public static detectPrimaryGenre(
        title: string
    ): LibraryGenre {

        return GenreDetector.detectPrimary(
            title
        );
    }

    // =========================================================================
    // GET ROUTE
    // =========================================================================

    public static getRoute(
        title: string
    ): GenreRoute {

        const genres =
            this.detectGenres(
                title
            );

        return GenreRouter.route(
            genres
        );
    }

    // =========================================================================
    // BUILD POST
    // =========================================================================

    public static buildPost(
        input: MovieCatalogInput
    ): string {

        return this.create(
            input
        ).post;
    }

    // =========================================================================
    // GENERATE ARCHIVE ID
    // =========================================================================

    public static generateArchiveId(
        title: string
    ): string {

        const genre =
            this.detectPrimaryGenre(
                title
            );

        return ArchiveIdGenerator.generate(
            genre
        );
    }

    // =========================================================================
    // NORMALIZE TITLE
    // =========================================================================

    public static normalizeTitle(
        title: string
    ): string {

        return this.clean(
            title
        )
            .replace(
                /\.(mp4|mkv|avi|mov|webm)$/i,
                ""
            )
            .replace(
                /\s*\|\s*$/,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }

    // =========================================================================
    // CLEAN
    // =========================================================================

    private static clean(
        value: unknown
    ): string {

        return String(
            value ?? ""
        )
            .trim();
    }

    // =========================================================================
    // DEBUG
    // =========================================================================

    public static describe(
        input: MovieCatalogInput
    ): string {

        const movie =
            this.create(
                input
            );

        return [

            "=================================================",

            "🎬 MOVIE CATALOG",

            "=================================================",

            `🎬 Titel: ${movie.title}`,

            `📅 Jahr: ${
                movie.year ??
                "Unbekannt"
            }`,

            `🏷️ Genres: ${
                movie.genres.join(
                    ", "
                )
            }`,

            `⭐ Primary: ${
                movie.primaryGenre
            }`,

            `📂 Kategorie: ${
                movie.category
            }`,

            `🗃️ Archive-ID: ${
                movie.archiveId
            }`,

            "================================================="

        ].join(
            "\n"
        );
    }
}