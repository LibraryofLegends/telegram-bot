/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: HealthStatus

Architecture Layer..: Shared Kernel

Module..............: Shared Results

Module ID...........: LOL-MOD-RES-0001

LOL-ID..............: LOL-RES-0003

File................: health-status.ts

Location............
Library Of Legends/src/shared/results/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Represents the result of a component health check.

===============================================================================
*/

import type { OperationResult } from "./operation-result";

/**
 * Represents the health status of a component.
 */
export interface HealthStatus
    extends OperationResult<void> {

    /**
     * Indicates whether the component is healthy.
     */
    readonly healthy: boolean;

    /**
     * Optional component name.
     */
    readonly component?: string;

}