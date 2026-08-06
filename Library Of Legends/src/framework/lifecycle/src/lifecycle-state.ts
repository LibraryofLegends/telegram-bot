/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LifecycleState

Architecture Layer..: Framework Core

Module..............: Lifecycle

Module ID...........: LOL-MOD-LIFE-0005

LOL-ID..............: LOL-FRM-LIFE-0003

File................: lifecycle-state.ts

Location............
Library Of Legends/src/framework/lifecycle/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official internal lifecycle states of the Lifecycle module.

===============================================================================

Responsibilities

• Define Lifecycle Manager states
• Standardize state transitions
• Support diagnostics
• Enable runtime monitoring
• Provide type-safe state management

===============================================================================

Design Decisions

• String literal union
• Human-readable states
• Deterministic transitions
• Framework-wide consistency
• Forward compatible

===============================================================================

Future Extensions

• Restarting
• Recovering
• Maintenance
• Suspended
• Updating

===============================================================================
*/

/**
 * Official lifecycle states of the Lifecycle Manager.
 */
export type LifecycleState =
    | "created"
    | "initializing"
    | "starting"
    | "running"
    | "stopping"
    | "disposing"
    | "disposed"
    | "failed";