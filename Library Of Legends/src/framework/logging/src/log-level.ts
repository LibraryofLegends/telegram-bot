/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LogLevel

Architecture Layer..: Framework Core

Module..............: Logging

Module ID...........: LOL-MOD-LOG-0003

LOL-ID..............: LOL-FRM-LOG-0005

File................: log-level.ts

Location............:
Library Of Legends/src/framework/logging/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official logging severity levels used throughout the
Project Phoenix Framework.

===============================================================================

Responsibilities

• Define official log levels
• Standardize log severity
• Support structured logging
• Enable log filtering
• Ensure Framework-wide consistency

===============================================================================

Design Decisions

• String literal union
• Human-readable values
• Ordered by severity
• Framework-wide compatibility
• Future extensibility

===============================================================================

Future Extensions

• Trace level
• Audit level
• Security level
• Performance level
• Custom log levels

===============================================================================
*/

/**
 * Official logging severity levels.
 */
export type LogLevel =
    | "debug"
    | "info"
    | "warn"
    | "error"
    | "fatal";