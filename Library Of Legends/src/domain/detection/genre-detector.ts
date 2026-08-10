/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: GenreDetector

Architecture Layer..: Domain

Module..............: Detection

Module ID...........: LOL-MOD-DET-0003

LOL-ID..............: LOL-DET-GEN-0001

File................: genre-detector.ts

Location............
Library Of Legends/src/domain/detection/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Automatically detects and normalizes media genres.

The detector analyzes media titles and filenames and maps
recognized keywords to the Library Of Legends genre system.

Supported primary genres:

- Action
- Abenteuer
- Thriller
- Horror
- Sci-Fi
- Fantasy
- Drama
- Romantik
- Komödie
- Familie
- Animation
- Anime
- Mystery
- Krimi
- Dokumentation
- Biografie
- Western
- Musik
- Kinder

The detector can return multiple genres for a single title.

===============================================================================
*/

export type LibraryGenre =
    | "Action"
    | "Abenteuer"
    | "Thriller"
    | "Horror"
    | "Sci-Fi"
    | "Fantasy"
    | "Drama"
    | "Romantik"
    | "Komödie"
    | "Familie"
    | "Animation"
    | "Anime"
    | "Mystery"
    | "Krimi"
    | "Dokumentation"
    | "Biografie"
    | "Western"
    | "Musik"
    | "Kinder"
    | "Unbekannt";

export class GenreDetector {

    // =========================================================================
    // KEYWORD MAP
    // =========================================================================

    private static readonly GENRE_KEYWORDS: Record<
        Exclude<LibraryGenre, "Unbekannt">,
        string[]
    > = {

        Action: [
            "action",
            "fight",
            "fighting",
            "war",
            "battle",
            "assassin",
            "agent",
            "soldier",
            "combat",
            "superhero"
        ],

        Abenteuer: [
            "adventure",
            "abenteuer",
            "quest",
            "expedition",
            "journey"
        ],

        Thriller: [
            "thriller",
            "suspense",
            "stalker",
            "killer",
            "conspiracy"
        ],

        Horror: [
            "horror",
            "zombie",
            "vampire",
            "demon",
            "ghost",
            "haunted",
            "evil",
            "slasher"
        ],

        "Sci-Fi": [
            "sci-fi",
            "science fiction",
            "space",
            "alien",
            "robot",
            "future",
            "cyborg",
            "galaxy",
            "star trek",
            "star wars"
        ],

        Fantasy: [
            "fantasy",
            "magic",
            "wizard",
            "dragon",
            "kingdom",
            "witch",
            "mythical"
        ],

        Drama: [
            "drama",
            "dramatic",
            "family drama",
            "historical drama"
        ],

        Romantik: [
            "romance",
            "romantic",
            "love",
            "relationship",
            "wedding"
        ],

        Komödie: [
            "comedy",
            "comedie",
            "komödie",
            "funny",
            "humor",
            "parody"
        ],

        Familie: [
            "family",
            "familie",
            "family film"
        ],

        Animation: [
            "animation",
            "animated",
            "zeichentrick",
            "cartoon"
        ],

        Anime: [
            "anime",
            "japanese animation"
        ],

        Mystery: [
            "mystery",
            "mysterious",
            "supernatural",
            "unknown"
        ],

        Krimi: [
            "crime",
            "krimi",
            "criminal",
            "detective",
            "police",
            "gangster",
            "mafia",
            "heist"
        ],

        Dokumentation: [
            "documentary",
            "dokumentation",
            "dokumentarfilm"
        ],

        Biografie: [
            "biography",
            "biopic",
            "biografie"
        ],

        Western: [
            "western",
            "cowboy",
            "cowboys",
            "wild west"
        ],

        Musik: [
            "music",
            "musical",
            "musik",
            "concert",
            "konzert"
        ],

        Kinder: [
            "kids",
            "kid",
            "children",
            "child",
            "kinder",
            "disney junior"
        ]
    };

    // =========================================================================
    // DETECT
    // =========================================================================

    public static detect(
        input: string
    ): LibraryGenre[] {

        const normalized = this.normalize(input);

        const detected: LibraryGenre[] = [];

        for (
            const genre of Object.keys(
                this.GENRE_KEYWORDS
            ) as Exclude<LibraryGenre, "Unbekannt">[]
        ) {

            const keywords =
                this.GENRE_KEYWORDS[genre];

            const match = keywords.some(
                keyword =>
                    normalized.includes(
                        this.normalize(keyword)
                    )
            );

            if (match) {
                detected.push(genre);
            }
        }

        if (detected.length === 0) {
            return ["Unbekannt"];
        }

        return detected;
    }

    // =========================================================================
    // PRIMARY GENRE
    // =========================================================================

    public static detectPrimary(
        input: string
    ): LibraryGenre {

        const genres =
            this.detect(input);

        return genres[0] ?? "Unbekannt";
    }

    // =========================================================================
    // HAS GENRE
    // =========================================================================

    public static hasGenre(
        input: string,
        genre: LibraryGenre
    ): boolean {

        return this.detect(input).includes(
            genre
        );
    }

    // =========================================================================
    // NORMALIZE
    // =========================================================================

    private static normalize(
        input: string
    ): string {

        return input
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[_\-]+/g, " ")
            .replace(/[^\p{L}\p{N}\s]/gu, " ")
            .replace(/\s+/g, " ")
            .trim();
    }
}