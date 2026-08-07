/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: PersonId

Architecture Layer..: Domain

Module..............: Person

Module ID...........: LOL-MOD-PER-0001

LOL-ID..............: LOL-PER-0002

File................: person-id.ts

Location............
Library Of Legends/src/domain/person/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the unique identifier for a person entity.

===============================================================================
*/

import { EntityId } from "../../shared/domain/identifiers/entity-id";

/**
 * Represents the unique identifier of a person.
 */
export class PersonId extends EntityId {

    /**
     * Creates a new person identifier.
     *
     * @param value Identifier value.
     */
    public constructor(value: string) {

        super(value);

    }

}