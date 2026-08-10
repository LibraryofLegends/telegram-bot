/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SubtitleType

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-SST-0001

LOL-ID..............: LOL-SST-0005

File................: subtitle-type.ts

Location............
Library Of Legends/src/domain/media/subtitle-stream/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the type of a subtitle stream.

===============================================================================
*/

import { DomainError } from "../../../shared/domain/errors/domain-error";
import { ValueObject } from "../../../shared/domain/value-objects/value-object";

/**
 * Supported subtitle types.
 */
export type SubtitleTypeValue =
    | "FULL"
    | "FORCED"
    | "SDH";

/**
 * Represents a subtitle type.
 */
export class SubtitleType extends ValueObject<SubtitleTypeValue> {

    private static readonly NORMALIZED: Record<string, SubtitleTypeValue> = {
        "FULL": "FULL",
        "NORMAL": "FULL",

        "FORCED": "FORCED",
        "FORCED SUBS": "FORCED",

        "SDH": "SDH",
        "HI": "SDH",
        "HEARING IMPAIRED": "SDH"
    };

    public constructor(value: string) {

        super(SubtitleType.normalize(value));

    }

    /**
     * Returns true if subtitle is forced.
     */
    public isForced(): boolean {

        return this.getValue() === "FORCED";

    }

    /**
     * Returns true if subtitle is full.
     */
    public isFull(): boolean {

        return this.getValue() === "FULL";

    }

    /**
     * Returns true if subtitle is for hearing impaired.
     */
    public isSDH(): boolean {

        return this.getValue() === "SDH";

    }

    public override toString(): string {

        return this.getValue();

    }

    private static normalize(value: string): SubtitleTypeValue {

        if (!value) {

            throw new DomainError(
                "Subtitle type cannot be empty."
            );

        }

        const upper = value.toUpperCase();

        const normalized = SubtitleType.NORMALIZED[upper];

        if (!normalized) {

            throw new DomainError(
                `Invalid subtitle type: ${value}`
            );

        }

        return normalized;

    }

}