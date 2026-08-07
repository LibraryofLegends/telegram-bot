/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ExternalIdentifierSet

Architecture Layer..: Domain

Module..............: Catalog Shared

Module ID...........: LOL-MOD-CAT-0001

LOL-ID..............: LOL-CAT-0005

File................: external-identifier-set.ts

Location............
Library Of Legends/src/domain/catalog/shared/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents a collection of external identifiers.

===============================================================================
*/

import {
    ExternalIdentifier,
    ExternalProvider
} from "./external-identifier";

import { ValueObject } from "../../../shared/domain/value-objects/value-object";

/**
 * Represents a set of external identifiers.
 */
export class ExternalIdentifierSet extends ValueObject<
    readonly ExternalIdentifier[]
> {

    public constructor(
        identifiers: readonly ExternalIdentifier[] = []
    ) {

        const providers = new Set<ExternalProvider>();

        for (const identifier of identifiers) {

            if (providers.has(identifier.provider)) {

                throw new Error(
                    `Duplicate external provider: ${identifier.provider}`
                );

            }

            providers.add(identifier.provider);

        }

        super([...identifiers]);

    }

    /**
     * Returns all identifiers.
     */
    public getAll(): readonly ExternalIdentifier[] {

        return [...this.getValue()];

    }

    /**
     * Returns an identifier for a provider.
     */
    public getByProvider(
        provider: ExternalProvider
    ): ExternalIdentifier | undefined {

        return this.getValue().find(
            identifier => identifier.provider === provider
        );

    }

    /**
     * Determines whether a provider exists.
     */
    public hasProvider(
        provider: ExternalProvider
    ): boolean {

        return this.getByProvider(provider) !== undefined;

    }

}