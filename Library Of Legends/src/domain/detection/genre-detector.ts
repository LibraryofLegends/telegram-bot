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

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Automatic genre detection for Library Of Legends.

Responsibilities:

- Detect genres from movie and series titles
- Detect genres from keywords
- Support German and English keywords
- Detect superhero content
- Detect science-fiction content
- Detect fantasy content
- Detect horror and thriller content
- Detect crime and mystery content
- Detect comedy and family content
- Detect drama and romance content
- Detect animation and anime
- Detect documentary and biography
- Provide a primary genre
- Never return an empty genre list

The detector is intentionally title-based.

TMDB metadata can later improve the result.

===============================================================================
*/

import {
    LibraryGenre
} from "./genre-detector-types";

/**
 * Genre detection engine.
 */
export class GenreDetector {

    // =========================================================================
    // DETECT
    // =========================================================================

    public static detect(
        title: string
    ): LibraryGenre[] {

        const normalized =
            this.normalize(title);

        const genres: LibraryGenre[] = [];

        // =====================================================================
        // SUPERHERO / COMIC
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "superman",
                    "batman",
                    "spiderman",
                    "spider-man",
                    "supergirl",
                    "wonder woman",
                    "aquaman",
                    "flash",
                    "green lantern",
                    "justice league",
                    "avengers",
                    "iron man",
                    "captain america",
                    "thor",
                    "hulk",
                    "deadpool",
                    "x-men",
                    "xmen",
                    "fantastic four",
                    "marvel",
                    "dc comics",
                    "dc universe"
                ]
            )
        ) {

            genres.push(
                "Action",
                "Abenteuer"
            );
        }

        // =====================================================================
        // ACTION
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "action",
                    "assassin",
                    "assassins",
                    "agent",
                    "agents",
                    "war",
                    "warrior",
                    "warriors",
                    "soldier",
                    "soldiers",
                    "fight",
                    "fighter",
                    "combat",
                    "mercenary",
                    "mercenaries",
                    "gun",
                    "guns",
                    "mission",
                    "revenge",
                    "rescue",
                    "special forces",
                    "military",
                    "police"
                ]
            )
        ) {

            genres.push(
                "Action"
            );
        }

        // =====================================================================
        // ADVENTURE
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "adventure",
                    "abenteuer",
                    "quest",
                    "treasure",
                    "pirate",
                    "pirates",
                    "expedition",
                    "jungle",
                    "island",
                    "journey"
                ]
            )
        ) {

            genres.push(
                "Abenteuer"
            );
        }

        // =====================================================================
        // SCI-FI
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "sci-fi",
                    "scifi",
                    "science fiction",
                    "space",
                    "spaceship",
                    "spaceships",
                    "alien",
                    "aliens",
                    "robot",
                    "robots",
                    "android",
                    "future",
                    "galaxy",
                    "star",
                    "stars",
                    "planet",
                    "planets",
                    "cyborg",
                    "time travel",
                    "terminator",
                    "matrix",
                    "star wars",
                    "star trek"
                ]
            )
        ) {

            genres.push(
                "Sci-Fi"
            );
        }

        // =====================================================================
        // FANTASY
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "fantasy",
                    "magic",
                    "magical",
                    "wizard",
                    "wizards",
                    "witch",
                    "witches",
                    "dragon",
                    "dragons",
                    "kingdom",
                    "elf",
                    "elves",
                    "demon",
                    "demons",
                    "fairy",
                    "fairies",
                    "middle earth",
                    "hobbit",
                    "lord of the rings",
                    "harry potter"
                ]
            )
        ) {

            genres.push(
                "Fantasy"
            );
        }

        // =====================================================================
        // HORROR
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "horror",
                    "terror",
                    "haunted",
                    "ghost",
                    "ghosts",
                    "zombie",
                    "zombies",
                    "vampire",
                    "vampires",
                    "werewolf",
                    "werewolves",
                    "evil",
                    "dead",
                    "undead",
                    "demon",
                    "demons",
                    "possession",
                    "possessed",
                    "slasher",
                    "nightmare"
                ]
            )
        ) {

            genres.push(
                "Horror"
            );
        }

        // =====================================================================
        // THRILLER
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "thriller",
                    "conspiracy",
                    "kidnap",
                    "kidnapped",
                    "hostage",
                    "stalker",
                    "stalking",
                    "serial killer",
                    "killer",
                    "murder",
                    "murderer",
                    "survival",
                    "hunt",
                    "hunted"
                ]
            )
        ) {

            genres.push(
                "Thriller"
            );
        }

        // =====================================================================
        // CRIME
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "crime",
                    "krimi",
                    "gangster",
                    "gangsters",
                    "mafia",
                    "mob",
                    "heist",
                    "robbery",
                    "robber",
                    "criminal",
                    "detective",
                    "cop",
                    "cops",
                    "drug",
                    "drugs"
                ]
            )
        ) {

            genres.push(
                "Krimi"
            );
        }

        // =====================================================================
        // MYSTERY
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "mystery",
                    "mysterious",
                    "secret",
                    "secrets",
                    "unknown",
                    "missing",
                    "investigation",
                    "investigator",
                    "detective"
                ]
            )
        ) {

            genres.push(
                "Mystery"
            );
        }

        // =====================================================================
        // DRAMA
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "drama",
                    "family",
                    "familie",
                    "life",
                    "story",
                    "based on a true story",
                    "biopic"
                ]
            )
        ) {

            genres.push(
                "Drama"
            );
        }

        // =====================================================================
        // ROMANCE
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "romance",
                    "romantic",
                    "romantik",
                    "love",
                    "liebe",
                    "lover",
                    "lovers",
                    "wedding",
                    "hochzeit"
                ]
            )
        ) {

            genres.push(
                "Romantik"
            );
        }

        // =====================================================================
        // COMEDY
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "comedy",
                    "komödie",
                    "komoedie",
                    "funny",
                    "humor",
                    "humour",
                    "comedian"
                ]
            )
        ) {

            genres.push(
                "Komödie"
            );
        }

        // =====================================================================
        // FAMILY
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "family",
                    "familie",
                    "familienfilm"
                ]
            )
        ) {

            genres.push(
                "Familie"
            );
        }

        // =====================================================================
        // ANIMATION
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "animation",
                    "animated",
                    "zeichentrick",
                    "cartoon"
                ]
            )
        ) {

            genres.push(
                "Animation"
            );
        }

        // =====================================================================
        // ANIME
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "anime",
                    "japanese animation"
                ]
            )
        ) {

            genres.push(
                "Anime"
            );
        }

        // =====================================================================
        // DOCUMENTARY
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "documentary",
                    "dokumentation",
                    "dokumentarfilm"
                ]
            )
        ) {

            genres.push(
                "Dokumentation"
            );
        }

        // =====================================================================
        // BIOGRAPHY
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "biography",
                    "biografie",
                    "biopic"
                ]
            )
        ) {

            genres.push(
                "Biografie"
            );
        }

        // =====================================================================
        // WESTERN
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "western",
                    "cowboy",
                    "cowboys",
                    "wild west"
                ]
            )
        ) {

            genres.push(
                "Western"
            );
        }

        // =====================================================================
        // MUSIC
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "music",
                    "musik",
                    "musical",
                    "concert",
                    "konzert"
                ]
            )
        ) {

            genres.push(
                "Musik"
            );
        }

        // =====================================================================
        // KIDS
        // =====================================================================

        if (
            this.containsAny(
                normalized,
                [
                    "kids",
                    "kinder",
                    "children",
                    "child",
                    "family movie"
                ]
            )
        ) {

            genres.push(
                "Kinder"
            );
        }

        // =====================================================================
        // REMOVE DUPLICATES
        // =====================================================================

        const uniqueGenres =
            this.unique(
                genres
            );

        // =====================================================================
        // FALLBACK
        // =====================================================================

        if (
            uniqueGenres.length === 0
        ) {

            return [
                "Unbekannt" as LibraryGenre
            ];
        }

        return uniqueGenres;
    }

    // =========================================================================
    // PRIMARY GENRE
    // =========================================================================

    public static detectPrimary(
        title: string
    ): LibraryGenre {

        const genres =
            this.detect(
                title
            );

        /*
         * Für das Archiv hat Action Vorrang.
         *
         * Dadurch wird beispielsweise:
         *
         * Superman
         * Batman
         * Avengers
         *
         * zuverlässig als Action eingeordnet.
         */

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
            "Unbekannt" as LibraryGenre
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

        return (
            genres[0] ??
            "Unbekannt" as LibraryGenre
        );
    }

    // =========================================================================
    // NORMALIZE
    // =========================================================================

    private static normalize(
        value: string
    ): string {

        return value
            .toLowerCase()
            .normalize(
                "NFD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(
                /[-–—]/g,
                " "
            )
            .replace(
                /[|_:;,()[\]{}]/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }

    // =========================================================================
    // KEYWORD MATCH
    // =========================================================================

    private static containsAny(
        text: string,
        keywords: string[]
    ): boolean {

        return keywords.some(
            keyword => {

                const normalizedKeyword =
                    this.normalize(
                        keyword
                    );

                return text.includes(
                    normalizedKeyword
                );
            }
        );
    }

    // =========================================================================
    // UNIQUE
    // =========================================================================

    private static unique(
        genres: LibraryGenre[]
    ): LibraryGenre[] {

        return [
            ...new Set(
                genres
            )
        ];
    }
}