/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: TextFormatter

Architecture Layer..: Application

Module..............: Formatter

Module ID...........: LOL-MOD-APP-FMT-0001

LOL-ID..............: LOL-TEXT-FORMATTER-0001

File................: text-formatter.ts

Location............
Library Of Legend/src/application/formatter/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Central text formatter for Library Of Legends.

Responsibilities:

- Format movie titles
- Format ratings
- Format genres
- Generate genre hashtags
- Format story text
- Shorten stories at complete sentence boundaries
- Format technical information
- Escape Telegram HTML
- Keep formatted text Telegram-compatible

Design principle:

The formatter contains presentation logic only.

It does NOT:

- access Telegram
- access TMDB
- access the database
- parse filenames
- generate archive IDs

===============================================================================
*/

// =============================================================================
// TYPES
// =============================================================================

export interface TextFormatterMovieData {

    title:
        string;

    year?:
        number;

    rating?:
        number;

    genres?:
        string[];

    overview?:
        string;

    quality?:
        string;

    fileSize?:
        string;

    audio?:
        string;

    source?:
        string;

    archiveId?:
        string;

    category?:
        string;
}

// =============================================================================
// TEXT FORMATTER
// =============================================================================

export class TextFormatter {

    // =========================================================================
    // MOVIE TITLE
    // =========================================================================

    public static formatMovieTitle(
        title: string,
        year?: number
    ): string {

        const cleanTitle =
            this.cleanText(
                title
            );

        if (
            year !==
            undefined
        ) {

            return `🎬 <b>${this.escapeHtml(
                cleanTitle
            )} (${year})</b>`;
        }

        return `🎬 <b>${this.escapeHtml(
            cleanTitle
        )}</b>`;
    }

    // =========================================================================
    // RATING
    // =========================================================================

    public static formatRating(
        rating?: number
    ): string {

        if (
            rating ===
            undefined ||
            !Number.isFinite(
                rating
            )
        ) {

            return "⭐ Bewertung: —";
        }

        return `⭐ Bewertung: ${rating.toFixed(
            1
        )}/10`;
    }

    // =========================================================================
    // GENRES
    // =========================================================================

    public static formatGenres(
        genres?: string[]
    ): string {

        const cleanGenres =
            this.normalizeGenres(
                genres
            );

        if (
            cleanGenres.length ===
            0
        ) {

            return "🎭 Genres: —";
        }

        return [
            "🎭 Genres:",
            cleanGenres
                .map(
                    genre =>
                        this.escapeHtml(
                            genre
                        )
                )
                .join(
                    ", "
                )
        ].join(
            " "
        );
    }

    // =========================================================================
    // GENRE HASHTAGS
    // =========================================================================

    public static buildGenreHashtags(
        genres?: string[]
    ): string {

        const cleanGenres =
            this.normalizeGenres(
                genres
            );

        if (
            cleanGenres.length ===
            0
        ) {

            return "";
        }

        const hashtags =
            cleanGenres
                .map(
                    genre =>
                        this.genreToHashtag(
                            genre
                        )
                )
                .filter(
                    Boolean
                );

        if (
            hashtags.length ===
            0
        ) {

            return "";
        }

        return hashtags.join(
            " "
        );
    }

    // =========================================================================
    // STORY
    // =========================================================================

    public static formatStory(
        overview?: string,
        maximumLength: number = 420
    ): string {

        const story =
            this.buildCompleteSynopsis(
                overview,
                maximumLength
            );

        return [
            "📝 <b>Handlung:</b>",
            this.escapeHtml(
                story
            )
        ].join(
            "\n"
        );
    }

    // =========================================================================
    // TECHNICAL INFORMATION
    // =========================================================================

    public static formatTechnicalInfo(
        data: {
            quality?: string;
            fileSize?: string;
            audio?: string;
            source?: string;
        }
    ): string {

        const quality =
            this.cleanOptional(
                data.quality
            );

        const fileSize =
            this.cleanOptional(
                data.fileSize
            );

        const audio =
            this.cleanOptional(
                data.audio
            );

        const source =
            this.cleanOptional(
                data.source
            );

        /*
         * Primary compact format:
         *
         * 📦 FHD · 3.78 GB · Deutsch
         *
         * Source is only added when it exists.
         */

        const parts =
            [
                quality,
                fileSize,
                audio
            ]
                .filter(
                    Boolean
                );

        if (
            source
        ) {

            parts.push(
                source
            );
        }

        return [
            "📦",
            parts.length > 0
                ? parts.join(
                    " · "
                )
                : "—"
        ].join(
            " "
        );
    }

    // =========================================================================
    // ARCHIVE
    // =========================================================================

    public static formatArchive(
        archiveId?: string,
        category?: string,
        genres?: string[]
    ): string {

        const hashtags =
            this.buildGenreHashtags(
                genres
            );

        const parts:
            string[] = [];

        if (
            archiveId
        ) {

            parts.push(
                `<code>${this.escapeHtml(
                    archiveId
                )}</code>`
            );
        }

        if (
            category
        ) {

            parts.push(
                this.genreToHashtag(
                    category
                )
            );
        }

        if (
            hashtags
        ) {

            parts.push(
                hashtags
            );
        }

        if (
            parts.length ===
            0
        ) {

            return "🗂️ Archiv: —";
        }

        return `🗂️ Archiv: ${
            parts.join(
                " "
            )
        }`;
    }

    // =========================================================================
    // FOOTER
    // =========================================================================

    public static formatFooter(): string {

        return "🔥 <b>@LibraryOfLegends</b>";
    }

    // =========================================================================
    // SEPARATOR
    // =========================================================================

    public static separator(): string {

        return "━━━━━━━━━━━━━━━━━━";
    }

    // =========================================================================
    // COMPLETE MOVIE CAPTION
    // =========================================================================

    public static formatMovieCaption(
        data: TextFormatterMovieData
    ): string {

        const title =
            this.formatMovieTitle(
                data.title,
                data.year
            );

        const rating =
            this.formatRating(
                data.rating
            );

        const genres =
            this.formatGenres(
                data.genres
            );

        const story =
            this.formatStory(
                data.overview
            );

        const technical =
            this.formatTechnicalInfo({
                quality:
                    data.quality,

                fileSize:
                    data.fileSize,

                audio:
                    data.audio,

                source:
                    data.source
            });

        const hashtags =
            this.buildGenreHashtags(
                data.genres
            );

        const archive =
            this.formatArchive(
                data.archiveId,
                data.category
            );

        const footer =
            this.formatFooter();

        const sections:
            string[] = [

            this.separator(),

            title,

            this.separator(),

            rating,

            genres,

            this.separator(),

            "",

            story,

            "",

            this.separator(),

            technical,

            this.separator(),

            archive,

            hashtags
                ? `🏷️ ${hashtags}`
                : "",

            footer
        ];

        return sections
            .filter(
                section =>
                    section !== ""
            )
            .join(
                "\n"
            )
            .trim();
    }

    // =========================================================================
    // COMPLETE SENTENCE SYNOPSIS
    // =========================================================================

    private static buildCompleteSynopsis(
        overview?: string,
        maximumLength: number = 420
    ): string {

        const text =
            this.cleanText(
                overview ||
                "Keine Beschreibung verfügbar."
            );

        if (
            text.length <=
            maximumLength
        ) {

            return this.ensureFinalSentence(
                text
            );
        }

        /*
         * First attempt:
         * Find the last complete sentence inside the limit.
         */

        const shortened =
            text.slice(
                0,
                maximumLength
            );

        const matches =
            shortened.match(
                /[^.!?]*[.!?](?=\s|$)/g
            );

        if (
            matches &&
            matches.length > 0
        ) {

            let completeText =
                matches.join(
                    ""
                ).trim();

            /*
             * Prevent a uselessly short result.
             */

            if (
                completeText.length >=
                140
            ) {

                return this.ensureFinalSentence(
                    completeText
                );
            }
        }

        /*
         * Second attempt:
         * Allow a little more space to reach the next sentence.
         */

        const extendedLimit =
            maximumLength +
            120;

        const extended =
            text.slice(
                0,
                extendedLimit
            );

        const extendedMatches =
            extended.match(
                /[^.!?]*[.!?](?=\s|$)/g
            );

        if (
            extendedMatches &&
            extendedMatches.length > 0
        ) {

            const completeText =
                extendedMatches
                    .join(
                        ""
                    )
                    .trim();

            if (
                completeText.length <=
                extendedLimit
            ) {

                return this.ensureFinalSentence(
                    completeText
                );
            }
        }

        /*
         * Final fallback:
         * Cut at the last complete word and add a period.
         */

        const wordSafe =
            shortened
                .slice(
                    0,
                    Math.max(
                        1,
                        shortened.length -
                        1
                    )
                )
                .trim();

        const lastSpace =
            wordSafe.lastIndexOf(
                " "
            );

        const fallback =
            lastSpace > 0
                ? wordSafe.slice(
                    0,
                    lastSpace
                ).trim()
                : wordSafe;

        return this.ensureFinalSentence(
            fallback
        );
    }

    // =========================================================================
    // ENSURE FINAL SENTENCE
    // =========================================================================

    private static ensureFinalSentence(
        value: string
    ): string {

        const text =
            String(
                value ||
                ""
            ).trim();

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
    // NORMALIZE GENRES
    // =========================================================================

    private static normalizeGenres(
        genres?: string[]
    ): string[] {

        if (
            !Array.isArray(
                genres
            )
        ) {

            return [];
        }

        return genres
            .map(
                genre =>
                    this.cleanText(
                        String(
                            genre ||
                            ""
                        )
                    )
            )
            .filter(
                Boolean
            )
            .filter(
                (
                    genre,
                    index,
                    array
                ) =>
                    array.indexOf(
                        genre
                    ) ===
                    index
            );
    }

    // =========================================================================
    // GENRE → HASHTAG
    // =========================================================================

    private static genreToHashtag(
        value: string
    ): string {

        const normalized =
            this.cleanText(
                value
            );

        if (
            !normalized
        ) {

            return "";
        }

        /*
         * Special German / TMDB genre mappings.
         */

        const mappings:
            Record<
                string,
                string
            > = {

            "Science Fiction":
                "#ScienceFiction",

            "Sci-Fi":
                "#ScienceFiction",

            "Action":
                "#Action",

            "Abenteuer":
                "#Abenteuer",

            "Adventure":
                "#Abenteuer",

            "Animation":
                "#Animation",

            "Komödie":
                "#Komödie",

            "Comedy":
                "#Komödie",

            "Drama":
                "#Drama",

            "Horror":
                "#Horror",

            "Thriller":
                "#Thriller",

            "Krimi":
                "#Krimi",

            "Crime":
                "#Krimi",

            "Mystery":
                "#Mystery",

            "Fantasy":
                "#Fantasy",

            "Romantik":
                "#Romantik",

            "Romance":
                "#Romantik",

            "Familie":
                "#Familie",

            "Family":
                "#Familie",

            "Musik":
                "#Musik",

            "Music":
                "#Musik",

            "Western":
                "#Western",

            "Historie":
                "#Historie",

            "History":
                "#Historie"
        };

        if (
            mappings[
                normalized
            ]
        ) {

            return mappings[
                normalized
            ];
        }

        /*
         * Generic fallback:
         *
         * Science Fiction → #ScienceFiction
         * Action & Abenteuer → #ActionAbenteuer
         */

        const hashtagBody =
            normalized
                .replace(
                    /[^\p{L}\p{N}]+/gu,
                    ""
                );

        if (
            !hashtagBody
        ) {

            return "";
        }

        return `#${hashtagBody}`;
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
    // OPTIONAL VALUE
    // =========================================================================

    private static cleanOptional(
        value?: string
    ): string {

        const text =
            String(
                value ||
                ""
            ).trim();

        return text ||
            "—";
    }

    // =========================================================================
    // HTML ESCAPE
    // =========================================================================

    public static escapeHtml(
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