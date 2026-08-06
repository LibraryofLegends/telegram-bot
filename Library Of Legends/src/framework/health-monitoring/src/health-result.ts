/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: HealthResult

Architecture Layer..: Framework Core

Module..............: Health Monitoring

Module ID...........: LOL-MOD-HLT-0009

LOL-ID..............: LOL-FRM-HLT-0005

File................: health-result.ts

Location............
Library Of Legends/src/framework/health-monitoring/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Represents the official initialization result of the Health Monitoring
module.

===============================================================================

Responsibilities

• Return initialization status
• Expose Health Monitoring state
• Return active configuration
• Provide runtime information
• Support future extensibility

===============================================================================

Design Decisions

• Immutable result object
• Strong TypeScript typing
• Consistent Framework API
• Predictable structure
• Forward compatible

===============================================================================

Future Extensions

• Registered Health Check count
• Snapshot count
• Active alerts
• Runtime diagnostics
• Performance metrics

===============================================================================
*/

import type { HealthOptions } from "./health-options";
import type { HealthState } from "./health-state";

/**
 * Official Health Monitoring initialization result.
 */
export interface HealthResult {

    /**
     * Indicates whether initialization completed successfully.
     */
    readonly success: boolean;

    /**
     * Current Health Monitoring state.
     */
    readonly state: HealthState;

    /**
     * Active Health Monitoring configuration.
     */
    readonly options: Readonly<HealthOptions>;

    /**
     * Number of registered Health Checks.
     */
    readonly registeredHealthChecks?: number;

    /**
     * Number of active alerts.
     */
    readonly activeAlerts?: number;

    /**
     * Number of stored health snapshots.
     */
    readonly snapshotCount?: number;

    /**
     * Timestamp when initialization completed.
     */
    readonly initializedAt?: Date;

    /**
     * Optional informational messages.
     */
    readonly messages?: readonly string[];

}