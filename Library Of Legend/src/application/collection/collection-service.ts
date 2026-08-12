/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: CollectionService

Architecture Layer..: Application

Module..............: Collection

Module ID...........: LOL-MOD-APP-COL-0002

LOL-ID..............: LOL-COLLECTION-AUTO-0001

File................: collection-service.ts

Version.............: 2.0.0

Description.........

Automatic Collection Detection (No Static Mapping Required)

===============================================================================
*/

import { MovieRepository } from "../../infrastructure/database/database";

// =============================================================================
// HELPERS
// =============================================================================

function normalize(title: string): string {
    return String(title || "")
        .toLowerCase()
        .replace(/[:\-]/g, "")
        .trim();
}

// =============================================================================
// SERVICE
// =============================================================================

export class CollectionService {

    // =========================================================================
    // AUTO DETECT COLLECTION
    // =========================================================================

    public static detect(title: string): string | null {

        const t = normalize(title);

        // ---------------------------------------------------------------------
        // JOHN WICK
        // ---------------------------------------------------------------------
        if (t.includes("john wick")) {
            return "John Wick Reihe";
        }

        // ---------------------------------------------------------------------
        // FAST & FURIOUS
        // ---------------------------------------------------------------------
        if (
            t.includes("fast") &&
            t.includes("furious")
        ) {
            return "Fast & Furious Reihe";
        }

        // ---------------------------------------------------------------------
        // HARRY POTTER
        // ---------------------------------------------------------------------
        if (t.includes("harry potter")) {
            return "Harry Potter Reihe";
        }

        // ---------------------------------------------------------------------
        // TRANSFORMERS
        // ---------------------------------------------------------------------
        if (t.includes("transformers")) {
            return "Transformers Reihe";
        }

        // ---------------------------------------------------------------------
        // GENERIC DETECTION (z.B. "Movie 2", "Film 3")
        // ---------------------------------------------------------------------
        const match = t.match(/^(.+?)\s(\d+)$/);

        if (match) {
            return `${match[1].trim()} Reihe`;
        }

        return null;
    }

    // =========================================================================
    // GET PROGRESS
    // =========================================================================

    public static getProgress(
        collection: string
    ): string {

        const allMovies =
            MovieRepository.getAll();

        // Filter: gleiche Reihe
        const related = allMovies.filter(m =>
            this.detect(m.title) === collection
        );

        const owned = related.length;

        // UNKNOWN TOTAL → dynamisch (wird später verbessert)
        return `${owned} / ?`;
    }
}