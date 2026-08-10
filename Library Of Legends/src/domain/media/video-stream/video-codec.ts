/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: VideoCodec

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-VST-0001

LOL-ID..............: LOL-VST-0004

File................: video-codec.ts

Location............
Library Of Legends/src/domain/media/video-stream/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the codec of a video stream.

===============================================================================
*/

import { DomainError } from "../../../shared/domain/errors/domain-error";
import { ValueObject } from "../../../shared/domain/value-objects/value-object";

/**
 * Supported video codecs.
 */
export type VideoCodecValue =
    | "H264"
    | "H265"
    | "HEVC"
    | "AV1";

/**
 * Represents a video codec.
 */
export class VideoCodec extends ValueObject<VideoCodecValue> {

    private static readonly NORMALIZED: Record<string, VideoCodecValue> = {
        "H264": "H264",
        "AVC": "H264",

        "H265": "H265",
        "HEVC": "H265",

        "AV1": "AV1"
    };

    public constructor(value: string) {

        super(VideoCodec.normalize(value));

    }

    /**
     * Returns true if codec is modern (efficient).
     */
    public isModern(): boolean {

        return this.getValue() === "H265" || this.getValue() === "AV1";

    }

    /**
     * Returns true if codec is widely compatible.
     */
    public isCompatible(): boolean {

        return this.getValue() === "H264";

    }

    public override toString(): string {

        return this.getValue();

    }

    private static normalize(value: string): VideoCodecValue {

        if (!value) {

            throw new DomainError(
                "Video codec cannot be empty."
            );

        }

        const upper = value.toUpperCase();

        const normalized = VideoCodec.NORMALIZED[upper];

        if (!normalized) {

            throw new DomainError(
                `Invalid video codec: ${value}`
            );

        }

        return normalized;

    }

}