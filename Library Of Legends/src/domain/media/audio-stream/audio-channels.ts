/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: AudioChannels

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-AST-0001

LOL-ID..............: LOL-AST-0005

File................: audio-channels.ts

Location............
Library Of Legends/src/domain/media/audio-stream/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the channel configuration of an audio stream.

===============================================================================
*/

import { DomainError } from "../../../shared/domain/errors/domain-error";
import { ValueObject } from "../../../shared/domain/value-objects/value-object";

/**
 * Supported channel configurations.
 */
export type AudioChannelsValue =
    | "1.0"
    | "2.0"
    | "5.1"
    | "7.1";

/**
 * Represents audio channel configuration.
 */
export class AudioChannels extends ValueObject<AudioChannelsValue> {

    private static readonly NORMALIZED: Record<string, AudioChannelsValue> = {
        "1.0": "1.0",
        "MONO": "1.0",

        "2.0": "2.0",
        "STEREO": "2.0",

        "5.1": "5.1",
        "6CH": "5.1",
        "6 CHANNEL": "5.1",

        "7.1": "7.1",
        "8CH": "7.1",
        "8 CHANNEL": "7.1"
    };

    private static readonly ORDER: Record<AudioChannelsValue, number> = {
        "1.0": 1,
        "2.0": 2,
        "5.1": 3,
        "7.1": 4
    };

    public constructor(value: string) {

        super(AudioChannels.normalize(value));

    }

    /**
     * Returns true if surround sound.
     */
    public isSurround(): boolean {

        return this.getValue() === "5.1"
            || this.getValue() === "7.1";

    }

    /**
     * Returns true if stereo.
     */
    public isStereo(): boolean {

        return this.getValue() === "2.0";

    }

    /**
     * Returns true if higher quality than other.
     */
    public isHigherThan(other: AudioChannels): boolean {

        return this.rank > other.rank;

    }

    private get rank(): number {

        return AudioChannels.ORDER[this.getValue()];

    }

    public override toString(): string {

        return this.getValue();

    }

    private static normalize(value: string): AudioChannelsValue {

        if (!value) {

            throw new DomainError(
                "Audio channels cannot be empty."
            );

        }

        const upper = value.toUpperCase();

        const normalized = AudioChannels.NORMALIZED[upper];

        if (!normalized) {

            throw new DomainError(
                `Invalid audio channels: ${value}`
            );

        }

        return normalized;

    }

}