/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: CollectionName

Architecture Layer..: Domain

Module..............: Collection

Module ID...........: LOL-MOD-COL-0001

LOL-ID..............: LOL-COL-0003

File................: collection-name.ts

Location............
Library Of Legends/src/domain/collection/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the immutable name of a media collection.

===============================================================================
*/

import { DomainError } from "../../shared/domain/errors/domain-error";
import { ValueObject } from "../../shared/domain/value-objects/value-object";

/**
 * Represents the name of a collection.
 */
export class CollectionName extends ValueObject<string> {

    public static readonly MAX_LENGTH = 150;

    public constructor(value: string) {
        super(CollectionName.normalize(value));
    }

    public override toString(): string {
        return this.getValue();
    }

    private static normalize(value: string): string {

        const normalized = value.trim();

        if (normalized.length === 0) {
            throw new DomainError(
                "Collection name cannot be empty."
            );
        }

        if (normalized.length > CollectionName.MAX_LENGTH) {
            throw new DomainError(
                `Collection name cannot exceed ${CollectionName.MAX_LENGTH} characters.`
            );
        }

        return normalized;
    }

}