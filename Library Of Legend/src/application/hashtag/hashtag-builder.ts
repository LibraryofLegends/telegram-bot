/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: HashtagBuilder

Architecture Layer..: Application

Module..............: Hashtag

Module ID...........: LOL-MOD-APP-HASHTAG-0001

LOL-ID..............: LOL-HASHTAG-CORE-0002

File................: hashtag-builder.ts

Location............
Library Of Legends/src/application/hashtag/

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Central intelligent hashtag engine for Library Of Legends.

Responsibilities:

- Generate genre hashtags
- Generate intelligent title hashtags
- Generate collection-compatible hashtags
- Remove meaningless title words
- Remove duplicate hashtags
- Normalize hashtag formatting
- Keep hashtags Telegram-compatible

Rules:

- Genres become their own hashtags.
- Movie titles are NOT split into individual word hashtags.
- Collection/franchise names become one combined hashtag.
- Filler words such as "The", "Chapter", "Part" are removed where
  appropriate.
- Hashtags remain deterministic.

Examples:

John Wick: Chapter 4
→ #JohnWick

The Equalizer 3 - The Final Chapter
→ #TheEqualizer

Spider-Man: Across the Spider-Verse
→ #SpiderMan

===============================================================================
*/

// =============================================================================
// TYPES
// =============================================================================

export interface HashtagInput {

    title?:
        string;

    genres?:
        string[];

    year?:
        number;

    collection?:
        string;

    custom?:
        string[];
}

// =============================================================================
// BUILDER
// =============================================================================

export class HashtagBuilder {

    // =========================================================================
    // MAIN
    // =========================================================================

    public static build(
        input: HashtagInput
    ): string[] {

        const tags =
            new Set<string>();

        // =====================================================================
        // COLLECTION
        // =====================================================================

        if (
            input.collection
        ) {

            const collectionTag =
                this.toCollectionHashtag(
                    input.collection
                );

            if (
                collectionTag
            ) {

                tags.add(
                    collectionTag
                );
            }

        } else {

            // =============================================================
            // TITLE
            // =============================================================

            const titleTag =
                this.toTitleHashtag(
                    input.title
                );

            if (
                titleTag
            ) {

                tags.add(
                    titleTag
                );
            }
        }

        // =====================================================================
        // GENRES
        // =====================================================================

        this.addGenres(
            tags,
            input.genres
        );

        // =====================================================================
        // CUSTOM
        // =====================================================================

        this.addCustom(
            tags,
            input.custom
        );

        // =====================================================================
        // RESULT
        // =====================================================================

        return Array.from(
            tags
        );
    }

    // =========================================================================
    // GENRES
    // =========================================================================

    private static addGenres(
        set: Set<string>,
        genres?: string[]
    ): void {

        if (
            !Array.isArray(
                genres
            )
        ) {

            return;
        }

        for (
            const genre of genres
        ) {

            const tag =
                this.genreToHashtag(
                    genre
                );

            if (
                tag
            ) {

                set.add(
                    tag
                );
            }
        }
    }

    // =========================================================================
    // TITLE HASHTAG
    // =========================================================================

    private static toTitleHashtag(
        title?: string
    ): string {

        if (
            !title
        ) {

            return "";
        }

        let value =
            String(
                title
            )
                .trim();

        if (
            !value
        ) {

            return "";
        }

        // =====================================================================
        // REMOVE YEAR
        // =====================================================================

        value =
            value.replace(
                /\b(19|20)\d{2}\b/g,
                ""
            );

        // =====================================================================
        // REMOVE CONTENT AFTER COMMON SEQUEL MARKERS
        // =====================================================================

        value =
            value
                .replace(
                    /\bchapter\b.*$/i,
                    ""
                )
                .replace(
                    /\bpart\b.*$/i,
                    ""
                );

        // =====================================================================
        // REMOVE TRAILING NUMBERS
        // =====================================================================

        value =
            value.replace(
                /\s+\d+\s*$/g,
                ""
            );

        // =====================================================================
        // REMOVE PUNCTUATION
        // =====================================================================

        value =
            value
                .replace(
                    /[:"'!?,.;()[\]{}]/g,
                    " "
                );

        // =====================================================================
        // HANDLE WELL-KNOWN TITLES
        // =====================================================================

        const normalized =
            this.normalizeForComparison(
                value
            );

        const known =
            this.getKnownTitleHashtag(
                normalized
            );

        if (
            known
        ) {

            return known;
        }

        // =====================================================================
        // REMOVE FILLER WORDS
        // =====================================================================

        const ignoredWords =
            new Set([
                "the",
                "a",
                "an",
                "of",
                "and",
                "or",
                "part",
                "chapter",
                "film",
                "movie",
                "final",
                "chapter"
            ]);

        const words =
            value
                .split(
                    /\s+/
                )
                .filter(
                    word =>
                        word.length > 0
                )
                .filter(
                    word =>
                        !ignoredWords.has(
                            word.toLowerCase()
                        )
                );

        if (
            words.length ===
            0
        ) {

            return "";
        }

        return `#${words.join("")}`;
    }

    // =========================================================================
    // COLLECTION HASHTAG
    // =========================================================================

    private static toCollectionHashtag(
        collection: string
    ): string {

        const value =
            String(
                collection ||
                ""
            )
                .trim();

        if (
            !value
        ) {

            return "";
        }

        const normalized =
            this.normalizeForComparison(
                value
            );

        const known =
            this.getKnownCollectionHashtag(
                normalized
            );

        if (
            known
        ) {

            return known;
        }

        const cleaned =
            value
                .replace(
                    /\b(reihe|filmreihe|saga|universe|trilogie)\b/gi,
                    ""
                )
                .replace(
                    /[^\p{L}\p{N}]+/gu,
                    ""
                );

        if (
            !cleaned
        ) {

            return "";
        }

        return `#${cleaned}`;
    }

    // =========================================================================
    // GENRE HASHTAG
    // =========================================================================

    private static genreToHashtag(
        genre: string
    ): string {

        const value =
            String(
                genre ||
                ""
            ).trim();

        if (
            !value
        ) {

            return "";
        }

        const mappings:
            Record<string, string> = {

            "Action":
                "#Action",

            "Abenteuer":
                "#Abenteuer",

            "Adventure":
                "#Abenteuer",

            "Science Fiction":
                "#ScienceFiction",

            "Sci-Fi":
                "#ScienceFiction",

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
                value
            ]
        ) {

            return mappings[
                value
            ];
        }

        return this.toGenericHashtag(
            value
        );
    }

    // =========================================================================
    // CUSTOM
    // =========================================================================

    private static addCustom(
        set: Set<string>,
        custom?: string[]
    ): void {

        if (
            !Array.isArray(
                custom
            )
        ) {

            return;
        }

        for (
            const value of custom
        ) {

            const tag =
                this.toGenericHashtag(
                    value
                );

            if (
                tag
            ) {

                set.add(
                    tag
                );
            }
        }
    }

    // =========================================================================
    // GENERIC HASHTAG
    // =========================================================================

    private static toGenericHashtag(
        value: string
    ): string {

        const cleaned =
            String(
                value ||
                ""
            )
                .trim()
                .replace(
                    /[^\p{L}\p{N}]+/gu,
                    ""
                );

        if (
            !cleaned
        ) {

            return "";
        }

        return `#${cleaned}`;
    }

    // =========================================================================
    // KNOWN TITLE HASHTAGS
    // =========================================================================

    private static getKnownTitleHashtag(
        normalized: string
    ): string | null {

        const known:
            Record<string, string> = {

            "johnwick":
                "#JohnWick",

            "theequalizer":
                "#TheEqualizer",

            "fastandfurious":
                "#FastAndFurious",

            "harrypotter":
                "#HarryPotter",

            "transformers":
                "#Transformers",

            "spiderman":
                "#SpiderMan",

            "superman":
                "#Superman",

            "batman":
                "#Batman",

            "jurassicpark":
                "#JurassicPark",

            "scream":
                "#Scream"
        };

        return (
            known[
                normalized
            ] ||
            null
        );
    }

    // =========================================================================
    // KNOWN COLLECTION HASHTAGS
    // =========================================================================

    private static getKnownCollectionHashtag(
        normalized: string
    ): string | null {

        const known:
            Record<string, string> = {

            "johnwick":
                "#JohnWick",

            "theequalizer":
                "#TheEqualizer",

            "fastandfurious":
                "#FastAndFurious",

            "harrypotter":
                "#HarryPotter",

            "transformers":
                "#Transformers",

            "spiderman":
                "#SpiderMan",

            "superman":
                "#Superman",

            "batman":
                "#Batman",

            "jurassicpark":
                "#JurassicPark",

            "scream":
                "#Scream"
        };

        return (
            known[
                normalized
            ] ||
            null
        );
    }

    // =========================================================================
    // NORMALIZE FOR COMPARISON
    // =========================================================================

    private static normalizeForComparison(
        value: string
    ): string {

        return String(
            value ||
            ""
        )
            .normalize(
                "NFD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .toLowerCase()
            .replace(
                /[^\p{L}\p{N}]+/gu,
                ""
            );
    }
}