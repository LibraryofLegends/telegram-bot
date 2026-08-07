/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Artwork

Architecture Layer..: Domain

Module..............: Catalog Shared

Module ID...........: LOL-MOD-CAT-0001

LOL-ID..............: LOL-CAT-0006

File................: artwork.ts

Location............
Library Of Legends/src/domain/catalog/shared/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents artwork associated with a catalog item.

===============================================================================
*/

import { DomainError } from "../../../shared/domain/errors/domain-error";
import { ValueObject } from "../../../shared/domain/value-objects/value-object";

/**
 * Represents artwork metadata.
 */
export class Artwork extends ValueObject<{

    url: string;

    type: "poster" | "backdrop" | "logo" | "banner";

}> {

    public constructor(

        url: string,

        type: "poster" | "backdrop" | "logo" | "banner"

    ) {

        const normalized = url.trim();

        if (normalized.length === 0) {

            throw new DomainError(
                "Artwork URL cannot be empty."
            );

        }

        super({

            url: normalized,

            type

        });

    }

    public get url(): string {

        return this.getValue().url;

    }

    public get type(): "poster" | "backdrop" | "logo" | "banner" {

        return this.getValue().type;

    }

}