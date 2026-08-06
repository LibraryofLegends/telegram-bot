/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: HealthStatus

Architecture Layer..: Framework Core

Module..............: Health Monitoring

Module ID...........: LOL-MOD-HLT-0009

LOL-ID..............: LOL-FRM-HLT-0003

File................: health-status.ts

Location............
Library Of Legends/src/framework/health-monitoring/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official health status model used throughout the
Project Phoenix Framework.

===============================================================================

Responsibilities

• Represent health state
• Provide diagnostics
• Report execution duration
• Support monitoring
• Enable self-healing decisions

===============================================================================

Design Decisions

• Immutable model
• Strong TypeScript typing
• Structured diagnostics
• Framework-wide consistency
• Forward compatible

===============================================================================

Future Extensions

• Historical comparisons
• Trend analysis
• Root cause information
• Recovery recommendations
• External monitoring integration

===============================================================================
*/

/**
 * Supported health severity levels.
 */
export type HealthSeverity =
    | "HEALTHY"
    | "DEGRADED"
    | "WARNING"
    | "CRITICAL"
    | "OFFLINE"
    | "UNKNOWN";

/**
 * Official Health Status model.
 */
export interface HealthStatus {

    /**
     * Unique Health Check identifier.
     */
    readonly id: string;

    /**
     * Current health severity.
     */
    readonly severity: HealthSeverity;

    /**
     * Human-readable status message.
     */
    readonly message: string;

    /**
     * Time when the health check completed.
     */
    readonly timestamp: Date;

    /**
     * Health check execution duration.
     */
    readonly durationMs: number;

    /**
     * Optional structured diagnostics.
     */
    readonly diagnostics?: Readonly<Record<string, unknown>>;

    /**
     * Indicates whether automatic recovery is available.
     */
    readonly recoverable: boolean;

}