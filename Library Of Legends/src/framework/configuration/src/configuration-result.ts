/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ConfigurationResult

Architecture Layer..: Framework Core

Module..............: Configuration

Module ID...........: LOL-MOD-CONF-0002

LOL-ID..............: LOL-FRM-CONF-0006

File................: configuration-result.ts

Location............:
Library Of Legends/src/framework/configuration/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Represents the official result returned after the Configuration module
has completed its initialization process.

===============================================================================

Responsibilities

• Return initialization status
• Expose validated configuration
• Report current module state
• Provide initialization timestamp
• Support future diagnostics

===============================================================================

Design Decisions

• Immutable result object
• Simple and predictable API
• Type-safe implementation
• Easy extensibility
• Consistent with Framework standards

===============================================================================

Future Extensions

• Initialization duration
• Validation warnings
• Loaded configuration sources
• Diagnostic information
• Performance metrics

===============================================================================
*/

import type { ConfigurationOptions } from "./configuration-options";
import type { ConfigurationState } from "./configuration-state";

/**
 * Official Configuration module initialization result.
 */
export interface ConfigurationResult {

    /**
     * Indicates whether initialization completed successfully.
     */
    readonly success: boolean;

    /**
     * Current Configuration module state.
     */
    readonly state: ConfigurationState;

    /**
     * Validated runtime configuration.
     */
    readonly configuration: Readonly<ConfigurationOptions>;

    /**
     * Timestamp when initialization completed.
     */
    readonly initializedAt?: Date;

    /**
     * Optional informational messages.
     */
    readonly messages?: readonly string[];

}