/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ProviderCapabilities

Architecture Layer..: Shared Kernel

Module..............: Provider SDK

Module ID...........: LOL-MOD-PRV-0011

LOL-ID..............: LOL-PRV-0003

File................: provider-capabilities.ts

Location............
Library Of Legends/src/shared/providers/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Describes the capabilities supported by a provider.

===============================================================================
*/

/**
 * Defines the supported capabilities of a provider.
 */
export interface ProviderCapabilities {

    /**
     * Supports searching.
     */
    readonly supportsSearch: boolean;

    /**
     * Supports metadata retrieval.
     */
    readonly supportsMetadata: boolean;

    /**
     * Supports artwork retrieval.
     */
    readonly supportsImages: boolean;

    /**
     * Supports video streaming.
     */
    readonly supportsStreaming: boolean;

    /**
     * Supports file uploads.
     */
    readonly supportsUpload: boolean;

    /**
     * Supports file downloads.
     */
    readonly supportsDownload: boolean;

    /**
     * Supports authentication.
     */
    readonly supportsAuthentication: boolean;

    /**
     * Supports OAuth.
     */
    readonly supportsOAuth: boolean;

    /**
     * Supports webhooks.
     */
    readonly supportsWebhooks: boolean;

    /**
     * Supports realtime events.
     */
    readonly supportsRealtimeUpdates: boolean;

    /**
     * Supports rate limiting.
     */
    readonly supportsRateLimiting: boolean;

    /**
     * Supports health monitoring.
     */
    readonly supportsHealthChecks: boolean;

    /**
     * Supports automatic retries.
     */
    readonly supportsRetry: boolean;

    /**
     * Supports caching.
     */
    readonly supportsCaching: boolean;

    /**
     * Supports batch operations.
     */
    readonly supportsBatchRequests: boolean;

    /**
     * Supports plugin loading.
     */
    readonly supportsPlugins: boolean;

}