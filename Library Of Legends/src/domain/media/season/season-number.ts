/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SeasonNumber

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-SEA-0001

LOL-ID..............: LOL-SEA-0003

File................: season-number.ts

Location............
Library Of Legends/src/domain/media/season/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the immutable number of a television season.

===============================================================================
*/

import { DomainError } from "../../../shared/domain/errors/domain-error";
import { ValueObject } from "../../../shared/domain/value-objects/value-object";

/**
 * Represents a television season number.
 */
export class SeasonNumber extends ValueObject<number> {

    public static readonly SPECIALS = 0;

    public constructor(value: number) {

        super(SeasonNumber.validate(value));

    }

    /**
     * Returns true if this represents the specials season.
     */
    public isSpecial(): boolean {

        return this.getValue() === SeasonNumber.SPECIALS;

    }

    /**
     * Returns true if this is a regular season.
     */
    public isRegular(): boolean {

        return this.getValue() > SeasonNumber.SPECIALS;

    }

    /**
     * Returns the numeric value.
     */
    public get value(): number {

        return this.getValue();

    }

    public override toString(): string {

        return this.isSpecial()
            ? "Specials"
            : `Season ${this.value}`;

    }

    private static validate(value: number): number {

        if (!Number.isInteger(value)) {

            throw new DomainError(
                "Season number must be an integer."
            );

        }

        if (value < SeasonNumber.SPECIALS) {

            throw new DomainError(
                "Season number cannot be negative."
            );

        }

        return value;

    }

}