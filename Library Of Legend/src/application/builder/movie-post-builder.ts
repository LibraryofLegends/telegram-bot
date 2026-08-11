/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MoviePostBuilder

Architecture Layer..: Application

Module..............: Builder

Module ID...........: LOL-MOD-APP-MOVIE-0001

LOL-ID..............: LOL-MOVIE-POST-0001

File................: movie-post-builder.ts

Location............
Library Of Legends/src/application/builder/

Version.............: 1.1.0

Status..............: Core

Lifecycle...........: Production

Description.........

Builds Telegram-compatible movie posts for Library Of Legends.

Responsibilities:

- Combine parser data
- Combine TMDB metadata
- Build structured movie caption
- Format file information
- Format rating
- Format genres
- Format synopsis
- Include TMDB poster information
- Guarantee Telegram-safe caption length

Telegram limitation:

Telegram photo captions are limited to 1024 characters after
entity parsing. The builder therefore keeps a safety margin and
automatically shortens long synopses.

===============================================================================
*/

// =============================================================================
// TYPES
// =============================================================================

export interface MoviePostInput {

    fileName:
        string;

    fileId:
        string;

    fileSize:
        number;

    parser: {

        title:
            string;

        year?:
            number;

        quality?:
            string;

        source?:
            string;
    };

    tmdb?: {

        id?:
            number;

        title:
            string;

        originalTitle?:
            string;

        year?:
            number;

        overview?:
            string;

        rating?:
            number;

        genres?:
            string[];

        posterUrl?:
            string;

        backdropUrl?:
            string;
    };
}

// =============================================================================
// OUTPUT
// =============================================================================

export interface MoviePost {

    caption:
        string;

    posterUrl?:
        string;

    backdropUrl?:
        string;
}

// =============================================================================
// MOVIE POST BUILDER
// =============================================================================

export class MoviePostBuilder {

    // =========================================================================
    // BUILD
    // =========================================================================

    public static build(
        input: MoviePostInput
    ): MoviePost {

        const parser =
            input.parser;

        const tmdb =
            input.tmdb;

        // =====================================================================
        // TITLE
        // =====================================================================

        const title =
            tmdb?.title ||
            parser.title ||
            "Unbekannter Titel";

        // =====================================================================
        // YEAR
        // =====================================================================

        const year =
            parser.year ||
            tmdb?.year ||
            undefined;

        // =====================================================================
        // RATING
        // =====================================================================

        const rating =
            tmdb?.rating !==
                undefined
                ? tmdb.rating.toFixed(
                    1
                )
                : "—";

        // =====================================================================
        // GENRES
        // =====================================================================

        const genres =
            tmdb?.genres &&
            tmdb.genres.length > 0
                ? tmdb.genres.join(
                    ", "
                )
                : "—";

        // =====================================================================
        // OVERVIEW
        // =====================================================================

        const overview =
            tmdb?.overview
                ? this.cleanText(
                    tmdb.overview
                )
                : "Keine Beschreibung verfügbar.";

        // =====================================================================
        // QUALITY
        // =====================================================================

        const quality =
            parser.quality ||
            "—";

        // =====================================================================
        // SOURCE
        // =====================================================================

        const source =
            parser.source ||
            "—";

        // =====================================================================
        // FILE SIZE
        // =====================================================================

        const fileSize =
            this.formatFileSize(
                input.fileSize
            );

        // =====================================================================
        // INITIAL CAPTION
        // =====================================================================

        const header =
            [
                `🎬 <b>${this.escapeHtml(
                    title
                )}${
                    year
                        ? ` (${year})`
                        : ""
                }</b>`,

                "",

                `⭐ Bewertung: ${rating}`,

                `🎭 Genres: ${this.escapeHtml(
                    genres
                )}`,

                ""
            ].join(
                "\n"
            );

        const technical =
            [
                `📦 Qualität: ${this.escapeHtml(
                    quality
                )}`,

                `💿 Quelle: ${this.escapeHtml(
                    source
                )}`,

                `📁 Datei: ${this.escapeHtml(
                    input.fileName
                )}`,

                `💾 Größe: ${this.escapeHtml(
                    fileSize
                )}`,

                "",

                "━━━━━━━━━━━━━━━━━━━━",

                "🔥 <b>Library Of Legends</b>"
            ].join(
                "\n"
            );

        const storyPrefix =
            "📖 ";

        // =====================================================================
        // CAPTION SAFETY
        // =====================================================================

        /*
         * Telegram allows at most 1024 characters for a photo caption
         * after entity parsing.
         *
         * We intentionally keep the generated HTML caption below that
         * limit to provide a safety margin.
         */

        const maximumCaptionLength =
            950;

        const reservedLength =
            (
                header.length +
                storyPrefix.length +
                technical.length +
                20
            );

        const availableOverviewLength =
            Math.max(
                100,
                maximumCaptionLength -
                reservedLength
            );

        const shortenedOverview =
            this.limitText(
                overview,
                availableOverviewLength
            );

        const caption =
            [
                header,

                `<b>📖 Handlung:</b>`,

                this.escapeHtml(
                    shortenedOverview
                ),

                "",

                technical
            ].join(
                "\n"
            );

        return {

            caption:
                this.ensureCaptionLimit(
                    caption,
                    maximumCaptionLength
                ),

            posterUrl:
                tmdb?.posterUrl,

            backdropUrl:
                tmdb?.backdropUrl
        };
    }

    // =========================================================================
    // CAPTION LIMIT
    // =========================================================================

    private static ensureCaptionLimit(
        caption: string,
        maximumLength: number
    ): string {

        const clean =
            String(
                caption ||
                ""
            ).trim();

        if (
            clean.length <=
            maximumLength
        ) {

            return clean;
        }

        return (
            clean
                .slice(
                    0,
                    maximumLength - 1
                )
                .trim() +
            "…"
        );
    }

    // =========================================================================
    // TEXT LIMIT
    // =========================================================================

    private static limitText(
        value: string,
        maxLength: number
    ): string {

        const text =
            String(
                value ||
                ""
            )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();

        if (
            text.length <=
            maxLength
        ) {

            return text;
        }

        /*
         * Prefer cutting at the last complete word.
         */

        const shortened =
            text.slice(
                0,
                Math.max(
                    1,
                    maxLength - 1
                )
            );

        const lastSpace =
            shortened.lastIndexOf(
                " "
            );

        if (
            lastSpace >
            Math.floor(
                maxLength * 0.7
            )
        ) {

            return (
                shortened
                    .slice(
                        0,
                        lastSpace
                    )
                    .trim() +
                "…"
            );
        }

        return (
            shortened.trim() +
            "…"
        );
    }

    // =========================================================================
    // CLEAN TEXT
    // =========================================================================

    private static cleanText(
        value: string
    ): string {

        return String(
            value ||
            ""
        )
            .replace(
                /\r\n/g,
                "\n"
            )
            .replace(
                /\r/g,
                "\n"
            )
            .replace(
                /[ \t]+/g,
                " "
            )
            .replace(
                /\n{3,}/g,
                "\n\n"
            )
            .trim();
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
            bytes <=
                0
        ) {

            return "unbekannt";
        }

        const units = [
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
            value >=
                1024 &&
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
    // HTML ESCAPE
    // =========================================================================

    private static escapeHtml(
        value: string
    ): string {

        return String(
            value ||
            ""
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
}