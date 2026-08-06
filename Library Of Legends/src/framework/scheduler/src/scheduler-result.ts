/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SchedulerResult

Architecture Layer..: Framework Core

Module..............: Scheduler

Module ID...........: LOL-MOD-SCH-0008

LOL-ID..............: LOL-FRM-SCH-0005

File................: scheduler-result.ts

Location............
Library Of Legends/src/framework/scheduler/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Represents the official initialization result of the Scheduler module.

===============================================================================

Responsibilities

• Return initialization status
• Expose Scheduler state
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

• Registered task count
• Active job count
• Queue statistics
• Runtime diagnostics
• Performance metrics

===============================================================================
*/

import type { SchedulerOptions } from "./scheduler-options";
import type { SchedulerState } from "./scheduler-state";

/**
 * Official Scheduler initialization result.
 */
export interface SchedulerResult {

    /**
     * Indicates whether initialization completed successfully.
     */
    readonly success: boolean;

    /**
     * Current Scheduler state.
     */
    readonly state: SchedulerState;

    /**
     * Active Scheduler configuration.
     */
    readonly options: Readonly<SchedulerOptions>;

    /**
     * Number of registered tasks.
     */
    readonly registeredTasks?: number;

    /**
     * Number of active jobs.
     */
    readonly activeJobs?: number;

    /**
     * Timestamp when initialization completed.
     */
    readonly initializedAt?: Date;

    /**
     * Optional informational messages.
     */
    readonly messages?: readonly string[];

}