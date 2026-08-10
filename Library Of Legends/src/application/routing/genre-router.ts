/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: GenreRouter

Architecture Layer..: Application

Module..............: Routing

Module ID...........: LOL-MOD-ROU-0001

LOL-ID..............: LOL-ROU-GEN-0001

File................: genre-router.ts

Location............
Library Of Legends/src/application/routing/

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Central routing engine for the Library Of Legends media archive.

Determines the correct archive category for movies and series
based on automatically detected genres.

Responsibilities:

- Determine primary category
- Determine secondary categories
- Normalize genre combinations
- Determine Telegram destination
- Support category-specific Telegram chat IDs
- Support Telegram forum topics
- Provide category names for post generation
- Provide routing information to TelegramBot
- Keep unknown content in Allgemein
- Prevent invalid genre routing

Telegram communication itself remains in the Telegram layer.

===============================================================================
*/

import {
    LibraryGenre
} from "../../domain/detection/genre-detector";

/**
 * Available Library Of Legends archive categories.
 */
export type LibraryCategory =
    | "ACTION_ABENTEUER"
    | "HORROR_THRILLER"
    | "SCI_FI_FANTASY"
    | "DRAMA_ROMANTIK"
    | "KOMEDIE_FAMILIE"
    | "ANIMATION_ANIME"
    | "MYSTERY_KRIMI"
    | "DOKUMENTATION_BIOGRAFIE"
    | "WESTERN"
    | "MUSIK"
    | "KINDER"
    | "ALLGEMEIN";

/**
 * Telegram routing information.
 */
export interface GenreRoute {

    /**
     * Internal Library Of Legends category.
     */
    category: LibraryCategory;

    /**
     * Human-readable category title.
     */
    categoryTitle: string;

    /**
     * All detected genres.
     */
    genres: LibraryGenre[];

    /**
     * Primary genre.
     */
    primaryGenre: LibraryGenre;

    /**
     * Telegram destination chat.
     */
    telegramChatId?: string;

    /**
     * Telegram forum topic.
     */
    topicId?: number;

    /**
     * Whether a valid Telegram destination exists.
     */
    hasTelegramDestination: boolean;

    /**
     * Whether this route uses a Telegram forum topic.
     */
    usesForumTopic: boolean;
}

/**
 * Genre Router
 */
export class GenreRouter {

    // =========================================================================
    // CATEGORY TITLES
    // =========================================================================

    private static readonly CATEGORY_TITLES: Record<
        LibraryCategory,
        string
    > = {

        ACTION_ABENTEUER:
            "🎬 Action & Abenteuer",

        HORROR_THRILLER:
            "👻 Horror & Thriller",

        SCI_FI_FANTASY:
            "🤖 Sci-Fi & Fantasy",

        DRAMA_ROMANTIK:
            "🎭 Drama & Romantik",

        KOMEDIE_FAMILIE:
            "😂 Komödie & Familie",

        ANIMATION_ANIME:
            "🎨 Animation & Anime",

        MYSTERY_KRIMI:
            "🕵️ Mystery & Krimi",

        DOKUMENTATION_BIOGRAFIE:
            "🏞️ Dokumentationen & Biografien",

        WESTERN:
            "🤠 Western",

        MUSIK:
            "🎵 Musik",

        KINDER:
            "🧸 Kinder",

        ALLGEMEIN:
            "📚 Allgemein"
    };

    // =========================================================================
    // CATEGORY ENVIRONMENT VARIABLES
    // =========================================================================

    private static readonly CATEGORY_ENV_KEYS: Record<
        LibraryCategory,
        string
    > = {

        ACTION_ABENTEUER:
            "CATEGORY_ACTION_ID",

        HORROR_THRILLER:
            "CATEGORY_HORROR_ID",

        SCI_FI_FANTASY:
            "CATEGORY_SCIFI_ID",

        DRAMA_ROMANTIK:
            "CATEGORY_DRAMA_ID",

        KOMEDIE_FAMILIE:
            "CATEGORY_COMEDY_ID",

        ANIMATION_ANIME:
            "CATEGORY_ANIMATION_ID",

        MYSTERY_KRIMI:
            "CATEGORY_MYSTERY_ID",

        DOKUMENTATION_BIOGRAFIE:
            "CATEGORY_DOCUMENTARY_ID",

        WESTERN:
            "CATEGORY_WESTERN_ID",

        MUSIK:
            "CATEGORY_MUSIC_ID",

        KINDER:
            "CATEGORY_KIDS_ID",

        ALLGEMEIN:
            "LIBRARY_CHANNEL_ID"
    };

    // =========================================================================
    // CATEGORY PRIORITY
    // =========================================================================

    private static readonly CATEGORY_PRIORITY: LibraryCategory[] = [

        "ACTION_ABENTEUER",

        "HORROR_THRILLER",

        "SCI_FI_FANTASY",

        "DRAMA_ROMANTIK",

        "KOMEDIE_FAMILIE",

        "ANIMATION_ANIME",

        "MYSTERY_KRIMI",

        "DOKUMENTATION_BIOGRAFIE",

        "WESTERN",

        "MUSIK",

        "KINDER",

        "ALLGEMEIN"
    ];

    // =========================================================================
    // ROUTE
    // =========================================================================

    public static route(
        genres: LibraryGenre[]
    ): GenreRoute {

        const safeGenres =
            this.normalizeGenres(
                genres
            );

        const primaryGenre =
            this.detectPrimaryGenre(
                safeGenres
            );

        const category =
            this.detectCategory(
                safeGenres
            );

        const telegramChatId =
            this.getTelegramChatId(
                category
            );

        const topicId =
            this.getTopicId(
                category
            );

        return {

            category,

            categoryTitle:
                this.getCategoryTitle(
                    category
                ),

            genres:
                safeGenres,

            primaryGenre,

            telegramChatId,

            topicId,

            hasTelegramDestination:
                Boolean(
                    telegramChatId
                ),

            usesForumTopic:
                topicId !== undefined
        };
    }

    // =========================================================================
    // ROUTE FROM PRIMARY GENRE
    // =========================================================================

    public static routeFromGenre(
        genre: LibraryGenre
    ): GenreRoute {

        return this.route(
            [genre]
        );
    }

    // =========================================================================
    // DETECT PRIMARY GENRE
    // =========================================================================

    public static detectPrimaryGenre(
        genres: LibraryGenre[]
    ): LibraryGenre {

        const priority: LibraryGenre[] = [

            "Action",
            "Horror",
            "Thriller",
            "Sci-Fi",
            "Fantasy",
            "Abenteuer",
            "Krimi",
            "Mystery",
            "Drama",
            "Romantik",
            "Komödie",
            "Familie",
            "Animation",
            "Anime",
            "Dokumentation",
            "Biografie",
            "Western",
            "Musik",
            "Kinder",
            "Unbekannt"
        ];

        for (
            const genre of priority
        ) {

            if (
                genres.includes(
                    genre
                )
            ) {

                return genre;
            }
        }

        return "Unbekannt";
    }

    // =========================================================================
    // DETECT CATEGORY
    // =========================================================================

    public static detectCategory(
        genres: LibraryGenre[]
    ): LibraryCategory {

        const normalized =
            new Set<LibraryGenre>(
                this.normalizeGenres(
                    genres
                )
            );

        // =====================================================================
        // ACTION / ADVENTURE
        // =====================================================================

        if (
            normalized.has("Action") ||
            normalized.has("Abenteuer")
        ) {

            return "ACTION_ABENTEUER";
        }

        // =====================================================================
        // HORROR / THRILLER
        // =====================================================================

        if (
            normalized.has("Horror") ||
            normalized.has("Thriller")
        ) {

            return "HORROR_THRILLER";
        }

        // =====================================================================
        // SCI-FI / FANTASY
        // =====================================================================

        if (
            normalized.has("Sci-Fi") ||
            normalized.has("Fantasy")
        ) {

            return "SCI_FI_FANTASY";
        }

        // =====================================================================
        // DRAMA / ROMANCE
        // =====================================================================

        if (
            normalized.has("Drama") ||
            normalized.has("Romantik")
        ) {

            return "DRAMA_ROMANTIK";
        }

        // =====================================================================
        // COMEDY / FAMILY
        // =====================================================================

        if (
            normalized.has("Komödie") ||
            normalized.has("Familie")
        ) {

            return "KOMEDIE_FAMILIE";
        }

        // =====================================================================
        // ANIMATION / ANIME
        // =====================================================================

        if (
            normalized.has("Animation") ||
            normalized.has("Anime")
        ) {

            return "ANIMATION_ANIME";
        }

        // =====================================================================
        // MYSTERY / CRIME
        // =====================================================================

        if (
            normalized.has("Mystery") ||
            normalized.has("Krimi")
        ) {

            return "MYSTERY_KRIMI";
        }

        // =====================================================================
        // DOCUMENTARY / BIOGRAPHY
        // =====================================================================

        if (
            normalized.has("Dokumentation") ||
            normalized.has("Biografie")
        ) {

            return "DOKUMENTATION_BIOGRAFIE";
        }

        // =====================================================================
        // WESTERN
        // =====================================================================

        if (
            normalized.has("Western")
        ) {

            return "WESTERN";
        }

        // =====================================================================
        // MUSIC
        // =====================================================================

        if (
            normalized.has("Musik")
        ) {

            return "MUSIK";
        }

        // =====================================================================
        // KIDS
        // =====================================================================

        if (
            normalized.has("Kinder")
        ) {

            return "KINDER";
        }

        // =====================================================================
        // DEFAULT
        // =====================================================================

        return "ALLGEMEIN";
    }

    // =========================================================================
    // NORMALIZE GENRES
    // =========================================================================

    public static normalizeGenres(
        genres: LibraryGenre[]
    ): LibraryGenre[] {

        if (
            !Array.isArray(
                genres
            )
        ) {

            return [
                "Unbekannt"
            ];
        }

        const validGenres =
            new Set<LibraryGenre>([
                "Action",
                "Abenteuer",
                "Horror",
                "Thriller",
                "Sci-Fi",
                "Fantasy",
                "Drama",
                "Romantik",
                "Komödie",
                "Familie",
                "Animation",
                "Anime",
                "Mystery",
                "Krimi",
                "Dokumentation",
                "Biografie",
                "Western",
                "Musik",
                "Kinder",
                "Unbekannt"
            ]);

        const result: LibraryGenre[] = [];

        for (
            const genre of genres
        ) {

            if (
                validGenres.has(
                    genre
                )
            ) {

                if (
                    !result.includes(
                        genre
                    )
                ) {

                    result.push(
                        genre
                    );
                }
            }
        }

        if (
            result.length === 0
        ) {

            result.push(
                "Unbekannt"
            );
        }

        return result;
    }

    // =========================================================================
    // CATEGORY TITLE
    // =========================================================================

    public static getCategoryTitle(
        category: LibraryCategory
    ): string {

        return (
            this.CATEGORY_TITLES[
                category
            ] ??
            this.CATEGORY_TITLES.ALLGEMEIN
        );
    }

    // =========================================================================
    // TELEGRAM CHAT ID
    // =========================================================================

    public static getTelegramChatId(
        category: LibraryCategory
    ): string | undefined {

        const environmentKey =
            this.getEnvironmentKey(
                category
            );

        const categoryChatId =
            process.env[
                environmentKey
            ];

        if (
            categoryChatId &&
            categoryChatId.trim()
        ) {

            return categoryChatId.trim();
        }

        /*
         * Fallback:
         *
         * Wenn keine eigene Kategorie-Gruppe
         * hinterlegt ist, verwenden wir die
         * zentrale Library Of Legends Gruppe.
         */

        const libraryChannelId =
            process.env.LIBRARY_CHANNEL_ID;

        if (
            libraryChannelId &&
            libraryChannelId.trim()
        ) {

            return libraryChannelId.trim();
        }

        /*
         * Ältere Projektkonfiguration:
         *
         * GROUP_ID wird weiterhin unterstützt.
         */

        const groupId =
            process.env.GROUP_ID;

        if (
            groupId &&
            groupId.trim()
        ) {

            return groupId.trim();
        }

        return undefined;
    }

    // =========================================================================
    // TELEGRAM TOPIC ID
    // =========================================================================

    public static getTopicId(
        category: LibraryCategory
    ): number | undefined {

        const environmentKey =
            this.getTopicEnvironmentKey(
                category
            );

        if (!environmentKey) {

            return undefined;
        }

        const raw =
            process.env[
                environmentKey
            ];

        if (!raw) {

            return undefined;
        }

        const topicId =
            Number(
                raw
            );

        if (
            !Number.isInteger(
                topicId
            ) ||
            topicId <= 0
        ) {

            return undefined;
        }

        return topicId;
    }

    // =========================================================================
    // TOPIC ENVIRONMENT KEY
    // =========================================================================

    private static getTopicEnvironmentKey(
        category: LibraryCategory
    ): string | undefined {

        const keys: Partial<
            Record<
                LibraryCategory,
                string
            >
        > = {

            ACTION_ABENTEUER:
                "TOPIC_ACTION_ID",

            HORROR_THRILLER:
                "TOPIC_HORROR_ID",

            SCI_FI_FANTASY:
                "TOPIC_SCIFI_ID",

            DRAMA_ROMANTIK:
                "TOPIC_DRAMA_ID",

            KOMEDIE_FAMILIE:
                "TOPIC_COMEDY_ID",

            ANIMATION_ANIME:
                "TOPIC_ANIMATION_ID",

            MYSTERY_KRIMI:
                "TOPIC_MYSTERY_ID",

            DOKUMENTATION_BIOGRAFIE:
                "TOPIC_DOCUMENTARY_ID",

            WESTERN:
                "TOPIC_WESTERN_ID",

            MUSIK:
                "TOPIC_MUSIC_ID",

            KINDER:
                "TOPIC_KIDS_ID"
        };

        return keys[
            category
        ];
    }

    // =========================================================================
    // ENVIRONMENT KEY
    // =========================================================================

    private static getEnvironmentKey(
        category: LibraryCategory
    ): string {

        return (
            GenreRouter.CATEGORY_ENV_KEYS[
                category
            ] ??
            "LIBRARY_CHANNEL_ID"
        );
    }

    // =========================================================================
    // CATEGORY CHECK
    // =========================================================================

    public static isCategory(
        category: string
    ): category is LibraryCategory {

        return Object.prototype.hasOwnProperty.call(
            this.CATEGORY_TITLES,
            category
        );
    }

    // =========================================================================
    // GET ALL CATEGORIES
    // =========================================================================

    public static getCategories(): LibraryCategory[] {

        return [
            ...this.CATEGORY_PRIORITY
        ];
    }

    // =========================================================================
    // GET ALL CATEGORY TITLES
    // =========================================================================

    public static getCategoryTitles(): string[] {

        return this.getCategories()
            .map(
                category =>
                    this.getCategoryTitle(
                        category
                    )
            );
    }

    // =========================================================================
    // GET CATEGORY ENVIRONMENT KEY
    // =========================================================================

    public static getCategoryEnvironmentKey(
        category: LibraryCategory
    ): string {

        return this.getEnvironmentKey(
            category
        );
    }

    // =========================================================================
    // HAS TELEGRAM DESTINATION
    // =========================================================================

    public static hasTelegramDestination(
        category: LibraryCategory
    ): boolean {

        return Boolean(
            this.getTelegramChatId(
                category
            )
        );
    }

    // =========================================================================
    // DEBUG ROUTE
    // =========================================================================

    public static describeRoute(
        genres: LibraryGenre[]
    ): string {

        const route =
            this.route(
                genres
            );

        return [

            `🏷️ Genre: ${route.primaryGenre}`,

            `📂 Kategorie: ${route.categoryTitle}`,

            `📨 Telegram Chat: ${
                route.telegramChatId ??
                "NICHT KONFIGURIERT"
            }`,

            `📌 Topic: ${
                route.topicId ??
                "Keines"
            }`

        ].join(
            "\n"
        );
    }
}