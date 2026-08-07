/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Runtime

Architecture Layer..: Shared Domain

Module..............: Value Objects

Module ID...........: LOL-MOD-DOM-0001

LOL-ID..............: LOL-VO-0003

File................: runtime.ts

Location............
Library Of Legends/src/shared/domain/value-objects/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents an immutable runtime measured in minutes.

===============================================================================
*/

import { DomainError } from "../errors/domain-error";
import { ValueObject } from "./value-object";

/**
 * Represents the runtime of a media item.
 */
export class Runtime extends ValueObject<number> {

    /**
     * Maximum supported runtime in minutes.
     */
    public static readonly MAX_MINUTES = 1440;

    /**
     * Creates a new Runtime.
     *
     * @param minutes Runtime in minutes.
     */
    public constructor(minutes: number) {

        Runtime.validate(minutes);

        super(minutes);

    }

    /**
     * Returns the runtime in minutes.
     */
    public get minutes(): number {

        return this.getValue();

    }

    /**
     * Returns the runtime in hours.
     */
    public get hours(): number {

        return this.minutes / 60;

    }

    /**
     * Formats the runtime.
     */
    public override toString(): string {

        const hours = Math.floor(this.minutes / 60);
        const minutes = this.minutes % 60;

        if (hours === 0) {
            return `${minutes} min`;
        }

        return `${hours}h ${minutes}m`;
    }

    /**
     * Validates the runtime.
     */
    private static validate(minutes: number): void {

        if (!Number.isInteger(minutes)) {

            throw new DomainError(
                "Runtime must be an integer."
            );

        }

        if (minutes <= 0) {

            throw new DomainError(
                "Runtime must be greater than zero."
            );

        }

        if (minutes > Runtime.MAX_MINUTES) {

            throw new DomainError(
                `Runtime cannot exceed ${Runtime.MAX_MINUTES} minutes.`
            );

        }

    }

}