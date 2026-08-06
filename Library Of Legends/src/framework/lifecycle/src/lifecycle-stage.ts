/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LifecycleStage

Architecture Layer..: Framework Core

Module..............: Lifecycle

Module ID...........: LOL-MOD-LIFE-0005

LOL-ID..............: LOL-FRM-LIFE-0002

File................: lifecycle-stage.ts

Location............
Library Of Legends/src/framework/lifecycle/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official runtime stages executed during the Project Phoenix
Framework lifecycle.

===============================================================================

Responsibilities

• Define runtime execution stages
• Standardize lifecycle sequencing
• Support lifecycle hooks
• Improve runtime diagnostics
• Ensure deterministic execution

===============================================================================

Design Decisions

• String literal union
• Human-readable stage names
• Ordered execution
• Framework-wide consistency
• Forward compatible

===============================================================================

Future Extensions

• Warmup stage
• Restart stage
• Upgrade stage
• Maintenance stage
• Recovery stage

===============================================================================
*/

/**
 * Official runtime lifecycle stages.
 */
export type LifecycleStage =
    | "initialize"
    | "start"
    | "running"
    | "stop"
    | "dispose";