/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LogEntry

Architecture Layer..: Framework Core

Module..............: Logging

Module ID...........: LOL-MOD-LOG-0003

LOL-ID..............: LOL-FRM-LOG-0004

File................: log-entry.ts

Location............:
Library Of Legends/src/framework/logging/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official immutable log entry model used throughout the
Project Phoenix Framework.

===============================================================================

Responsibilities

• Represent structured log entries
• Standardize logging data
• Support all Framework modules
• Provide immutable log objects
• Enable provider interoperability

===============================================================================

Design Decisions

• Immutable interface
• Framework-wide standard
• Human-readable structure
• Strong TypeScript typing
• Easily extensible

===============================================================================

Future Extensions

• Correlation IDs
• Session IDs
• Request IDs
• Exception details
• Custom metadata
• Tags
• Categories

===============================================================================
*/

import type { LogLevel } from "./log-level";

/**
 * Official structured log entry.
 */
export interface LogEntry {

    /**
     * Time when the entry was created.
     */
    readonly timestamp: Date;

    /**
     * Log severity.
     */
    readonly level: LogLevel;

    /**
     * Component that created the entry.
     */
    readonly component?: string;

    /**
     * Log message.
     */
    readonly message: string;

    /**
     * Optional structured metadata.
     */
    readonly metadata?: Readonly<Record<string, unknown>>;

}