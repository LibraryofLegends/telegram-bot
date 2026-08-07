/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: EpisodeNumber

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-EPI-0001

LOL-ID..............: LOL-EPI-0003

File................: episode-number.ts

Location............
Library Of Legends/src/domain/media/episode/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the immutable number of a television episode.

===============================================================================
*/

import { DomainError } from "../../../shared/domain/errors/domain-error";
import { ValueObject } from "../../../shared/domain/value-objects/value-object";

/**
 * Represents a television episode number.
 */
export class EpisodeNumber extends ValueObject<number> {

    public constructor(value: number) {

        super(EpisodeNumber.validate(value));

    }

    /**
     * Returns the numeric value.
     */
    public get value(): number {

        return this.getValue();

    }

    /**
     * Returns whether this is the pilot episode.
     */
    public isPilot(): boolean {

        return this.value === 1;

    }

    public override toString(): string {

        return `Episode ${this.value}`;

    }

    private static validate(value: number): number {

        if (!Number.isInteger(value)) {

            throw new DomainError(
                "Episode number must be an integer."
            );

        }

        if (value <= 0) {

            throw new DomainError(
                "Episode number must be greater than zero."
            );

        }

        return value;

    }

}