/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: Logger

Architecture Layer..: Framework Core

Module..............: Logging

Module ID...........: LOL-MOD-LOG-0003

LOL-ID..............: LOL-FRM-LOG-0002

File................: logger.ts

Location............:
Library Of Legends/src/framework/logging/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Provides the primary logging API used throughout the Project Phoenix
Framework.

===============================================================================

Responsibilities

• Create structured log entries
• Dispatch log entries to providers
• Support all official log levels
• Preserve logging consistency
• Provide a simple logging API

===============================================================================

Design Decisions

• Provider-independent implementation
• Immutable log entries
• Type-safe log levels
• Central logging API
• Extensible architecture

===============================================================================

Future Extensions

• Context-aware logging
• Correlation IDs
• Scoped loggers
• Child loggers
• Structured metadata

===============================================================================
*/

import type { LogEntry } from "./log-entry";
import type { LogLevel } from "./log-level";

export class Logger {

    /**
     * Writes a log entry.
     */
    public log(
        level: LogLevel,
        message: string
    ): LogEntry {

        const entry: LogEntry = {

            timestamp: new Date(),

            level,

            message

        };

        /*
        ===============================================================

        Future Pipeline

        ===============================================================

        1. Apply filters
        2. Apply enrichers
        3. Dispatch to providers
        4. Flush pipeline

        ===============================================================
        */

        return Object.freeze(entry);

    }

    /**
     * Writes a debug log entry.
     */
    public debug(message: string): LogEntry {

        return this.log("debug", message);

    }

    /**
     * Writes an information log entry.
     */
    public info(message: string): LogEntry {

        return this.log("info", message);

    }

    /**
     * Writes a warning log entry.
     */
    public warn(message: string): LogEntry {

        return this.log("warn", message);

    }

    /**
     * Writes an error log entry.
     */
    public error(message: string): LogEntry {

        return this.log("error", message);

    }

    /**
     * Writes a fatal log entry.
     */
    public fatal(message: string): LogEntry {

        return this.log("fatal", message);

    }

}