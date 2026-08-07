/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Entity

Architecture Layer..: Shared Domain

Module..............: Entities

Module ID...........: LOL-MOD-DOM-0002

LOL-ID..............: LOL-ENT-0001

File................: entity.ts

Location............
Library Of Legends/src/shared/domain/entities/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Base class for all Domain-Driven Design entities.

===============================================================================
*/

import { ValueObject } from "../value-objects/value-object";

/**
 * Base class for all entities.
 *
 * @typeParam TId Entity identifier type.
 */
export abstract class Entity<TId extends ValueObject<unknown>> {

    /**
     * Creates a new entity.
     *
     * @param id Entity identifier.
     */
    protected constructor(
        public readonly id: TId
    ) {}

    /**
     * Determines whether two entities are equal.
     *
     * Entities are compared by identity, not by state.
     *
     * @param other Another entity.
     */
    public equals(other: Entity<TId>): boolean {

        return this.id.equals(other.id);

    }

}