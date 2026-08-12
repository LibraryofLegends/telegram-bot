/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: AutoCollection

Architecture Layer..: Application

Module..............: Collection

Module ID...........: LOL-MOD-APP-COLL-0002

LOL-ID..............: LOL-AUTO-COLLECTION-0001

File................: auto-collection.ts

Location............
Library Of Legend/src/application/collection/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Automatically detects movie collections (film series) from titles.

Responsibilities:

- Normalize movie titles
- Detect known collections
- Fallback to base title extraction

===============================================================================
*/

// =============================================================================
// KNOWN COLLECTIONS (MANUELL ERWEITERBAR 🔥)
// =============================================================================

const COLLECTION_MAP: Record<string, string> = {

    "john wick": "John Wick",
    "the equalizer": "The Equalizer",
    "fast & furious": "Fast & Furious",
    "harry potter": "Harry Potter",
    "avengers": "Marvel Avengers",
    "iron man": "Marvel Iron Man",
    "batman": "Batman",
    "superman": "Superman",
    "spider-man": "Spider-Man",
    "jurassic": "Jurassic Park",
    "transformers": "Transformers"

};

// =============================================================================
// HELPERS
// =============================================================================

function normalize(title: string): string {

    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .trim();
}

// =============================================================================
// SERVICE
// =============================================================================

export class AutoCollectionService {

    public static detect(title: string): string | null {

        const clean =
            normalize(title);

        // ---------------------------------------------------------------------
        // 1. KNOWN COLLECTION MATCH
        // ---------------------------------------------------------------------

        for (const key in COLLECTION_MAP) {

            if (clean.includes(key)) {
                return COLLECTION_MAP[key];
            }
        }

        // ---------------------------------------------------------------------
        // 2. FALLBACK (NUMMER ENTFERNEN)
        // ---------------------------------------------------------------------

        const fallback =
            clean
                .replace(/\b\d+\b/g, "")      // Zahlen entfernen
                .replace(/chapter/gi, "")
                .replace(/part/gi, "")
                .replace(/final/gi, "")
                .replace(/\s+/g, " ")
                .trim();

        if (fallback.length > 3) {
            return capitalize(fallback);
        }

        return null;
    }
}

// =============================================================================
// FORMATTER
// =============================================================================

function capitalize(text: string): string {

    return text
        .split(" ")
        .map(word =>
            word.charAt(0).toUpperCase() +
            word.slice(1)
        )
        .join(" ");
}