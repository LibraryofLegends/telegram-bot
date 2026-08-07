/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Rating

Architecture Layer..: Shared Domain

Module..............: Value Objects

Module ID...........: LOL-MOD-DOM-0001

LOL-ID..............: LOL-VO-0005

File................: rating.ts

Location............
Library Of Legends/src/shared/domain/value-objects/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents an immutable normalized media rating.

===============================================================================
*/

import { DomainError } from "../errors/domain-error";
import { ValueObject } from "./value-object";

/**
 * Represents a normalized rating between 0.0 and 10.0.
 */
export class Rating extends ValueObject<number> {

    public static readonly MIN = 0;

    public static readonly MAX = 10;

    public constructor(value: number) {

        Rating.validate(value);

        super(value);

    }

    /**
     * Returns the rating value.
     */
    public get value(): number {

        return this.getValue();

    }

    /**
     * Returns the rating as a percentage.
     */
    public get percentage(): number {

        return (this.value / Rating.MAX) * 100;

    }

    /**
     * Returns whether the rating is considered excellent.
     */
    public get isExcellent(): boolean {

        return this.value >= 8.5;

    }

    /**
     * Returns whether the rating is considered good.
     */
    public get isGood(): boolean {

        return this.value >= 7;

    }

    /**
     * Returns the formatted rating.
     */
    public override toString(): string {

        return this.value.toFixed(1);

    }

    private static validate(value: number): void {

        if (!Number.isFinite(value)) {

            throw new DomainError(
                "Rating must be a valid number."
            );

        }

        if (value < Rating.MIN || value > Rating.MAX) {

            throw new DomainError(
                `Rating must be between ${Rating.MIN} and ${Rating.MAX}.`
            );

        }

    }

}