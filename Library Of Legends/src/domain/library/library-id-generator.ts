/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LibraryIdGenerator

Architecture Layer..: Domain

Module..............: Library

Module ID...........: LOL-MOD-LIB-0001

LOL-ID..............: LOL-LIB-0001

File................: library-id-generator.ts

Location............
Library Of Legends/src/domain/library/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Generates unique Library IDs for movies and series.

===============================================================================
*/

/**
 * Library ID Types
 */
export type LibraryType = "MOVIE" | "SERIES";

/**
 * Internal counters (temporary – later DB)
 */
let movieCounter = 1;
let seriesCounter = 1;

/**
 * Library ID Generator
 */
export class LibraryIdGenerator {

    /**
     * Generate next ID
     */
    public static next(type: LibraryType): string {

        if (type === "MOVIE") {
            const id = this.format("MOV", movieCounter);
            movieCounter++;
            return id;
        }

        if (type === "SERIES") {
            const id = this.format("SER", seriesCounter);
            seriesCounter++;
            return id;
        }

        throw new Error("❌ Ungültiger Library Type");

    }

    /**
     * Format ID
     */
    private static format(prefix: string, num: number): string {
        return `LIB-${prefix}-${num.toString().padStart(4, "0")}`;
    }

}