/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: BootstrapError

Architecture Layer..: Framework Core

Module..............: Bootstrap

Module ID...........: LOL-MOD-BOOT-0001

LOL-ID..............: LOL-FRM-BOOT-0006

File................: bootstrap-errors.ts

Location............:
Library Of Legends/src/framework/bootstrap/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official bootstrap error codes used during the framework
startup process.

===============================================================================

Responsibilities

• Define standardized bootstrap error codes
• Improve diagnostics
• Enable consistent error handling
• Support structured logging
• Simplify troubleshooting

===============================================================================

Design Decisions

• String literal union for type safety
• Stable error identifiers
• Human-readable naming
• Easy extensibility
• Framework-wide consistency

===============================================================================

Future Extensions

• Localized error messages
• Error severity levels
• Error categories
• Recovery recommendations
• Diagnostic metadata

===============================================================================
*/

/**
 * Official bootstrap error codes.
 */
export type BootstrapError =
    | "INVALID_CONFIGURATION"
    | "CONFIGURATION_LOAD_FAILED"
    | "LOGGER_INITIALIZATION_FAILED"
    | "DEPENDENCY_INJECTION_FAILED"
    | "LIFECYCLE_INITIALIZATION_FAILED"
    | "EVENT_SYSTEM_INITIALIZATION_FAILED"
    | "REPOSITORY_INITIALIZATION_FAILED"
    | "SCHEDULER_INITIALIZATION_FAILED"
    | "HEALTH_MONITOR_INITIALIZATION_FAILED"
    | "BOOTSTRAP_ABORTED"
    | "UNKNOWN_BOOTSTRAP_ERROR";