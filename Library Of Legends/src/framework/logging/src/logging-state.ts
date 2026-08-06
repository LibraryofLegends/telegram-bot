/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LoggingState

Architecture Layer..: Framework Core

Module..............: Logging

Module ID...........: LOL-MOD-LOG-0003

LOL-ID..............: LOL-FRM-LOG-0008

File................: logging-state.ts

Location............:
Library Of Legends/src/framework/logging/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official lifecycle states of the Logging module.

===============================================================================

Responsibilities

• Define logging lifecycle states
• Standardize module state transitions
• Improve runtime observability
• Support diagnostics
• Provide type-safe state management

===============================================================================

Design Decisions

• String literal union
• Human-readable state names
• Deterministic state transitions
• Framework-wide consistency
• Forward compatible

===============================================================================

Future Extensions

• Reloading state
• Recovery state
• Maintenance state
• Provider synchronization
• Distributed logging states

===============================================================================
*/

/**
 * Official lifecycle states of the Logging module.
 */
export type LoggingState =
    | "created"
    | "initializing"
    | "initialized"
    | "registering-providers"
    | "ready"
    | "failed";