/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ConfigurationProvider

Architecture Layer..: Framework Core

Module..............: Configuration

Module ID...........: LOL-MOD-CONF-0002

LOL-ID..............: LOL-FRM-CONF-0004

File................: configuration-provider.ts

Location............:
Library Of Legends/src/framework/configuration/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Provides read-only access to the validated runtime configuration for all
Framework Core modules, Providers, Features and Applications.

===============================================================================

Responsibilities

• Expose runtime configuration
• Provide type-safe configuration access
• Protect configuration integrity
• Prevent configuration mutation
• Support future configuration sections

===============================================================================

Design Decisions

• Read-only access
• Immutable configuration
• Framework-wide availability
• Type-safe API
• Centralized configuration access

===============================================================================

Future Extensions

• Section-based access
• Typed configuration namespaces
• Cached lookups
• Runtime diagnostics
• Configuration observers

===============================================================================
*/

import type { ConfigurationOptions } from "./configuration-options";

export class ConfigurationProvider {

    private configuration?: Readonly<ConfigurationOptions>;

    /**
     * Registers the validated runtime configuration.
     */
    public register(
        configuration: Readonly<ConfigurationOptions>
    ): void {

        this.configuration = configuration;

    }

    /**
     * Returns the complete runtime configuration.
     */
    public getConfiguration(): Readonly<ConfigurationOptions> {

        if (!this.configuration) {

            throw new Error(
                "Configuration has not been registered."
            );

        }

        return this.configuration;

    }

    /**
     * Indicates whether a configuration has already been registered.
     */
    public isRegistered(): boolean {

        return this.configuration !== undefined;

    }

}