/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: UniverseId

Architecture Layer..: Domain

Module..............: Catalog

Module ID...........: LOL-MOD-UNI-0001

LOL-ID..............: LOL-UNI-0002

File................: universe-id.ts

Location............
Library Of Legends/src/domain/catalog/universe/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the unique identifier for a universe entity.

===============================================================================
*/

import { EntityId } from "../../../shared/domain/identifiers/entity-id";

/**
 * Represents the unique identifier of a universe.
 */
export class UniverseId extends EntityId {

    /**
     * Creates a new universe identifier.
     *
     * @param value Identifier value.
     */
    public constructor(value: string) {

        super(value);

    }

}