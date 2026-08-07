/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Person

Architecture Layer..: Domain

Module..............: Person

Module ID...........: LOL-MOD-PER-0001

LOL-ID..............: LOL-PER-0001

File................: person.ts

Location............
Library Of Legends/src/domain/person/

Version.............: 2.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents a person within the media library.

===============================================================================
*/

import { Entity } from "../../shared/domain/entities/entity";

import { PersonId } from "./person-id";
import { PersonName } from "./person-name";

/**
 * Represents a person.
 */
export class Person extends Entity<PersonId> {

    public constructor(
        id: PersonId,
        public readonly name: PersonName
    ) {

        super(id);

    }

    /**
     * Returns the person's display name.
     */
    public get displayName(): string {

        return this.name.toString();

    }

}