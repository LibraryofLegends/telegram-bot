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

Version.............: 3.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Automatic genre detection for Library Of Legends.

Responsibilities:

- Detect genres from movie titles
- Detect genres from series titles
- Detect German keywords
- Detect English keywords
- Detect superhero content
- Detect Marvel content
- Detect DC content
- Detect science-fiction content
- Detect fantasy content
- Detect horror and thriller content
- Detect crime and mystery content
- Detect comedy and family content
- Detect drama and romance content
- Detect animation and anime
- Detect documentary and biography
- Detect western content
- Detect war content
- Detect historical content
- Detect sports content
- Detect kids content
- Provide multiple genres
- Provide a primary genre
- Never return an empty genre list
- Use a deterministic fallback

TMDB metadata can later improve the result.

===============================================================================
*/

import {
    LibraryGenre,
    normalizeLibraryGenre
} from "./genre-detector-types";

export {
    LibraryGenre
} from "./genre-detector-types";

/**
 * Keyword rule.
 */
interface GenreRule {

    genre: LibraryGenre;

    keywords: string[];
}

/**
 * Genre detection engine.
 */
export class GenreDetector {

    // =========================================================================
    // RULES
    // =========================================================================

    private static readonly RULES:
        GenreRule[] = [

        // =====================================================================
        // SUPERHERO
        // =====================================================================

        {
            genre:
                "Superhelden",

            keywords: [

                "superman",
                "batman",
                "supergirl",
                "wonder woman",
                "wonderwoman",
                "flash",
                "the flash",
                "green lantern",
                "green arrow",
                "aquaman",
                "cyborg",
                "justice league",
                "justiceleague",
                "avengers",
                "avenger",
                "iron man",
                "ironman",
                "captain america",
                "thor",
                "hulk",
                "black widow",
                "hawkeye",
                "spider-man",
                "spiderman",
                "spider man",
                "deadpool",
                "wolverine",
                "x-men",
                "xmen",
                "venom",
                "guardians of the galaxy",
                "guardians",
                "ant-man",
                "antman",
                "doctor strange",
                "black panther",
                "shang-chi",
                "eternals",
                "marvel",
                "dc comics",
                "dc universe",
                "comic book"
            ]
        },

        // =====================================================================
        // ACTION
        // =====================================================================

        {
            genre:
                "Action",

            keywords: [

                "action",
                "kampf",
                "kämpfer",
                "agent",
                "assassin",
                "assassin's",
                "attentat",
                "bodyguard",
                "soldat",
                "soldaten",
                "mercenary",
                "söldner",
                "police",
                "polizist",
                "cop",
                "swat",
                "cia",
                "fbi",
                "mi6",
                "military",
                "militär",
                "warrior",
                "krieger",
                "gun",
                "guns",
                "waffe",
                "waffen",
                "explosion",
                "explosions",
                "heist",
                "raid",
                "revenge",
                "rache",
                "mission",
                "chase",
                "verfolgung",
                "fast furious",
                "fast & furious",
                "john wick",
                "mission impossible",
                "bourne",
                "rambo",
                "terminator",
                "die hard",
                "stirb langsam"
            ]
        },

        // =====================================================================
        // ABENTEUER
        // =====================================================================

        {
            genre:
                "Abenteuer",

            keywords: [

                "abenteuer",
                "adventure",
                "treasure",
                "schatz",
                "expedition",
                "expeditionen",
                "jungle",
                "dschungel",
                "island",
                "insel",
                "pirate",
                "pirates",
                "pirat",
                "piraten",
                "explorer",
                "entdecker",
                "quest",
                "reise",
                "journey",
                "voyage",
                "lost world",
                "unbekannte welt",
                "jurassic park",
                "jurassic world",
                "indiana jones",
                "tomb raider",
                "uncharted",
                "mummy",
                "die mumie"
            ]
        },

        // =====================================================================
        // HORROR
        // =====================================================================

        {
            genre:
                "Horror",

            keywords: [

                "horror",
                "terror",
                "dämon",
                "dämonen",
                "demon",
                "demons",
                "devil",
                "teufel",
                "ghost",
                "ghosts",
                "geist",
                "geister",
                "haunted",
                "spuk",
                "spukhaus",
                "haunted house",
                "vampire",
                "vampir",
                "zombie",
                "zombies",
                "witch",
                "witches",
                "hexe",
                "hexen",
                "possession",
                "besessen",
                "exorcism",
                "exorzismus",
                "evil",
                "böse",
                "dead",
                "toten",
                "scream",
                "conjuring",
                "insidious",
                "annabelle",
                "halloween",
                "saw",
                "texas chainsaw",
                "nightmare",
                "alptraum"
            ]
        },

        // =====================================================================
        // THRILLER
        // =====================================================================

        {
            genre:
                "Thriller",

            keywords: [

                "thriller",
                "psychothriller",
                "psychological",
                "psychologisch",
                "serial killer",
                "serienkiller",
                "killer",
                "mörder",
                "murder",
                "mord",
                "hostage",
                "geisel",
                "kidnapping",
                "entführung",
                "conspiracy",
                "verschwörung",
                "suspense",
                "stalker",
                "stalking",
                "survival",
                "überleben",
                "danger",
                "gefahr",
                "secret",
                "geheimnis",
                "no escape",
                "escape",
                "flucht"
            ]
        },

        // =====================================================================
        // SCI-FI
        // =====================================================================

        {
            genre:
                "Sci-Fi",

            keywords: [

                "sci-fi",
                "sci fi",
                "science fiction",
                "sciencefiction",
                "space",
                "weltraum",
                "galaxy",
                "galaxie",
                "planet",
                "planeten",
                "alien",
                "aliens",
                "extraterrestrial",
                "android",
                "androiden",
                "robot",
                "roboter",
                "cyborg",
                "future",
                "zukunft",
                "time travel",
                "zeitreise",
                "time machine",
                "zeitmaschine",
                "spaceship",
                "raumschiff",
                "star",
                "stars",
                "star wars",
                "star trek",
                "matrix",
                "terminator",
                "blade runner",
                "avatar",
                "dune",
                "predator",
                "alien",
                "independence day"
            ]
        },

        // =====================================================================
        // FANTASY
        // =====================================================================

        {
            genre:
                "Fantasy",

            keywords: [

                "fantasy",
                "magie",
                "magic",
                "magical",
                "zauber",
                "zauberer",
                "wizard",
                "witch",
                "hexe",
                "hexen",
                "dragon",
                "dragons",
                "drache",
                "drachen",
                "elf",
                "elfen",
                "elfe",
                "dwarf",
                "zwerge",
                "zwerg",
                "kingdom",
                "königreich",
                "prinz",
                "prinzessin",
                "fairy",
                "fee",
                "feen",
                "myth",
                "mythology",
                "mythologie",
                "middle earth",
                "mittelerde",
                "lord of the rings",
                "herr der ringe",
                "hobbit",
                "harry potter",
                "fantastic beasts",
                "narnia",
                "game of thrones",
                "house of the dragon"
            ]
        },

        // =====================================================================
        // DRAMA
        // =====================================================================

        {
            genre:
                "Drama",

            keywords: [

                "drama",
                "dramatic",
                "familie",
                "family",
                "leben",
                "life",
                "schicksal",
                "fate",
                "krieg",
                "war",
                "verlust",
                "loss",
                "trauer",
                "grief",
                "freundschaft",
                "friendship",
                "wahrheit",
                "truth",
                "geschichte",
                "story",
                "biopic"
            ]
        },

        // =====================================================================
        // ROMANTIK
        // =====================================================================

        {
            genre:
                "Romantik",

            keywords: [

                "romance",
                "romantic",
                "romantik",
                "liebe",
                "love",
                "lover",
                "lovers",
                "hochzeit",
                "wedding",
                "bride",
                "groom",
                "verliebt",
                "beziehung",
                "relationship",
                "kiss",
                "kuss",
                "valentine",
                "valentinstag"
            ]
        },

        // =====================================================================
        // KOMÖDIE
        // =====================================================================

        {
            genre:
                "Komödie",

            keywords: [

                "comedy",
                "komödie",
                "komoedie",
                "humor",
                "funny",
                "lustig",
                "witzig",
                "parodie",
                "parody",
                "satire",
                "satire",
                "prank",
                "college",
                "hangover",
                "dumm",
                "idiot",
                "fools",
                "buddy"
            ]
        },

        // =====================================================================
        // FAMILIE
        // =====================================================================

        {
            genre:
                "Familie",

            keywords: [

                "familie",
                "family",
                "familienfilm",
                "family movie",
                "family film",
                "eltern",
                "parents",
                "kind",
                "kinder",
                "kids",
                "siblings",
                "geschwister",
                "school",
                "schule"
            ]
        },

        // =====================================================================
        // KRIMI
        // =====================================================================

        {
            genre:
                "Krimi",

            keywords: [

                "crime",
                "krimi",
                "criminal",
                "verbrechen",
                "detective",
                "detektiv",
                "detectives",
                "police",
                "polizei",
                "cop",
                "murder",
                "mord",
                "killer",
                "mafioso",
                "mafia",
                "gangster",
                "gang",
                "drug",
                "drogen",
                "investigation",
                "ermittlung",
                "ermittler",
                "forensic",
                "forensik"
            ]
        },

        // =====================================================================
        // MYSTERY
        // =====================================================================

        {
            genre:
                "Mystery",

            keywords: [

                "mystery",
                "rätsel",
                "riddle",
                "mysterious",
                "geheimnis",
                "secret",
                "unknown",
                "unbekannt",
                "disappearance",
                "verschwunden",
                "verschwinden",
                "strange",
                "seltsam",
                "paranormal",
                "übernatürlich",
                "supernatural"
            ]
        },

        // =====================================================================
        // ANIMATION
        // =====================================================================

        {
            genre:
                "Animation",

            keywords: [

                "animation",
                "animated",
                "zeichentrick",
                "cartoon",
                "animated movie",
                "pixar",
                "dreamworks",
                "illumination",
                "disney animation",
                "stop motion",
                "stop-motion"
            ]
        },

        // =====================================================================
        // ANIME
        // =====================================================================

        {
            genre:
                "Anime",

            keywords: [

                "anime",
                "manga",
                "japan animation",
                "japanese animation",
                "shonen",
                "shoujo",
                "isekai",
                "dragon ball",
                "naruto",
                "one piece",
                "bleach",
                "pokemon",
                "pokémon",
                "demon slayer",
                "jujutsu kaisen",
                "attack on titan",
                "my hero academia"
            ]
        },

        // =====================================================================
        // DOKUMENTATION
        // =====================================================================

        {
            genre:
                "Dokumentation",

            keywords: [

                "documentary",
                "dokumentation",
                "dokumentarfilm",
                "doku",
                "nature documentary",
                "naturdokumentation",
                "true story",
                "wahre geschichte",
                "real story",
                "history documentary",
                "science documentary"
            ]
        },

        // =====================================================================
        // BIOGRAFIE
        // =====================================================================

        {
            genre:
                "Biografie",

            keywords: [

                "biography",
                "biografie",
                "biographical",
                "biopic",
                "leben von",
                "based on a true story",
                "based on true events",
                "wahre begebenheit"
            ]
        },

        // =====================================================================
        // KINDER
        // =====================================================================

        {
            genre:
                "Kinder",

            keywords: [

                "kids",
                "kid",
                "kinder",
                "kinderfilm",
                "kinderfilme",
                "children",
                "children's",
                "family kids",
                "baby",
                "babies",
                "junior",
                "puppy",
                "welpen",
                "paw patrol",
                "peppa pig",
                "mickey mouse",
                "winnie pooh"
            ]
        },

        // =====================================================================
        // WESTERN
        // =====================================================================

        {
            genre:
                "Western",

            keywords: [

                "western",
                "cowboy",
                "cowboys",
                "cowgirl",
                "wild west",
                "wilder westen",
                "sheriff",
                "saloon",
                "gunslinger",
                "outlaw",
                "outlaws",
                "duel",
                "duell"
            ]
        },

        // =====================================================================
        // MUSIK
        // =====================================================================

        {
            genre:
                "Musik",

            keywords: [

                "music",
                "musik",
                "musical",
                "concert",
                "konzert",
                "singer",
                "sänger",
                "sängerin",
                "band",
                "rock",
                "pop star",
                "popstar",
                "rapper",
                "rap",
                "dance"
            ]
        },

        // =====================================================================
        // HISTORISCH
        // =====================================================================

        {
            genre:
                "Historisch",

            keywords: [

                "historical",
                "historisch",
                "history",
                "geschichte",
                "mittelalter",
                "medieval",
                "ancient",
                "antik",
                "ancient rome",
                "römer",
                "roman empire",
                "könig",
                "king",
                "queen",
                "kaiser",
                "emperor",
                "period drama"
            ]
        },

        // =====================================================================
        // KRIEGSFILM
        // =====================================================================

        {
            genre:
                "Kriegsfilm",

            keywords: [

                "war",
                "krieg",
                "kriegsfilm",
                "world war",
                "weltkrieg",
                "world war ii",
                "world war 2",
                "zweiter weltkrieg",
                "first world war",
                "erster weltkrieg",
                "soldier",
                "soldat",
                "military",
                "militär",
                "battle",
                "schlacht",
                "front",
                "army",
                "armee",
                "navy",
                "marine"
            ]
        },

        // =====================================================================
        // SPORT
        // =====================================================================

        {
            genre:
                "Sport",

            keywords: [

                "sport",
                "sports",
                "football",
                "soccer",
                "fußball",
                "fussball",
                "basketball",
                "baseball",
                "hockey",
                "tennis",
                "boxing",
                "boxen",
                "wrestling",
                "rennen",
                "racing",
                "formula 1",
                "formel 1",
                "olympics",
                "olympia",
                "champion",
                "championship"
            ]
        },

        // =====================================================================
        // ABENTEUERFILM
        // =====================================================================

        {
            genre:
                "Abenteuerfilm",

            keywords: [

                "adventure film",
                "abenteuerfilm",
                "action adventure",
                "action-abenteuer"
            ]
        }
    ];

    // =========================================================================
    // DETECT
    // =========================================================================

    public static detect(
        title: string
    ): LibraryGenre[] {

        const normalized =
            this.normalizeTitle(
                title
            );

        if (
            !normalized
        ) {

            return [
                "Unbekannt"
            ];
        }

        const detected:
            LibraryGenre[] = [];

        // =====================================================================
        // CHECK ALL RULES
        // =====================================================================

        for (
            const rule of
            this.RULES
        ) {

            const matched =
                this.containsKeyword(
                    normalized,
                    rule.keywords
                );

            if (
                matched &&
                !detected.includes(
                    rule.genre
                )
            ) {

                detected.push(
                    rule.genre
                );
            }
        }

        // =====================================================================
        // SPECIAL COMBINATIONS
        // =====================================================================

        this.addSpecialGenres(
            normalized,
            detected
        );

        // =====================================================================
        // FALLBACK
        // =====================================================================

        if (
            detected.length === 0
        ) {

            detected.push(
                "Unbekannt"
            );
        }

        return detected;
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

        // =====================================================================
        // PRIORITY
        // =====================================================================

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

            "Krimi",

            "Mystery",

            "Western",

            "Sport",

            "Dokumentation",

            "Biografie",

            "Animation",

            "Komödie",

            "Familie",

            "Romantik",

            "Drama",

            "Historisch",

            "Musik",

            "Abenteuerfilm",

            "Unbekannt"
        ];

        for (
            const genre of
            priority
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
    // NORMALIZE
    // =========================================================================

    public static normalizeTitle(
        title: string
    ): string {

        return String(
            title || ""
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
                /[_./\\|()[\]{}:;,!?]+/g,
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

    private static containsKeyword(
        title: string,
        keywords: string[]
    ): boolean {

        for (
            const keyword of
            keywords
        ) {

            const normalizedKeyword =
                this.normalizeTitle(
                    keyword
                );

            if (
                !normalizedKeyword
            ) {

                continue;
            }

            if (
                title.includes(
                    normalizedKeyword
                )
            ) {

                return true;
            }
        }

        return false;
    }

    // =========================================================================
    // SPECIAL GENRES
    // =========================================================================

    private static addSpecialGenres(
        title: string,
        genres: LibraryGenre[]
    ): void {

        // =====================================================================
        // SUPERMAN
        // =====================================================================

        if (
            title.includes(
                "superman"
            )
        ) {

            this.addGenre(
                genres,
                "Superhelden"
            );

            this.addGenre(
                genres,
                "Action"
            );
        }

        // =====================================================================
        // MARVEL
        // =====================================================================

        if (
            title.includes(
                "marvel"
            ) ||
            title.includes(
                "avengers"
            ) ||
            title.includes(
                "iron man"
            ) ||
            title.includes(
                "captain america"
            ) ||
            title.includes(
                "thor"
            )
        ) {

            this.addGenre(
                genres,
                "Superhelden"
            );

            this.addGenre(
                genres,
                "Action"
            );
        }

        // =====================================================================
        // DC
        // =====================================================================

        if (
            title.includes(
                "batman"
            ) ||
            title.includes(
                "wonder woman"
            ) ||
            title.includes(
                "justice league"
            ) ||
            title.includes(
                "aquaman"
            ) ||
            title.includes(
                "green lantern"
            )
        ) {

            this.addGenre(
                genres,
                "Superhelden"
            );

            this.addGenre(
                genres,
                "Action"
            );
        }

        // =====================================================================
        // JURASSIC
        // =====================================================================

        if (
            title.includes(
                "jurassic park"
            ) ||
            title.includes(
                "jurassic world"
            )
        ) {

            this.addGenre(
                genres,
                "Abenteuer"
            );

            this.addGenre(
                genres,
                "Action"
            );

            this.addGenre(
                genres,
                "Sci-Fi"
            );
        }

        // =====================================================================
        // HARRY POTTER
        // =====================================================================

        if (
            title.includes(
                "harry potter"
            ) ||
            title.includes(
                "fantastic beasts"
            )
        ) {

            this.addGenre(
                genres,
                "Fantasy"
            );

            this.addGenre(
                genres,
                "Abenteuer"
            );
        }

        // =====================================================================
        // FAST & FURIOUS
        // =====================================================================

        if (
            title.includes(
                "fast furious"
            ) ||
            title.includes(
                "fast and furious"
            )
        ) {

            this.addGenre(
                genres,
                "Action"
            );

            this.addGenre(
                genres,
                "Abenteuer"
            );
        }

        // =====================================================================
        // STAR WARS
        // =====================================================================

        if (
            title.includes(
                "star wars"
            )
        ) {

            this.addGenre(
                genres,
                "Sci-Fi"
            );

            this.addGenre(
                genres,
                "Action"
            );

            this.addGenre(
                genres,
                "Abenteuer"
            );
        }

        // =====================================================================
        // LORD OF THE RINGS
        // =====================================================================

        if (
            title.includes(
                "lord of the rings"
            ) ||
            title.includes(
                "herr der ringe"
            ) ||
            title.includes(
                "hobbit"
            )
        ) {

            this.addGenre(
                genres,
                "Fantasy"
            );

            this.addGenre(
                genres,
                "Abenteuer"
            );
        }

        // =====================================================================
        // HORROR + THRILLER
        // =====================================================================

        if (
            genres.includes(
                "Horror"
            )
        ) {

            this.addGenre(
                genres,
                "Thriller"
            );
        }

        // =====================================================================
        // ACTION + ABENTEUER
        // =====================================================================

        if (
            genres.includes(
                "Action"
            ) &&
            genres.includes(
                "Abenteuer"
            )
        ) {

            this.addGenre(
                genres,
                "Abenteuerfilm"
            );
        }

        // =====================================================================
        // ANIME + ANIMATION
        // =====================================================================

        if (
            genres.includes(
                "Anime"
            )
        ) {

            this.addGenre(
                genres,
                "Animation"
            );
        }

        // =====================================================================
        // KINDER + FAMILIE
        // =====================================================================

        if (
            genres.includes(
                "Kinder"
            )
        ) {

            this.addGenre(
                genres,
                "Familie"
            );
        }
    }

    // =========================================================================
    // ADD GENRE
    // =========================================================================

    private static addGenre(
        genres: LibraryGenre[],
        genre: LibraryGenre
    ): void {

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

    // =========================================================================
    // NORMALIZE GENRE
    // =========================================================================

    public static normalizeGenre(
        value: unknown
    ): LibraryGenre {

        return normalizeLibraryGenre(
            value
        );
    }

    // =========================================================================
    // HAS GENRE
    // =========================================================================

    public static hasGenre(
        title: string,
        genre: LibraryGenre
    ): boolean {

        return this.detect(
            title
        ).includes(
            genre
        );
    }

    // =========================================================================
    // DEBUG
    // =========================================================================

    public static describe(
        title: string
    ): string {

        const genres =
            this.detect(
                title
            );

        const primary =
            this.detectPrimary(
                title
            );

        return [

            "=================================================",

            "🧠 GENRE DETECTOR",

            "=================================================",

            `🎬 Titel: ${title}`,

            `🏷️ Genres: ${
                genres.join(
                    ", "
                )
            }`,

            `⭐ Primary: ${primary}`,

            "================================================="

        ].join(
            "\n"
        );
    }
}