/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: CollectionService

Architecture Layer..: Application

Module..............: Collection

Module ID...........: LOL-MOD-APP-COLLECTION-0001

LOL-ID..............: LOL-COLLECTION-0001

File................: collection-service.ts

Location............
Library Of Legend/src/application/collection/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Detects movie collections / franchises automatically.

===============================================================================
*/

export class CollectionService {

    // =========================================================================
    // MAIN
    // =========================================================================

    public static detect(
        title?: string
    ): string | null {

        if (!title) return null;

        const t = title.toLowerCase();

        // =========================================================================
        // COLLECTION MAP
        // =========================================================================

        const collections: Record<string, string> = {

            // Marvel / Spider-Man
            "spider-man": "Spider-Man Universe",
            "avengers": "Marvel Cinematic Universe",
            "iron man": "Marvel Cinematic Universe",

            // DC
            "batman": "Batman Reihe",
            "superman": "Superman Reihe",

            // Action Reihen
            "fast & furious": "Fast & Furious Saga",
            "fast and furious": "Fast & Furious Saga",
            "the equalizer": "The Equalizer Reihe",
            "john wick": "John Wick Reihe",

            // Klassiker
            "harry potter": "Harry Potter Reihe",
            "lord of the rings": "Herr der Ringe Trilogie",
            "the hobbit": "Der Hobbit Trilogie",

            // Horror
            "scream": "Scream Filmreihe",
            "conjuring": "Conjuring Universe",
            "annabelle": "Conjuring Universe",

            // Animation
            "toy story": "Toy Story Reihe",
            "shrek": "Shrek Reihe"
        };

        for (const key in collections) {

            if (t.includes(key)) {
                return collections[key];
            }
        }

        return null;
    }
}