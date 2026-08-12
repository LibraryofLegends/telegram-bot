/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: CollectionProgressService

Architecture Layer..: Application

Module..............: Collection

Module ID...........: LOL-MOD-APP-COLL-0003

LOL-ID..............: LOL-COLLECTION-PROGRESS-0001

File................: collection-progress.ts

Location............
Library Of Legends/src/application/collection/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Production

Description.........

Calculates collection progress for the Library Of Legends archive.

Responsibilities:

- Resolve collection names
- Count already archived movies
- Provide known collection totals
- Return progress in a Telegram-friendly format
- Prevent incorrect collection progress
- Keep progress calculation centralized

Examples:

The Equalizer
→ 2 / 3

John Wick
→ 4 / 4

Unknown collection
→ 2 / ?

Important:

- Progress is based on the SQLite movie archive.
- The collection name must match the canonical name used by
  AutoCollectionService.
- No fake progress is generated.
- Unknown collection totals remain unknown until explicitly defined.

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
    // ACTION
    // =========================================================================

    "John Wick":
        4,

    "The Equalizer":
        3,

    "Fast & Furious":
        11,

    "Transformers":
        7,

    // =========================================================================
    // FANTASY
    // =========================================================================

    "Harry Potter":
        8,

    // =========================================================================
    // SUPERHERO
    // =========================================================================

    "Batman":
        10,

    "Superman":
        6,

    "Spider-Man":
        8,

    "Marvel Avengers":
        4,

    "Marvel Iron Man":
        3,

    // =========================================================================
    // SCI-FI / ADVENTURE
    // =========================================================================

    "Jurassic Park":
        6
};

// =============================================================================
// SERVICE
// =============================================================================

export class CollectionProgressService {

    // =========================================================================
    // GET PROGRESS BY TITLE
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
    // GET PROGRESS
    // =========================================================================

    public static get(
        collection: string
    ): CollectionProgress {

        const canonicalCollection =
            this.normalizeCollectionName(
                collection
            );

        // =====================================================================
        // GET ARCHIVED MOVIES
        // =====================================================================

        const movies =
            MovieRepository.getAll();

        // =====================================================================
        // COUNT OWNED MOVIES
        // =====================================================================

        const owned =
            movies.filter(
                movie => {

                    if (
                        movie.collection
                    ) {

                        return (
                            this.normalizeCollectionName(
                                movie.collection
                            ) ===
                            canonicalCollection
                        );
                    }

                    /*
                     * Fallback for older records that may not have the
                     * collection field populated.
                     */

                    const detected =
                        AutoCollectionService.detect(
                            movie.title
                        );

                    if (
                        !detected
                    ) {

                        return false;
                    }

                    return (
                        this.normalizeCollectionName(
                            detected
                        ) ===
                        canonicalCollection
                    );
                }
            ).length;

        // =====================================================================
        // TOTAL
        // =====================================================================

        const total =
            COLLECTION_TOTALS[
                canonicalCollection
            ] ??
            null;

        // =====================================================================
        // COMPLETE
        // =====================================================================

        const complete =
            total !== null &&
            owned >= total;

        // =====================================================================
        // FORMAT
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
    // FORMAT TELEGRAM LINE
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

            return [
                `🎞️ Reihe: ${progress.collection}`,
                `✅ vollständig ${progress.formatted}`
            ].join(
                " · "
            );
        }

        return [
            `🎞️ Reihe: ${progress.collection}`,
            `⚠️ ${progress.formatted} vorhanden`
        ].join(
            " · "
        );
    }

    // =========================================================================
    // FORMAT MULTI-LINE
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
    // GET TOTAL
    // =========================================================================

    public static getTotal(
        collection: string
    ): number | null {

        const canonical =
            this.normalizeCollectionName(
                collection
            );

        return (
            COLLECTION_TOTALS[
                canonical
            ] ??
            null
        );
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
    // COLLECTION EXISTS
    // =========================================================================

    public static isKnownCollection(
        collection: string
    ): boolean {

        const canonical =
            this.normalizeCollectionName(
                collection
            );

        return Boolean(
            COLLECTION_TOTALS[
                canonical
            ]
        );
    }

    // =========================================================================
    // NORMALIZE COLLECTION NAME
    // =========================================================================

    private static normalizeCollectionName(
        value: string
    ): string {

        return String(
            value ||
            ""
        )
            .trim();
    }
}