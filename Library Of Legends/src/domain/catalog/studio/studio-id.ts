/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: StudioId

Architecture Layer..: Domain

Module..............: Catalog

Module ID...........: LOL-MOD-STU-0001

LOL-ID..............: LOL-STU-0002

File................: studio-id.ts

Location............
Library Of Legends/src/domain/catalog/studio/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the unique identifier for a studio entity.

===============================================================================
*/

import { EntityId } from "../../../shared/domain/identifiers/entity-id";

/**
 * Represents the unique identifier of a studio.
 */
export class StudioId extends EntityId {

    /**
     * Creates a new studio identifier.
     *
     * @param value Identifier value.
     */
    public constructor(value: string) {

        super(value);

    }

}