/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LifecycleError

Architecture Layer..: Framework Core

Module..............: Lifecycle

Module ID...........: LOL-MOD-LIFE-0005

LOL-ID..............: LOL-FRM-LIFE-0007

File................: lifecycle-errors.ts

Location............
Library Of Legends/src/framework/lifecycle/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official error codes used by the Lifecycle module during
framework startup, runtime coordination and graceful shutdown.

===============================================================================

Responsibilities

• Define official lifecycle error codes
• Standardize lifecycle failures
• Improve diagnostics
• Support structured logging
• Enable consistent error handling

===============================================================================

Design Decisions

• String literal union
• Stable error identifiers
• Human-readable names
• Framework-wide consistency
• Forward compatible design

===============================================================================

Future Extensions

• Error severity levels
• Localized messages
• Recovery recommendations
• Diagnostic metadata
• Error categories

===============================================================================
*/

/**
 * Official Lifecycle module error codes.
 */
export type LifecycleError =
    | "LIFECYCLE_NOT_INITIALIZED"
    | "LIFECYCLE_ALREADY_INITIALIZED"
    | "INVALID_LIFECYCLE_CONFIGURATION"
    | "INVALID_LIFECYCLE_STAGE"
    | "HOOK_REGISTRATION_FAILED"
    | "HOOK_EXECUTION_FAILED"
    | "STARTUP_FAILED"
    | "SHUTDOWN_FAILED"
    | "DISPOSAL_FAILED"
    | "LIFECYCLE_VALIDATION_FAILED"
    | "RUNTIME_COORDINATION_FAILED"
    | "UNKNOWN_LIFECYCLE_ERROR";