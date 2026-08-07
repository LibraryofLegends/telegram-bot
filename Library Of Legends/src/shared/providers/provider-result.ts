/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ProviderResult

Architecture Layer..: Shared Kernel

Module..............: Provider SDK

Module ID...........: LOL-MOD-PRV-0011

LOL-ID..............: LOL-PRV-0006

File................: provider-result.ts

Location............
Library Of Legends/src/shared/providers/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the standardized execution result returned by every provider.

===============================================================================
*/

import type { ProviderStatus } from "./provider-status";

export interface ProviderResult<T = unknown> {

    /**
     * Indicates whether the operation succeeded.
     */
    readonly success: boolean;

    /**
     * Current provider status.
     */
    readonly status: ProviderStatus;

    /**
     * Returned payload.
     */
    readonly data?: T;

    /**
     * Optional error code.
     */
    readonly error?: string;

    /**
     * Human-readable message.
     */
    readonly message?: string;

    /**
     * Provider execution duration.
     */
    readonly durationMs: number;

    /**
     * Request timestamp.
     */
    readonly timestamp: Date;

    /**
     * Indicates whether the response originated from cache.
     */
    readonly fromCache?: boolean;

    /**
     * Indicates whether a fallback provider handled the request.
     */
    readonly fallbackUsed?: boolean;

    /**
     * Number of retry attempts.
     */
    readonly retries?: number;

    /**
     * Optional provider-specific metadata.
     */
    readonly metadata?: Readonly<Record<string, unknown>>;

}