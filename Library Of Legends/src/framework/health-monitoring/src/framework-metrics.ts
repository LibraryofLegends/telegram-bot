/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: FrameworkMetrics

Architecture Layer..: Framework Core

Module..............: Health Monitoring

Module ID...........: LOL-MOD-HLT-0009

LOL-ID..............: LOL-FRM-HLT-0008

File................: framework-metrics.ts

Location............
Library Of Legends/src/framework/health-monitoring/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official runtime metrics model used throughout the
Project Phoenix Framework.

===============================================================================
*/

/**
 * Official Framework Metrics model.
 */
export interface FrameworkMetrics {

    /**
     * Timestamp when metrics were collected.
     */
    readonly timestamp: Date;

    /**
     * Overall system health score (0–100).
     */
    readonly healthScore: number;

    /**
     * CPU usage in percent.
     */
    readonly cpuUsagePercent: number;

    /**
     * Memory usage in bytes.
     */
    readonly memoryUsageBytes: number;

    /**
     * Heap usage in bytes.
     */
    readonly heapUsageBytes: number;

    /**
     * Framework uptime in milliseconds.
     */
    readonly uptimeMs: number;

    /**
     * Number of active Scheduler jobs.
     */
    readonly activeJobs: number;

    /**
     * Number of queued Scheduler jobs.
     */
    readonly queuedJobs: number;

    /**
     * Number of registered repositories.
     */
    readonly repositoryCount: number;

    /**
     * Number of registered Health Checks.
     */
    readonly healthCheckCount: number;

    /**
     * Number of active alerts.
     */
    readonly activeAlerts: number;

    /**
     * Optional provider-specific metrics.
     */
    readonly customMetrics?: Readonly<Record<string, unknown>>;

}