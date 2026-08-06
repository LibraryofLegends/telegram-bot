/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SchedulerState

Architecture Layer..: Framework Core

Module..............: Scheduler

Module ID...........: LOL-MOD-SCH-0008

LOL-ID..............: LOL-FRM-SCH-0006

File................: scheduler-state.ts

Location............
Library Of Legends/src/framework/scheduler/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official lifecycle states of the Scheduler module.

===============================================================================

Responsibilities

• Define Scheduler lifecycle states
• Standardize state transitions
• Support runtime diagnostics
• Enable health monitoring
• Provide type-safe state management

===============================================================================

Design Decisions

• String literal union
• Human-readable state names
• Deterministic transitions
• Framework-wide consistency
• Forward compatible

===============================================================================

Future Extensions

• Cluster synchronization
• Worker scaling
• Maintenance mode
• Recovery mode
• Distributed scheduler states

===============================================================================
*/

/**
 * Official lifecycle states of the Scheduler.
 */
export type SchedulerState =
    | "created"
    | "initializing"
    | "building-task-registry"
    | "starting-workers"
    | "starting-job-queue"
    | "ready"
    | "paused"
    | "stopping"
    | "stopped"
    | "failed";