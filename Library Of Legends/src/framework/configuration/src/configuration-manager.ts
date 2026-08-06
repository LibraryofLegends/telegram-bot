/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ConfigurationManager

Architecture Layer..: Framework Core

Module..............: Configuration

Module ID...........: LOL-MOD-CONF-0002

LOL-ID..............: LOL-FRM-CONF-0001

File................: configuration-manager.ts

Location............:
Library Of Legends/src/framework/configuration/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Central service responsible for loading, validating and exposing the
runtime configuration of Project Phoenix.

===============================================================================

Responsibilities

• Coordinate configuration initialization
• Load configuration from available sources
• Validate loaded configuration
• Store immutable runtime configuration
• Expose configuration to Framework components

===============================================================================

Design Decisions

• Single source of truth for configuration
• Immutable runtime configuration
• Extensible provider architecture
• Framework-independent API
• Deterministic initialization

===============================================================================

Future Extensions

• Multiple configuration providers
• Remote configuration
• Hot reload support
• Secret management
• Configuration encryption

===============================================================================
*/

import type { ConfigurationOptions } from "./configuration-options";
import type { ConfigurationResult } from "./configuration-result";
import type { ConfigurationState } from "./configuration-state";

export class ConfigurationManager {

    private state: ConfigurationState = "created";

    private options?: ConfigurationOptions;

    /**
     * Initializes the Configuration Manager.
     */
    public async initialize(
        options: ConfigurationOptions
    ): Promise<ConfigurationResult> {

        this.state = "loading";

        this.options = Object.freeze({ ...options });

        /*
        ===============================================================

        Initialization Pipeline

        ===============================================================

        1. Load configuration sources
        2. Validate configuration
        3. Apply default values
        4. Freeze configuration
        5. Mark module as ready

        ===============================================================
        */

        this.state = "ready";

        return {

            success: true,

            state: this.state,

            configuration: this.options

        };

    }

    /**
     * Returns the current Configuration Manager state.
     */
    public getState(): ConfigurationState {

        return this.state;

    }

    /**
     * Returns the active runtime configuration.
     */
    public getConfiguration(): Readonly<ConfigurationOptions> {

        if (!this.options) {

            throw new Error(
                "ConfigurationManager has not been initialized."
            );

        }

        return this.options;

    }

}