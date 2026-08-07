/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: CatalogDescription

Architecture Layer..: Domain

Module..............: Catalog Shared

Module ID...........: LOL-MOD-CAT-0001

LOL-ID..............: LOL-CAT-0003

File................: catalog-description.ts

Location............
Library Of Legends/src/domain/catalog/shared/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the immutable description of a catalog item.

===============================================================================
*/

import { DomainError } from "../../../shared/domain/errors/domain-error";
import { ValueObject } from "../../../shared/domain/value-objects/value-object";

/**
 * Represents a catalog description.
 */
export class CatalogDescription extends ValueObject<string> {

    public static readonly MAX_LENGTH = 5000;

    public constructor(value: string) {

        super(CatalogDescription.normalize(value));

    }

    public override toString(): string {

        return this.getValue();

    }

    private static normalize(value: string): string {

        const normalized = value.trim();

        if (normalized.length > CatalogDescription.MAX_LENGTH) {

            throw new DomainError(
                `Catalog description cannot exceed ${CatalogDescription.MAX_LENGTH} characters.`
            );

        }

        return normalized;

    }

}