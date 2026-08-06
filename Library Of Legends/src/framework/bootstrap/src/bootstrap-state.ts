/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: BootstrapState

Architecture Layer..: Framework Core

Module..............: Bootstrap

Module ID...........: LOL-MOD-BOOT-0001

LOL-ID..............: LOL-FRM-BOOT-0005

File................: bootstrap-state.ts

Location............:
Library Of Legends/src/framework/bootstrap/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official lifecycle states of the Project Phoenix bootstrap
process.

===============================================================================

Responsibilities

• Define bootstrap lifecycle states
• Standardize startup state transitions
• Improve runtime observability
• Support diagnostics and monitoring
• Provide type-safe state management

===============================================================================

Design Decisions

• String literal union for maximum type safety
• Human-readable state names
• Framework-wide reusable state model
• Easily extensible without breaking compatibility

===============================================================================

Future Extensions

• Additional startup phases
• Recovery states
• Distributed bootstrap support
• Runtime migration states
• Advanced diagnostic states

===============================================================================
*/

/**
 * Official bootstrap lifecycle states.
 */
export type BootstrapState =
    | "created"
    | "validating"
    | "initializing"
    | "starting"
    | "running"
    | "stopping"
    | "stopped"
    | "failed";