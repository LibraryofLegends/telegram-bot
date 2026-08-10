/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: VideoResolution

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-VST-0001

LOL-ID..............: LOL-VST-0003

File................: video-resolution.ts

Location............
Library Of Legends/src/domain/media/video-stream/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the resolution of a video stream.

===============================================================================
*/

import { DomainError } from "../../../shared/domain/errors/domain-error";
import { ValueObject } from "../../../shared/domain/value-objects/value-object";

/**
 * Supported resolution values.
 */
export type VideoResolutionValue =
    | "480p"
    | "720p"
    | "1080p"
    | "1440p"
    | "4K"
    | "8K";

/**
 * Represents a video resolution.
 */
export class VideoResolution extends ValueObject<VideoResolutionValue> {

    private static readonly ORDER: Record<VideoResolutionValue, number> = {
        "480p": 1,
        "720p": 2,
        "1080p": 3,
        "1440p": 4,
        "4K": 5,
        "8K": 6
    };

    public constructor(value: VideoResolutionValue) {

        super(VideoResolution.validate(value));

    }

    /**
     * Returns true if this resolution is higher than the other.
     */
    public isHigherThan(other: VideoResolution): boolean {

        return this.rank > other.rank;

    }

    /**
     * Returns true if this resolution is lower than the other.
     */
    public isLowerThan(other: VideoResolution): boolean {

        return this.rank < other.rank;

    }

    /**
     * Returns true if this is Full HD.
     */
    public isFullHD(): boolean {

        return this.getValue() === "1080p";

    }

    /**
     * Returns true if this is 4K or higher.
     */
    public isUltraHD(): boolean {

        return this.getValue() === "4K" || this.getValue() === "8K";

    }

    /**
     * Returns ranking value.
     */
    private get rank(): number {

        return VideoResolution.ORDER[this.getValue()];

    }

    public override toString(): string {

        return this.getValue();

    }

    private static validate(value: string): VideoResolutionValue {

        if (!value) {

            throw new DomainError(
                "Video resolution cannot be empty."
            );

        }

        if (!(value in VideoResolution.ORDER)) {

            throw new DomainError(
                `Invalid video resolution: ${value}`
            );

        }

        return value as VideoResolutionValue;

    }

}