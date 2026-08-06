/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SchedulerJob

Architecture Layer..: Framework Core

Module..............: Scheduler

Module ID...........: LOL-MOD-SCH-0008

LOL-ID..............: LOL-FRM-SCH-0003

File................: scheduler-job.ts

Location............
Library Of Legends/src/framework/scheduler/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the runtime representation of a scheduled task execution within
the Project Phoenix Framework.

===============================================================================

Responsibilities

• Represent a scheduled execution
• Track execution lifecycle
• Store execution metadata
• Record execution timestamps
• Support retry processing

===============================================================================

Design Decisions

• Immutable identifiers
• Mutable runtime state
• Provider-independent model
• Framework-wide compatibility
• Easy extensibility

===============================================================================

Future Extensions

• Execution history
• Worker identifiers
• Distributed execution
• Execution metrics
• Failure diagnostics

===============================================================================
*/

import type { ScheduledTask } from "./scheduled-task";

/**
 * Current execution state of a scheduler job.
 */
export type SchedulerJobState =
    | "pending"
    | "running"
    | "completed"
    | "failed"
    | "cancelled";

/**
 * Represents one execution of a scheduled task.
 */
export interface SchedulerJob {

    /**
     * Unique job identifier.
     */
    readonly id: string;

    /**
     * Executed task.
     */
    readonly task: ScheduledTask;

    /**
     * Current execution state.
     */
    state: SchedulerJobState;

    /**
     * Time when execution was scheduled.
     */
    readonly scheduledAt: Date;

    /**
     * Execution start time.
     */
    startedAt?: Date;

    /**
     * Execution completion time.
     */
    completedAt?: Date;

    /**
     * Current retry attempt.
     */
    retryCount: number;

    /**
     * Optional execution error.
     */
    error?: Error;

}