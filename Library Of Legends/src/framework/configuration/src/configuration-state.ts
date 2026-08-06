/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ConfigurationState

Architecture Layer..: Framework Core

Module..............: Configuration

Module ID...........: LOL-MOD-CONF-0002

LOL-ID..............: LOL-FRM-CONF-0007

File................: configuration-state.ts

Location............:
Library Of Legends/src/framework/configuration/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official lifecycle states of the Configuration module.

===============================================================================

Responsibilities

• Define configuration lifecycle states
• Standardize state transitions
• Improve runtime observability
• Support diagnostics
• Provide type-safe state management

===============================================================================

Design Decisions

• String literal union for maximum type safety
• Human-readable state names
• Deterministic state transitions
• Framework-wide consistency
• Easy future extensibility

===============================================================================

Future Extensions

• Reloading state
• Refreshing state
• Migration state
• Recovery state
• Maintenance state

===============================================================================
*/

/**
 * Official lifecycle states of the Configuration module.
 */
export type ConfigurationState =
    | "created"
    | "loading"
    | "loaded"
    | "validating"
    | "validated"
    | "ready"
    | "failed";