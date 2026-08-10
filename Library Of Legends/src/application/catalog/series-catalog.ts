/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SeriesCatalog

Architecture Layer..: Application

Module..............: Catalog

Module ID...........: LOL-MOD-CAT-0002

LOL-ID..............: LOL-CAT-SER-0001

File................: series-catalog.ts

Location............
Library Of Legends/src/application/catalog/

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Central series catalog service for Library Of Legends.

Responsibilities:

- Create series catalog entries
- Detect series information
- Detect genres
- Determine archive category
- Generate Archive-ID
- Prepare Telegram series posts
- Keep season and episode information together
- Connect Detection, Routing and Post Builder layers
- Prepare data for Telegram Forum Topics

===============================================================================
*/

import {
    GenreDetector,
    LibraryGenre
} from "../../domain/detection/genre-detector";

import {
    GenreRouter,
    GenreRoute
} from "../routing/genre-router";

import {
    ArchiveIdGenerator
} from "../archive/archive-id-generator";

import {
    SeriesPostBuilder,
    SeriesPostData
} from "../post-builder/series-post-builder";

/**
 * Input data for a series episode.
 */
export interface SeriesCatalogInput {

    title: string;

    year?: number;

    season?: number;

    episode?: number;

    episodeTitle?: string;

    seasonEpisode?: string;

    seriesId?: string | number;

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

    episodeTmdbId?: string | number;
}

/**
 * Normalized series catalog entry.
 */
export interface SeriesCatalogEntry
    extends SeriesCatalogInput {

    title: string;

    genres: LibraryGenre[];

    primaryGenre: LibraryGenre;

    category: string;

    categoryId: string;

    archiveId: string;

    topicName: string;

    post: string;
}

/**
 * Series Catalog
 */
export class SeriesCatalog {

    // =========================================================================
    // CREATE
    // =========================================================================

    public static create(
        input: SeriesCatalogInput
    ): SeriesCatalogEntry {

        const title =
            this.normalizeTitle(
                input.title
            ) ||
            "Unbekannte Serie";

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
        // TOPIC NAME
        // =====================================================================

        const topicName =
            this.buildTopicName(
                title
            );

        // =====================================================================
        // POST DATA
        // =====================================================================

        const postData:
            SeriesPostData = {

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

            season:
                input.season,

            episode:
                input.episode,

            episodeTitle:
                input.episodeTitle,

            seasonEpisode:
                input.seasonEpisode,

            seriesId:
                input.seriesId,

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

            episodeTmdbId:
                input.episodeTmdbId,

            fileName:
                input.fileName,

            telegramFileId:
                input.fileId
        };

        const post =
            SeriesPostBuilder.build(
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

            topicName,

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
    // BUILD TOPIC NAME
    // =========================================================================

    public static buildTopicName(
        title: string
    ): string {

        const normalized =
            this.normalizeTitle(
                title
            );

        if (
            !normalized
        ) {

            return "Unbekannte Serie";
        }

        return normalized;
    }

    // =========================================================================
    // BUILD EPISODE LABEL
    // =========================================================================

    public static buildEpisodeLabel(
        season?: number,
        episode?: number
    ): string {

        if (
            season !== undefined &&
            episode !== undefined
        ) {

            return `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;
        }

        if (
            season !== undefined
        ) {

            return `S${String(season).padStart(2, "0")}`;
        }

        if (
            episode !== undefined
        ) {

            return `E${String(episode).padStart(2, "0")}`;
        }

        return "";
    }

    // =========================================================================
    // BUILD POST
    // =========================================================================

    public static buildPost(
        input: SeriesCatalogInput
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

        return String(
            title || ""
        )
            .trim()
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
    // NORMALIZE SERIES TITLE FROM FILENAME
    // =========================================================================

    public static extractSeriesTitle(
        fileName: string
    ): string {

        let title =
            this.normalizeTitle(
                fileName
            );

        /*
         * Remove common season/episode patterns:
         *
         * Example:
         *
         * Superman S01E01.mp4
         *
         * becomes:
         *
         * Superman
         */

        title =
            title.replace(
                /\bS\d{1,2}E\d{1,3}\b/gi,
                ""
            );

        title =
            title.replace(
                /\bS\d{1,2}\b/gi,
                ""
            );

        title =
            title.replace(
                /\bSeason\s*\d{1,2}\b/gi,
                ""
            );

        title =
            title.replace(
                /\bStaffel\s*\d{1,2}\b/gi,
                ""
            );

        title =
            title.replace(
                /\bEpisode\s*\d{1,3}\b/gi,
                ""
            );

        title =
            title.replace(
                /\bE\d{1,3}\b/gi,
                ""
            );

        return title
            .replace(
                /[\[\](){}]/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }

    // =========================================================================
    // DEBUG
    // =========================================================================

    public static describe(
        input: SeriesCatalogInput
    ): string {

        const series =
            this.create(
                input
            );

        return [

            "=================================================",

            "📺 SERIES CATALOG",

            "=================================================",

            `📺 Serie: ${series.title}`,

            `📅 Jahr: ${
                series.year ??
                "Unbekannt"
            }`,

            `🎞️ Episode: ${
                this.buildEpisodeLabel(
                    series.season,
                    series.episode
                ) ||
                "Unbekannt"
            }`,

            `🏷️ Genres: ${
                series.genres.join(
                    ", "
                )
            }`,

            `⭐ Primary: ${
                series.primaryGenre
            }`,

            `📂 Kategorie: ${
                series.category
            }`,

            `📌 Topic: ${
                series.topicName
            }`,

            `🗃️ Archive-ID: ${
                series.archiveId
            }`,

            "================================================="

        ].join(
            "\n"
        );
    }
}