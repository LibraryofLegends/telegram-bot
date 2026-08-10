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

Version.............: 1.0.1

Status..............: Core

Lifecycle...........: Development

Description.........

Determines the correct Library Of Legends destination category
for movies and series based on detected genres.

Responsibilities:

- Determine primary category
- Determine secondary categories
- Normalize genre combinations
- Provide Telegram routing information
- Provide category names for post generation

Telegram communication itself is handled by the Telegram layer.

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

    category: LibraryCategory;

    categoryTitle: string;

    genres: LibraryGenre[];

    primaryGenre: LibraryGenre;

    telegramChatId?: string;

    topicId?: number;
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
    // ROUTE
    // =========================================================================

    public static route(
        genres: LibraryGenre[]
    ): GenreRoute {

        const safeGenres: LibraryGenre[] =
            genres.length > 0
                ? genres
                : ["Unbekannt" as LibraryGenre];

        const primaryGenre: LibraryGenre =
            safeGenres[0];

        const category =
            this.detectCategory(
                safeGenres
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

            telegramChatId:
                this.getTelegramChatId(
                    category
                )
        };
    }

    // =========================================================================
    // DETECT CATEGORY
    // =========================================================================

    public static detectCategory(
        genres: LibraryGenre[]
    ): LibraryCategory {

        const normalized =
            new Set<LibraryGenre>(
                genres
            );

        // ---------------------------------------------------------------------
        // ACTION / ADVENTURE
        // ---------------------------------------------------------------------

        if (
            normalized.has("Action") ||
            normalized.has("Abenteuer")
        ) {

            return "ACTION_ABENTEUER";
        }

        // ---------------------------------------------------------------------
        // HORROR / THRILLER
        // ---------------------------------------------------------------------

        if (
            normalized.has("Horror") ||
            normalized.has("Thriller")
        ) {

            return "HORROR_THRILLER";
        }

        // ---------------------------------------------------------------------
        // SCI-FI / FANTASY
        // ---------------------------------------------------------------------

        if (
            normalized.has("Sci-Fi") ||
            normalized.has("Fantasy")
        ) {

            return "SCI_FI_FANTASY";
        }

        // ---------------------------------------------------------------------
        // DRAMA / ROMANTIK
        // ---------------------------------------------------------------------

        if (
            normalized.has("Drama") ||
            normalized.has("Romantik")
        ) {

            return "DRAMA_ROMANTIK";
        }

        // ---------------------------------------------------------------------
        // COMEDY / FAMILY
        // ---------------------------------------------------------------------

        if (
            normalized.has("Komödie") ||
            normalized.has("Familie")
        ) {

            return "KOMEDIE_FAMILIE";
        }

        // ---------------------------------------------------------------------
        // ANIMATION / ANIME
        // ---------------------------------------------------------------------

        if (
            normalized.has("Animation") ||
            normalized.has("Anime")
        ) {

            return "ANIMATION_ANIME";
        }

        // ---------------------------------------------------------------------
        // MYSTERY / CRIME
        // ---------------------------------------------------------------------

        if (
            normalized.has("Mystery") ||
            normalized.has("Krimi")
        ) {

            return "MYSTERY_KRIMI";
        }

        // ---------------------------------------------------------------------
        // DOCUMENTARY / BIOGRAPHY
        // ---------------------------------------------------------------------

        if (
            normalized.has("Dokumentation") ||
            normalized.has("Biografie")
        ) {

            return "DOKUMENTATION_BIOGRAFIE";
        }

        // ---------------------------------------------------------------------
        // WESTERN
        // ---------------------------------------------------------------------

        if (
            normalized.has("Western")
        ) {

            return "WESTERN";
        }

        // ---------------------------------------------------------------------
        // MUSIC
        // ---------------------------------------------------------------------

        if (
            normalized.has("Musik")
        ) {

            return "MUSIK";
        }

        // ---------------------------------------------------------------------
        // KIDS
        // ---------------------------------------------------------------------

        if (
            normalized.has("Kinder")
        ) {

            return "KINDER";
        }

        // ---------------------------------------------------------------------
        // DEFAULT
        // ---------------------------------------------------------------------

        return "ALLGEMEIN";
    }

    // =========================================================================
    // CATEGORY TITLE
    // =========================================================================

    public static getCategoryTitle(
        category: LibraryCategory
    ): string {

        return (
            this.CATEGORY_TITLES[category] ??
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

        return (
            process.env[environmentKey] ||
            process.env.LIBRARY_CHANNEL_ID ||
            undefined
        );
    }

    // =========================================================================
    // ENVIRONMENT KEY
    // =========================================================================

    private static getEnvironmentKey(
        category: LibraryCategory
    ): string {

        const keys: Record<
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

        return keys[category];
    }

    // =========================================================================
    // CHECK CATEGORY
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

        return Object.keys(
            this.CATEGORY_TITLES
        ) as LibraryCategory[];
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
}