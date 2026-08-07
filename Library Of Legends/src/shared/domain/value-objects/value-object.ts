/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ValueObject

Architecture Layer..: Shared Domain

Module..............: Value Objects

Module ID...........: LOL-MOD-DOM-0001

LOL-ID..............: LOL-VO-0000

File................: value-object.ts

Location............
Library Of Legends/src/shared/domain/value-objects/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Base class for immutable Domain-Driven Design value objects.

===============================================================================
*/

/**
 * Base class for all value objects.
 *
 * @typeParam TValue Internal value type.
 */
export abstract class ValueObject<TValue> {

    protected readonly value: TValue;

    protected constructor(value: TValue) {

        this.value = value;

        Object.freeze(this);

    }

    /**
     * Returns the wrapped value.
     */
    public getValue(): TValue {

        return this.value;

    }

    /**
     * Determines whether two value objects are equal.
     */
    public equals(
        other: ValueObject<TValue>
    ): boolean {

        return Object.is(
            this.value,
            other.value
        );

    }

}