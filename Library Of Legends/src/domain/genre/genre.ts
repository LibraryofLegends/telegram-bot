/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Genre

Architecture Layer..: Domain

Module..............: Genre

Module ID...........: LOL-MOD-GEN-0001

LOL-ID..............: LOL-GEN-0001

File................: genre.ts

Location............
Library Of Legends/src/domain/genre/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents a media genre.

===============================================================================
*/

import { DomainError } from "../../shared/domain/errors/domain-error";
import { ValueObject } from "../../shared/domain/value-objects/value-object";

/**
 * Represents a media genre.
 */
export class Genre extends ValueObject<string> {

    public static readonly MAX_LENGTH = 50;

    public constructor(value: string) {

        super(Genre.normalize(value));

    }

    /**
     * Returns the genre name.
     */
    public override toString(): string {

        return this.getValue();

    }

    private static normalize(value: string): string {

        const normalized = value.trim();

        if (normalized.length === 0) {

            throw new DomainError(
                "Genre cannot be empty."
            );

        }

        if (normalized.length > Genre.MAX_LENGTH) {

            throw new DomainError(
                `Genre cannot exceed ${Genre.MAX_LENGTH} characters.`
            );

        }

        return normalized;

    }

}