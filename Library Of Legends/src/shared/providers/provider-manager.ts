/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ProviderManager

Architecture Layer..: Shared Kernel

Module..............: Provider SDK

Module ID...........: LOL-MOD-PRV-0011

LOL-ID..............: LOL-PRV-0011

Description.........

Central lifecycle manager for all active providers.

===============================================================================
*/

import type { Provider } from "./provider";
import { ProviderRegistry } from "./provider-registry";

export class ProviderManager {

    public constructor(

        private readonly registry: ProviderRegistry

    ) {}

    /**
     * Initializes all registered providers.
     */
    public async initializeAll(): Promise<void> {

        for (const provider of this.registry.getAll()) {

            await provider.initialize({

                enabled: true,

                type: provider.metadata.type

            });

        }

    }

    /**
     * Executes health checks.
     */
    public async healthCheck(): Promise<void> {

        for (const provider of this.registry.getAll()) {

            await provider.health();

        }

    }

    /**
     * Shuts all providers down.
     */
    public async shutdownAll(): Promise<void> {

        for (const provider of this.registry.getAll()) {

            await provider.shutdown();

        }

    }

}