/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ConfigurationOptions

Architecture Layer..: Framework Core

Module..............: Configuration

Module ID...........: LOL-MOD-CONF-0002

LOL-ID..............: LOL-FRM-CONF-0005

File................: configuration-options.ts

Location............:
Library Of Legends/src/framework/configuration/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official runtime configuration model used by the
Project Phoenix Framework.

===============================================================================

Responsibilities

• Define runtime configuration
• Provide type-safe configuration
• Support multiple environments
• Define optional startup features
• Ensure consistent configuration structure

===============================================================================

Design Decisions

• Immutable configuration model
• Strong TypeScript typing
• Framework-wide compatibility
• Forward compatible structure
• Easy extensibility

===============================================================================

Future Extensions

• Database configuration
• Logging configuration
• Provider configuration
• Feature configuration
• Application configuration

===============================================================================
*/

/**
 * Supported runtime environments.
 */
export type RuntimeEnvironment =
    | "development"
    | "testing"
    | "staging"
    | "production";

/**
 * Official runtime configuration.
 */
export interface ConfigurationOptions {

    /**
     * Active runtime environment.
     */
    readonly environment: RuntimeEnvironment;

    /**
     * Enables debug mode.
     */
    readonly debug?: boolean;

    /**
     * Enables verbose logging.
     */
    readonly verbose?: boolean;

    /**
     * Enables startup diagnostics.
     */
    readonly diagnostics?: boolean;

    /**
     * Enables health monitoring.
     */
    readonly healthMonitoring?: boolean;

    /**
     * Application name.
     */
    readonly applicationName?: string;

    /**
     * Application version.
     */
    readonly applicationVersion?: string;

}