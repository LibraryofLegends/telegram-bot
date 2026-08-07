/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: EntityId

Architecture Layer..: Shared Domain

Module..............: Identifiers

Module ID...........: LOL-MOD-DOM-0003

LOL-ID..............: LOL-ID-0001

File................: entity-id.ts

Location............
Library Of Legends/src/shared/domain/identifiers/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Base identifier for all domain entities.

===============================================================================
*/

import { DomainError } from "../errors/domain-error";
import { ValueObject } from "../value-objects/value-object";

/**
 * Base class for all entity identifiers.
 */
export abstract class EntityId extends ValueObject<string> {

    protected constructor(value: string) {

        super(EntityId.normalize(value));

    }

    /**
     * Returns the identifier.
     */
    public override toString(): string {

        return this.getValue();

    }

    /**
     * Validates and normalizes an identifier.
     */
    private static normalize(value: string): string {

        const normalized = value.trim();

        if (normalized.length === 0) {

            throw new DomainError(
                "Entity identifier cannot be empty."
            );

        }

        return normalized;

    }

}