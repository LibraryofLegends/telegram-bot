/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: RepositoryError

Architecture Layer..: Framework Core

Module..............: Repository Framework

Module ID...........: LOL-MOD-REP-0007

LOL-ID..............: LOL-FRM-REP-0007

File................: repository-errors.ts

Location............
Library Of Legends/src/framework/repository-framework/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official error codes used by the Repository Framework during
repository registration, provider management and transaction handling.

===============================================================================

Responsibilities

• Define official Repository Framework error codes
• Standardize repository failures
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
 * Official Repository Framework error codes.
 */
export type RepositoryError =
    | "REPOSITORY_FRAMEWORK_NOT_INITIALIZED"
    | "REPOSITORY_FRAMEWORK_ALREADY_INITIALIZED"
    | "INVALID_REPOSITORY_CONFIGURATION"
    | "INVALID_REPOSITORY"
    | "INVALID_PROVIDER"
    | "PROVIDER_ALREADY_REGISTERED"
    | "PROVIDER_NOT_REGISTERED"
    | "REPOSITORY_ALREADY_REGISTERED"
    | "REPOSITORY_NOT_REGISTERED"
    | "TRANSACTION_FAILED"
    | "REPOSITORY_VALIDATION_FAILED"
    | "PROVIDER_CONNECTION_FAILED"
    | "UNKNOWN_REPOSITORY_ERROR";