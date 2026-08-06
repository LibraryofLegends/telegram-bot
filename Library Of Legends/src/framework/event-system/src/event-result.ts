/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: EventResult

Architecture Layer..: Framework Core

Module..............: Event System

Module ID...........: LOL-MOD-EVT-0006

LOL-ID..............: LOL-FRM-EVT-0006

File................: event-result.ts

Location............
Library Of Legends/src/framework/event-system/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Represents the official initialization result of the Event System
module.

===============================================================================

Responsibilities

• Return initialization status
• Expose Event System state
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

• Registered listener count
• Published event count
• Initialization duration
• Runtime diagnostics
• Performance metrics

===============================================================================
*/

import type { EventOptions } from "./event-options";
import type { EventState } from "./event-state";

/**
 * Official Event System initialization result.
 */
export interface EventResult {

    /**
     * Indicates whether initialization completed successfully.
     */
    readonly success: boolean;

    /**
     * Current Event System state.
     */
    readonly state: EventState;

    /**
     * Active Event System configuration.
     */
    readonly options: Readonly<EventOptions>;

    /**
     * Number of registered listeners.
     */
    readonly registeredListeners?: number;

    /**
     * Timestamp when initialization completed.
     */
    readonly initializedAt?: Date;

    /**
     * Optional informational messages.
     */
    readonly messages?: readonly string[];

}