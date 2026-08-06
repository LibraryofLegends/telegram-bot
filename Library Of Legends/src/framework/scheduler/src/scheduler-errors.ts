/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SchedulerError

Architecture Layer..: Framework Core

Module..............: Scheduler

Module ID...........: LOL-MOD-SCH-0008

LOL-ID..............: LOL-FRM-SCH-0007

File................: scheduler-errors.ts

Location............
Library Of Legends/src/framework/scheduler/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official error codes used by the Scheduler during task
registration, scheduling and runtime execution.

===============================================================================

Responsibilities

• Define official Scheduler error codes
• Standardize scheduler failures
• Improve diagnostics
• Support structured logging
• Enable consistent error handling

===============================================================================

Design Decisions

• String literal union
• Stable error identifiers
• Human-readable names
• Framework-wide consistency
• Forward compatible design

===============================================================================

Future Extensions

• FrameworkErrorCode integration
• Error severity levels
• Localized messages
• Diagnostic metadata
• Recovery recommendations

===============================================================================
*/

/**
 * Official Scheduler error codes.
 */
export type SchedulerError =
    | "SCHEDULER_NOT_INITIALIZED"
    | "SCHEDULER_ALREADY_INITIALIZED"
    | "INVALID_SCHEDULER_CONFIGURATION"
    | "INVALID_TASK"
    | "TASK_ALREADY_REGISTERED"
    | "TASK_NOT_REGISTERED"
    | "JOB_ALREADY_RUNNING"
    | "JOB_NOT_FOUND"
    | "JOB_EXECUTION_FAILED"
    | "JOB_TIMEOUT"
    | "JOB_CANCELLED"
    | "CRON_EXPRESSION_INVALID"
    | "WORKER_START_FAILED"
    | "WORKER_STOP_FAILED"
    | "QUEUE_INITIALIZATION_FAILED"
    | "SCHEDULER_VALIDATION_FAILED"
    | "GRACEFUL_SHUTDOWN_FAILED"
    | "UNKNOWN_SCHEDULER_ERROR";