/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ProviderFactory

Architecture Layer..: Shared Kernel

Module..............: Provider SDK

Module ID...........: LOL-MOD-PRV-0011

LOL-ID..............: LOL-PRV-0009

File................: provider-factory.ts

Location............
Library Of Legends/src/shared/providers/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Creates, configures and initializes Provider instances.

===============================================================================
*/

import type { Provider } from "./provider";
import type { ProviderOptions } from "./provider-options";

export type ProviderConstructor<T extends Provider = Provider> =
    new () => T;

export class ProviderFactory {

    /**
     * Creates a provider instance.
     */
    public static create<T extends Provider>(
        ProviderClass: ProviderConstructor<T>
    ): T {

        return new ProviderClass();

    }

    /**
     * Creates and initializes a provider.
     */
    public static async initialize<T extends Provider>(
        ProviderClass: ProviderConstructor<T>,
        options: ProviderOptions
    ): Promise<T> {

        const provider = new ProviderClass();

        await provider.initialize(options);

        return provider;

    }

}