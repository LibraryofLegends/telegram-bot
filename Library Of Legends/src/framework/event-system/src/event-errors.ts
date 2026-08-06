/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: EventError

Architecture Layer..: Framework Core

Module..............: Event System

Module ID...........: LOL-MOD-EVT-0006

LOL-ID..............: LOL-FRM-EVT-0008

File................: event-errors.ts

Location............
Library Of Legends/src/framework/event-system/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official error codes used by the Event System during
listener registration, event dispatching and runtime processing.

===============================================================================

Responsibilities

• Define official Event System error codes
• Standardize event processing failures
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

• FrameworkErrorCode integration
• Error severity levels
• Localized messages
• Diagnostic metadata
• Recovery recommendations

===============================================================================
*/

/**
 * Official Event System error codes.
 */
export type EventError =
    | "EVENT_SYSTEM_NOT_INITIALIZED"
    | "EVENT_SYSTEM_ALREADY_INITIALIZED"
    | "INVALID_EVENT_CONFIGURATION"
    | "INVALID_EVENT"
    | "INVALID_EVENT_LISTENER"
    | "LISTENER_ALREADY_REGISTERED"
    | "LISTENER_NOT_REGISTERED"
    | "EVENT_DISPATCH_FAILED"
    | "EVENT_VALIDATION_FAILED"
    | "EVENT_PROCESSING_FAILED"
    | "EVENT_BUS_FAILURE"
    | "UNKNOWN_EVENT_ERROR";