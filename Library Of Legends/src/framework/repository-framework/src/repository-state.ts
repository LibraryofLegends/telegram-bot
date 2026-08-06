/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: RepositoryState

Architecture Layer..: Framework Core

Module..............: Repository Framework

Module ID...........: LOL-MOD-REP-0007

LOL-ID..............: LOL-FRM-REP-0006

File................: repository-state.ts

Location............
Library Of Legends/src/framework/repository-framework/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official lifecycle states of the Repository Framework.

===============================================================================

Responsibilities

• Define Repository Framework lifecycle states
• Standardize state transitions
• Support runtime diagnostics
• Enable health monitoring
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

• Provider synchronization
• Repository rebuilding
• Maintenance mode
• Recovery mode
• Distributed repository states

===============================================================================
*/

/**
 * Official lifecycle states of the Repository Framework.
 */
export type RepositoryState =
    | "created"
    | "initializing"
    | "registering-providers"
    | "building-repositories"
    | "validating"
    | "ready"
    | "failed";