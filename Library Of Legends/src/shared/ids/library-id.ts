/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LibraryId

Architecture Layer..: Shared Kernel

Module..............: Shared Identifiers

Module ID...........: LOL-MOD-SHK-0010

LOL-ID..............: LOL-SHK-ID-0009

File................: library-id.ts

Location............
Library Of Legends/src/shared/ids/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Strongly typed identifier representing a Library instance.

===============================================================================
*/

import { IdentifierFactory } from "./identifier-factory";
import { StringIdentifier } from "./string-identifier";

/**
 * Strongly typed Library identifier.
 */
export class LibraryId extends StringIdentifier {

    public constructor(value: string) {

        super(value);

    }

    /**
     * Creates a LibraryId from an existing value.
     */
    public static from(value: string): LibraryId {

        return new LibraryId(value);

    }

    /**
     * Generates a new LibraryId.
     */
    public static create(): LibraryId {

        return new LibraryId(
            IdentifierFactory.create()
        );

    }

}