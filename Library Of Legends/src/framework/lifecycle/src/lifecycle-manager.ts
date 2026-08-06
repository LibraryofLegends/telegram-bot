/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LifecycleManager

Architecture Layer..: Framework Core

Module..............: Lifecycle

Module ID...........: LOL-MOD-LIFE-0005

LOL-ID..............: LOL-FRM-LIFE-0001

File................: lifecycle-manager.ts

Location............
Library Of Legends/src/framework/lifecycle/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Central service responsible for coordinating the complete runtime
lifecycle of the Project Phoenix Framework.

===============================================================================

Responsibilities

• Initialize lifecycle management
• Coordinate framework startup
• Coordinate framework shutdown
• Execute lifecycle hooks
• Expose lifecycle state

===============================================================================

Design Decisions

• Single orchestration point
• Deterministic execution order
• Immutable runtime configuration
• Framework-wide availability
• Extensible lifecycle pipeline

===============================================================================

Future Extensions

• Module restart support
• Parallel startup
• Graceful restart
• Runtime recovery
• Distributed lifecycle management

===============================================================================
*/

import type { LifecycleOptions } from "./lifecycle-options";
import type { LifecycleResult } from "./lifecycle-result";
import type { LifecycleState } from "./lifecycle-state";

export class LifecycleManager {

    private state: LifecycleState = "created";

    private options?: LifecycleOptions;

    /**
     * Initializes the Lifecycle module.
     */
    public async initialize(
        options: LifecycleOptions
    ): Promise<LifecycleResult> {

        this.state = "initializing";

        this.options = Object.freeze({ ...options });

        /*
        ===============================================================

        Lifecycle Initialization Pipeline

        ===============================================================

        1. Validate lifecycle configuration
        2. Register lifecycle hooks
        3. Prepare startup pipeline
        4. Prepare shutdown pipeline
        5. Mark module as ready

        ===============================================================
        */

        this.state = "ready";

        return {

            success: true,

            state: this.state,

            options: this.options

        };

    }

    /**
     * Returns the current lifecycle state.
     */
    public getState(): LifecycleState {

        return this.state;

    }

    /**
     * Returns the active lifecycle configuration.
     */
    public getOptions(): Readonly<LifecycleOptions> {

        if (!this.options) {

            throw new Error(
                "LifecycleManager has not been initialized."
            );

        }

        return this.options;

    }

}