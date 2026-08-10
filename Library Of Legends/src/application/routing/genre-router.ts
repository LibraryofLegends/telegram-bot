/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: GenreRouter

Architecture Layer..: Application

Module..............: Routing

Module ID...........: LOL-MOD-ROUT-0001

LOL-ID..............: LOL-ROUT-GEN-0001

File................: genre-router.ts

Location............
Library Of Legends/src/application/routing/

Version.............: 3.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Central genre routing system for Library Of Legends.

Responsibilities:

- Convert detected genres into Telegram categories
- Determine primary Telegram archive category
- Provide stable routing identifiers
- Support multiple detected genres
- Prevent invalid string[] / LibraryGenre[] assignments
- Provide category metadata
- Provide readable Telegram category names
- Prepare routing information for TelegramBot
- Provide fallback category
- Keep routing independent from Telegram implementation

Telegram categories:

🎬 Action & Abenteuer
👻 Horror & Thriller
🤖 Sci-Fi & Fantasy
🎭 Drama & Romantik
😂 Komödie & Familienfilme
🎨 Animation & Anime
🕵️ Mystery / Krimi
🏞️ Dokumentationen / Biografien
🧸 Kinderfilme
📚 Allgemein

===============================================================================
*/

import {
    LibraryGenre,
    GenreDefinition,
    GENRE_DEFINITIONS,
    getGenreDefinition
} from "../../domain/detection/genre-detector-types";

/**
 * Result of genre routing.
 */
export interface GenreRoute {

    /**
     * Primary detected genre.
     */
    primaryGenre: LibraryGenre;

    /**
     * All detected genres.
     */
    genres: LibraryGenre[];

    /**
     * Stable Telegram routing ID.
     */
    category: string;

    /**
     * Human-readable Telegram category.
     */
    categoryTitle: string;

    /**
     * Category emoji.
     */
    emoji: string;

    /**
     * Archive code.
     */
    archiveCode: string;

    /**
     * All matching category IDs.
     */
    categoryIds: string[];
}

/**
 * Genre category definition.
 */
export interface GenreCategory {

    id: string;

    title: string;

    emoji: string;

    archiveCode: string;

    genres: LibraryGenre[];
}

/**
 * Genre Router.
 */
export class GenreRouter {

    // =========================================================================
    // CATEGORY DEFINITIONS
    // =========================================================================

    private static readonly CATEGORIES:
        GenreCategory[] = [

        // =====================================================================
        // ACTION
        // =====================================================================

        {
            id:
                "action",

            title:
                "🎬 Action & Abenteuer",

            emoji:
                "🎬",

            archiveCode:
                "ACT",

            genres: [

                "Action",

                "Abenteuer",

                "Abenteuerfilm",

                "Western",

                "Kriegsfilm"
            ]
        },

        // =====================================================================
        // HORROR
        // =====================================================================

        {
            id:
                "horror",

            title:
                "👻 Horror & Thriller",

            emoji:
                "👻",

            archiveCode:
                "HOR",

            genres: [

                "Horror",

                "Thriller"
            ]
        },

        // =====================================================================
        // SCI-FI
        // =====================================================================

        {
            id:
                "scifi",

            title:
                "🤖 Sci-Fi & Fantasy",

            emoji:
                "🤖",

            archiveCode:
                "SCF",

            genres: [

                "Sci-Fi",

                "Fantasy"
            ]
        },

        // =====================================================================
        // DRAMA
        // =====================================================================

        {
            id:
                "drama",

            title:
                "🎭 Drama & Romantik",

            emoji:
                "🎭",

            archiveCode:
                "DRM",

            genres: [

                "Drama",

                "Romantik",

                "Historisch",

                "Musik",

                "Sport"
            ]
        },

        // =====================================================================
        // COMEDY
        // =====================================================================

        {
            id:
                "comedy",

            title:
                "😂 Komödie & Familienfilme",

            emoji:
                "😂",

            archiveCode:
                "COM",

            genres: [

                "Komödie",

                "Familie"
            ]
        },

        // =====================================================================
        // ANIMATION
        // =====================================================================

        {
            id:
                "animation",

            title:
                "🎨 Animation & Anime",

            emoji:
                "🎨",

            archiveCode:
                "ANI",

            genres: [

                "Animation",

                "Anime"
            ]
        },

        // =====================================================================
        // MYSTERY / CRIME
        // =====================================================================

        {
            id:
                "crime",

            title:
                "🕵️ Mystery / Krimi",

            emoji:
                "🕵️",

            archiveCode:
                "KRM",

            genres: [

                "Krimi",

                "Mystery"
            ]
        },

        // =====================================================================
        // DOCUMENTARY
        // =====================================================================

        {
            id:
                "documentary",

            title:
                "🏞️ Dokumentationen / Biografien",

            emoji:
                "🏞️",

            archiveCode:
                "DOC",

            genres: [

                "Dokumentation",

                "Biografie"
            ]
        },

        // =====================================================================
        // KIDS
        // =====================================================================

        {
            id:
                "kids",

            title:
                "🧸 Kinderfilme",

            emoji:
                "🧸",

            archiveCode:
                "KID",

            genres: [

                "Kinder"
            ]
        },

        // =====================================================================
        // GENERAL
        // =====================================================================

        {
            id:
                "general",

            title:
                "📚 Allgemein",

            emoji:
                "📚",

            archiveCode:
                "GEN",

            genres: [

                "Unbekannt"
            ]
        }
    ];

    // =========================================================================
    // ROUTE
    // =========================================================================

    public static route(
        genres: LibraryGenre[]
    ): GenreRoute {

        const normalized =
            this.normalizeGenres(
                genres
            );

        const primaryGenre =
            this.detectPrimaryGenre(
                normalized
            );

        const primaryCategory =
            this.getCategoryForGenre(
                primaryGenre
            );

        const categoryIds =
            this.getCategoryIds(
                normalized
            );

        return {

            primaryGenre,

            genres:
                normalized,

            category:
                primaryCategory.id,

            categoryTitle:
                primaryCategory.title,

            emoji:
                primaryCategory.emoji,

            archiveCode:
                primaryCategory.archiveCode,

            categoryIds
        };
    }

    // =========================================================================
    // ROUTE SINGLE GENRE
    // =========================================================================

    public static routeGenre(
        genre: LibraryGenre
    ): GenreRoute {

        return this.route([
            genre
        ]);
    }

    // =========================================================================
    // GET CATEGORY FOR GENRE
    // =========================================================================

    public static getCategoryForGenre(
        genre: LibraryGenre
    ): GenreCategory {

        for (
            const category of
            this.CATEGORIES
        ) {

            if (
                category.genres.includes(
                    genre
                )
            ) {

                return category;
            }
        }

        return this.getGeneralCategory();
    }

    // =========================================================================
    // GET CATEGORY
    // =========================================================================

    public static getCategory(
        categoryId: string
    ): GenreCategory {

        const category =
            this.CATEGORIES.find(
                item =>
                    item.id ===
                    categoryId
            );

        return (
            category ||
            this.getGeneralCategory()
        );
    }

    // =========================================================================
    // GET CATEGORY TITLE
    // =========================================================================

    public static getCategoryTitle(
        genre: LibraryGenre
    ): string {

        return this.getCategoryForGenre(
            genre
        ).title;
    }

    // =========================================================================
    // GET CATEGORY ID
    // =========================================================================

    public static getCategoryId(
        genre: LibraryGenre
    ): string {

        return this.getCategoryForGenre(
            genre
        ).id;
    }

    // =========================================================================
    // GET EMOJI
    // =========================================================================

    public static getCategoryEmoji(
        genre: LibraryGenre
    ): string {

        return this.getCategoryForGenre(
            genre
        ).emoji;
    }

    // =========================================================================
    // GET ARCHIVE CODE
    // =========================================================================

    public static getArchiveCode(
        genre: LibraryGenre
    ): string {

        return this.getCategoryForGenre(
            genre
        ).archiveCode;
    }

    // =========================================================================
    // DETECT PRIMARY GENRE
    // =========================================================================

    public static detectPrimaryGenre(
        genres: LibraryGenre[]
    ): LibraryGenre {

        const normalized =
            this.normalizeGenres(
                genres
            );

        const priority:
            LibraryGenre[] = [

            "Superhelden",

            "Anime",

            "Kinder",

            "Horror",

            "Thriller",

            "Sci-Fi",

            "Fantasy",

            "Action",

            "Abenteuer",

            "Kriegsfilm",

            "Western",

            "Krimi",

            "Mystery",

            "Dokumentation",

            "Biografie",

            "Animation",

            "Komödie",

            "Familie",

            "Romantik",

            "Drama",

            "Historisch",

            "Musik",

            "Sport",

            "Abenteuerfilm",

            "Unbekannt"
        ];

        for (
            const genre of
            priority
        ) {

            if (
                normalized.includes(
                    genre
                )
            ) {

                return genre;
            }
        }

        return "Unbekannt";
    }

    // =========================================================================
    // GET CATEGORY IDS
    // =========================================================================

    public static getCategoryIds(
        genres: LibraryGenre[]
    ): string[] {

        const normalized =
            this.normalizeGenres(
                genres
            );

        const ids:
            string[] = [];

        for (
            const genre of
            normalized
        ) {

            const category =
                this.getCategoryForGenre(
                    genre
                );

            if (
                !ids.includes(
                    category.id
                )
            ) {

                ids.push(
                    category.id
                );
            }
        }

        if (
            ids.length === 0
        ) {

            ids.push(
                "general"
            );
        }

        return ids;
    }

    // =========================================================================
    // NORMALIZE GENRES
    // =========================================================================

    public static normalizeGenres(
        genres: LibraryGenre[]
    ): LibraryGenre[] {

        const result:
            LibraryGenre[] = [];

        for (
            const genre of
            genres
        ) {

            /*
             * Because this method receives LibraryGenre[],
             * we intentionally validate the value again.
             */

            const normalized =
                this.normalizeGenre(
                    genre
                );

            if (
                !result.includes(
                    normalized
                )
            ) {

                result.push(
                    normalized
                );
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
    // NORMALIZE SINGLE GENRE
    // =========================================================================

    public static normalizeGenre(
        genre: LibraryGenre
    ): LibraryGenre {

        switch (
            genre
        ) {

            case "Action":
            case "Abenteuer":
            case "Horror":
            case "Thriller":
            case "Sci-Fi":
            case "Fantasy":
            case "Drama":
            case "Romantik":
            case "Komödie":
            case "Familie":
            case "Krimi":
            case "Mystery":
            case "Animation":
            case "Anime":
            case "Dokumentation":
            case "Biografie":
            case "Superhelden":
            case "Kinder":
            case "Western":
            case "Musik":
            case "Historisch":
            case "Kriegsfilm":
            case "Sport":
            case "Abenteuerfilm":
            case "Unbekannt":

                return genre;

            default:

                return "Unbekannt";
        }
    }

    // =========================================================================
    // GET ALL CATEGORIES
    // =========================================================================

    public static getAllCategories():
        GenreCategory[] {

        return [
            ...this.CATEGORIES
        ];
    }

    // =========================================================================
    // GET ALL GENRES
    // =========================================================================

    public static getAllGenres():
        LibraryGenre[] {

        const genres:
            LibraryGenre[] = [];

        for (
            const category of
            this.CATEGORIES
        ) {

            for (
                const genre of
                category.genres
            ) {

                if (
                    !genres.includes(
                        genre
                    )
                ) {

                    genres.push(
                        genre
                    );
                }
            }
        }

        return genres;
    }

    // =========================================================================
    // GENERAL CATEGORY
    // =========================================================================

    private static getGeneralCategory():
        GenreCategory {

        return this.CATEGORIES[
            this.CATEGORIES.length - 1
        ];
    }

    // =========================================================================
    // GET DEFINITION
    // =========================================================================

    public static getDefinition(
        genre: LibraryGenre
    ): GenreDefinition {

        return getGenreDefinition(
            genre
        );
    }

    // =========================================================================
    // SHOULD GO TO CATEGORY
    // =========================================================================

    public static belongsToCategory(
        genre: LibraryGenre,
        categoryId: string
    ): boolean {

        const category =
            this.getCategory(
                categoryId
            );

        return category.genres.includes(
            genre
        );
    }

    // =========================================================================
    // DEBUG
    // =========================================================================

    public static describe(
        genres: LibraryGenre[]
    ): string {

        const route =
            this.route(
                genres
            );

        return [

            "=================================================",

            "📂 GENRE ROUTER",

            "=================================================",

            `🏷️ Genres: ${
                route.genres.join(
                    ", "
                )
            }`,

            `⭐ Primary: ${
                route.primaryGenre
            }`,

            `📂 Kategorie: ${
                route.categoryTitle
            }`,

            `🆔 Route-ID: ${
                route.category
            }`,

            `🗃️ Archive-Code: ${
                route.archiveCode
            }`,

            `📂 Weitere Kategorien: ${
                route.categoryIds.join(
                    ", "
                )
            }`,

            "================================================="

        ].join(
            "\n"
        );
    }
}