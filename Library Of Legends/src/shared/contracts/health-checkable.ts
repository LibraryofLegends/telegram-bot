/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: HealthCheckable

Architecture Layer..: Shared Kernel

Module..............: Shared Contracts

Module ID...........: LOL-MOD-CON-0001

LOL-ID..............: LOL-CON-0004

File................: health-checkable.ts

Location............
Library Of Legends/src/shared/contracts/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Defines a common health check contract for components that expose
runtime health information.

===============================================================================
*/

/**
 * Represents the result of a health check.
 */
export interface HealthStatus {

    /**
     * Indicates whether the component is healthy.
     */
    readonly healthy: boolean;

    /**
     * Optional human-readable status message.
     */
    readonly message?: string;

}

/**
 * Defines a component that supports health checks.
 */
export interface HealthCheckable {

    /**
     * Performs a health check.
     */
    checkHealth(): Promise<HealthStatus>;

}