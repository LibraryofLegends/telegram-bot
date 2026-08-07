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

/**
 * Represents the title of a media item.
 */
export class Title {

    /**
     * Internal title value.
     */
    public readonly value: string;

    /**
     * Creates a new title.
     *
     * @param value Title text.
     */
    public constructor(value: string) {

        const normalized = value.trim();

        if (normalized.length === 0) {
            throw new Error("Title cannot be empty.");
        }

        if (normalized.length > 300) {
            throw new Error("Title exceeds the maximum length.");
        }

        this.value = normalized;

        Object.freeze(this);

    }

    /**
     * Compares two titles.
     *
     * @param other Another title.
     */
    public equals(other: Title): boolean {

        return this.value === other.value;

    }

    /**
     * Returns the title as a string.
     */
    public toString(): string {

        return this.value;

    }

}