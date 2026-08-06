/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: HealthError

Architecture Layer..: Framework Core

Module..............: Health Monitoring

Module ID...........: LOL-MOD-HLT-0009

LOL-ID..............: LOL-FRM-HLT-0007

File................: health-errors.ts

Location............
Library Of Legends/src/framework/health-monitoring/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official error codes used by the Health Monitoring module.

===============================================================================

Responsibilities

• Define official Health Monitoring error codes
• Standardize monitoring failures
• Improve diagnostics
• Support structured logging
• Enable consistent error handling

===============================================================================

Design Decisions

• String literal union
• Stable error identifiers
• Human-readable names
• Framework-wide consistency
• Forward compatible design

===============================================================================

Future Extensions

• FrameworkErrorCode integration
• Error severity levels
• Localized messages
• Recovery recommendations
• Diagnostic metadata

===============================================================================
*/

/**
 * Official Health Monitoring error codes.
 */
export type HealthError =
    | "HEALTH_MONITORING_NOT_INITIALIZED"
    | "HEALTH_MONITORING_ALREADY_INITIALIZED"
    | "INVALID_HEALTH_CONFIGURATION"
    | "HEALTH_CHECK_ALREADY_REGISTERED"
    | "HEALTH_CHECK_NOT_FOUND"
    | "HEALTH_CHECK_FAILED"
    | "HEALTH_CHECK_TIMEOUT"
    | "HEALTH_REGISTRY_BUILD_FAILED"
    | "HEALTH_SNAPSHOT_CREATION_FAILED"
    | "METRICS_COLLECTION_FAILED"
    | "ALERT_DISPATCH_FAILED"
    | "AUTO_RECOVERY_FAILED"
    | "HEALTH_POLICY_VIOLATION"
    | "SYSTEM_HEALTH_CRITICAL"
    | "UNKNOWN_HEALTH_ERROR";