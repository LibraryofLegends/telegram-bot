/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: RepositoryOptions

Architecture Layer..: Framework Core

Module..............: Repository Framework

Module ID...........: LOL-MOD-REP-0007

LOL-ID..............: LOL-FRM-REP-0004

File................: repository-options.ts

Location............
Library Of Legends/src/framework/repository-framework/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official runtime configuration used by the Repository
Framework.

===============================================================================

Responsibilities

• Configure repository behavior
• Configure provider selection
• Configure transaction support
• Configure diagnostics
• Support future repository features

===============================================================================

Design Decisions

• Immutable configuration model
• Strong TypeScript typing
• Provider-independent configuration
• Framework-wide compatibility
• Easy extensibility

===============================================================================

Future Extensions

• Automatic provider failover
• Multi-provider routing
• Read/Write splitting
• Repository caching
• Distributed repositories

===============================================================================
*/

/**
 * Official Repository Framework configuration.
 */
export interface RepositoryOptions {

    /**
     * Default repository provider identifier.
     */
    readonly defaultProvider: string;

    /**
     * Enables transaction support.
     */
    readonly transactions?: boolean;

    /**
     * Enables repository caching.
     */
    readonly caching?: boolean;

    /**
     * Enables runtime diagnostics.
     */
    readonly diagnostics?: boolean;

    /**
     * Enables automatic provider health checks.
     */
    readonly healthChecks?: boolean;

    /**
     * Automatically reconnects providers after failures.
     */
    readonly autoReconnect?: boolean;

}