/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SeriesPostBuilder

Architecture Layer..: Application

Module..............: Post Builder

Module ID...........: LOL-MOD-POST-0002

LOL-ID..............: LOL-POST-SER-0001

File................: series-post-builder.ts

Location............
Library Of Legends/src/application/post-builder/

Version.............: 3.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Telegram series post builder for Library Of Legends.

Responsibilities:

- Build standardized series posts
- Display series metadata
- Display season and episode
- Display series archive ID
- Display episode archive ID
- Display genres
- Display TMDB metadata
- Display technical media information
- Build Telegram captions
- Build inline keyboard data
- Keep presentation logic outside TelegramBot
- Provide safe fallbacks for missing metadata

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
     * Whether technical information should be displayed.
     */
    showTechnicalInfo?: boolean;

    /**
     * Whether archive information should be displayed.
     */
    showArchiveInfo?: boolean;

    /**
     * Whether synopsis should be displayed.
     */
    showSynopsis?: boolean;

    /**
     * Whether cast should be displayed.
     */
    showCast?: boolean;

    /**
     * Whether TMDB button should be displayed.
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
 * Complete generated series post.
 */
export interface SeriesPost {

    /**
     * Telegram caption.
     */
    caption: string;

    /**
     * Inline keyboard.
     */
    buttons: SeriesPostButton[][];

    /**
     * Poster URL.
     */
    posterUrl?: string;

    /**
     * Backdrop URL.
     */
    backdropUrl?: string;

    /**
     * Telegram parse mode.
     */
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
        options:
            SeriesPostOptions = {}
    ): SeriesPost {

        const tmdb =
            options.tmdb;

        const showTechnical =
            options.showTechnicalInfo !==
            false;

        const showArchive =
            options.showArchiveInfo !==
            false;

        const showSynopsis =
            options.showSynopsis !==
            false;

        const showCast =
            options.showCast ===
            true;

        const sections:
            string[] = [];

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
        // SYNOPSIS
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
            showTechnical
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
            showArchive
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
                tmdb
            );

        return {

            caption:
                sections
                    .filter(
                        Boolean
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

        return [

            `📺 <b>${title}</b>`,

            "━━━━━━━━━━━━━━━━━━"

        ].join(
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

        const lines:
            string[] = [];

        // =====================================================================
        // SEASON / EPISODE
        // =====================================================================

        const seasonEpisode =
            this.formatSeasonEpisode(
                series.season,
                series.episode
            );

        if (
            seasonEpisode
        ) {

            lines.push(
                `🎬 <b>Episode:</b> ${
                    seasonEpisode
                }`
            );
        }

        // =====================================================================
        // GENRE
        // =====================================================================

        if (
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
        // YEAR
        // =====================================================================

        if (
            tmdb?.year
        ) {

            lines.push(
                `📅 <b>Startjahr:</b> ${
                    tmdb.year
                }`
            );
        }

        // =====================================================================
        // SEASONS
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
        // EPISODES
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
        // COUNTRIES
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
                    8
                )
                .map(
                    person =>
                        this.escapeHtml(
                            person.name
                        )
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

        const lines:
            string[] = [];

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
                        series.quality
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
                        series.resolution
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
                        series.source
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
                `🎥 Video: ${
                    this.escapeHtml(
                        series.videoCodec
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
                        series.audio
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
                        series.audioCodec
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
                `🔈 Kanäle: ${
                    this.escapeHtml(
                        series.audioChannels
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
                        series.hdr
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
                `💾 Größe: ${
                    this.formatFileSize(
                        series.fileSize
                    )
                }`
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

        const lines:
            string[] = [

            "🗃️ <b>Library Of Legends</b>",

            `📚 Serien-ID: <code>${
                this.escapeHtml(
                    series.seriesId
                )
            }</code>`
        ];

        if (
            series.episodeId
        ) {

            lines.push(
                `🎬 Episoden-ID: <code>${
                    this.escapeHtml(
                        series.episodeId
                    )
                }</code>`
            );
        }

        lines.push(
            `📂 Kategorie: ${
                this.escapeHtml(
                    series.categoryTitle
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
        tmdb?: TMDBMetadata
    ): SeriesPostButton[][] {

        const rows:
            SeriesPostButton[][] = [];

        // =====================================================================
        // SERIES BUTTON
        // =====================================================================

        rows.push(
            [
                {
                    text:
                        "📺 Serie",

                    callbackData:
                        `series_${series.seriesId}`
                }
            ]
        );

        // =====================================================================
        // FAVORITE
        // =====================================================================

        rows.push(
            [
                {
                    text:
                        "⭐ Favorit",

                    callbackData:
                        `fav_${series.episodeId || series.seriesId}`
                }
            ]
        );

        // =====================================================================
        // TMDB
        // =====================================================================

        if (
            tmdb
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
            text.slice(
                0,
                maxLength - 1
            ).trim() +
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
                post.posterUrl ??
                "—"
            }`,

            "================================================="

        ].join(
            "\n"
        );
    }
}