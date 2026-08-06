/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: MediaId

Architecture Layer..: Shared Kernel

Module..............: Shared Identifiers

Module ID...........: LOL-MOD-SHK-0010

LOL-ID..............: LOL-SHK-ID-0002

File................: media-id.ts

Location............
Library Of Legends/src/shared/ids/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Strongly typed identifier representing any media object within the
Library Of Legends platform.

===============================================================================
*/

import { Identifier } from "./identifier";

/**
 * Strongly typed Media identifier.
 */
export class MediaId extends Identifier<string> {

    /**
     * Creates a new MediaId.
     */
    public constructor(value: string) {

        MediaId.validate(value);

        super(value);

    }

    /**
     * Creates a MediaId from a string.
     */
    public static from(value: string): MediaId {

        return new MediaId(value);

    }

    /**
     * Generates a random MediaId.
     *
     * TODO:
     * Replace with IdentifierFactory (UUID / ULID / NanoID)
     */
    public static create(): MediaId {

        const value = crypto.randomUUID();

        return new MediaId(value);

    }

    /**
     * Validates the identifier value.
     */
    private static validate(value: string): void {

        if (value.trim().length === 0) {

            throw new Error(
                "MediaId cannot be empty."
            );

        }

    }

}