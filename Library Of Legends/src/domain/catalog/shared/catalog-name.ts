/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: CatalogName

Architecture Layer..: Domain

Module..............: Catalog Shared

Module ID...........: LOL-MOD-CAT-0001

LOL-ID..............: LOL-CAT-0002

File................: catalog-name.ts

Location............
Library Of Legends/src/domain/catalog/shared/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the immutable name of a catalog item.

===============================================================================
*/

import { DomainError } from "../../../shared/domain/errors/domain-error";
import { ValueObject } from "../../../shared/domain/value-objects/value-object";

/**
 * Represents the name of a catalog item.
 */
export class CatalogName extends ValueObject<string> {

    public static readonly MIN_LENGTH = 1;

    public static readonly MAX_LENGTH = 150;

    public constructor(value: string) {

        super(CatalogName.normalize(value));

    }

    public override toString(): string {

        return this.getValue();

    }

    private static normalize(value: string): string {

        const normalized = value.trim();

        if (normalized.length < CatalogName.MIN_LENGTH) {

            throw new DomainError(
                "Catalog name cannot be empty."
            );

        }

        if (normalized.length > CatalogName.MAX_LENGTH) {

            throw new DomainError(
                `Catalog name cannot exceed ${CatalogName.MAX_LENGTH} characters.`
            );

        }

        return normalized;

    }

}