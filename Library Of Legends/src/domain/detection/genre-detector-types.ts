/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: GenreDetectorTypes

Architecture Layer..: Domain

Module..............: Detection

Module ID...........: LOL-MOD-DET-0003

LOL-ID..............: LOL-DET-GEN-TYPES-0001

File................: genre-detector-types.ts

Location............
Library Of Legends/src/domain/detection/

Version.............: 3.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Central genre definitions for Library Of Legends.

Responsibilities:

- Define all supported Library Of Legends genres
- Provide one central LibraryGenre type
- Prevent incompatible string[] assignments
- Provide genre validation
- Provide genre normalization
- Provide genre display names
- Provide Telegram category names
- Provide stable routing identifiers

The LibraryGenre type is exported from this file and re-exported
by GenreDetector.

===============================================================================
*/

/**
 * All supported Library Of Legends genres.
 *
 * IMPORTANT:
 *
 * Keep these values stable.
 * They are used by:
 *
 * - GenreDetector
 * - GenreRouter
 * - MovieCatalog
 * - SeriesCatalog
 * - ArchiveIdGenerator
 * - TelegramBot
 */
export type LibraryGenre =

    | "Action"

    | "Abenteuer"

    | "Horror"

    | "Thriller"

    | "Sci-Fi"

    | "Fantasy"

    | "Drama"

    | "Romantik"

    | "Komödie"

    | "Familie"

    | "Krimi"

    | "Mystery"

    | "Animation"

    | "Anime"

    | "Dokumentation"

    | "Biografie"

    | "Superhelden"

    | "Kinder"

    | "Western"

    | "Musik"

    | "Historisch"

    | "Kriegsfilm"

    | "Sport"

    | "Abenteuerfilm"

    | "Unbekannt";

/**
 * Information belonging to a LibraryGenre.
 */
export interface GenreDefinition {

    /**
     * Stable internal genre identifier.
     */
    id: LibraryGenre;

    /**
     * German display name.
     */
    name: string;

    /**
     * Telegram archive category.
     */
    category: string;

    /**
     * Short routing identifier.
     */
    routeId: string;

    /**
     * Archive-ID prefix.
     */
    archiveCode: string;

    /**
     * Emoji used in the UI.
     */
    emoji: string;
}

/**
 * Central genre definitions.
 */
export const GENRE_DEFINITIONS:
    Record<LibraryGenre, GenreDefinition> = {

    // =========================================================================
    // ACTION
    // =========================================================================

    Action: {

        id:
            "Action",

        name:
            "Action",

        category:
            "🎬 Action & Abenteuer",

        routeId:
            "action",

        archiveCode:
            "ACT",

        emoji:
            "💥"
    },

    // =========================================================================
    // ABENTEUER
    // =========================================================================

    Abenteuer: {

        id:
            "Abenteuer",

        name:
            "Abenteuer",

        category:
            "🎬 Action & Abenteuer",

        routeId:
            "action",

        archiveCode:
            "ACT",

        emoji:
            "🗺️"
    },

    // =========================================================================
    // HORROR
    // =========================================================================

    Horror: {

        id:
            "Horror",

        name:
            "Horror",

        category:
            "👻 Horror & Thriller",

        routeId:
            "horror",

        archiveCode:
            "HOR",

        emoji:
            "👻"
    },

    // =========================================================================
    // THRILLER
    // =========================================================================

    Thriller: {

        id:
            "Thriller",

        name:
            "Thriller",

        category:
            "👻 Horror & Thriller",

        routeId:
            "horror",

        archiveCode:
            "HOR",

        emoji:
            "🔪"
    },

    // =========================================================================
    // SCI-FI
    // =========================================================================

    "Sci-Fi": {

        id:
            "Sci-Fi",

        name:
            "Sci-Fi",

        category:
            "🤖 Sci-Fi & Fantasy",

        routeId:
            "scifi",

        archiveCode:
            "SCF",

        emoji:
            "🤖"
    },

    // =========================================================================
    // FANTASY
    // =========================================================================

    Fantasy: {

        id:
            "Fantasy",

        name:
            "Fantasy",

        category:
            "🤖 Sci-Fi & Fantasy",

        routeId:
            "fantasy",

        archiveCode:
            "FAN",

        emoji:
            "🧙"
    },

    // =========================================================================
    // DRAMA
    // =========================================================================

    Drama: {

        id:
            "Drama",

        name:
            "Drama",

        category:
            "🎭 Drama & Romantik",

        routeId:
            "drama",

        archiveCode:
            "DRM",

        emoji:
            "🎭"
    },

    // =========================================================================
    // ROMANTIK
    // =========================================================================

    Romantik: {

        id:
            "Romantik",

        name:
            "Romantik",

        category:
            "🎭 Drama & Romantik",

        routeId:
            "romance",

        archiveCode:
            "DRM",

        emoji:
            "❤️"
    },

    // =========================================================================
    // KOMÖDIE
    // =========================================================================

    Komödie: {

        id:
            "Komödie",

        name:
            "Komödie",

        category:
            "😂 Komödie & Familienfilme",

        routeId:
            "comedy",

        archiveCode:
            "COM",

        emoji:
            "😂"
    },

    // =========================================================================
    // FAMILIE
    // =========================================================================

    Familie: {

        id:
            "Familie",

        name:
            "Familie",

        category:
            "😂 Komödie & Familienfilme",

        routeId:
            "family",

        archiveCode:
            "COM",

        emoji:
            "👨‍👩‍👧‍👦"
    },

    // =========================================================================
    // KRIMI
    // =========================================================================

    Krimi: {

        id:
            "Krimi",

        name:
            "Krimi",

        category:
            "🕵️ Mystery / Krimi",

        routeId:
            "crime",

        archiveCode:
            "KRM",

        emoji:
            "🕵️"
    },

    // =========================================================================
    // MYSTERY
    // =========================================================================

    Mystery: {

        id:
            "Mystery",

        name:
            "Mystery",

        category:
            "🕵️ Mystery / Krimi",

        routeId:
            "mystery",

        archiveCode:
            "KRM",

        emoji:
            "🔎"
    },

    // =========================================================================
    // ANIMATION
    // =========================================================================

    Animation: {

        id:
            "Animation",

        name:
            "Animation",

        category:
            "🎨 Animation & Anime",

        routeId:
            "animation",

        archiveCode:
            "ANI",

        emoji:
            "🎨"
    },

    // =========================================================================
    // ANIME
    // =========================================================================

    Anime: {

        id:
            "Anime",

        name:
            "Anime",

        category:
            "🎨 Animation & Anime",

        routeId:
            "anime",

        archiveCode:
            "ANI",

        emoji:
            "🌸"
    },

    // =========================================================================
    // DOKUMENTATION
    // =========================================================================

    Dokumentation: {

        id:
            "Dokumentation",

        name:
            "Dokumentation",

        category:
            "🏞️ Dokumentationen / Biografien",

        routeId:
            "documentary",

        archiveCode:
            "DOC",

        emoji:
            "🏞️"
    },

    // =========================================================================
    // BIOGRAFIE
    // =========================================================================

    Biografie: {

        id:
            "Biografie",

        name:
            "Biografie",

        category:
            "🏞️ Dokumentationen / Biografien",

        routeId:
            "biography",

        archiveCode:
            "DOC",

        emoji:
            "👤"
    },

    // =========================================================================
    // SUPERHELDEN
    // =========================================================================

    Superhelden: {

        id:
            "Superhelden",

        name:
            "Superhelden",

        category:
            "🦸 Marvel",

        routeId:
            "superhero",

        archiveCode:
            "ACT",

        emoji:
            "🦸"
    },

    // =========================================================================
    // KINDER
    // =========================================================================

    Kinder: {

        id:
            "Kinder",

        name:
            "Kinder",

        category:
            "🧸 Kinderfilme",

        routeId:
            "kids",

        archiveCode:
            "COM",

        emoji:
            "🧸"
    },

    // =========================================================================
    // WESTERN
    // =========================================================================

    Western: {

        id:
            "Western",

        name:
            "Western",

        category:
            "🎬 Action & Abenteuer",

        routeId:
            "western",

        archiveCode:
            "ACT",

        emoji:
            "🤠"
    },

    // =========================================================================
    // MUSIK
    // =========================================================================

    Musik: {

        id:
            "Musik",

        name:
            "Musik",

        category:
            "🎭 Drama & Romantik",

        routeId:
            "music",

        archiveCode:
            "DRM",

        emoji:
            "🎵"
    },

    // =========================================================================
    // HISTORISCH
    // =========================================================================

    Historisch: {

        id:
            "Historisch",

        name:
            "Historisch",

        category:
            "🎭 Drama & Romantik",

        routeId:
            "history",

        archiveCode:
            "DRM",

        emoji:
            "🏛️"
    },

    // =========================================================================
    // KRIEGSFILM
    // =========================================================================

    Kriegsfilm: {

        id:
            "Kriegsfilm",

        name:
            "Kriegsfilm",

        category:
            "🎬 Action & Abenteuer",

        routeId:
            "war",

        archiveCode:
            "ACT",

        emoji:
            "⚔️"
    },

    // =========================================================================
    // SPORT
    // =========================================================================

    Sport: {

        id:
            "Sport",

        name:
            "Sport",

        category:
            "🎭 Drama & Romantik",

        routeId:
            "sport",

        archiveCode:
            "DRM",

        emoji:
            "🏆"
    },

    // =========================================================================
    // ABENTEUERFILM
    // =========================================================================

    Abenteuerfilm: {

        id:
            "Abenteuerfilm",

        name:
            "Abenteuerfilm",

        category:
            "🎬 Action & Abenteuer",

        routeId:
            "action",

        archiveCode:
            "ACT",

        emoji:
            "🏔️"
    },

    // =========================================================================
    // UNKNOWN
    // =========================================================================

    Unbekannt: {

        id:
            "Unbekannt",

        name:
            "Unbekannt",

        category:
            "📚 Allgemein",

        routeId:
            "general",

        archiveCode:
            "GEN",

        emoji:
            "📚"
    }
};

/**
 * Check whether a value is a valid LibraryGenre.
 */
export function isLibraryGenre(
    value: unknown
): value is LibraryGenre {

    if (
        typeof value !== "string"
    ) {

        return false;
    }

    return (
        value in
        GENRE_DEFINITIONS
    );
}

/**
 * Normalize an arbitrary genre string
 * into a supported LibraryGenre.
 */
export function normalizeLibraryGenre(
    value: unknown
): LibraryGenre {

    const input =
        String(
            value ?? ""
        )
            .trim()
            .toLowerCase();

    const aliases:
        Record<string, LibraryGenre> = {

        // ---------------------------------------------------------------------
        // ACTION
        // ---------------------------------------------------------------------

        action:
            "Action",

        actions:
            "Action",

        // ---------------------------------------------------------------------
        // ABENTEUER
        // ---------------------------------------------------------------------

        abenteuer:
            "Abenteuer",

        adventure:
            "Abenteuer",

        // ---------------------------------------------------------------------
        // HORROR
        // ---------------------------------------------------------------------

        horror:
            "Horror",

        // ---------------------------------------------------------------------
        // THRILLER
        // ---------------------------------------------------------------------

        thriller:
            "Thriller",

        // ---------------------------------------------------------------------
        // SCI-FI
        // ---------------------------------------------------------------------

        "sci-fi":
            "Sci-Fi",

        "sci fi":
            "Sci-Fi",

        scifi:
            "Sci-Fi",

        sciencefiction:
            "Sci-Fi",

        "science fiction":
            "Sci-Fi",

        // ---------------------------------------------------------------------
        // FANTASY
        // ---------------------------------------------------------------------

        fantasy:
            "Fantasy",

        // ---------------------------------------------------------------------
        // DRAMA
        // ---------------------------------------------------------------------

        drama:
            "Drama",

        // ---------------------------------------------------------------------
        // ROMANCE
        // ---------------------------------------------------------------------

        romance:
            "Romantik",

        romantik:
            "Romantik",

        // ---------------------------------------------------------------------
        // COMEDY
        // ---------------------------------------------------------------------

        comedy:
            "Komödie",

        komödie:
            "Komödie",

        komodie:
            "Komödie",

        // ---------------------------------------------------------------------
        // FAMILY
        // ---------------------------------------------------------------------

        family:
            "Familie",

        familie:
            "Familie",

        // ---------------------------------------------------------------------
        // CRIME
        // ---------------------------------------------------------------------

        crime:
            "Krimi",

        krimi:
            "Krimi",

        // ---------------------------------------------------------------------
        // MYSTERY
        // ---------------------------------------------------------------------

        mystery:
            "Mystery",

        // ---------------------------------------------------------------------
        // ANIMATION
        // ---------------------------------------------------------------------

        animation:
            "Animation",

        animated:
            "Animation",

        // ---------------------------------------------------------------------
        // ANIME
        // ---------------------------------------------------------------------

        anime:
            "Anime",

        // ---------------------------------------------------------------------
        // DOCUMENTARY
        // ---------------------------------------------------------------------

        documentary:
            "Dokumentation",

        dokumentation:
            "Dokumentation",

        doku:
            "Dokumentation",

        // ---------------------------------------------------------------------
        // BIOGRAPHY
        // ---------------------------------------------------------------------

        biography:
            "Biografie",

        biografie:
            "Biografie",

        biopic:
            "Biografie",

        // ---------------------------------------------------------------------
        // SUPERHERO
        // ---------------------------------------------------------------------

        superhero:
            "Superhelden",

        superheroes:
            "Superhelden",

        superheld:
            "Superhelden",

        superhelden:
            "Superhelden",

        marvel:
            "Superhelden",

        dc:
            "Superhelden",

        // ---------------------------------------------------------------------
        // KIDS
        // ---------------------------------------------------------------------

        kids:
            "Kinder",

        kinder:
            "Kinder",

        kinderfilm:
            "Kinder",

        kinderfilme:
            "Kinder",

        // ---------------------------------------------------------------------
        // WESTERN
        // ---------------------------------------------------------------------

        western:
            "Western",

        // ---------------------------------------------------------------------
        // MUSIC
        // ---------------------------------------------------------------------

        music:
            "Musik",

        musik:
            "Musik",

        musical:
            "Musik",

        // ---------------------------------------------------------------------
        // HISTORY
        // ---------------------------------------------------------------------

        historical:
            "Historisch",

        historisch:
            "Historisch",

        geschichte:
            "Historisch",

        // ---------------------------------------------------------------------
        // WAR
        // ---------------------------------------------------------------------

        war:
            "Kriegsfilm",

        krieg:
            "Kriegsfilm",

        kriegsfilm:
            "Kriegsfilm",

        // ---------------------------------------------------------------------
        // SPORT
        // ---------------------------------------------------------------------

        sport:
            "Sport",

        sports:
            "Sport",

        // ---------------------------------------------------------------------
        // UNKNOWN
        // ---------------------------------------------------------------------

        unknown:
            "Unbekannt",

        unbekannt:
            "Unbekannt"
    };

    return (
        aliases[input] ||
        "Unbekannt"
    );
}

/**
 * Get the definition for a genre.
 */
export function getGenreDefinition(
    genre: LibraryGenre
): GenreDefinition {

    return GENRE_DEFINITIONS[
        genre
    ];
}

/**
 * Get Telegram category for a genre.
 */
export function getGenreCategory(
    genre: LibraryGenre
): string {

    return GENRE_DEFINITIONS[
        genre
    ].category;
}

/**
 * Get archive code for a genre.
 */
export function getGenreArchiveCode(
    genre: LibraryGenre
): string {

    return GENRE_DEFINITIONS[
        genre
    ].archiveCode;
}

/**
 * Get all supported genres.
 */
export function getAllGenres(): LibraryGenre[] {

    return Object.keys(
        GENRE_DEFINITIONS
    ) as LibraryGenre[];
}