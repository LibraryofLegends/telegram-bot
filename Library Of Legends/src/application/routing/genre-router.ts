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

Version.............: 4.0.0

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
- Support superhero content
- Support multiple archive categories
- Provide stable archive codes

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

                "Kriegsfilm",

                "Superhelden"
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
        // SCI-FI / FANTASY
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
        // COMEDY / FAMILY
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
        // ANIMATION / ANIME
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
        // DOCUMENTARY / BIOGRAPHY
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

        const normalized:
            LibraryGenre[] =
            this.normalizeGenres(
                genres
            );

        const primaryGenre:
            LibraryGenre =
            this.detectPrimaryGenre(
                normalized
            );

        const primaryCategory:
            GenreCategory =
            this.getCategoryForGenre(
                primaryGenre
            );

        const categoryIds:
            string[] =
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

        return this.route(
            [
                genre
            ]
        );
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

        const normalizedId =
            String(
                categoryId ||
                ""
            )
                .trim()
                .toLowerCase();

        const category =
            this.CATEGORIES.find(
                item =>
                    item.id ===
                    normalizedId
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

        return this
            .getCategoryForGenre(
                genre
            )
            .title;
    }

    // =========================================================================
    // GET CATEGORY ID
    // =========================================================================

    public static getCategoryId(
        genre: LibraryGenre
    ): string {

        return this
            .getCategoryForGenre(
                genre
            )
            .id;
    }

    // =========================================================================
    // GET EMOJI
    // =========================================================================

    public static getCategoryEmoji(
        genre: LibraryGenre
    ): string {

        return this
            .getCategoryForGenre(
                genre
            )
            .emoji;
    }

    // =========================================================================
    // GET ARCHIVE CODE
    // =========================================================================

    public static getArchiveCode(
        genre: LibraryGenre
    ): string {

        return this
            .getCategoryForGenre(
                genre
            )
            .archiveCode;
    }

    // =========================================================================
    // DETECT PRIMARY GENRE
    // =========================================================================

    public static detectPrimaryGenre(
        genres: LibraryGenre[]
    ): LibraryGenre {

        const normalized:
            LibraryGenre[] =
            this.normalizeGenres(
                genres
            );

        /*
         * Priority determines which genre becomes the primary
         * archive category when multiple genres are detected.
         */

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

        const normalized:
            LibraryGenre[] =
            this.normalizeGenres(
                genres
            );

        const ids:
            string[] = [];

        for (
            const genre of
            normalized
        ) {

            const category:
                GenreCategory =
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
            ids.length ===
            0
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

        if (
            !Array.isArray(
                genres
            )
        ) {

            return [
                "Unbekannt"
            ];
        }

        for (
            const genre of
            genres
        ) {

            const normalized:
                LibraryGenre =
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
            result.length ===
            0
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

                return "Action";

            case "Abenteuer":

                return "Abenteuer";

            case "Horror":

                return "Horror";

            case "Thriller":

                return "Thriller";

            case "Sci-Fi":

                return "Sci-Fi";

            case "Fantasy":

                return "Fantasy";

            case "Drama":

                return "Drama";

            case "Romantik":

                return "Romantik";

            case "Komödie":

                return "Komödie";

            case "Familie":

                return "Familie";

            case "Krimi":

                return "Krimi";

            case "Mystery":

                return "Mystery";

            case "Animation":

                return "Animation";

            case "Anime":

                return "Anime";

            case "Dokumentation":

                return "Dokumentation";

            case "Biografie":

                return "Biografie";

            case "Superhelden":

                return "Superhelden";

            case "Kinder":

                return "Kinder";

            case "Western":

                return "Western";

            case "Musik":

                return "Musik";

            case "Historisch":

                return "Historisch";

            case "Kriegsfilm":

                return "Kriegsfilm";

            case "Sport":

                return "Sport";

            case "Abenteuerfilm":

                return "Abenteuerfilm";

            case "Unbekannt":

                return "Unbekannt";

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
    // GET CATEGORY BY ID
    // =========================================================================

    public static getCategoryById(
        categoryId: string
    ): GenreCategory {

        return this.getCategory(
            categoryId
        );
    }

    // =========================================================================
    // GET CATEGORY BY ARCHIVE CODE
    // =========================================================================

    public static getCategoryByArchiveCode(
        archiveCode: string
    ): GenreCategory {

        const normalizedCode =
            String(
                archiveCode ||
                ""
            )
                .trim()
                .toUpperCase();

        const category =
            this.CATEGORIES.find(
                item =>
                    item.archiveCode ===
                    normalizedCode
            );

        return (
            category ||
            this.getGeneralCategory()
        );
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

        const category:
            GenreCategory =
            this.getCategory(
                categoryId
            );

        return category.genres.includes(
            genre
        );
    }

    // =========================================================================
    // IS VALID GENRE
    // =========================================================================

    public static isValidGenre(
        genre: LibraryGenre
    ): boolean {

        return (
            genre !==
            "Unbekannt"
        );
    }

    // =========================================================================
    // ROUTE FROM UNKNOWN INPUT
    // =========================================================================

    public static routeSafe(
        genres: unknown
    ): GenreRoute {

        /*
         * This method is intentionally defensive.
         *
         * The normal route() method remains strongly typed.
         * routeSafe() can be used by TelegramBot when data comes
         * from filename parsing or external metadata.
         */

        if (
            !Array.isArray(
                genres
            )
        ) {

            return this.route(
                [
                    "Unbekannt"
                ]
            );
        }

        const validGenres:
            LibraryGenre[] = [];

        for (
            const value of
            genres
        ) {

            if (
                typeof value !==
                "string"
            ) {

                continue;
            }

            const normalized =
                this.normalizeUnknownGenre(
                    value
                );

            if (
                !validGenres.includes(
                    normalized
                )
            ) {

                validGenres.push(
                    normalized
                );
            }
        }

        return this.route(
            validGenres
        );
    }

    // =========================================================================
    // NORMALIZE UNKNOWN INPUT
    // =========================================================================

    private static normalizeUnknownGenre(
        genre: string
    ): LibraryGenre {

        const value =
            String(
                genre
            )
                .trim()
                .toLowerCase();

        switch (
            value
        ) {

            case "action":
                return "Action";

            case "abenteuer":
            case "adventure":
                return "Abenteuer";

            case "abenteuerfilm":
                return "Abenteuerfilm";

            case "horror":
                return "Horror";

            case "thriller":
                return "Thriller";

            case "sci-fi":
            case "sci fi":
            case "science fiction":
            case "science-fiction":
                return "Sci-Fi";

            case "fantasy":
                return "Fantasy";

            case "superheld":
            case "superhelden":
            case "superhero":
            case "superheroes":
                return "Superhelden";

            case "drama":
                return "Drama";

            case "romantik":
            case "romance":
                return "Romantik";

            case "komödie":
            case "komoedie":
            case "comedy":
                return "Komödie";

            case "familie":
            case "family":
                return "Familie";

            case "krimi":
            case "crime":
                return "Krimi";

            case "mystery":
                return "Mystery";

            case "animation":
                return "Animation";

            case "anime":
                return "Anime";

            case "dokumentation":
            case "dokumentarfilm":
            case "documentary":
                return "Dokumentation";

            case "biografie":
            case "biography":
                return "Biografie";

            case "kinder":
            case "kinderfilm":
            case "kids":
            case "children":
                return "Kinder";

            case "western":
                return "Western";

            case "musik":
            case "music":
                return "Musik";

            case "historisch":
            case "history":
            case "historical":
                return "Historisch";

            case "kriegsfilm":
            case "krieg":
            case "war":
                return "Kriegsfilm";

            case "sport":
                return "Sport";

            case "unbekannt":
            case "unknown":
            case "undefined":
            case "":
                return "Unbekannt";

            default:
                return "Unbekannt";
        }
    }

    // =========================================================================
    // DEBUG
    // =========================================================================

    public static describe(
        genres: LibraryGenre[]
    ): string {

        const route:
            GenreRoute =
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