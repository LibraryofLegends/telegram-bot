/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: SchedulerOptions

Architecture Layer..: Framework Core

Module..............: Scheduler

Module ID...........: LOL-MOD-SCH-0008

LOL-ID..............: LOL-FRM-SCH-0004

File................: scheduler-options.ts

Location............
Library Of Legends/src/framework/scheduler/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official runtime configuration used by the Scheduler
module.

===============================================================================

Responsibilities

• Configure scheduler behavior
• Configure execution engine
• Configure retry handling
• Configure diagnostics
• Support future scheduling features

===============================================================================

Design Decisions

• Immutable configuration model
• Strong TypeScript typing
• Provider-independent configuration
• Framework-wide compatibility
• Easy extensibility

===============================================================================

Future Extensions

• Distributed scheduling
• Persistent Job Store
• Task priorities
• Worker pools
• Cluster execution

===============================================================================
*/

/**
 * Official Scheduler configuration.
 */
export interface SchedulerOptions {

    /**
     * Enables automatic scheduler startup.
     */
    readonly autoStart?: boolean;

    /**
     * Maximum number of concurrently running jobs.
     */
    readonly maxConcurrentJobs?: number;

    /**
     * Default retry count.
     */
    readonly defaultRetryCount?: number;

    /**
     * Enables runtime diagnostics.
     */
    readonly diagnostics?: boolean;

    /**
     * Enables scheduler event publishing.
     */
    readonly publishEvents?: boolean;

    /**
     * Enables automatic recovery after failures.
     */
    readonly autoRecovery?: boolean;

    /**
     * Enables persistent Job Store support.
     */
    readonly persistentJobs?: boolean;

}