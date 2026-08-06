/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Event

Architecture Layer..: Framework Core

Module..............: Event System

Module ID...........: LOL-MOD-EVT-0006

LOL-ID..............: LOL-FRM-EVT-0004

File................: event.ts

Location............
Library Of Legends/src/framework/event-system/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official event model used throughout the Project Phoenix
Framework.

===============================================================================

Responsibilities

• Represent framework events
• Provide immutable event data
• Standardize event metadata
• Support diagnostics
• Enable type-safe communication

===============================================================================

Design Decisions

• Immutable event contract
• Generic payload support
• ISO timestamp
• Framework-wide consistency
• Forward compatible

===============================================================================

Future Extensions

• Event priorities
• Correlation IDs
• Distributed tracing
• Event versioning
• Event persistence

===============================================================================
*/

/**
 * Official framework event.
 */
export interface Event<TPayload = unknown> {

    /**
     * Unique event identifier.
     */
    readonly id: string;

    /**
     * Event name.
     */
    readonly name: string;

    /**
     * Component that published the event.
     */
    readonly source: string;

    /**
     * Event creation timestamp.
     */
    readonly timestamp: Date;

    /**
     * Event payload.
     */
    readonly payload: Readonly<TPayload>;

    /**
     * Optional metadata.
     */
    readonly metadata?: Readonly<Record<string, unknown>>;

}