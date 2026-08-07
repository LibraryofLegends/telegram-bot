/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Year

Architecture Layer..: Shared Domain

Module..............: Value Objects

Module ID...........: LOL-MOD-DOM-0001

LOL-ID..............: LOL-VO-0002

File................: year.ts

Location............
Library Of Legends/src/shared/domain/value-objects/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents an immutable release year.

===============================================================================
*/

import { DomainError } from "../errors/domain-error";
import { ValueObject } from "./value-object";

/**
 * Represents a release year.
 */
export class Year extends ValueObject<number> {

    /**
     * Lowest supported year.
     */
    public static readonly MIN = 1888;

    /**
     * Maximum allowed future offset.
     */
    public static readonly MAX_FUTURE_YEARS = 5;

    public constructor(value: number) {

        Year.validate(value);

        super(value);

    }

    /**
     * Returns the numeric year.
     */
    public valueOf(): number {

        return this.getValue();

    }

    /**
     * Returns the year as a string.
     */
    public override toString(): string {

        return this.getValue().toString();

    }

    /**
     * Validates the supplied year.
     */
    private static validate(value: number): void {

        if (!Number.isInteger(value)) {

            throw new DomainError(
                "Year must be an integer."
            );

        }

        if (value < Year.MIN) {

            throw new DomainError(
                `Year cannot be earlier than ${Year.MIN}.`
            );

        }

        const maxYear =
            new Date().getFullYear() +
            Year.MAX_FUTURE_YEARS;

        if (value > maxYear) {

            throw new DomainError(
                `Year cannot be greater than ${maxYear}.`
            );

        }

    }

}