/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: HashtagBuilder

Architecture Layer..: Application

Module..............: Hashtag

Module ID...........: LOL-MOD-APP-HASHTAG-0001

LOL-ID..............: LOL-HASHTAG-0001

File................: hashtag-builder.ts

Location............
Library Of Legend/src/application/hashtag/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Generates intelligent hashtags for Library Of Legends.

Responsibilities:

- Build genre hashtags
- Build title hashtags
- Normalize hashtags
- Remove duplicates
- Keep hashtags Telegram safe

===============================================================================
*/

// =============================================================================
// TYPES
// =============================================================================

export interface HashtagInput {

    title?: string;

    genres?: string[];

    year?: number;

    collection?: string;

    custom?: string[];
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

        const tags = new Set<string>();

        // Genres
        this.addGenres(
            tags,
            input.genres
        );

        // Title
        this.addTitle(
            tags,
            input.title
        );

        // Collection (optional)
        this.addCollection(
            tags,
            input.collection
        );

        // Custom
        this.addCustom(
            tags,
            input.custom
        );

        return Array.from(tags);
    }

    // =========================================================================
    // GENRES
    // =========================================================================

    private static addGenres(
        set: Set<string>,
        genres?: string[]
    ): void {

        if (!genres) return;

        for (const genre of genres) {

            const tag =
                this.genreToHashtag(
                    genre
                );

            if (tag) {
                set.add(tag);
            }
        }
    }

    // =========================================================================
    // TITLE
    // =========================================================================

    private static addTitle(
        set: Set<string>,
        title?: string
    ): void {

        if (!title) return;

        const cleaned =
            title
                .replace(/\(.*?\)/g, "")
                .replace(/[^\p{L}\p{N} ]+/gu, "")
                .trim();

        const words =
            cleaned.split(" ");

        for (const word of words) {

            if (
                word.length < 4
            ) continue;

            const tag =
                `#${word}`;

            set.add(tag);
        }
    }

    // =========================================================================
    // COLLECTION
    // =========================================================================

    private static addCollection(
        set: Set<string>,
        collection?: string
    ): void {

        if (!collection) return;

        const tag =
            this.toHashtag(
                collection
            );

        if (tag) {
            set.add(tag);
        }
    }

    // =========================================================================
    // CUSTOM
    // =========================================================================

    private static addCustom(
        set: Set<string>,
        custom?: string[]
    ): void {

        if (!custom) return;

        for (const entry of custom) {

            const tag =
                this.toHashtag(
                    entry
                );

            if (tag) {
                set.add(tag);
            }
        }
    }

    // =========================================================================
    // GENRE → HASHTAG
    // =========================================================================

    private static genreToHashtag(
        value: string
    ): string {

        const map: Record<string, string> = {

            "Science Fiction": "#ScienceFiction",
            "Sci-Fi": "#ScienceFiction",

            "Action": "#Action",
            "Abenteuer": "#Abenteuer",
            "Adventure": "#Abenteuer",

            "Animation": "#Animation",

            "Komödie": "#Komödie",
            "Comedy": "#Komödie",

            "Drama": "#Drama",
            "Horror": "#Horror",
            "Thriller": "#Thriller",

            "Krimi": "#Krimi",
            "Crime": "#Krimi",

            "Mystery": "#Mystery",
            "Fantasy": "#Fantasy",

            "Romantik": "#Romantik",
            "Romance": "#Romantik",

            "Familie": "#Familie",
            "Family": "#Familie"
        };

        if (map[value]) {
            return map[value];
        }

        return this.toHashtag(value);
    }

    // =========================================================================
    // GENERIC HASHTAG
    // =========================================================================

    private static toHashtag(
        value: string
    ): string {

        if (!value) return "";

        const cleaned =
            value
                .replace(/[^\p{L}\p{N}]+/gu, "")
                .trim();

        if (!cleaned) return "";

        return `#${cleaned}`;
    }
}