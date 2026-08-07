/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: PersonName

Architecture Layer..: Domain

Module..............: Person

Module ID...........: LOL-MOD-PER-0001

LOL-ID..............: LOL-PER-0003

File................: person-name.ts

Location............
Library Of Legends/src/domain/person/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the immutable name of a person.

===============================================================================
*/

import { DomainError } from "../../shared/domain/errors/domain-error";
import { ValueObject } from "../../shared/domain/value-objects/value-object";

/**
 * Represents a person's name.
 */
export class PersonName extends ValueObject<string> {

    public static readonly MAX_LENGTH = 150;

    public constructor(value: string) {
        super(PersonName.normalize(value));
    }

    public override toString(): string {
        return this.getValue();
    }

    private static normalize(value: string): string {

        const normalized = value.trim();

        if (normalized.length === 0) {
            throw new DomainError("Person name cannot be empty.");
        }

        if (normalized.length > PersonName.MAX_LENGTH) {
            throw new DomainError(
                `Person name cannot exceed ${PersonName.MAX_LENGTH} characters.`
            );
        }

        return normalized;
    }

}