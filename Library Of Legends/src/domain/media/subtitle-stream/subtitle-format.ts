/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SubtitleFormat

Architecture Layer..: Domain

Module..............: Media

Module ID...........: LOL-MOD-SST-0001

LOL-ID..............: LOL-SST-0004

File................: subtitle-format.ts

Location............
Library Of Legends/src/domain/media/subtitle-stream/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the format of a subtitle stream.

===============================================================================
*/

import { DomainError } from "../../../shared/domain/errors/domain-error";
import { ValueObject } from "../../../shared/domain/value-objects/value-object";

/**
 * Supported subtitle formats.
 */
export type SubtitleFormatValue =
    | "SRT"
    | "ASS"
    | "SSA"
    | "PGS";

/**
 * Represents a subtitle format.
 */
export class SubtitleFormat extends ValueObject<SubtitleFormatValue> {

    private static readonly NORMALIZED: Record<string, SubtitleFormatValue> = {
        "SRT": "SRT",

        "ASS": "ASS",
        "SSA": "SSA",

        "PGS": "PGS",
        "SUP": "PGS",
        "BLURAY": "PGS"
    };

    public constructor(value: string) {

        super(SubtitleFormat.normalize(value));

    }

    /**
     * Returns true if subtitle is text-based.
     */
    public isText(): boolean {

        return this.getValue() === "SRT"
            || this.getValue() === "ASS"
            || this.getValue() === "SSA";

    }

    /**
     * Returns true if subtitle is image-based.
     */
    public isImage(): boolean {

        return this.getValue() === "PGS";

    }

    public override toString(): string {

        return this.getValue();

    }

    private static normalize(value: string): SubtitleFormatValue {

        if (!value) {

            throw new DomainError(
                "Subtitle format cannot be empty."
            );

        }

        const upper = value.toUpperCase();

        const normalized = SubtitleFormat.NORMALIZED[upper];

        if (!normalized) {

            throw new DomainError(
                `Invalid subtitle format: ${value}`
            );

        }

        return normalized;

    }

}