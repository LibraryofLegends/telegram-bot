/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LifecycleOptions

Architecture Layer..: Framework Core

Module..............: Lifecycle

Module ID...........: LOL-MOD-LIFE-0005

LOL-ID..............: LOL-FRM-LIFE-0004

File................: lifecycle-options.ts

Location............
Library Of Legends/src/framework/lifecycle/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official runtime configuration used by the Lifecycle module.

===============================================================================

Responsibilities

• Define lifecycle configuration
• Configure startup behavior
• Configure shutdown behavior
• Configure hook execution
• Support runtime diagnostics

===============================================================================

Design Decisions

• Immutable configuration model
• Strong TypeScript typing
• Framework-wide compatibility
• Forward compatible structure
• Easy extensibility

===============================================================================

Future Extensions

• Parallel startup
• Restart support
• Shutdown timeout
• Startup profiling
• Distributed lifecycle

===============================================================================
*/

import type { LifecycleStage } from "./lifecycle-stage";

/**
 * Official Lifecycle configuration.
 */
export interface LifecycleOptions {

    /**
     * Initial lifecycle stage.
     */
    readonly initialStage: LifecycleStage;

    /**
     * Executes startup hooks automatically.
     */
    readonly executeStartupHooks?: boolean;

    /**
     * Executes shutdown hooks automatically.
     */
    readonly executeShutdownHooks?: boolean;

    /**
     * Continues execution if a hook fails.
     */
    readonly continueOnHookFailure?: boolean;

    /**
     * Enables runtime diagnostics.
     */
    readonly diagnostics?: boolean;

    /**
     * Enables execution timing.
     */
    readonly measureExecutionTime?: boolean;

}