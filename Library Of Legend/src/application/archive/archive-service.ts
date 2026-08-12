/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ArchiveService

Architecture Layer..: Application

Module..............: Archive

Module ID...........: LOL-MOD-APP-ARCH-0002

LOL-ID..............: LOL-ARCHIVE-PERSIST-0001

File................: archive-service.ts

Location............
Library Of Legend/src/application/archive/

Version.............: 2.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Persistent Archive ID Service for Library Of Legends.

Responsibilities:

- Map TMDB genres to short archive codes
- Generate persistent archive IDs (#LIB-XXX-0001)
- Fetch last used ID from database
- Increment safely per genre

Important:

- Uses MovieRepository (database)
- Archive IDs are UNIQUE and persistent
- First genre is used as primary genre
- Fallback genre = GEN

===============================================================================
*/

// =============================================================================
// IMPORTS
// =============================================================================

import { MovieRepository } from "../../infrastructure/database/database";

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
// SERVICE
// =============================================================================

export class ArchiveService {

    // =========================================================================
    // GENERATE ARCHIVE ID (PERSISTENT)
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
        // FETCH LAST ID FROM DATABASE
        // ---------------------------------------------------------------------

        const lastArchiveId =
            MovieRepository.getLastArchiveId(code);

        // ---------------------------------------------------------------------
        // DETERMINE NEXT NUMBER
        // ---------------------------------------------------------------------

        let nextNumber = 1;

        if (lastArchiveId) {

            const match =
                lastArchiveId.match(/-(\d+)$/);

            if (match) {

                const lastNumber =
                    parseInt(match[1], 10);

                if (!isNaN(lastNumber)) {
                    nextNumber = lastNumber + 1;
                }
            }
        }

        // ---------------------------------------------------------------------
        // FORMAT NUMBER
        // ---------------------------------------------------------------------

        const formattedNumber =
            String(nextNumber)
                .padStart(4, "0");

        // ---------------------------------------------------------------------
        // RESULT
        // ---------------------------------------------------------------------

        return `#LIB-${code}-${formattedNumber}`;
    }
}