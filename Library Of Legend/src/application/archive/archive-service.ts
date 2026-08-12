/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ArchiveService

Architecture Layer..: Application

Module..............: Archive

Module ID...........: LOL-MOD-APP-ARCH-0001

LOL-ID..............: LOL-ARCHIVE-ID-0001

File................: archive-service.ts

Location............
Library Of Legend/src/application/archive/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Generates unique Archive IDs for movies.

Responsibilities:

- Map genres to short codes
- Generate archive IDs (#LIB-XXX-0001)
- Maintain in-memory counters per genre

Important:

- First genre is used as primary genre
- Counter is NOT persistent (resets on restart)
- Will be upgraded later with database support

===============================================================================
*/

// =============================================================================
// GENRE MAP
// =============================================================================

const GENRE_MAP: Record<string, string> = {

    "Action": "ACT",
    "Thriller": "THR",
    "Krimi": "CRI",
    "Horror": "HOR",
    "Science Fiction": "SCI",
    "Fantasy": "FAN",
    "Abenteuer": "ADV",
    "Animation": "ANI",
    "Komödie": "COM",
    "Drama": "DRA"

};

// =============================================================================
// COUNTERS (IN-MEMORY)
// =============================================================================

const counters: Record<string, number> = {};

// =============================================================================
// SERVICE
// =============================================================================

export class ArchiveService {

    // =========================================================================
    // GENERATE ARCHIVE ID
    // =========================================================================

    public static generate(
        genres: string[]
    ): string {

        // ---------------------------------------------------------------------
        // PRIMARY GENRE
        // ---------------------------------------------------------------------

        const primaryGenre =
            Array.isArray(genres) && genres.length > 0
                ? genres[0]
                : "Unknown";

        // ---------------------------------------------------------------------
        // MAP TO CODE
        // ---------------------------------------------------------------------

        const code =
            GENRE_MAP[primaryGenre] || "GEN";

        // ---------------------------------------------------------------------
        // COUNTER
        // ---------------------------------------------------------------------

        if (!counters[code]) {
            counters[code] = 1;
        } else {
            counters[code]++;
        }

        // ---------------------------------------------------------------------
        // FORMAT NUMBER
        // ---------------------------------------------------------------------

        const number =
            String(counters[code])
                .padStart(4, "0");

        // ---------------------------------------------------------------------
        // RESULT
        // ---------------------------------------------------------------------

        return `#LIB-${code}-${number}`;
    }
}