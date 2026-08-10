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

Version.............: 4.1.0

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

Compatibility:

- Uses SeriesCatalogEntry
- Does not require SeriesCatalogEntry.year
- Supports optional year through dynamic catalog metadata
- Supports TMDB year
- Supports optional technical metadata

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

    tmdb?: TMDBMetadata;

    showTechnicalInfo?: boolean;

    showArchiveInfo?: boolean;

    showSynopsis?: boolean;

    showCast?: boolean;

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

        const basicInfo =
            this.buildBasicInfo(
                series,
                tmdb
            );

        if (
            basicInfo
        ) {

            sections.push(
                basicInfo
            );
        }

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

            const technicalInfo =
                this.buildTechnicalInfo(
                    series
                );

            if (
                technicalInfo
            ) {

                sections.push(
                    technicalInfo
                );
            }
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

        /*
         * SeriesCatalogEntry currently does not expose "year".
         *
         * Therefore we intentionally read it as optional metadata.
         *
         * This avoids:
         *
         * TS2339:
         * Property 'year' does not exist on type 'SeriesCatalogEntry'.
         */

        const seriesData =
            series as unknown as Record<
                string,
                unknown
            >;

        const catalogYear =
            seriesData.year;

        const year =
            tmdb?.year ||
            (
                typeof catalogYear ===
                "number"
                    ? catalogYear
                    : undefined
            );

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

        } else if (
            tmdb?.genres &&
            tmdb.genres.length > 0
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

        if (
            !tmdb.cast ||
            tmdb.cast.length === 0
        ) {

            return "";
        }

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

        const seriesData =
            series as unknown as Record<
                string,
                unknown
            >;

        const lines: string[] = [];

        // =====================================================================
        // QUALITY
        // =====================================================================

        if (
            series.quality
        ) {

            lines.push(
                `🔥 <b>Qualität:</b> ${
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
                `📺 <b>Auflösung:</b> ${
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
                `💿 <b>Quelle:</b> ${
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
                `🎥 <b>Video-Codec:</b> ${
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
                `🔊 <b>Audio:</b> ${
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
                `🎧 <b>Audio-Codec:</b> ${
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
                `🔈 <b>Audiokanäle:</b> ${
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
                `🌈 <b>HDR:</b> ${
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

        if (
            seriesData.fsk
        ) {

            lines.push(
                `🔞 <b>FSK:</b> ${
                    this.escapeHtml(
                        String(
                            seriesData.fsk
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
                `💾 <b>Dateigröße:</b> ${
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
                `📄 <b>Datei:</b> <code>${
                    this.escapeHtml(
                        series.originalFileName
                    )
                }</code>`
            );
        }

        if (
            lines.length === 0
        ) {

            return "";
        }

        return [

            "📊 <b>Technische Informationen</b>",

            ...lines

        ].join(
            "\n"
        );
    }

    // =========================================================================
    // ARCHIVE INFORMATION
    // =========================================================================

    private static buildArchiveInfo(
        series: SeriesCatalogEntry
    ): string {

        const seriesData =
            series as unknown as Record<
                string,
                unknown
            >;

        const seriesId =
            seriesData.seriesId ||
            seriesData.libraryId ||
            seriesData.archiveId ||
            seriesData.id ||
            "—";

        const episodeId =
            seriesData.episodeId ||
            seriesData.episodeArchiveId ||
            "";

        const categoryTitle =
            seriesData.categoryTitle ||
            seriesData.category ||
            "📚 Allgemein";

        const lines: string[] = [

            "🗃️ <b>Library Of Legends</b>",

            `📚 <b>Serien-ID:</b> <code>${
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
                `🎬 <b>Episoden-ID:</b> <code>${
                    this.escapeHtml(
                        String(
                            episodeId
                        )
                    )
                }</code>`
            );
        }

        lines.push(
            `📂 <b>Kategorie:</b> ${
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

        const seriesData =
            series as unknown as Record<
                string,
                unknown
            >;

        const seriesId =
            String(
                seriesData.seriesId ||
                seriesData.libraryId ||
                seriesData.archiveId ||
                seriesData.id ||
                ""
            );

        const episodeId =
            String(
                seriesData.episodeId ||
                seriesData.episodeArchiveId ||
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