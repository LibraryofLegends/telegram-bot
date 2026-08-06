/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LifecycleResult

Architecture Layer..: Framework Core

Module..............: Lifecycle

Module ID...........: LOL-MOD-LIFE-0005

LOL-ID..............: LOL-FRM-LIFE-0005

File................: lifecycle-result.ts

Location............
Library Of Legends/src/framework/lifecycle/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Represents the official initialization result of the Lifecycle module.

===============================================================================

Responsibilities

• Return initialization status
• Expose lifecycle state
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

• Startup duration
• Shutdown duration
• Executed hook count
• Runtime diagnostics
• Performance metrics

===============================================================================
*/

import type { LifecycleOptions } from "./lifecycle-options";
import type { LifecycleStage } from "./lifecycle-stage";
import type { LifecycleState } from "./lifecycle-state";

/**
 * Official Lifecycle module initialization result.
 */
export interface LifecycleResult {

    /**
     * Indicates whether initialization completed successfully.
     */
    readonly success: boolean;

    /**
     * Current Lifecycle Manager state.
     */
    readonly state: LifecycleState;

    /**
     * Current lifecycle stage.
     */
    readonly stage: LifecycleStage;

    /**
     * Active lifecycle configuration.
     */
    readonly options: Readonly<LifecycleOptions>;

    /**
     * Timestamp when initialization completed.
     */
    readonly initializedAt?: Date;

    /**
     * Optional informational messages.
     */
    readonly messages?: readonly string[];

}