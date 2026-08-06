/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: DependencyInjectionState

Architecture Layer..: Framework Core

Module..............: Dependency Injection

Module ID...........: LOL-MOD-DI-0004

LOL-ID..............: LOL-FRM-DI-0008

File................: dependency-injection-state.ts

Location............
Library Of Legends/src/framework/dependency-injection/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official lifecycle states of the Dependency Injection module.

===============================================================================

Responsibilities

• Define Dependency Injection lifecycle states
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

• Container rebuilding
• Service validation
• Scope initialization
• Recovery state
• Maintenance state

===============================================================================
*/

/**
 * Official lifecycle states of the Dependency Injection module.
 */
export type DependencyInjectionState =
    | "created"
    | "initializing"
    | "building-container"
    | "registering-services"
    | "validating"
    | "ready"
    | "failed";