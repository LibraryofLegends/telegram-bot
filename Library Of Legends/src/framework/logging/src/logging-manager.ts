/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LoggingManager

Architecture Layer..: Framework Core

Module..............: Logging

Module ID...........: LOL-MOD-LOG-0003

LOL-ID..............: LOL-FRM-LOG-0001

File................: logging-manager.ts

Location............:
Library Of Legends/src/framework/logging/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Central service responsible for initializing, coordinating and managing
the Project Phoenix logging infrastructure.

===============================================================================

Responsibilities

• Initialize the logging module
• Coordinate registered log providers
• Create Logger instances
• Manage logging lifecycle
• Expose logging state

===============================================================================

Design Decisions

• Single entry point for logging
• Provider-based architecture
• Immutable runtime configuration
• Framework-wide availability
• Deterministic initialization

===============================================================================

Future Extensions

• Dynamic provider registration
• Remote logging
• Log buffering
• Async logging pipeline
• Runtime provider discovery

===============================================================================
*/

import type { LoggingOptions } from "./logging-options";
import type { LoggingResult } from "./logging-result";
import type { LoggingState } from "./logging-state";

export class LoggingManager {

    private state: LoggingState = "created";

    private options?: LoggingOptions;

    /**
     * Initializes the Logging module.
     */
    public async initialize(
        options: LoggingOptions
    ): Promise<LoggingResult> {

        this.state = "initializing";

        this.options = Object.freeze({ ...options });

        /*
        ===============================================================

        Initialization Pipeline

        ===============================================================

        1. Validate logging configuration
        2. Register providers
        3. Configure log levels
        4. Prepare logging pipeline
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
     * Returns the current Logging module state.
     */
    public getState(): LoggingState {

        return this.state;

    }

    /**
     * Returns the active logging configuration.
     */
    public getOptions(): Readonly<LoggingOptions> {

        if (!this.options) {

            throw new Error(
                "LoggingManager has not been initialized."
            );

        }

        return this.options;

    }

}