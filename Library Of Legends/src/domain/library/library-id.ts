/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LibraryId

Architecture Layer..: Domain

Module..............: Library

Module ID...........: LOL-MOD-LIB-0002

LOL-ID..............: LOL-LIB-0002

File................: library-id.ts

Location............
Library Of Legends/src/domain/library/

Version.............: 1.0.0

Status..............: Core

Lifecycle...........: Development

Description.........

Generates unique Library IDs (e.g. LL-0001, LL-0002).

===============================================================================
*/

/**
 * Library ID Generator
 */
export class LibraryId {

    private static counter: number = 1;

    /**
     * Generates next ID
     */
    public static next(): string {

        const id = this.counter.toString().padStart(4, "0");

        this.counter++;

        return `LL-${id}`;
    }

}