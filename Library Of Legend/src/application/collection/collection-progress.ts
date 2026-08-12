/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: CollectionProgressService

Architecture Layer..: Application

Module..............: Collection

Module ID...........: LOL-MOD-APP-COLL-0003

LOL-ID..............: LOL-COLLECTION-PROGRESS-0002

File................: collection-progress.ts

Location............
Library Of Legends/src/application/collection/

Version.............: 1.1.0

Status..............: Core

Lifecycle...........: Production

Description.........

Calculates collection progress for the Library Of Legends archive.

Responsibilities:

- Resolve canonical collection names
- Count archived movies belonging to a collection
- Provide known total film counts
- Calculate collection completion
- Handle titles that were stored before collection metadata existed
- Prevent false "0 / ?" results for known collections
- Provide Telegram-ready progress information

Important:

- Existing database records may not contain a collection value.
- Therefore the service also performs automatic collection detection
  against the stored movie title.
- Known collection totals are defined centrally.
- Unknown collection totals remain unknown and are never invented.

===============================================================================
*/

import {
    MovieRepository
} from "../../infrastructure/database/database";

import {
    AutoCollectionService
} from "./auto-collection";

// =============================================================================
// TYPES
// =============================================================================

export interface CollectionProgress {

    collection:
        string;

    owned:
        number;

    total:
        number | null;

    complete:
        boolean;

    formatted:
        string;
}

// =============================================================================
// KNOWN COLLECTION TOTALS
// =============================================================================

const COLLECTION_TOTALS:
    Record<string, number> = {

    // =========================================================================
    // JOHN WICK
    // =========================================================================

    "John Wick":
        4,

    // =========================================================================
    // THE EQUALIZER
    // =========================================================================

    "The Equalizer":
        3,

    // =========================================================================
    // FAST & FURIOUS
    // =========================================================================

    "Fast & Furious":
        11,

    // =========================================================================
    // HARRY POTTER
    // =========================================================================

    "Harry Potter":
        8,

    // =========================================================================
    // TRANSFORMERS
    // =========================================================================

    "Transformers":
        7,

    // =========================================================================
    // SPIDER-MAN
    // =========================================================================

    "Spider-Man":
        8,

    // =========================================================================
    // SUPERMAN
    // =========================================================================

    "Superman":
        6,

    // =========================================================================
    // BATMAN
    // =========================================================================

    "Batman":
        10,

    // =========================================================================
    // JURASSIC PARK
    // =========================================================================

    "Jurassic Park":
        6,

    // =========================================================================
    // SCREAM
    // =========================================================================

    "Scream":
        6
};

// =============================================================================
// SERVICE
// =============================================================================

export class CollectionProgressService {

    // =========================================================================
    // GET BY TITLE
    // =========================================================================

    public static getByTitle(
        title: string
    ): CollectionProgress | null {

        const collection =
            AutoCollectionService.detect(
                title
            );

        if (
            !collection
        ) {

            return null;
        }

        return this.get(
            collection
        );
    }

    // =========================================================================
    // GET
    // =========================================================================

    public static get(
        collection: string
    ): CollectionProgress {

        const canonicalCollection =
            this.normalizeCollectionName(
                collection
            );

        // =====================================================================
        // LOAD DATABASE
        // =====================================================================

        const movies =
            MovieRepository.getAll();

        // =====================================================================
        // COUNT OWNED MOVIES
        // =====================================================================

        let owned =
            0;

        for (
            const movie of movies
        ) {

            // -----------------------------------------------------------------
            // FIRST: STORED COLLECTION
            // -----------------------------------------------------------------

            if (
                movie.collection
            ) {

                const storedCollection =
                    this.normalizeCollectionName(
                        movie.collection
                    );

                if (
                    storedCollection ===
                    canonicalCollection
                ) {

                    owned++;

                    continue;
                }
            }

            // -----------------------------------------------------------------
            // SECOND: DETECT COLLECTION FROM TITLE
            // -----------------------------------------------------------------

            const detectedCollection =
                AutoCollectionService.detect(
                    movie.title
                );

            if (
                !detectedCollection
            ) {

                continue;
            }

            const normalizedDetected =
                this.normalizeCollectionName(
                    detectedCollection
                );

            if (
                normalizedDetected ===
                canonicalCollection
            ) {

                owned++;
            }
        }

        // =====================================================================
        // TOTAL
        // =====================================================================

        const total =
            this.getTotal(
                canonicalCollection
            );

        // =====================================================================
        // COMPLETE
        // =====================================================================

        const complete =
            total !== null &&
            owned >= total;

        // =====================================================================
        // FORMATTED
        // =====================================================================

        const formatted =
            total !== null
                ? `${owned} / ${total}`
                : `${owned} / ?`;

        return {

            collection:
                canonicalCollection,

            owned,

            total,

            complete,

            formatted
        };
    }

    // =========================================================================
    // FORMAT SINGLE LINE
    // =========================================================================

    public static formatLine(
        collection: string
    ): string {

        const progress =
            this.get(
                collection
            );

        if (
            progress.complete
        ) {

            return (
                `🎞️ Reihe: ${progress.collection} · ` +
                `✅ vollständig ${progress.formatted}`
            );
        }

        return (
            `🎞️ Reihe: ${progress.collection} · ` +
            `⚠️ ${progress.formatted} vorhanden`
        );
    }

    // =========================================================================
    // FORMAT BLOCK
    // =========================================================================

    public static formatBlock(
        collection: string
    ): string {

        const progress =
            this.get(
                collection
            );

        if (
            progress.complete
        ) {

            return [
                `🎞️ Reihe: ${progress.collection}`,
                `✅ vollständig ${progress.formatted}`
            ].join(
                "\n"
            );
        }

        return [
            `🎞️ Reihe: ${progress.collection}`,
            `⚠️ ${progress.formatted} vorhanden`
        ].join(
            "\n"
        );
    }

    // =========================================================================
    // IS COMPLETE
    // =========================================================================

    public static isComplete(
        collection: string
    ): boolean {

        return this.get(
            collection
        ).complete;
    }

    // =========================================================================
    // GET OWNED
    // =========================================================================

    public static getOwned(
        collection: string
    ): number {

        return this.get(
            collection
        ).owned;
    }

    // =========================================================================
    // GET TOTAL
    // =========================================================================

    public static getTotal(
        collection: string
    ): number | null {

        const canonicalCollection =
            this.normalizeCollectionName(
                collection
            );

        return (
            COLLECTION_TOTALS[
                canonicalCollection
            ] ??
            null
        );
    }

    // =========================================================================
    // IS KNOWN COLLECTION
    // =========================================================================

    public static isKnownCollection(
        collection: string
    ): boolean {

        return (
            this.getTotal(
                collection
            ) !== null
        );
    }

    // =========================================================================
    // GET ALL KNOWN COLLECTIONS
    // =========================================================================

    public static getAllKnownCollections():
        string[] {

        return Object.keys(
            COLLECTION_TOTALS
        );
    }

    // =========================================================================
    // NORMALIZE COLLECTION NAME
    // =========================================================================

    private static normalizeCollectionName(
        value: string
    ): string {

        const normalized =
            String(
                value ||
                ""
            )
                .trim();

        /*
         * Keep collection names canonical.
         */

        const aliases:
            Record<string, string> = {

            "John Wick Reihe":
                "John Wick",

            "The Equalizer Reihe":
                "The Equalizer",

            "The Equalizer Filmreihe":
                "The Equalizer",

            "Fast & Furious Reihe":
                "Fast & Furious",

            "Harry Potter Reihe":
                "Harry Potter",

            "Transformers Reihe":
                "Transformers",

            "Spider-Man Universe":
                "Spider-Man",

            "Spider-Man Reihe":
                "Spider-Man",

            "Batman Reihe":
                "Batman",

            "Superman Reihe":
                "Superman",

            "Scream Filmreihe":
                "Scream"
        };

        return (
            aliases[
                normalized
            ] ||
            normalized
        );
    }
}