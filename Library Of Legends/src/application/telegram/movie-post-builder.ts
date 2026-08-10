/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MoviePostBuilder

Architecture Layer..: Application

Module..............: Telegram

Module ID...........: LOL-MOD-TG-POST-0001

LOL-ID..............: LOL-TG-POST-MOV-0001

File................: movie-post-builder.ts

Location............
Library Of Legends/src/application/telegram/

Version.............: 4.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Telegram movie post builder for Library Of Legends.

Responsibilities:

- Build standardized movie posts
- Display movie title
- Display release year
- Display genres
- Display rating
- Display country
- Display runtime
- Display director
- Display story
- Display cast
- Display technical information
- Display archive ID
- Display category
- Build Telegram inline keyboards
- Support TMDB metadata
- Support missing metadata
- Keep Telegram presentation logic centralized
- Return Telegram-compatible post data

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
     * Show technical information.
     */
    showTechnicalInfo?: boolean;

    /**
     * Show archive information.
     */
    showArchiveInfo?: boolean;

    /**
     * Show movie synopsis.
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
export interface MoviePostButton {

    text: string;

    callbackData?: string;

    url?: string;
}

/**
 * Generated movie post.
 */
export interface MoviePost {

    caption: string;

    buttons: MoviePostButton[][];

    posterUrl?: string;

    backdropUrl?: string;

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
        options: MoviePostOptions = {}
    ): MoviePost {

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
                    movie
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

        const lines: string[] = [];

        // =====================================================================
        // GENRE
        // =====================================================================

        if (
            movie.genres &&
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
        // TMDB GENRE FALLBACK
        // =====================================================================

        if (
            (!movie.genres ||
                movie.genres.length === 0) &&
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
        // LANGUAGE
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
        movie: MovieCatalogEntry
    ): string {

        const lines: string[] = [];

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
                        String(
                            movie.quality
                        )
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
                        String(
                            movie.resolution
                        )
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
                        String(
                            movie.source
                        )
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
                `🎥 Video-Codec: ${
                    this.escapeHtml(
                        String(
                            movie.videoCodec
                        )
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
                        String(
                            movie.audio
                        )
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
                        String(
                            movie.audioCodec
                        )
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
                `🔈 Audiokanäle: ${
                    this.escapeHtml(
                        String(
                            movie.audioChannels
                        )
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
                        String(
                            movie.hdr
                        )
                    )
                }`
            );
        }

        // =====================================================================
        // FSK
        // =====================================================================

        const movieAny =
            movie as unknown as Record<
                string,
                unknown
            >;

        if (
            movieAny.fsk
        ) {

            lines.push(
                `🔞 FSK: ${
                    this.escapeHtml(
                        String(
                            movieAny.fsk
                        )
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
                `💾 Dateigröße: ${
                    this.formatFileSize(
                        Number(
                            movie.fileSize
                        )
                    )
                }`
            );
        }

        // =====================================================================
        // FILE NAME
        // =====================================================================

        if (
            movie.originalFileName
        ) {

            lines.push(
                `📄 Datei: <code>${
                    this.escapeHtml(
                        movie.originalFileName
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
        movie: MovieCatalogEntry
    ): string {

        const movieAny =
            movie as unknown as Record<
                string,
                unknown
            >;

        const archiveId =
            movieAny.archiveId ||
            movieAny.libraryId ||
            movieAny.id ||
            "—";

        const categoryTitle =
            movieAny.categoryTitle ||
            movieAny.category ||
            "📚 Allgemein";

        return [

            "🗃️ <b>Library Of Legends</b>",

            `🆔 Archive-ID: <code>${
                this.escapeHtml(
                    String(
                        archiveId
                    )
                )
            }</code>`,

            `📂 Kategorie: ${
                this.escapeHtml(
                    String(
                        categoryTitle
                    )
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
        showTmdbLink: boolean
    ): MoviePostButton[][] {

        const rows:
            MoviePostButton[][] = [];

        const movieAny =
            movie as unknown as Record<
                string,
                unknown
            >;

        const archiveId =
            String(
                movieAny.archiveId ||
                movieAny.libraryId ||
                movieAny.id ||
                ""
            );

        // =====================================================================
        // FAVORITE
        // =====================================================================

        if (
            archiveId
        ) {

            rows.push(
                [
                    {
                        text:
                            "⭐ Favorit",

                        callbackData:
                            `fav_${archiveId}`
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