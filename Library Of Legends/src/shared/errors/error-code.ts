/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ErrorCode

Architecture Layer..: Shared Kernel

Module..............: Shared Errors

Module ID...........: LOL-MOD-ERR-0001

LOL-ID..............: LOL-ERR-0001

File................: error-code.ts

Location............
Library Of Legends/src/shared/errors/

Version.............: 1.0.0

Status..............: Stable

Lifecycle...........: Development

Description.........

Defines common error codes used across the framework and domain.

===============================================================================
*/

/**
 * Common error codes shared across the project.
 */
export enum ErrorCode {

    Unknown = "UNKNOWN",

    Validation = "VALIDATION",

    Configuration = "CONFIGURATION",

    Authentication = "AUTHENTICATION",

    Authorization = "AUTHORIZATION",

    NotFound = "NOT_FOUND",

    Conflict = "CONFLICT",

    Timeout = "TIMEOUT",

    Network = "NETWORK",

    Internal = "INTERNAL"

}