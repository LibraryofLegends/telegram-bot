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

export {
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
                    "the flash",
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
                    "police",
                    "john wick",
                    "rambo",
                    "die hard",
                    "mission impossible"
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
                    "journey",
                    "indiana jones",
                    "jurassic",
                    "tomb raider"
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
                    "sci fi",
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
                    "time machine",
                    "terminator",
                    "matrix",
                    "star wars",
                    "star trek",
                    "blade runner",
                    "transformers",
                    "back to the future"
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
                    "harry potter",
                    "narnia"
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
                    "undead",
                    "possession",
                    "possessed",
                    "slasher",
                    "nightmare",
                    "conjuring",
                    "insidious",
                    "scream",
                    "halloween",
                    "saw",
                    "evil dead"
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
                    "hunted",
                    "escape",
                    "danger"
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
                    "drugs",
                    "organized crime"
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
                    "detective",
                    "clue",
                    "clues"
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
                    "cartoon",
                    "pixar",
                    "dreamworks"
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
                    "dokumentarfilm",
                    "dokumentar"
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
                "Unbekannt"
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
         * Priority determines which genre becomes the
         * primary archive category.
         *
         * Example:
         *
         * Superman
         * -> Action + Abenteuer
         * -> primary = Action
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

        return (
            genres[0] ??
            "Unbekannt"
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