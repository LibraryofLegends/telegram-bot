/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: RepositoryProvider

Architecture Layer..: Framework Core

Module..............: Repository Framework

Module ID...........: LOL-MOD-REP-0007

LOL-ID..............: LOL-FRM-REP-0003

File................: repository-provider.ts

Location............
Library Of Legends/src/framework/repository-framework/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official provider contract used by all storage providers
within the Project Phoenix Framework.

===============================================================================

Responsibilities

• Connect to storage providers
• Disconnect from providers
• Perform health checks
• Expose provider information
• Standardize provider lifecycle

===============================================================================

Design Decisions

• Interface-based design
• Provider-independent contract
• Promise-based operations
• Framework-wide compatibility
• Easy extensibility

===============================================================================

Future Extensions

• Connection pooling
• Automatic reconnect
• Replication support
• Provider metrics
• Distributed providers

===============================================================================
*/

/**
 * Official repository provider contract.
 */
export interface RepositoryProvider {

    /**
     * Unique provider identifier.
     *
     * Example:
     * LOL-PROV-SQLITE
     * LOL-PROV-POSTGRES
     * LOL-PROV-SUPABASE
     * LOL-PROV-TMDB
     */
    readonly id: string;

    /**
     * Human-readable provider name.
     */
    readonly name: string;

    /**
     * Provider version.
     */
    readonly version: string;

    /**
     * Establishes a connection.
     */
    connect(): Promise<void>;

    /**
     * Closes the provider connection.
     */
    disconnect(): Promise<void>;

    /**
     * Returns whether the provider is connected.
     */
    isConnected(): boolean;

    /**
     * Performs a provider health check.
     */
    healthCheck(): Promise<boolean>;

}