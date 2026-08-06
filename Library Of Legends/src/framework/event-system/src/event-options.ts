/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: EventOptions

Architecture Layer..: Framework Core

Module..............: Event System

Module ID...........: LOL-MOD-EVT-0006

LOL-ID..............: LOL-FRM-EVT-0005

File................: event-options.ts

Location............
Library Of Legends/src/framework/event-system/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official runtime configuration of the Event System.

===============================================================================

Responsibilities

• Configure event processing
• Configure listener execution
• Configure diagnostics
• Configure error handling
• Support future Event Bus features

===============================================================================

Design Decisions

• Immutable configuration model
• Strong TypeScript typing
• Framework-wide consistency
• Forward compatible
• Easy extensibility

===============================================================================

Future Extensions

• Event priorities
• Parallel dispatching
• Wildcard subscriptions
• Middleware support
• Distributed events

===============================================================================
*/

/**
 * Official Event System configuration.
 */
export interface EventOptions {

    /**
     * Enables asynchronous event dispatching.
     */
    readonly asynchronous?: boolean;

    /**
     * Stops processing when a listener fails.
     */
    readonly stopOnError?: boolean;

    /**
     * Enables runtime diagnostics.
     */
    readonly diagnostics?: boolean;

    /**
     * Enables event logging.
     */
    readonly logging?: boolean;

    /**
     * Maximum number of listeners allowed per event.
     */
    readonly maxListeners?: number;

    /**
     * Enables event validation.
     */
    readonly validateEvents?: boolean;

}