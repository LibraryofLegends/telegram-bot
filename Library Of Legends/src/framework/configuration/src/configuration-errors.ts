/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ConfigurationError

Architecture Layer..: Framework Core

Module..............: Configuration

Module ID...........: LOL-MOD-CONF-0002

LOL-ID..............: LOL-FRM-CONF-0008

File................: configuration-errors.ts

Location............:
Library Of Legends/src/framework/configuration/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official error codes of the Configuration module used during
configuration loading, validation and runtime initialization.

===============================================================================

Responsibilities

• Define official configuration error codes
• Standardize configuration failures
• Improve diagnostics
• Support structured logging
• Enable consistent error handling

===============================================================================

Design Decisions

• String literal union for maximum type safety
• Stable error identifiers
• Human-readable names
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
 * Official Configuration module error codes.
 */
export type ConfigurationError =
    | "CONFIGURATION_NOT_FOUND"
    | "CONFIGURATION_LOAD_FAILED"
    | "CONFIGURATION_VALIDATION_FAILED"
    | "CONFIGURATION_ALREADY_INITIALIZED"
    | "CONFIGURATION_NOT_INITIALIZED"
    | "INVALID_CONFIGURATION"
    | "INVALID_ENVIRONMENT"
    | "MISSING_REQUIRED_CONFIGURATION"
    | "UNSUPPORTED_CONFIGURATION_SOURCE"
    | "CONFIGURATION_PROVIDER_FAILED"
    | "CONFIGURATION_IMMUTABLE"
    | "UNKNOWN_CONFIGURATION_ERROR";