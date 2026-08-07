/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: CollectionId

Architecture Layer..: Domain

Module..............: Collection

Module ID...........: LOL-MOD-COL-0001

LOL-ID..............: LOL-COL-0002

File................: collection-id.ts

Location............
Library Of Legends/src/domain/collection/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the unique identifier for a collection entity.

===============================================================================
*/

import { EntityId } from "../../shared/domain/identifiers/entity-id";

/**
 * Represents the unique identifier of a collection.
 */
export class CollectionId extends EntityId {

    /**
     * Creates a new collection identifier.
     *
     * @param value Identifier value.
     */
    public constructor(value: string) {

        super(value);

    }

}