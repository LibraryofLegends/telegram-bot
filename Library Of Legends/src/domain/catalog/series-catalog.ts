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

Version.............: 3.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Series catalog system for Library Of Legends.

Responsibilities:

- Create series catalog entries
- Detect series information
- Extract season and episode
- Detect genres
- Route series to Telegram categories
- Generate series archive IDs
- Generate episode archive IDs
- Preserve Telegram File-ID
- Preserve original filename
- Normalize series titles
- Prepare series data for database storage
- Prepare topic information
- Support multiple episodes per series

The catalog does NOT directly access Telegram.

The catalog does NOT directly access PostgreSQL.

Those responsibilities belong to the framework and infrastructure layers.

===============================================================================
*/

import {
    ParsedMedia,
    FilenameParser
} from "../detection/filename-parser";

import {
    MediaTypeDetector
} from "../detection/media-type-detector";

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
    TopicManager
} from "../../application/routing/topic-manager";

import {
    ArchiveIdGenerator
} from "../archive/archive-id-generator";

/**
 * Input required to create a series catalog entry.
 */
export interface SeriesCatalogInput {

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
 * Complete series catalog entry.
 */
export interface SeriesCatalogEntry {

    /**
     * Series archive ID.
     */
    seriesId: string;

    /**
     * Episode archive ID.
     */
    episodeId?: string;

    /**
     * Media type.
     */
    type: "SERIES";

    /**
     * Clean series title.
     */
    title: string;

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
     * Season.
     */
    season?: number;

    /**
     * Episode.
     */
    episode?: number;

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
     * Archive code.
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
     * Audio.
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
 * Series information independent from an episode.
 */
export interface SeriesInfo {

    seriesId: string;

    title: string;

    genres: LibraryGenre[];

    primaryGenre: LibraryGenre;

    category: string;

    categoryTitle: string;

    archiveCode: string;

    createdAt: number;
}

/**
 * Series Catalog.
 */
export class SeriesCatalog {

    // =========================================================================
    // INTERNAL SEQUENCE
    // =========================================================================

    private static seriesSequence =
        0;

    // =========================================================================
    // SERIES CACHE
    // =========================================================================

    private static seriesCache:
        Map<string, SeriesInfo> =
        new Map();

    // =========================================================================
    // CREATE
    // =========================================================================

    public static create(
        input: SeriesCatalogInput
    ): SeriesCatalogEntry {

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
                "SeriesCatalog: Telegram File-ID fehlt."
            );
        }

        if (
            !fileName
        ) {

            throw new Error(
                "SeriesCatalog: Dateiname fehlt."
            );
        }

        // =====================================================================
        // PARSE
        // =====================================================================

        const parsed:
            ParsedMedia =
            FilenameParser.parse(
                fileName
            );

        // =====================================================================
        // ENSURE SERIES
        // =====================================================================

        if (
            parsed.type !==
            "SERIES"
        ) {

            throw new Error(
                `SeriesCatalog: Datei wurde als ${parsed.type} erkannt und ist keine Serie.`
            );
        }

        return this.createFromParsed(
            parsed,
            fileId,
            input.fileSize,
            input.chatId,
            input.messageId
        );
    }

    // =========================================================================
    // CREATE FROM PARSED
    // =========================================================================

    public static createFromParsed(
        parsed: ParsedMedia,
        fileId: string,
        fileSize?: number,
        chatId?: string,
        messageId?: number
    ): SeriesCatalogEntry {

        if (
            parsed.type !==
            "SERIES"
        ) {

            throw new Error(
                "SeriesCatalog: ParsedMedia ist keine Serie."
            );
        }

        const title =
            this.normalizeSeriesTitle(
                parsed.title
            );

        if (
            !title
        ) {

            throw new Error(
                "SeriesCatalog: Serienname konnte nicht erkannt werden."
            );
        }

        // =====================================================================
        // GENRE
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
        // SERIES ID
        // =====================================================================

        const seriesInfo =
            this.getOrCreateSeries(
                title,
                genres,
                primaryGenre,
                route
            );

        // =====================================================================
        // EPISODE ID
        // =====================================================================

        let episodeId:
            string | undefined;

        if (
            parsed.season !== undefined &&
            parsed.episode !== undefined
        ) {

            episodeId =
                ArchiveIdGenerator.generateEpisodeId(
                    seriesInfo.seriesId,
                    parsed.season,
                    parsed.episode
                );
        }

        // =====================================================================
        // BUILD ENTRY
        // =====================================================================

        return {

            seriesId:
                seriesInfo.seriesId,

            episodeId,

            type:
                "SERIES",

            title:
                seriesInfo.title,

            originalFileName:
                parsed.originalFileName,

            fileId,

            fileSize,

            season:
                parsed.season,

            episode:
                parsed.episode,

            genres:
                seriesInfo.genres,

            primaryGenre:
                seriesInfo.primaryGenre,

            category:
                seriesInfo.category,

            categoryTitle:
                seriesInfo.categoryTitle,

            archiveCode:
                seriesInfo.archiveCode,

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
    // GET OR CREATE SERIES
    // =========================================================================

    public static getOrCreateSeries(
        title: string,
        genres?: LibraryGenre[],
        primaryGenre?: LibraryGenre,
        route?: GenreRoute
    ): SeriesInfo {

        const normalizedTitle =
            this.normalizeSeriesTitle(
                title
            );

        const key =
            TopicManager.normalizeName(
                normalizedTitle
            );

        const existing =
            this.seriesCache.get(
                key
            );

        if (
            existing
        ) {

            return existing;
        }

        const detectedGenres =
            genres &&
            genres.length > 0
                ? genres
                : GenreDetector.detect(
                    normalizedTitle
                );

        const detectedPrimary =
            primaryGenre ||
            GenreDetector.detectPrimary(
                normalizedTitle
            );

        const detectedRoute =
            route ||
            GenreRouter.route(
                detectedGenres
            );

        const seriesNumber =
            this.nextSeriesSequence();

        const seriesId =
            ArchiveIdGenerator.generateSeriesId(
                seriesNumber
            );

        const series:
            SeriesInfo = {

            seriesId,

            title:
                normalizedTitle,

            genres:
                detectedGenres,

            primaryGenre:
                detectedPrimary,

            category:
                detectedRoute.category,

            categoryTitle:
                detectedRoute.categoryTitle,

            archiveCode:
                detectedRoute.archiveCode,

            createdAt:
                Date.now()
        };

        this.seriesCache.set(
            key,
            series
        );

        return series;
    }

    // =========================================================================
    // FIND SERIES
    // =========================================================================

    public static findSeries(
        title: string
    ): SeriesInfo | undefined {

        const key =
            TopicManager.normalizeName(
                title
            );

        return this.seriesCache.get(
            key
        );
    }

    // =========================================================================
    // FIND BY SERIES ID
    // =========================================================================

    public static findBySeriesId(
        seriesId: string
    ): SeriesInfo | undefined {

        const normalized =
            String(
                seriesId || ""
            )
                .trim()
                .toUpperCase();

        for (
            const series of
            this.seriesCache.values()
        ) {

            if (
                series.seriesId ===
                normalized
            ) {

                return series;
            }
        }

        return undefined;
    }

    // =========================================================================
    // NORMALIZE TITLE
    // =========================================================================

    public static normalizeSeriesTitle(
        title: string
    ): string {

        return TopicManager.normalizeSeriesTitle(
            title
        );
    }

    // =========================================================================
    // NEXT SERIES SEQUENCE
    // =========================================================================

    private static nextSeriesSequence():
        number {

        this.seriesSequence++;

        return this.seriesSequence;
    }

    // =========================================================================
    // SET SERIES SEQUENCE
    // =========================================================================

    public static setSeriesSequence(
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

        this.seriesSequence =
            Math.floor(
                numeric
            );
    }

    // =========================================================================
    // GET SERIES SEQUENCE
    // =========================================================================

    public static getSeriesSequence():
        number {

        return this.seriesSequence;
    }

    // =========================================================================
    // GET EPISODE
    // =========================================================================

    public static getEpisode(
        entry: SeriesCatalogEntry
    ): number | undefined {

        return entry.episode;
    }

    // =========================================================================
    // GET SEASON
    // =========================================================================

    public static getSeason(
        entry: SeriesCatalogEntry
    ): number | undefined {

        return entry.season;
    }

    // =========================================================================
    // GET TOPIC NAME
    // =========================================================================

    public static getTopicName(
        entry: SeriesCatalogEntry
    ): string {

        return TopicManager.cleanTopicName(
            entry.title
        );
    }

    // =========================================================================
    // BUILD TOPIC REQUEST
    // =========================================================================

    public static buildTopicRequest(
        entry: SeriesCatalogEntry,
        chatId: string
    ) {

        return TopicManager.buildRequest(
            chatId,
            entry.title
        );
    }

    // =========================================================================
    // IS SERIES
    // =========================================================================

    public static isSeries(
        entry: SeriesCatalogEntry
    ): boolean {

        return (
            entry.type ===
            "SERIES"
        );
    }

    // =========================================================================
    // HAS EPISODE
    // =========================================================================

    public static hasEpisode(
        entry: SeriesCatalogEntry
    ): boolean {

        return (
            entry.season !== undefined &&
            entry.episode !== undefined
        );
    }

    // =========================================================================
    // HAS GENRE
    // =========================================================================

    public static hasGenre(
        entry: SeriesCatalogEntry,
        genre: LibraryGenre
    ): boolean {

        return entry.genres.includes(
            genre
        );
    }

    // =========================================================================
    // SEARCH MATCH
    // =========================================================================

    public static matchesSearch(
        entry: SeriesCatalogEntry,
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

                entry.title,

                entry.originalFileName,

                entry.seriesId,

                entry.episodeId ||
                    "",

                entry.primaryGenre,

                ...entry.genres

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
        entry: SeriesCatalogEntry
    ): Record<string, unknown> {

        return {

            libraryId:
                entry.episodeId ||
                entry.seriesId,

            seriesId:
                entry.seriesId,

            episodeId:
                entry.episodeId,

            title:
                entry.title,

            fileName:
                entry.originalFileName,

            fileId:
                entry.fileId,

            type:
                entry.type,

            season:
                entry.season,

            episode:
                entry.episode,

            genre:
                entry.primaryGenre,

            genres:
                entry.genres,

            category:
                entry.category,

            quality:
                entry.quality,

            resolution:
                entry.resolution,

            source:
                entry.source,

            audio:
                entry.audio,

            audioCodec:
                entry.audioCodec,

            audioChannels:
                entry.audioChannels,

            videoCodec:
                entry.videoCodec,

            hdr:
                entry.hdr,

            extension:
                entry.extension,

            fileSize:
                entry.fileSize,

            chatId:
                entry.chatId,

            messageId:
                entry.messageId
        };
    }

    // =========================================================================
    // GET DISPLAY TITLE
    // =========================================================================

    public static getDisplayTitle(
        entry: SeriesCatalogEntry
    ): string {

        let result =
            entry.title;

        if (
            entry.season !== undefined
        ) {

            result +=
                ` · S${String(
                    entry.season
                ).padStart(
                    2,
                    "0"
                )}`;
        }

        if (
            entry.episode !== undefined
        ) {

            result +=
                `E${String(
                    entry.episode
                ).padStart(
                    2,
                    "0"
                )}`;
        }

        return result;
    }

    // =========================================================================
    // DESCRIBE
    // =========================================================================

    public static describe(
        entry: SeriesCatalogEntry
    ): string {

        return [

            "=================================================",

            "📺 SERIES CATALOG",

            "=================================================",

            `🆔 Serien-ID: ${
                entry.seriesId
            }`,

            `🗃️ Episoden-ID: ${
                entry.episodeId ??
                "—"
            }`,

            `📺 Serie: ${
                entry.title
            }`,

            `📚 Staffel: ${
                entry.season ??
                "—"
            }`,

            `🎬 Episode: ${
                entry.episode ??
                "—"
            }`,

            `🏷️ Genres: ${
                entry.genres.join(
                    ", "
                )
            }`,

            `⭐ Hauptgenre: ${
                entry.primaryGenre
            }`,

            `📂 Kategorie: ${
                entry.categoryTitle
            }`,

            `🔥 Qualität: ${
                entry.quality ??
                "—"
            }`,

            `📺 Auflösung: ${
                entry.resolution ??
                "—"
            }`,

            `💿 Quelle: ${
                entry.source ??
                "—"
            }`,

            `🔊 Audio: ${
                entry.audio ??
                "—"
            }`,

            `🎧 Audio-Codec: ${
                entry.audioCodec ??
                "—"
            }`,

            `🔈 Kanäle: ${
                entry.audioChannels ??
                "—"
            }`,

            `🎥 Video-Codec: ${
                entry.videoCodec ??
                "—"
            }`,

            `🌈 HDR: ${
                entry.hdr ??
                "—"
            }`,

            `🆔 File-ID: ${
                entry.fileId
            }`,

            "================================================="

        ].join(
            "\n"
        );
    }

    // =========================================================================
    // GET ALL SERIES
    // =========================================================================

    public static getAllSeries():
        SeriesInfo[] {

        return Array.from(
            this.seriesCache.values()
        );
    }

    // =========================================================================
    // COUNT SERIES
    // =========================================================================

    public static countSeries():
        number {

        return this.seriesCache.size;
    }

    // =========================================================================
    // CLEAR CACHE
    // =========================================================================

    public static clearCache():
        void {

        this.seriesCache.clear();

        this.seriesSequence =
            0;
    }

    // =========================================================================
    // DEBUG PARSER
    // =========================================================================

    public static detect(
        fileName: string
    ): ParsedMedia {

        return FilenameParser.parse(
            fileName
        );
    }

    // =========================================================================
    // IS SERIES FILE
    // =========================================================================

    public static isSeriesFile(
        fileName: string
    ): boolean {

        return MediaTypeDetector.isSeries(
            fileName
        );
    }
}