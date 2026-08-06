/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: EventState

Architecture Layer..: Framework Core

Module..............: Event System

Module ID...........: LOL-MOD-EVT-0006

LOL-ID..............: LOL-FRM-EVT-0007

File................: event-state.ts

Location............
Library Of Legends/src/framework/event-system/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official lifecycle states of the Event System module.

===============================================================================

Responsibilities

• Define Event System lifecycle states
• Standardize state transitions
• Improve runtime observability
• Support diagnostics
• Provide type-safe state management

===============================================================================

Design Decisions

• String literal union
• Human-readable state names
• Deterministic transitions
• Framework-wide consistency
• Forward compatible

===============================================================================

Future Extensions

• Rebuilding
• Recovering
• Maintenance
• Listener synchronization
• Distributed event states

===============================================================================
*/

/**
 * Official lifecycle states of the Event System.
 */
export type EventState =
    | "created"
    | "initializing"
    | "building-event-bus"
    | "registering-listeners"
    | "ready"
    | "failed";