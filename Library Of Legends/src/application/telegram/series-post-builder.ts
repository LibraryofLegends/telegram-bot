/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SeriesPostBuilder

Architecture Layer..: Application

Module..............: Telegram

Module ID...........: LOL-MOD-TG-POST-0002

LOL-ID..............: LOL-TG-POST-SER-0001

File................: series-post-builder.ts

Location............
Library Of Legends/src/application/telegram/

Version.............: 4.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Telegram series post builder for Library Of Legends.

Responsibilities:

- Build standardized series posts
- Display series title
- Display release year
- Display season
- Display episode
- Display genres
- Display rating
- Display country
- Display runtime
- Display status
- Display number of seasons
- Display number of episodes
- Display story
- Display cast
- Display technical information
- Display series archive ID
- Display episode archive ID
- Display category
- Build Telegram inline keyboards
- Support TMDB metadata
- Support missing metadata
- Keep Telegram presentation logic centralized
- Return Telegram-compatible post data

===============================================================================
*/

import {
    SeriesCatalogEntry
} from "../../domain/catalog/series-catalog";

import {
    TMDBMetadata
} from "../../infrastructure/tmdb/tmdb-client";

/**
 * Options for series post generation.
 */
export interface SeriesPostOptions {

    /**
     * Optional TMDB metadata.
     */
    tmdb?: TMDBMetadata;

    /**
     * Show technical information.
     */
    showTechnicalInfo?: boolean;

    /**
     * Show archive information.
     */
    showArchiveInfo?: boolean;

    /**
     * Show series synopsis.
     */
    showSynopsis?: boolean;

    /**
     * Show cast.
     */
    showCast?: boolean;

    /**
     * Show TMDB button.
     */
    showTmdbLink?: boolean;
}

/**
 * Telegram button definition.
 */
export interface SeriesPostButton {

    text: string;

    callbackData?: string;

    url?: string;
}

/**
 * Generated series post.
 */
export interface SeriesPost {

    caption: string;

    buttons: SeriesPostButton[][];

    posterUrl?: string;

    backdropUrl?: string;

    parseMode: "HTML";
}

/**
 * Series post builder.
 */
export class SeriesPostBuilder {

    // =========================================================================
    // BUILD
    // =========================================================================

    public static build(
        series: SeriesCatalogEntry,
        options: SeriesPostOptions = {}
    ): SeriesPost {

        const tmdb =
            options.tmdb;

        const showTechnicalInfo =
            options.showTechnicalInfo !== false;

        const showArchiveInfo =
            options.showArchiveInfo !== false;

        const showSynopsis =
            options.showSynopsis !== false;

        const showCast =
            options.showCast === true;

        const showTmdbLink =
            options.showTmdbLink !== false;

        const sections: string[] = [];

        // =====================================================================
        // HEADER
        // =====================================================================

        sections.push(
            this.buildHeader(
                series,
                tmdb
            )
        );

        // =====================================================================
        // BASIC INFORMATION
        // =====================================================================

        sections.push(
            this.buildBasicInfo(
                series,
                tmdb
            )
        );

        // =====================================================================
        // STORY
        // =====================================================================

        if (
            showSynopsis &&
            tmdb?.overview
        ) {

            sections.push(
                this.buildSynopsis(
                    tmdb.overview
                )
            );
        }

        // =====================================================================
        // CAST
        // =====================================================================

        if (
            showCast &&
            tmdb?.cast?.length
        ) {

            sections.push(
                this.buildCast(
                    tmdb
                )
            );
        }

        // =====================================================================
        // TECHNICAL
        // =====================================================================

        if (
            showTechnicalInfo
        ) {

            sections.push(
                this.buildTechnicalInfo(
                    series
                )
            );
        }

        // =====================================================================
        // ARCHIVE
        // =====================================================================

        if (
            showArchiveInfo
        ) {

            sections.push(
                this.buildArchiveInfo(
                    series
                )
            );
        }

        // =====================================================================
        // FOOTER
        // =====================================================================

        sections.push(
            this.buildFooter()
        );

        // =====================================================================
        // BUTTONS
        // =====================================================================

        const buttons =
            this.buildButtons(
                series,
                tmdb,
                showTmdbLink
            );

        return {

            caption:
                sections
                    .filter(
                        section =>
                            Boolean(
                                section
                            )
                    )
                    .join(
                        "\n\n"
                    ),

            buttons,

            posterUrl:
                tmdb?.posterUrl,

            backdropUrl:
                tmdb?.backdropUrl,

            parseMode:
                "HTML"
        };
    }

    // =========================================================================
    // HEADER
    // =========================================================================

    private static buildHeader(
        series: SeriesCatalogEntry,
        tmdb?: TMDBMetadata
    ): string {

        const title =
            this.escapeHtml(
                tmdb?.title ||
                series.title
            );

        const year =
            tmdb?.year ||
            series.year;

        const yearText =
            year
                ? ` <b>(${year})</b>`
                : "";

        const episodeText =
            this.formatSeasonEpisode(
                series.season,
                series.episode
            );

        return [

            `📺 <b>${title}</b>${yearText}`,

            episodeText
                ? `🎬 <b>${episodeText}</b>`
                : "",

            "━━━━━━━━━━━━━━━━━━"

        ]
            .filter(
                Boolean
            )
            .join(
                "\n"
            );
    }

    // =========================================================================
    // BASIC INFORMATION
    // =========================================================================

    private static buildBasicInfo(
        series: SeriesCatalogEntry,
        tmdb?: TMDBMetadata
    ): string {

        const lines: string[] = [];

        // =====================================================================
        // GENRE
        // =====================================================================

        if (
            series.genres &&
            series.genres.length > 0
        ) {

            lines.push(
                `🏷️ <b>Genre:</b> ${
                    this.escapeHtml(
                        series.genres.join(
                            " • "
                        )
                    )
                }`
            );
        }

        // =====================================================================
        // TMDB GENRE FALLBACK
        // =====================================================================

        if (
            (!series.genres ||
                series.genres.length === 0) &&
            tmdb?.genres?.length
        ) {

            lines.push(
                `🏷️ <b>Genre:</b> ${
                    this.escapeHtml(
                        tmdb.genres
                            .map(
                                genre =>
                                    genre.name
                            )
                            .join(
                                " • "
                            )
                    )
                }`
            );
        }

        // =====================================================================
        // RATING
        // =====================================================================

        if (
            tmdb?.rating !== undefined
        ) {

            lines.push(
                `⭐ <b>Bewertung:</b> ${
                    tmdb.rating.toFixed(
                        1
                    )
                } / 10`
            );
        }

        // =====================================================================
        // COUNTRY
        // =====================================================================

        if (
            tmdb?.countries &&
            tmdb.countries.length > 0
        ) {

            lines.push(
                `🌍 <b>Land:</b> ${
                    this.escapeHtml(
                        tmdb.countries.join(
                            ", "
                        )
                    )
                }`
            );
        }

        // =====================================================================
        // RUNTIME
        // =====================================================================

        if (
            tmdb?.runtime
        ) {

            lines.push(
                `⏱️ <b>Laufzeit:</b> ${
                    tmdb.runtime
                } Min.`
            );
        }

        // =====================================================================
        // NUMBER OF SEASONS
        // =====================================================================

        if (
            tmdb?.numberOfSeasons
        ) {

            lines.push(
                `📚 <b>Staffeln:</b> ${
                    tmdb.numberOfSeasons
                }`
            );
        }

        // =====================================================================
        // NUMBER OF EPISODES
        // =====================================================================

        if (
            tmdb?.numberOfEpisodes
        ) {

            lines.push(
                `🎞️ <b>Episoden:</b> ${
                    tmdb.numberOfEpisodes
                }`
            );
        }

        // =====================================================================
        // STATUS
        // =====================================================================

        if (
            tmdb?.status
        ) {

            lines.push(
                `📡 <b>Status:</b> ${
                    this.escapeHtml(
                        tmdb.status
                    )
                }`
            );
        }

        // =====================================================================
        // ORIGINAL TITLE
        // =====================================================================

        if (
            tmdb?.originalTitle &&
            tmdb.originalTitle !==
                tmdb.title
        ) {

            lines.push(
                `🎞️ <b>Originaltitel:</b> ${
                    this.escapeHtml(
                        tmdb.originalTitle
                    )
                }`
            );
        }

        // =====================================================================
        // ORIGINAL LANGUAGE
        // =====================================================================

        if (
            tmdb?.originalLanguage
        ) {

            lines.push(
                `🗣️ <b>Originalsprache:</b> ${
                    this.escapeHtml(
                        tmdb.originalLanguage
                    )
                }`
            );
        }

        return lines.join(
            "\n"
        );
    }

    // =========================================================================
    // SYNOPSIS
    // =========================================================================

    private static buildSynopsis(
        overview: string
    ): string {

        return [

            "📖 <b>Story</b>",

            this.escapeHtml(
                this.limitText(
                    overview,
                    1500
                )
            )

        ].join(
            "\n"
        );
    }

    // =========================================================================
    // CAST
    // =========================================================================

    private static buildCast(
        tmdb: TMDBMetadata
    ): string {

        const cast =
            tmdb.cast
                .slice(
                    0,
                    10
                )
                .map(
                    person => {

                        const name =
                            this.escapeHtml(
                                person.name
                            );

                        if (
                            person.character
                        ) {

                            return `${name} (${this.escapeHtml(
                                person.character
                            )})`;
                        }

                        return name;
                    }
                )
                .join(
                    " • "
                );

        if (
            !cast
        ) {

            return "";
        }

        return [

            "🎭 <b>Besetzung</b>",

            cast

        ].join(
            "\n"
        );
    }

    // =========================================================================
    // TECHNICAL INFORMATION
    // =========================================================================

    private static buildTechnicalInfo(
        series: SeriesCatalogEntry
    ): string {

        const lines: string[] = [];

        lines.push(
            "📊 <b>Technische Informationen</b>"
        );

        // =====================================================================
        // QUALITY
        // =====================================================================

        if (
            series.quality
        ) {

            lines.push(
                `🔥 Qualität: ${
                    this.escapeHtml(
                        String(
                            series.quality
                        )
                    )
                }`
            );
        }

        // =====================================================================
        // RESOLUTION
        // =====================================================================

        if (
            series.resolution
        ) {

            lines.push(
                `📺 Auflösung: ${
                    this.escapeHtml(
                        String(
                            series.resolution
                        )
                    )
                }`
            );
        }

        // =====================================================================
        // SOURCE
        // =====================================================================

        if (
            series.source
        ) {

            lines.push(
                `💿 Quelle: ${
                    this.escapeHtml(
                        String(
                            series.source
                        )
                    )
                }`
            );
        }

        // =====================================================================
        // VIDEO CODEC
        // =====================================================================

        if (
            series.videoCodec
        ) {

            lines.push(
                `🎥 Video-Codec: ${
                    this.escapeHtml(
                        String(
                            series.videoCodec
                        )
                    )
                }`
            );
        }

        // =====================================================================
        // AUDIO
        // =====================================================================

        if (
            series.audio
        ) {

            lines.push(
                `🔊 Audio: ${
                    this.escapeHtml(
                        String(
                            series.audio
                        )
                    )
                }`
            );
        }

        // =====================================================================
        // AUDIO CODEC
        // =====================================================================

        if (
            series.audioCodec
        ) {

            lines.push(
                `🎧 Audio-Codec: ${
                    this.escapeHtml(
                        String(
                            series.audioCodec
                        )
                    )
                }`
            );
        }

        // =====================================================================
        // AUDIO CHANNELS
        // =====================================================================

        if (
            series.audioChannels
        ) {

            lines.push(
                `🔈 Audiokanäle: ${
                    this.escapeHtml(
                        String(
                            series.audioChannels
                        )
                    )
                }`
            );
        }

        // =====================================================================
        // HDR
        // =====================================================================

        if (
            series.hdr
        ) {

            lines.push(
                `🌈 HDR: ${
                    this.escapeHtml(
                        String(
                            series.hdr
                        )
                    )
                }`
            );
        }

        // =====================================================================
        // FSK
        // =====================================================================

        const seriesAny =
            series as unknown as Record<
                string,
                unknown
            >;

        if (
            seriesAny.fsk
        ) {

            lines.push(
                `🔞 FSK: ${
                    this.escapeHtml(
                        String(
                            seriesAny.fsk
                        )
                    )
                }`
            );
        }

        // =====================================================================
        // FILE SIZE
        // =====================================================================

        if (
            series.fileSize
        ) {

            lines.push(
                `💾 Dateigröße: ${
                    this.formatFileSize(
                        Number(
                            series.fileSize
                        )
                    )
                }`
            );
        }

        // =====================================================================
        // FILE NAME
        // =====================================================================

        if (
            series.originalFileName
        ) {

            lines.push(
                `📄 Datei: <code>${
                    this.escapeHtml(
                        series.originalFileName
                    )
                }</code>`
            );
        }

        return lines.join(
            "\n"
        );
    }

    // =========================================================================
    // ARCHIVE INFORMATION
    // =========================================================================

    private static buildArchiveInfo(
        series: SeriesCatalogEntry
    ): string {

        const seriesAny =
            series as unknown as Record<
                string,
                unknown
            >;

        const seriesId =
            seriesAny.seriesId ||
            seriesAny.libraryId ||
            seriesAny.archiveId ||
            seriesAny.id ||
            "—";

        const episodeId =
            seriesAny.episodeId ||
            seriesAny.episodeArchiveId ||
            "";

        const categoryTitle =
            seriesAny.categoryTitle ||
            seriesAny.category ||
            "📚 Allgemein";

        const lines: string[] = [

            "🗃️ <b>Library Of Legends</b>",

            `📚 Serien-ID: <code>${
                this.escapeHtml(
                    String(
                        seriesId
                    )
                )
            }</code>`

        ];

        if (
            episodeId
        ) {

            lines.push(
                `🎬 Episoden-ID: <code>${
                    this.escapeHtml(
                        String(
                            episodeId
                        )
                    )
                }</code>`
            );
        }

        lines.push(
            `📂 Kategorie: ${
                this.escapeHtml(
                    String(
                        categoryTitle
                    )
                )
            }`
        );

        return lines.join(
            "\n"
        );
    }

    // =========================================================================
    // FOOTER
    // =========================================================================

    private static buildFooter(): string {

        return [

            "━━━━━━━━━━━━━━━━━━",

            "📺 <b>Library Of Legends</b>"

        ].join(
            "\n"
        );
    }

    // =========================================================================
    // BUTTONS
    // =========================================================================

    private static buildButtons(
        series: SeriesCatalogEntry,
        tmdb: TMDBMetadata | undefined,
        showTmdbLink: boolean
    ): SeriesPostButton[][] {

        const rows:
            SeriesPostButton[][] = [];

        const seriesAny =
            series as unknown as Record<
                string,
                unknown
            >;

        const seriesId =
            String(
                seriesAny.seriesId ||
                seriesAny.libraryId ||
                seriesAny.archiveId ||
                seriesAny.id ||
                ""
            );

        const episodeId =
            String(
                seriesAny.episodeId ||
                seriesAny.episodeArchiveId ||
                ""
            );

        // =====================================================================
        // SERIES
        // =====================================================================

        if (
            seriesId
        ) {

            rows.push(
                [
                    {
                        text:
                            "📺 Serie",

                        callbackData:
                            `series_${seriesId}`
                    }
                ]
            );
        }

        // =====================================================================
        // FAVORITE
        // =====================================================================

        const favoriteId =
            episodeId ||
            seriesId;

        if (
            favoriteId
        ) {

            rows.push(
                [
                    {
                        text:
                            "⭐ Favorit",

                        callbackData:
                            `fav_${favoriteId}`
                    }
                ]
            );
        }

        // =====================================================================
        // TMDB
        // =====================================================================

        if (
            tmdb &&
            showTmdbLink
        ) {

            rows.push(
                [
                    {
                        text:
                            "🎞️ TMDB",

                        url:
                            `https://www.themoviedb.org/${tmdb.mediaType}/${tmdb.id}`
                    }
                ]
            );
        }

        return rows;
    }

    // =========================================================================
    // SHORT VERSION
    // =========================================================================

    public static buildShort(
        series: SeriesCatalogEntry,
        tmdb?: TMDBMetadata
    ): SeriesPost {

        return this.build(
            series,
            {
                tmdb,

                showTechnicalInfo:
                    false,

                showArchiveInfo:
                    true,

                showSynopsis:
                    true,

                showCast:
                    false,

                showTmdbLink:
                    true
            }
        );
    }

    // =========================================================================
    // FULL VERSION
    // =========================================================================

    public static buildFull(
        series: SeriesCatalogEntry,
        tmdb?: TMDBMetadata
    ): SeriesPost {

        return this.build(
            series,
            {
                tmdb,

                showTechnicalInfo:
                    true,

                showArchiveInfo:
                    true,

                showSynopsis:
                    true,

                showCast:
                    true,

                showTmdbLink:
                    true
            }
        );
    }

    // =========================================================================
    // CAPTION ONLY
    // =========================================================================

    public static buildCaption(
        series: SeriesCatalogEntry,
        tmdb?: TMDBMetadata
    ): string {

        return this.buildFull(
            series,
            tmdb
        ).caption;
    }

    // =========================================================================
    // FORMAT SEASON / EPISODE
    // =========================================================================

    private static formatSeasonEpisode(
        season?: number,
        episode?: number
    ): string {

        if (
            season === undefined &&
            episode === undefined
        ) {

            return "";
        }

        if (
            season !== undefined &&
            episode !== undefined
        ) {

            return `S${String(
                season
            ).padStart(
                2,
                "0"
            )}E${String(
                episode
            ).padStart(
                2,
                "0"
            )}`;
        }

        if (
            season !== undefined
        ) {

            return `S${String(
                season
            ).padStart(
                2,
                "0"
            )}`;
        }

        return `E${String(
            episode
        ).padStart(
            2,
            "0"
        )}`;
    }

    // =========================================================================
    // ESCAPE HTML
    // =========================================================================

    private static escapeHtml(
        value: string
    ): string {

        return String(
            value
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#39;"
            );
    }

    // =========================================================================
    // LIMIT TEXT
    // =========================================================================

    private static limitText(
        value: string,
        maxLength: number
    ): string {

        const text =
            String(
                value || ""
            ).trim();

        if (
            text.length <=
            maxLength
        ) {

            return text;
        }

        return (
            text
                .slice(
                    0,
                    maxLength - 1
                )
                .trim() +
            "…"
        );
    }

    // =========================================================================
    // FORMAT FILE SIZE
    // =========================================================================

    private static formatFileSize(
        bytes: number
    ): string {

        if (
            !Number.isFinite(
                bytes
            ) ||
            bytes <= 0
        ) {

            return "—";
        }

        const units =
            [
                "B",
                "KB",
                "MB",
                "GB",
                "TB"
            ];

        let value =
            bytes;

        let index =
            0;

        while (
            value >= 1024 &&
            index <
                units.length - 1
        ) {

            value /=
                1024;

            index++;
        }

        return `${value.toFixed(
            index === 0
                ? 0
                : 2
        )} ${units[index]}`;
    }

    // =========================================================================
    // DEBUG
    // =========================================================================

    public static describe(
        series: SeriesCatalogEntry,
        tmdb?: TMDBMetadata
    ): string {

        const post =
            this.buildFull(
                series,
                tmdb
            );

        return [

            "=================================================",

            "📝 SERIES POST BUILDER",

            "=================================================",

            post.caption,

            "=================================================",

            `🔘 Button-Zeilen: ${
                post.buttons.length
            }`,

            `🖼 Poster: ${
                post.posterUrl ||
                "—"
            }`,

            `🖼 Backdrop: ${
                post.backdropUrl ||
                "—"
            }`,

            "================================================="

        ].join(
            "\n"
        );
    }
}