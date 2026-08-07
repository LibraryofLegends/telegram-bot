/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ExternalIdentifier

Architecture Layer..: Domain

Module..............: Catalog Shared

Module ID...........: LOL-MOD-CAT-0001

LOL-ID..............: LOL-CAT-0004

File................: external-identifier.ts

Location............
Library Of Legends/src/domain/catalog/shared/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents an identifier from an external provider.

===============================================================================
*/

import { DomainError } from "../../../shared/domain/errors/domain-error";
import { ValueObject } from "../../../shared/domain/value-objects/value-object";

/**
 * Supported external providers.
 */
export enum ExternalProvider {

    TMDb = "TMDb",

    IMDb = "IMDb",

    TVDb = "TVDb",

    MusicBrainz = "MusicBrainz",

    IGDB = "IGDB",

    ISBN = "ISBN"

}

/**
 * Represents one external identifier.
 */
export class ExternalIdentifier extends ValueObject<{

    provider: ExternalProvider;

    value: string;

}> {

    public constructor(
        provider: ExternalProvider,
        value: string
    ) {

        const normalized = value.trim();

        if (normalized.length === 0) {

            throw new DomainError(
                "External identifier cannot be empty."
            );

        }

        super({

            provider,

            value: normalized

        });

    }

    public get provider(): ExternalProvider {

        return this.getValue().provider;

    }

    public get value(): string {

        return this.getValue().value;

    }

}