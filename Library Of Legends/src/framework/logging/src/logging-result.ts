/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: LoggingResult

Architecture Layer..: Framework Core

Module..............: Logging

Module ID...........: LOL-MOD-LOG-0003

LOL-ID..............: LOL-FRM-LOG-0007

File................: logging-result.ts

Location............:
Library Of Legends/src/framework/logging/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Represents the official initialization result of the Logging module.

===============================================================================

Responsibilities

• Return initialization status
• Expose logging state
• Return active logging configuration
• Support diagnostics
• Provide future extensibility

===============================================================================

Design Decisions

• Immutable result object
• Strong TypeScript typing
• Consistent Framework API
• Forward compatible
• Simple and predictable structure

===============================================================================

Future Extensions

• Initialization duration
• Registered providers
• Diagnostic information
• Startup warnings
• Performance metrics

===============================================================================
*/

import type { LoggingOptions } from "./logging-options";
import type { LoggingState } from "./logging-state";

/**
 * Official Logging module initialization result.
 */
export interface LoggingResult {

    /**
     * Indicates whether initialization completed successfully.
     */
    readonly success: boolean;

    /**
     * Current Logging module state.
     */
    readonly state: LoggingState;

    /**
     * Active logging configuration.
     */
    readonly options: Readonly<LoggingOptions>;

    /**
     * Timestamp when initialization completed.
     */
    readonly initializedAt?: Date;

    /**
     * Optional informational messages.
     */
    readonly messages?: readonly string[];

}