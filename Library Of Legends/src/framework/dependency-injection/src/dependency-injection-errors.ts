/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: DependencyInjectionError

Architecture Layer..: Framework Core

Module..............: Dependency Injection

Module ID...........: LOL-MOD-DI-0004

LOL-ID..............: LOL-FRM-DI-0009

File................: dependency-injection-errors.ts

Location............
Library Of Legends/src/framework/dependency-injection/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official error codes used by the Dependency Injection module
during service registration, dependency resolution and container
management.

===============================================================================

Responsibilities

• Define official DI error codes
• Standardize container failures
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
 * Official Dependency Injection error codes.
 */
export type DependencyInjectionError =
    | "CONTAINER_NOT_INITIALIZED"
    | "CONTAINER_ALREADY_INITIALIZED"
    | "SERVICE_ALREADY_REGISTERED"
    | "SERVICE_NOT_REGISTERED"
    | "SERVICE_RESOLUTION_FAILED"
    | "INVALID_SERVICE_DESCRIPTOR"
    | "INVALID_SERVICE_LIFETIME"
    | "CIRCULAR_DEPENDENCY_DETECTED"
    | "CONSTRUCTOR_INJECTION_FAILED"
    | "SERVICE_VALIDATION_FAILED"
    | "CONTAINER_VALIDATION_FAILED"
    | "UNKNOWN_DEPENDENCY_INJECTION_ERROR";