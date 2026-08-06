/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: EventManager

Architecture Layer..: Framework Core

Module..............: Event System

Module ID...........: LOL-MOD-EVT-0006

LOL-ID..............: LOL-FRM-EVT-0001

File................: event-manager.ts

Location............
Library Of Legends/src/framework/event-system/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Central service responsible for initializing, coordinating and managing
the Project Phoenix Event System.

===============================================================================

Responsibilities

• Initialize the Event System
• Manage the Event Bus
• Coordinate event processing
• Expose runtime state
• Provide framework-wide event access

===============================================================================

Design Decisions

• Single orchestration point
• Immutable configuration
• Deterministic initialization
• Framework-wide availability
• Easy future extensibility

===============================================================================

Future Extensions

• Async dispatching
• Event replay
• Distributed event transport
• Runtime diagnostics
• Event middleware

===============================================================================
*/

import type { EventOptions } from "./event-options";
import type { EventResult } from "./event-result";
import type { EventState } from "./event-state";

export class EventManager {

    private state: EventState = "created";

    private options?: EventOptions;

    /**
     * Initializes the Event System.
     */
    public async initialize(
        options: EventOptions
    ): Promise<EventResult> {

        this.state = "initializing";

        this.options = Object.freeze({ ...options });

        /*
        ===============================================================

        Event System Initialization Pipeline

        ===============================================================

        1. Validate configuration
        2. Create Event Bus
        3. Register internal listeners
        4. Prepare dispatch pipeline
        5. Mark Event System as ready

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
     * Returns the current Event System state.
     */
    public getState(): EventState {

        return this.state;

    }

    /**
     * Returns the active Event System configuration.
     */
    public getOptions(): Readonly<EventOptions> {

        if (!this.options) {

            throw new Error(
                "EventManager has not been initialized."
            );

        }

        return this.options;

    }

}