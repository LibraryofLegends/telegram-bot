/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: CollectionService

Architecture Layer..: Application

Module..............: Collection

Module ID...........: LOL-MOD-APP-COL-0001

LOL-ID..............: LOL-COLLECTION-CORE-0001

File................: collection-service.ts

Location............
Library Of Legend/src/application/collection/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Handles movie collections (film series).

Responsibilities:

- Detect if a movie belongs to a collection
- Provide collection name
- Calculate collection progress (owned / total)
- Connect collection logic with database

Important:

- Uses static mapping (will be upgraded later)
- Relies on MovieRepository (database)
- Case-insensitive matching

===============================================================================
*/

import { MovieRepository } from "../../infrastructure/database/database";

// =============================================================================
// COLLECTION MAP
// =============================================================================

const COLLECTIONS: Record<string, string[]> = {

    // =========================================================================
    // JOHN WICK
    // =========================================================================

    "John Wick Reihe": [
        "John Wick",
        "John Wick: Chapter 2",
        "John Wick: Chapter 3",
        "John Wick: Chapter 4"
    ],

    // =========================================================================
    // SCREAM
    // =========================================================================

    "Scream Filmreihe": [
        "Scream",
        "Scream 2",
        "Scream 3",
        "Scream 4",
        "Scream (2022)",
        "Scream VI"
    ]
};

// =============================================================================
// SERVICE
// =============================================================================

export class CollectionService {

    // =========================================================================
    // DETECT COLLECTION
    // =========================================================================

    public static detect(
        title: string
    ): string | null {

        const normalizedTitle =
            String(title || "").toLowerCase();

        for (const [collection, movies] of Object.entries(COLLECTIONS)) {

            const match =
                movies.some(movieTitle =>
                    normalizedTitle.includes(
                        movieTitle.toLowerCase()
                    )
                );

            if (match) {
                return collection;
            }
        }

        return null;
    }

    // =========================================================================
    // GET PROGRESS
    // =========================================================================

    public static getProgress(
        collection: string
    ): string {

        const movies =
            COLLECTIONS[collection];

        if (!movies) {
            return "—";
        }

        const allMovies =
            MovieRepository.getAll();

        let owned = 0;

        for (const movieTitle of movies) {

            const found =
                allMovies.some(m =>
                    String(m.title)
                        .toLowerCase()
                        .includes(
                            movieTitle.toLowerCase()
                        )
                );

            if (found) {
                owned++;
            }
        }

        return `${owned} / ${movies.length}`;
    }

    // =========================================================================
    // GET TOTAL (optional future use)
    // =========================================================================

    public static getTotal(
        collection: string
    ): number {

        const movies =
            COLLECTIONS[collection];

        return movies
            ? movies.length
            : 0;
    }

    // =========================================================================
    // GET ALL COLLECTIONS (future UI / commands)
    // =========================================================================

    public static getAllCollections(): string[] {

        return Object.keys(COLLECTIONS);
    }
}