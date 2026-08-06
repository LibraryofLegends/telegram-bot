/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: HealthState

Architecture Layer..: Framework Core

Module..............: Health Monitoring

Module ID...........: LOL-MOD-HLT-0009

LOL-ID..............: LOL-FRM-HLT-0006

File................: health-state.ts

Location............
Library Of Legends/src/framework/health-monitoring/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official lifecycle states of the Health Monitoring module.

===============================================================================

Responsibilities

• Define Health Monitoring lifecycle states
• Standardize state transitions
• Support runtime diagnostics
• Enable framework-wide monitoring
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

• Distributed monitoring
• Maintenance mode
• Snapshot synchronization
• Recovery mode
• Cluster health aggregation

===============================================================================
*/

/**
 * Official lifecycle states of the Health Monitoring module.
 */
export type HealthState =
    | "created"
    | "initializing"
    | "registering-contributors"
    | "building-health-registry"
    | "starting-monitoring"
    | "ready"
    | "paused"
    | "stopping"
    | "stopped"
    | "failed";