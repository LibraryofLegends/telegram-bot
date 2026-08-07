/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Resolution

Architecture Layer..: Shared Domain

Module..............: Value Objects

Description.........

Represents an immutable video resolution.

===============================================================================
*/

import { DomainError } from "../errors/domain-error";
import { ValueObject } from "./value-object";

/**
 * Represents a video resolution.
 */
export class Resolution extends ValueObject<{
    width: number;
    height: number;
}> {

    public constructor(
        width: number,
        height: number
    ) {

        Resolution.validate(width, height);

        super({
            width,
            height
        });

    }

    public get width(): number {

        return this.getValue().width;

    }

    public get height(): number {

        return this.getValue().height;

    }

    /**
     * Returns the total number of pixels.
     */
    public get pixels(): number {

        return this.width * this.height;

    }

    /**
     * Returns true for UHD resolutions.
     */
    public get isUltraHD(): boolean {

        return this.width >= 3840 &&
               this.height >= 2160;

    }

    /**
     * Returns true for Full HD.
     */
    public get isFullHD(): boolean {

        return this.width === 1920 &&
               this.height === 1080;

    }

    public override toString(): string {

        return `${this.width}x${this.height}`;

    }

    private static validate(
        width: number,
        height: number
    ): void {

        if (!Number.isInteger(width) ||
            !Number.isInteger(height)) {

            throw new DomainError(
                "Resolution must use integer values."
            );

        }

        if (width <= 0 || height <= 0) {

            throw new DomainError(
                "Resolution dimensions must be greater than zero."
            );

        }

    }

}