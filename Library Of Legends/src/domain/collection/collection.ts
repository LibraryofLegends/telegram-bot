/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Collection

Architecture Layer..: Domain

Module..............: Collection

Module ID...........: LOL-MOD-COL-0001

LOL-ID..............: LOL-COL-0001

File................: collection.ts

Location............
Library Of Legends/src/domain/collection/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents a media collection or franchise.

===============================================================================
*/

import { Entity } from "../../shared/domain/entities/entity";

import { CollectionId } from "./collection-id";
import { CollectionName } from "./collection-name";
import { CollectionType } from "./collection-type";

/**
 * Represents a media collection.
 */
export class Collection extends Entity<CollectionId> {

    public constructor(
        id: CollectionId,
        public readonly name: CollectionName,
        public readonly type: CollectionType
    ) {

        super(id);

    }

}