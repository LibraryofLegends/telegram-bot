/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LifecycleHook

Architecture Layer..: Framework Core

Module..............: Lifecycle

Module ID...........: LOL-MOD-LIFE-0005

LOL-ID..............: LOL-FRM-LIFE-0006

File................: lifecycle-hook.ts

Location............
Library Of Legends/src/framework/lifecycle/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official lifecycle hook contract used by all Project Phoenix
Framework components.

===============================================================================

Responsibilities

• Define lifecycle hook interface
• Standardize hook execution
• Support startup and shutdown
• Enable runtime extensibility
• Ensure deterministic execution

===============================================================================

Design Decisions

• Interface-based design
• Optional lifecycle methods
• Promise-based execution
• Framework-wide compatibility
• Easy extensibility

===============================================================================

Future Extensions

• Hook priorities
• Conditional execution
• Timeout support
• Parallel execution
• Hook diagnostics

===============================================================================
*/

import type { LifecycleStage } from "./lifecycle-stage";

/**
 * Official lifecycle hook contract.
 */
export interface LifecycleHook {

    /**
     * Unique hook identifier.
     */
    readonly name: string;

    /**
     * Invoked before a lifecycle stage begins.
     */
    beforeStage?(
        stage: LifecycleStage
    ): Promise<void>;

    /**
     * Invoked after a lifecycle stage completes.
     */
    afterStage?(
        stage: LifecycleStage
    ): Promise<void>;

    /**
     * Invoked when a lifecycle stage fails.
     */
    onError?(
        stage: LifecycleStage,
        error: Error
    ): Promise<void>;

}