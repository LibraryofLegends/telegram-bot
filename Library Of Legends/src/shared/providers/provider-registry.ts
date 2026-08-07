/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ProviderRegistry

Architecture Layer..: Shared Kernel

Module..............: Provider SDK

Module ID...........: LOL-MOD-PRV-0011

LOL-ID..............: LOL-PRV-0010

File................: provider-registry.ts

Version.............: 1.0.0

Description.........

Registry for all available Provider implementations.

===============================================================================
*/

import type { Provider } from "./provider";
import type { ProviderType } from "./provider-type";

export class ProviderRegistry {

    private readonly providers = new Map<
        ProviderType,
        Provider
    >();

    /**
     * Registers a provider.
     */
    public register(provider: Provider): void {

        this.providers.set(
            provider.metadata.type,
            provider
        );

    }

    /**
     * Removes a provider.
     */
    public unregister(
        type: ProviderType
    ): boolean {

        return this.providers.delete(type);

    }

    /**
     * Returns a provider.
     */
    public get(
        type: ProviderType
    ): Provider | undefined {

        return this.providers.get(type);

    }

    /**
     * Checks whether a provider exists.
     */
    public has(
        type: ProviderType
    ): boolean {

        return this.providers.has(type);

    }

    /**
     * Returns all registered providers.
     */
    public getAll(): readonly Provider[] {

        return Array.from(
            this.providers.values()
        );

    }

    /**
     * Clears the registry.
     */
    public clear(): void {

        this.providers.clear();

    }

}