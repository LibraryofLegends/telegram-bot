/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: FranchiseName

Architecture Layer..: Domain

Module..............: Catalog

Module ID...........: LOL-MOD-FRA-0001

LOL-ID..............: LOL-FRA-0003

File................: franchise-name.ts

Location............
Library Of Legends/src/domain/catalog/franchise/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the immutable name of a media franchise.

===============================================================================
*/

import { DomainError } from "../../../shared/domain/errors/domain-error";
import { ValueObject } from "../../../shared/domain/value-objects/value-object";

/**
 * Represents the name of a franchise.
 */
export class FranchiseName extends ValueObject<string> {

    public static readonly MAX_LENGTH = 150;

    public constructor(value: string) {
        super(FranchiseName.normalize(value));
    }

    public override toString(): string {
        return this.getValue();
    }

    private static normalize(value: string): string {

        const normalized = value.trim();

        if (normalized.length === 0) {
            throw new DomainError(
                "Franchise name cannot be empty."
            );
        }

        if (normalized.length > FranchiseName.MAX_LENGTH) {
            throw new DomainError(
                `Franchise name cannot exceed ${FranchiseName.MAX_LENGTH} characters.`
            );
        }

        return normalized;

    }

}