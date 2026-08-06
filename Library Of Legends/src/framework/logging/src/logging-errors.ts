/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LoggingError

Architecture Layer..: Framework Core

Module..............: Logging

Module ID...........: LOL-MOD-LOG-0003

LOL-ID..............: LOL-FRM-LOG-0009

File................: logging-errors.ts

Location............:
Library Of Legends/src/framework/logging/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official error codes used by the Logging module during
initialization, provider registration and runtime logging.

===============================================================================

Responsibilities

• Define official logging error codes
• Standardize logging failures
• Improve diagnostics
• Support structured logging
• Enable consistent error handling

===============================================================================

Design Decisions

• String literal union
• Stable error identifiers
• Human-readable naming
• Framework-wide consistency
• Forward compatible design

===============================================================================

Future Extensions

• Error severity levels
• Localized error messages
• Recovery recommendations
• Diagnostic metadata
• Error categorization

===============================================================================
*/

/**
 * Official Logging module error codes.
 */
export type LoggingError =
    | "LOGGER_NOT_INITIALIZED"
    | "LOGGER_ALREADY_INITIALIZED"
    | "INVALID_LOG_CONFIGURATION"
    | "INVALID_LOG_LEVEL"
    | "PROVIDER_REGISTRATION_FAILED"
    | "PROVIDER_NOT_FOUND"
    | "PROVIDER_UNAVAILABLE"
    | "LOG_WRITE_FAILED"
    | "LOG_FLUSH_FAILED"
    | "LOG_DISPOSE_FAILED"
    | "LOGGING_PIPELINE_FAILED"
    | "UNKNOWN_LOGGING_ERROR";