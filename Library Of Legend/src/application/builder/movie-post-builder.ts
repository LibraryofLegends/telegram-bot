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
Library Of Legend/src/application/builder/

Version.............: 1.2.0

Status..............: Core

Lifecycle...........: Production

Description.........

Builds the final Telegram movie archive layout for Library Of Legends.

Responsibilities:

- Combine parser data
- Combine TMDB metadata
- Build standardized movie layout
- Format rating
- Format genres
- Format synopsis
- Format technical information
- Keep Telegram photo captions below the platform limit
- Shorten long synopsis text at complete sentence boundaries
- Ensure synopsis ends with a complete sentence

Movie presentation structure:

1. Movie title
2. Rating
3. Genres
4. Story
5. Technical information
6. Library Of Legends footer

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
            tmdb?.year;

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
        // TECHNICAL
        // =====================================================================

        const quality =
            parser.quality ||
            "—";

        const source =
            parser.source ||
            "—";

        const fileSize =
            this.formatFileSize(
                input.fileSize
            );

        // =====================================================================
        // HEADER
        // =====================================================================

        const header =
            [
                "━━━━━━━━━━━━━━━━━━",

                `🎬 <b>${this.escapeHtml(
                    title
                )}${
                    year
                        ? ` (${year})`
                        : ""
                }</b>`,

                "━━━━━━━━━━━━━━━━━━",

                `⭐ Bewertung: ${rating}/10`,

                `🎭 Genres: ${this.escapeHtml(
                    genres
                )}`,

                "━━━━━━━━━━━━━━━━━━"
            ].join(
                "\n"
            );

        // =====================================================================
        // TECHNICAL SECTION
        // =====================================================================

        const technical =
            [
                `📦 ${this.escapeHtml(
                    quality
                )} · ${this.escapeHtml(
                    fileSize
                )} · ${this.escapeHtml(
                    this.getAudioPlaceholder()
                )}`,

                "━━━━━━━━━━━━━━━━━━",

                "🔥 <b>Library Of Legends</b>"
            ].join(
                "\n"
            );

        // =====================================================================
        // CAPTION SAFETY
        // =====================================================================

        /*
         * Telegram photo captions have a hard size limit.
         *
         * We use a lower internal target to keep enough safety margin.
         */

        const maximumCaptionLength =
            950;

        const fixedLength =
            (
                header.length +
                technical.length +
                60
            );

        const availableStoryLength =
            Math.max(
                220,
                maximumCaptionLength -
                fixedLength
            );

        const story =
            this.buildCompleteSynopsis(
                overview,
                availableStoryLength
            );

        // =====================================================================
        // STORY
        // =====================================================================

        const storySection =
            [
                "📝 <b>Handlung:</b>",

                this.escapeHtml(
                    story
                ),

                "━━━━━━━━━━━━━━━━━━"
            ].join(
                "\n"
            );

        // =====================================================================
        // FINAL CAPTION
        // =====================================================================

        const caption =
            [
                header,

                "",

                storySection,

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
    // COMPLETE SENTENCE SYNOPSIS
    // =========================================================================

    private static buildCompleteSynopsis(
        overview: string,
        maxLength: number
    ): string {

        const text =
            this.cleanText(
                overview
            );

        if (
            text.length <=
            maxLength
        ) {

            return this.ensureFinalPeriod(
                text
            );
        }

        const shortened =
            text.slice(
                0,
                maxLength
            );

        /*
         * Find the last complete sentence.
         *
         * Supported endings:
         * .
         * !
         * ?
         */

        const sentenceMatches =
            shortened.match(
                /.*?[.!?](?=\s|$)/g
            );

        if (
            sentenceMatches &&
            sentenceMatches.length > 0
        ) {

            const completeText =
                sentenceMatches.join(
                    " "
                )
                    .trim();

            if (
                completeText.length >= 120
            ) {

                return this.ensureFinalPeriod(
                    completeText
                );
            }
        }

        /*
         * If the available text does not contain a sufficiently long
         * complete sentence, expand the search until the next sentence.
         */

        const nextSentenceEnd =
            text.search(
                /[.!?](?=\s|$)/
            );

        if (
            nextSentenceEnd >=
            0 &&
            nextSentenceEnd <
                text.length
        ) {

            const candidate =
                text.slice(
                    0,
                    nextSentenceEnd + 1
                )
                    .trim();

            if (
                candidate.length <=
                maxLength + 150
            ) {

                return this.ensureFinalPeriod(
                    candidate
                );
            }
        }

        /*
         * Absolute fallback:
         * Cut at the last word and add a period.
         *
         * This fallback should rarely be needed for normal TMDB overviews.
         */

        const fallback =
            shortened
                .slice(
                    0,
                    Math.max(
                        1,
                        shortened.length - 1
                    )
                )
                .trim();

        const lastSpace =
            fallback.lastIndexOf(
                " "
            );

        const cleanFallback =
            lastSpace > 0
                ? fallback.slice(
                    0,
                    lastSpace
                ).trim()
                : fallback;

        return this.ensureFinalPeriod(
            cleanFallback
        );
    }

    // =========================================================================
    // FINAL PERIOD
    // =========================================================================

    private static ensureFinalPeriod(
        value: string
    ): string {

        const text =
            String(
                value ||
                ""
            )
                .trim();

        if (
            !text
        ) {

            return "Keine Beschreibung verfügbar.";
        }

        if (
            /[.!?]$/.test(
                text
            )
        ) {

            return text;
        }

        return `${text}.`;
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
                /\n+/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }

    // =========================================================================
    // TELEGRAM CAPTION LIMIT
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

        const shortened =
            clean.slice(
                0,
                maximumLength
            );

        const lastNewline =
            shortened.lastIndexOf(
                "\n"
            );

        if (
            lastNewline >
            maximumLength - 120
        ) {

            return shortened
                .slice(
                    0,
                    lastNewline
                )
                .trim();
        }

        return shortened
            .trim();
    }

    // =========================================================================
    // FILE SIZE
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

            return "—";
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
    // AUDIO PLACEHOLDER
    // =========================================================================

    private static getAudioPlaceholder():
        string {

        return "—";
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