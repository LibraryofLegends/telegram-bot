/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: DependencyInjectionResult

Architecture Layer..: Framework Core

Module..............: Dependency Injection

Module ID...........: LOL-MOD-DI-0004

LOL-ID..............: LOL-FRM-DI-0007

File................: dependency-injection-result.ts

Location............
Library Of Legends/src/framework/dependency-injection/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Represents the official initialization result of the Dependency
Injection module.

===============================================================================

Responsibilities

• Return initialization status
• Expose module state
• Return active configuration
• Support diagnostics
• Provide future extensibility

===============================================================================

Design Decisions

• Immutable result object
• Strong TypeScript typing
• Consistent Framework API
• Forward compatible
• Predictable structure

===============================================================================

Future Extensions

• Initialization duration
• Registered service count
• Validation report
• Diagnostic information
• Performance metrics

===============================================================================
*/

import type {
    DependencyInjectionOptions
} from "./dependency-injection-options";

import type {
    DependencyInjectionState
} from "./dependency-injection-state";

/**
 * Official Dependency Injection initialization result.
 */
export interface DependencyInjectionResult {

    /**
     * Indicates whether initialization completed successfully.
     */
    readonly success: boolean;

    /**
     * Current Dependency Injection module state.
     */
    readonly state: DependencyInjectionState;

    /**
     * Active Dependency Injection configuration.
     */
    readonly options: Readonly<DependencyInjectionOptions>;

    /**
     * Number of registered services.
     */
    readonly registeredServices?: number;

    /**
     * Timestamp when initialization completed.
     */
    readonly initializedAt?: Date;

    /**
     * Optional informational messages.
     */
    readonly messages?: readonly string[];

}