/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ProviderOptions

Architecture Layer..: Shared Kernel

Module..............: Provider SDK

Module ID...........: LOL-MOD-PRV-0011

LOL-ID..............: LOL-PRV-0005

File................: provider-options.ts

Location............
Library Of Legends/src/shared/providers/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Defines the runtime configuration of every provider.

===============================================================================
*/

import type { ProviderType } from "./provider-type";

export interface ProviderOptions {

    /**
     * Enables this provider.
     */
    readonly enabled: boolean;

    /**
     * Provider type.
     */
    readonly type: ProviderType;

    /**
     * Optional endpoint.
     */
    readonly endpoint?: string;

    /**
     * Optional API key.
     */
    readonly apiKey?: string;

    /**
     * Optional API secret.
     */
    readonly apiSecret?: string;

    /**
     * Request timeout.
     */
    readonly timeoutMs?: number;

    /**
     * Maximum retry attempts.
     */
    readonly maxRetries?: number;

    /**
     * Retry delay.
     */
    readonly retryDelayMs?: number;

    /**
     * Request rate limit.
     */
    readonly requestsPerMinute?: number;

    /**
     * Enable local cache.
     */
    readonly cacheEnabled?: boolean;

    /**
     * Cache lifetime.
     */
    readonly cacheTtlSeconds?: number;

    /**
     * Enable fallback provider.
     */
    readonly fallbackEnabled?: boolean;

    /**
     * Environment profile.
     */
    readonly profile?:
        | "development"
        | "testing"
        | "staging"
        | "production";

    /**
     * Optional custom configuration.
     */
    readonly custom?: Readonly<Record<string, unknown>>;

}