/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: HealthOptions

Architecture Layer..: Framework Core

Module..............: Health Monitoring

Module ID...........: LOL-MOD-HLT-0009

LOL-ID..............: LOL-FRM-HLT-0004

File................: health-options.ts

Location............
Library Of Legends/src/framework/health-monitoring/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official runtime configuration used by the Health Monitoring
module.

===============================================================================

Responsibilities

• Configure Health Monitoring
• Configure metrics collection
• Configure diagnostics
• Configure alerting
• Support future monitoring features

===============================================================================

Design Decisions

• Immutable configuration
• Strong TypeScript typing
• Framework-wide consistency
• Provider-independent
• Easy extensibility

===============================================================================

Future Extensions

• External monitoring
• Metrics exporters
• Distributed monitoring
• Snapshot persistence
• AI diagnostics

===============================================================================
*/

/**
 * Official Health Monitoring configuration.
 */
export interface HealthOptions {

    /**
     * Enables runtime diagnostics.
     */
    readonly diagnostics?: boolean;

    /**
     * Enables framework metrics collection.
     */
    readonly metrics?: boolean;

    /**
     * Enables automatic health snapshots.
     */
    readonly snapshots?: boolean;

    /**
     * Enables alert generation.
     */
    readonly alerts?: boolean;

    /**
     * Enables automatic recovery.
     */
    readonly autoRecovery?: boolean;

    /**
     * Health check execution interval in milliseconds.
     */
    readonly checkIntervalMs?: number;

    /**
     * Maximum number of retained health snapshots.
     */
    readonly maxSnapshots?: number;

}