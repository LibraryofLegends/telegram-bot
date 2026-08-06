/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: HealthCheck

Architecture Layer..: Framework Core

Module..............: Health Monitoring

Module ID...........: LOL-MOD-HLT-0009

LOL-ID..............: LOL-FRM-HLT-0002

File................: health-check.ts

Location............
Library Of Legends/src/framework/health-monitoring/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official Health Check contract used throughout the Project
Phoenix Framework.

===============================================================================

Responsibilities

• Define health check identity
• Execute health checks
• Report health status
• Provide diagnostic information
• Support self-healing integration

===============================================================================

Design Decisions

• Interface-based design
• Promise-based execution
• Immutable metadata
• Framework-wide compatibility
• Easy extensibility

===============================================================================

Future Extensions

• Health check categories
• Health check dependencies
• Automatic recovery
• Historical execution
• Distributed health checks

===============================================================================
*/

import type { HealthStatus } from "./health-status";

/**
 * Official Health Check contract.
 */
export interface HealthCheck {

    /**
     * Unique Health Check identifier.
     *
     * Example:
     * LOL-HCHK-BOOTSTRAP
     * LOL-HCHK-SCHEDULER
     * LOL-HCHK-REPOSITORY
     */
    readonly id: string;

    /**
     * Human-readable Health Check name.
     */
    readonly name: string;

    /**
     * Optional Health Check description.
     */
    readonly description?: string;

    /**
     * Indicates whether this Health Check is enabled.
     */
    readonly enabled: boolean;

    /**
     * Executes the Health Check.
     */
    execute(): Promise<HealthStatus>;

    /**
     * Optional automatic recovery hook.
     */
    recover?(): Promise<void>;

}