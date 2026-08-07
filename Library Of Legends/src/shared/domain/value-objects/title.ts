/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Title

Architecture Layer..: Shared Domain

Module..............: Value Objects

Module ID...........: LOL-MOD-DOM-0001

LOL-ID..............: LOL-VO-0001

File................: title.ts

Location............
Library Of Legends/src/shared/domain/value-objects/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents an immutable media title.

===============================================================================
*/

import { ValueObject } from "./value-object";

/**
 * Represents the title of a media item.
 */
export class Title extends ValueObject<string> {

    /**
     * Maximum supported title length.
     */
    public static readonly MAX_LENGTH = 300;

    /**
     * Creates a new Title.
     *
     * @param value Raw title.
     */
    public constructor(value: string) {

        super(
            Title.normalize(
                Title.validate(value)
            )
        );

    }

    /**
     * Returns the title as a string.
     */
    public override toString(): string {

        return this.getValue();

    }

    /**
     * Validates the supplied title.
     */
    private static validate(value: string): string {

        const normalized = value.trim();

        if (normalized.length === 0) {
            throw new Error("Title cannot be empty.");
        }

        if (normalized.length > Title.MAX_LENGTH) {
            throw new Error(
                `Title exceeds ${Title.MAX_LENGTH} characters.`
            );
        }

        return normalized;

    }

    /**
     * Normalizes the title.
     */
    private static normalize(value: string): string {

        return value.replace(/\s+/g, " ");

    }

}