/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: FranchiseId

Architecture Layer..: Domain

Module..............: Catalog

Module ID...........: LOL-MOD-FRA-0001

LOL-ID..............: LOL-FRA-0002

File................: franchise-id.ts

Location............
Library Of Legends/src/domain/catalog/franchise/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the unique identifier for a franchise entity.

===============================================================================
*/

import { EntityId } from "../../../shared/domain/identifiers/entity-id";

/**
 * Represents the unique identifier of a franchise.
 */
export class FranchiseId extends EntityId {

    /**
     * Creates a new franchise identifier.
     *
     * @param value Identifier value.
     */
    public constructor(value: string) {

        super(value);

    }

}