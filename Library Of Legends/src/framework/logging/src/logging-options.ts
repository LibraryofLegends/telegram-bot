/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LoggingOptions

Architecture Layer..: Framework Core

Module..............: Logging

Module ID...........: LOL-MOD-LOG-0003

LOL-ID..............: LOL-FRM-LOG-0006

File................: logging-options.ts

Location............:
Library Of Legends/src/framework/logging/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official runtime configuration used by the Logging module.

===============================================================================

Responsibilities

• Define logging configuration
• Configure logging providers
• Configure log levels
• Enable runtime diagnostics
• Support future logging features

===============================================================================

Design Decisions

• Immutable configuration model
• Strong TypeScript typing
• Framework-wide compatibility
• Forward compatible structure
• Easy extensibility

===============================================================================

Future Extensions

• File logging options
• Remote provider options
• Log rotation
• Structured JSON output
• Log buffering

===============================================================================
*/

import type { LogLevel } from "./log-level";

/**
 * Official logging configuration.
 */
export interface LoggingOptions {

    /**
     * Minimum accepted log level.
     */
    readonly minimumLevel: LogLevel;

    /**
     * Enables console logging.
     */
    readonly console?: boolean;

    /**
     * Enables file logging.
     */
    readonly file?: boolean;

    /**
     * Enables structured JSON logging.
     */
    readonly structured?: boolean;

    /**
     * Enables timestamp formatting.
     */
    readonly timestamps?: boolean;

    /**
     * Enables colored console output.
     */
    readonly colors?: boolean;

    /**
     * Enables diagnostic logging.
     */
    readonly diagnostics?: boolean;

}