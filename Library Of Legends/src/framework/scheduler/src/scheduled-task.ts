/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ScheduledTask

Architecture Layer..: Framework Core

Module..............: Scheduler

Module ID...........: LOL-MOD-SCH-0008

LOL-ID..............: LOL-FRM-SCH-0002

File................: scheduled-task.ts

Location............
Library Of Legends/src/framework/scheduler/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official scheduled task contract used throughout the
Project Phoenix Framework.

===============================================================================

Responsibilities

• Define scheduled task identity
• Execute scheduled work
• Support task lifecycle
• Enable retry handling
• Provide execution metadata

===============================================================================

Design Decisions

• Interface-based design
• Promise-based execution
• Immutable task metadata
• Framework-wide compatibility
• Easy extensibility

===============================================================================

Future Extensions

• Task dependencies
• Task priorities
• Task tags
• Distributed execution
• Execution metrics

===============================================================================
*/

/**
 * Official scheduled task contract.
 */
export interface ScheduledTask {

    /**
     * Unique task identifier.
     *
     * Example:
     * LOL-TASK-LIBRARY-SCAN
     * LOL-TASK-TMDB-SYNC
     * LOL-TASK-BACKUP
     */
    readonly id: string;

    /**
     * Human-readable task name.
     */
    readonly name: string;

    /**
     * Optional task description.
     */
    readonly description?: string;

    /**
     * Indicates whether the task is enabled.
     */
    readonly enabled: boolean;

    /**
     * Executes the scheduled task.
     */
    execute(): Promise<void>;

    /**
     * Optional cleanup after execution.
     */
    dispose?(): Promise<void>;

}