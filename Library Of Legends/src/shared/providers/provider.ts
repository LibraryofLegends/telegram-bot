/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Provider

Architecture Layer..: Shared Kernel

Module..............: Provider SDK

Module ID...........: LOL-MOD-PRV-0011

LOL-ID..............: LOL-PRV-0008

File................: provider.ts

Location............
Library Of Legends/src/shared/providers/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Official Provider contract implemented by every external integration.

===============================================================================
*/

import type { ProviderCapabilities } from "./provider-capabilities";
import type { ProviderMetadata } from "./provider-metadata";
import type { ProviderOptions } from "./provider-options";
import type { ProviderResult } from "./provider-result";
import type { ProviderStatus } from "./provider-status";

export interface Provider {

    /**
     * Provider metadata.
     */
    readonly metadata: ProviderMetadata;

    /**
     * Provider capabilities.
     */
    readonly capabilities: ProviderCapabilities;

    /**
     * Current provider status.
     */
    readonly status: ProviderStatus;

    /**
     * Initializes the provider.
     */
    initialize(
        options: ProviderOptions
    ): Promise<ProviderResult<void>>;

    /**
     * Performs provider authentication.
     */
    authenticate(): Promise<ProviderResult<void>>;

    /**
     * Establishes a provider connection.
     */
    connect(): Promise<ProviderResult<void>>;

    /**
     * Executes a provider request.
     */
    execute<TRequest, TResult>(
        request: TRequest
    ): Promise<ProviderResult<TResult>>;

    /**
     * Performs a provider health check.
     */
    health(): Promise<ProviderResult<void>>;

    /**
     * Disconnects the provider.
     */
    disconnect(): Promise<ProviderResult<void>>;

    /**
     * Shuts the provider down.
     */
    shutdown(): Promise<ProviderResult<void>>;

}