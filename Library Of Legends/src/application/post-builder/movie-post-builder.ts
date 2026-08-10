/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MoviePostBuilder

Architecture Layer..: Application

Module..............: Post Builder

Module ID...........: LOL-MOD-POST-0001

LOL-ID..............: LOL-POST-MOV-0001

File................: movie-post-builder.ts

Location............
Library Of Legends/src/application/post-builder/

Version.............: 3.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Telegram movie post builder for Library Of Legends.

Responsibilities:

- Build standardized movie posts
- Format movie metadata
- Display archive IDs
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
    MovieCatalogEntry
} from "../../domain/catalog/movie-catalog";

import {
    TMDBMetadata
} from "../../infrastructure/tmdb/tmdb-client";

/**
 * Options for movie post generation.
 */
export interface MoviePostOptions {

    /**
     * Optional TMDB metadata.
     */
    tmdb?: TMDBMetadata;

    /**
     * Whether technical information should be shown.
     */
    showTechnicalInfo?: boolean;

    /**
     * Whether archive information should be shown.
     */
    showArchiveInfo?: boolean;

    /**
     * Whether the synopsis should be shown.
     */
    showSynopsis?: boolean;

    /**
     * Whether the cast should be shown.
     */
    showCast?: boolean;

    /**
     * Whether a TMDB link should be shown.
     */
    showTmdbLink?: boolean;

    /**
     * Telegram bot username.
     */
    botUsername?: string;
}

/**
 * Telegram button definition.
 */
export interface MoviePostButton {

    text: string;

    callbackData?: string;

    url?: string;
}

/**
 * Complete generated movie post.
 */
export interface MoviePost {

    /**
     * Telegram caption.
     */
    caption: string;

    /**
     * Inline keyboard.
     */
    buttons: MoviePostButton[][];

    /**
     * Poster URL.
     */
    posterUrl?: string;

    /**
     * Backdrop URL.
     */
    backdropUrl?: string;

    /**
     * Parse mode.
     */
    parseMode: "HTML";
}

/**
 * Movie post builder.
 */
export class MoviePostBuilder {

    // =========================================================================
    // BUILD
    // =========================================================================

    public static build(
        movie: MovieCatalogEntry,
        options:
            MoviePostOptions = {}
    ): MoviePost {

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

        const showTmdbLink =
            options.showTmdbLink !==
            false;

        const sections:
            string[] = [];

        // =====================================================================
        // HEADER
        // =====================================================================

        sections.push(
            this.buildHeader(
                movie,
                tmdb
            )
        );

        // =====================================================================
        // BASIC INFORMATION
        // =====================================================================

        sections.push(
            this.buildBasicInfo(
                movie,
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
                    movie
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
                    movie
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
                movie,
                tmdb,
                options
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
        movie: MovieCatalogEntry,
        tmdb?: TMDBMetadata
    ): string {

        const title =
            this.escapeHtml(
                tmdb?.title ||
                movie.title
            );

        const year =
            tmdb?.year ||
            movie.year;

        const yearText =
            year
                ? ` <b>(${year})</b>`
                : "";

        return [

            `🎬 <b>${title}</b>${yearText}`,

            "━━━━━━━━━━━━━━━━━━"

        ].join(
            "\n"
        );
    }

    // =========================================================================
    // BASIC INFORMATION
    // =========================================================================

    private static buildBasicInfo(
        movie: MovieCatalogEntry,
        tmdb?: TMDBMetadata
    ): string {

        const lines:
            string[] = [];

        // =====================================================================
        // GENRE
        // =====================================================================

        if (
            movie.genres.length > 0
        ) {

            lines.push(
                `🏷️ <b>Genre:</b> ${
                    this.escapeHtml(
                        movie.genres.join(
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
        // DIRECTOR
        // =====================================================================

        if (
            tmdb?.director
        ) {

            lines.push(
                `🎥 <b>Regie:</b> ${
                    this.escapeHtml(
                        tmdb.director
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

        const text =
            this.escapeHtml(
                this.limitText(
                    overview,
                    1500
                )
            );

        return [

            "📖 <b>Story</b>",

            text

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
        movie: MovieCatalogEntry
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
            movie.quality
        ) {

            lines.push(
                `🔥 Qualität: ${
                    this.escapeHtml(
                        movie.quality
                    )
                }`
            );
        }

        // =====================================================================
        // RESOLUTION
        // =====================================================================

        if (
            movie.resolution
        ) {

            lines.push(
                `📺 Auflösung: ${
                    this.escapeHtml(
                        movie.resolution
                    )
                }`
            );
        }

        // =====================================================================
        // SOURCE
        // =====================================================================

        if (
            movie.source
        ) {

            lines.push(
                `💿 Quelle: ${
                    this.escapeHtml(
                        movie.source
                    )
                }`
            );
        }

        // =====================================================================
        // VIDEO CODEC
        // =====================================================================

        if (
            movie.videoCodec
        ) {

            lines.push(
                `🎥 Video: ${
                    this.escapeHtml(
                        movie.videoCodec
                    )
                }`
            );
        }

        // =====================================================================
        // AUDIO
        // =====================================================================

        if (
            movie.audio
        ) {

            lines.push(
                `🔊 Audio: ${
                    this.escapeHtml(
                        movie.audio
                    )
                }`
            );
        }

        // =====================================================================
        // AUDIO CODEC
        // =====================================================================

        if (
            movie.audioCodec
        ) {

            lines.push(
                `🎧 Audio-Codec: ${
                    this.escapeHtml(
                        movie.audioCodec
                    )
                }`
            );
        }

        // =====================================================================
        // AUDIO CHANNELS
        // =====================================================================

        if (
            movie.audioChannels
        ) {

            lines.push(
                `🔈 Kanäle: ${
                    this.escapeHtml(
                        movie.audioChannels
                    )
                }`
            );
        }

        // =====================================================================
        // HDR
        // =====================================================================

        if (
            movie.hdr
        ) {

            lines.push(
                `🌈 HDR: ${
                    this.escapeHtml(
                        movie.hdr
                    )
                }`
            );
        }

        // =====================================================================
        // FILE SIZE
        // =====================================================================

        if (
            movie.fileSize
        ) {

            lines.push(
                `💾 Größe: ${
                    this.formatFileSize(
                        movie.fileSize
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
        movie: MovieCatalogEntry
    ): string {

        return [

            "🗃️ <b>Library Of Legends</b>",

            `🆔 Archive-ID: <code>${
                this.escapeHtml(
                    movie.archiveId
                )
            }</code>`,

            `📂 Kategorie: ${
                this.escapeHtml(
                    movie.categoryTitle
                )
            }`

        ].join(
            "\n"
        );
    }

    // =========================================================================
    // FOOTER
    // =========================================================================

    private static buildFooter(): string {

        return [

            "━━━━━━━━━━━━━━━━━━",

            "🎬 <b>Library Of Legends</b>"

        ].join(
            "\n"
        );
    }

    // =========================================================================
    // BUTTONS
    // =========================================================================

    private static buildButtons(
        movie: MovieCatalogEntry,
        tmdb: TMDBMetadata | undefined,
        options: MoviePostOptions
    ): MoviePostButton[][] {

        const rows:
            MoviePostButton[][] = [];

        // =====================================================================
        // FAVORITE
        // =====================================================================

        rows.push(
            [
                {
                    text:
                        "⭐ Favorit",

                    callbackData:
                        `fav_${movie.archiveId}`
                }
            ]
        );

        // =====================================================================
        // TMDB
        // =====================================================================

        if (
            tmdb &&
            options.showTmdbLink !==
            false
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
        movie: MovieCatalogEntry,
        tmdb?: TMDBMetadata
    ): MoviePost {

        return this.build(
            movie,
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
        movie: MovieCatalogEntry,
        tmdb?: TMDBMetadata
    ): MoviePost {

        return this.build(
            movie,
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
        movie: MovieCatalogEntry,
        tmdb?: TMDBMetadata
    ): string {

        return this.buildFull(
            movie,
            tmdb
        ).caption;
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
        movie: MovieCatalogEntry,
        tmdb?: TMDBMetadata
    ): string {

        const post =
            this.buildFull(
                movie,
                tmdb
            );

        return [

            "=================================================",

            "📝 MOVIE POST BUILDER",

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