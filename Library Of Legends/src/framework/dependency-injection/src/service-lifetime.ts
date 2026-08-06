/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ServiceLifetime

Architecture Layer..: Framework Core

Module..............: Dependency Injection

Module ID...........: LOL-MOD-DI-0004

LOL-ID..............: LOL-FRM-DI-0005

File................: service-lifetime.ts

Location............
Library Of Legends/src/framework/dependency-injection/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official service lifetimes supported by the Dependency
Injection container.

===============================================================================

Responsibilities

• Define service lifetimes
• Standardize instance management
• Support deterministic service creation
• Enable lifecycle management
• Ensure Framework-wide consistency

===============================================================================

Design Decisions

• String literal union
• Human-readable values
• Framework-wide compatibility
• Strong TypeScript typing
• Easy future extensibility

===============================================================================

Future Extensions

• Pooled lifetime
• Weak reference lifetime
• Session lifetime
• Cached lifetime
• Custom lifetime strategies

===============================================================================
*/

/**
 * Official service lifetimes.
 */
export type ServiceLifetime =
    | "singleton"
    | "transient"
    | "scoped";