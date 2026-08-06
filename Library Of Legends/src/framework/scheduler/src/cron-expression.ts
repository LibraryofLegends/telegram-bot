/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: CronExpression

Architecture Layer..: Framework Core

Module..............: Scheduler

Module ID...........: LOL-MOD-SCH-0008

LOL-ID..............: LOL-FRM-SCH-0008

File................: cron-expression.ts

Location............
Library Of Legends/src/framework/scheduler/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official Cron Expression contract used by the Scheduler.

===============================================================================

Responsibilities

• Validate cron expressions
• Parse cron expressions
• Calculate next execution time
• Generate human-readable descriptions
• Support time zones

===============================================================================

Design Decisions

• Immutable model
• Provider independent
• Strong typing
• Extensible parser
• Framework-wide compatibility

===============================================================================

Future Extensions

• Seconds support
• Calendar expressions
• Holiday calendars
• DST optimization
• Custom scheduling syntax

===============================================================================
*/

/**
 * Official cron expression contract.
 */
export interface CronExpression {

    /**
     * Original cron expression.
     */
    readonly expression: string;

    /**
     * Indicates whether the expression is valid.
     */
    readonly valid: boolean;

    /**
     * Returns a human-readable description.
     */
    describe(): string;

    /**
     * Returns the next execution time.
     */
    nextExecution(
        from?: Date
    ): Date;

    /**
     * Validates the expression.
     */
    validate(): boolean;

}