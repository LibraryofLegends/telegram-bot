/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ArchiveID

Architecture Layer..: Application

Module..............: Archive

Module ID...........: LOL-MOD-APP-ARCHIVE-0001

LOL-ID..............: LOL-ARCHIVE-0001

File................: archive-id.ts

Location............
Library Of Legend/src/application/archive/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Generates Library Of Legends Archive IDs.

Format:

#LIB-XXX-0001

===============================================================================
*/

// =============================================================================
// TYPES
// =============================================================================

export interface ArchiveInput {

    genres?: string[];

}

// =============================================================================
// SERVICE
// =============================================================================

export class ArchiveId {

    private static counters: Record<string, number> = {};

    // =========================================================================
    // MAIN
    // =========================================================================

    public static generate(
        input: ArchiveInput
    ): string {

        const prefix =
            this.resolvePrefix(
                input.genres
            );

        const number =
            this.nextNumber(
                prefix
            );

        return `#LIB-${prefix}-${number}`;
    }

    // =========================================================================
    // PREFIX
    // =========================================================================

    private static resolvePrefix(
        genres?: string[]
    ): string {

        if (!genres || genres.length === 0) {
            return "GEN";
        }

        const main =
            genres[0];

        const map: Record<string, string> = {

            "Action": "ACT",
            "Abenteuer": "ADV",
            "Adventure": "ADV",

            "Science Fiction": "SCI",
            "Sci-Fi": "SCI",

            "Fantasy": "FAN",

            "Horror": "HOR",
            "Thriller": "THR",

            "Krimi": "CRI",
            "Crime": "CRI",

            "Animation": "ANI",

            "Komödie": "COM",
            "Comedy": "COM",

            "Drama": "DRA",
            "Romantik": "ROM",

            "Familie": "FAM"
        };

        return map[main] || "GEN";
    }

    // =========================================================================
    // COUNTER
    // =========================================================================

    private static nextNumber(
        prefix: string
    ): string {

        if (!this.counters[prefix]) {
            this.counters[prefix] = 1;
        } else {
            this.counters[prefix]++;
        }

        return this.counters[prefix]
            .toString()
            .padStart(4, "0");
    }
}