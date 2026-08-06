/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: EventListener

Architecture Layer..: Framework Core

Module..............: Event System

Module ID...........: LOL-MOD-EVT-0006

LOL-ID..............: LOL-FRM-EVT-0003

File................: event-listener.ts

Location............
Library Of Legends/src/framework/event-system/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official event listener contract used throughout the Project
Phoenix Framework.

===============================================================================

Responsibilities

• Define the listener interface
• Receive framework events
• Process published events
• Support asynchronous execution
• Ensure type-safe event handling

===============================================================================

Design Decisions

• Interface-based design
• Promise-based execution
• Immutable event payload
• Framework-wide compatibility
• Easy extensibility

===============================================================================

Future Extensions

• Event priorities
• Listener metadata
• Conditional listeners
• Retry policies
• Event acknowledgements

===============================================================================
*/

import type { Event } from "./event";

/**
 * Official event listener contract.
 */
export interface EventListener {

    /**
     * Handles an incoming event.
     */
    handle(
        event: Readonly<Event>
    ): Promise<void>;

}