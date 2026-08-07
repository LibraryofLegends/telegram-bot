/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: HealthStatus

Architecture Layer..: Shared Kernel

Module..............: Shared Results

Module ID...........: LOL-MOD-RES-0001

LOL-ID..............: LOL-RES-0001

File................: health-status.ts

Location............
Library Of Legends/src/shared/results/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the result of a runtime health check.

===============================================================================
*/

/**
 * Represents the health state of a component.
 */
export interface HealthStatus {

    /**
     * Indicates whether the component is healthy.
     */
    readonly healthy: boolean;

    /**
     * Optional status message.
     */
    readonly message?: string;

    /**
     * Optional timestamp when the health check was performed.
     */
    readonly checkedAt: Date;

}