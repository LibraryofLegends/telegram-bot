/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: BootstrapOptions

Architecture Layer..: Framework Core

Module..............: Bootstrap

Module ID...........: LOL-MOD-BOOT-0001

LOL-ID..............: LOL-FRM-BOOT-0003

File................: bootstrap-options.ts

Location............:
Library Of Legends/src/framework/bootstrap/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the configuration options required to initialize the
Project Phoenix Framework.

===============================================================================

Responsibilities

• Define framework startup options
• Specify runtime environment
• Control startup behavior
• Provide future extensibility
• Remain immutable during bootstrap

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
 * Official bootstrap configuration.
 */
export interface BootstrapOptions {

    /**
     * Runtime environment.
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

}