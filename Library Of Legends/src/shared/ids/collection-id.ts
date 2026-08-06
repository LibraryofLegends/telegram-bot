/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: CollectionId

Architecture Layer..: Shared Kernel

Module..............: Shared Identifiers

Module ID...........: LOL-MOD-SHK-0010

LOL-ID..............: LOL-SHK-ID-0008

File................: collection-id.ts

Location............
Library Of Legends/src/shared/ids/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Strongly typed identifier representing a media collection.

===============================================================================
*/

import { IdentifierFactory } from "./identifier-factory";
import { StringIdentifier } from "./string-identifier";

export class CollectionId extends StringIdentifier {

    public constructor(value: string) {

        super(value);

    }

    /**
     * Creates a CollectionId from an existing value.
     */
    public static from(value: string): CollectionId {

        return new CollectionId(value);

    }

    /**
     * Generates a new CollectionId.
     */
    public static create(): CollectionId {

        return new CollectionId(
            IdentifierFactory.create()
        );

    }

}