/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: AudioCodec

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-AST-0001

LOL-ID..............: LOL-AST-0004

File................: audio-codec.ts

Location............
Library Of Legends/src/domain/media/audio-stream/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the codec of an audio stream.

===============================================================================
*/

import { DomainError } from "../../../shared/domain/errors/domain-error";
import { ValueObject } from "../../../shared/domain/value-objects/value-object";

/**
 * Supported audio codecs.
 */
export type AudioCodecValue =
    | "AAC"
    | "MP3"
    | "AC3"
    | "EAC3"
    | "DTS"
    | "TRUEHD";

/**
 * Represents an audio codec.
 */
export class AudioCodec extends ValueObject<AudioCodecValue> {

    private static readonly NORMALIZED: Record<string, AudioCodecValue> = {
        "AAC": "AAC",

        "MP3": "MP3",

        "AC3": "AC3",
        "DD": "AC3",
        "DOLBY": "AC3",

        "EAC3": "EAC3",
        "DDP": "EAC3",
        "DOLBY DIGITAL PLUS": "EAC3",

        "DTS": "DTS",

        "TRUEHD": "TRUEHD",
        "TRUE-HD": "TRUEHD",
        "DOLBY TRUEHD": "TRUEHD"
    };

    public constructor(value: string) {

        super(AudioCodec.normalize(value));

    }

    /**
     * Returns true if codec is lossless (high-end).
     */
    public isLossless(): boolean {

        return this.getValue() === "TRUEHD";

    }

    /**
     * Returns true if codec is surround capable.
     */
    public isSurround(): boolean {

        return this.getValue() === "AC3"
            || this.getValue() === "EAC3"
            || this.getValue() === "DTS"
            || this.getValue() === "TRUEHD";

    }

    /**
     * Returns true if codec is basic/stereo.
     */
    public isBasic(): boolean {

        return this.getValue() === "AAC"
            || this.getValue() === "MP3";

    }

    public override toString(): string {

        return this.getValue();

    }

    private static normalize(value: string): AudioCodecValue {

        if (!value) {

            throw new DomainError(
                "Audio codec cannot be empty."
            );

        }

        const upper = value.toUpperCase();

        const normalized = AudioCodec.NORMALIZED[upper];

        if (!normalized) {

            throw new DomainError(
                `Invalid audio codec: ${value}`
            );

        }

        return normalized;

    }

}