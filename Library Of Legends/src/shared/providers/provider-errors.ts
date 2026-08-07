/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ProviderErrors

Architecture Layer..: Shared Kernel

Module..............: Provider SDK

Module ID...........: LOL-MOD-PRV-0011

LOL-ID..............: LOL-PRV-0007

File................: provider-errors.ts

Location............
Library Of Legends/src/shared/providers/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Defines the standardized provider error codes used throughout
the Provider SDK.

===============================================================================
*/

/**
 * Official Provider SDK error codes.
 */
export type ProviderError =

    /* Registration */
    | "PROVIDER_ALREADY_REGISTERED"
    | "PROVIDER_NOT_REGISTERED"

    /* Lifecycle */
    | "PROVIDER_NOT_INITIALIZED"
    | "PROVIDER_INITIALIZATION_FAILED"
    | "PROVIDER_SHUTDOWN_FAILED"

    /* Configuration */
    | "INVALID_PROVIDER_CONFIGURATION"
    | "INVALID_PROVIDER_METADATA"
    | "INVALID_PROVIDER_OPTIONS"

    /* Connectivity */
    | "PROVIDER_CONNECTION_FAILED"
    | "PROVIDER_TIMEOUT"
    | "PROVIDER_UNAVAILABLE"

    /* Authentication */
    | "AUTHENTICATION_FAILED"
    | "AUTHORIZATION_FAILED"
    | "INVALID_API_KEY"

    /* Request */
    | "RATE_LIMIT_EXCEEDED"
    | "REQUEST_FAILED"
    | "RESPONSE_VALIDATION_FAILED"

    /* Retry / Fallback */
    | "RETRY_LIMIT_REACHED"
    | "FALLBACK_PROVIDER_FAILED"

    /* Cache */
    | "CACHE_READ_FAILED"
    | "CACHE_WRITE_FAILED"

    /* Pipeline */
    | "MIDDLEWARE_FAILED"

    /* Unknown */
    | "UNKNOWN_PROVIDER_ERROR";