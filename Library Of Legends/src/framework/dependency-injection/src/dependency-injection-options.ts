/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: DependencyInjectionOptions

Architecture Layer..: Framework Core

Module..............: Dependency Injection

Module ID...........: LOL-MOD-DI-0004

LOL-ID..............: LOL-FRM-DI-0006

File................: dependency-injection-options.ts

Location............
Library Of Legends/src/framework/dependency-injection/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the official runtime configuration used by the Dependency
Injection module.

===============================================================================

Responsibilities

• Define DI configuration
• Configure container behavior
• Configure validation
• Configure diagnostics
• Support future DI features

===============================================================================

Design Decisions

• Immutable configuration model
• Strong TypeScript typing
• Framework-wide compatibility
• Forward compatible structure
• Easy extensibility

===============================================================================

Future Extensions

• Automatic registration
• Assembly scanning
• Constructor injection options
• Lazy loading
• Plugin configuration

===============================================================================
*/

import type { ServiceLifetime } from "./service-lifetime";

/**
 * Official Dependency Injection configuration.
 */
export interface DependencyInjectionOptions {

    /**
     * Default lifetime assigned to registered services.
     */
    readonly defaultLifetime: ServiceLifetime;

    /**
     * Enables automatic service registration.
     */
    readonly autoRegistration?: boolean;

    /**
     * Enables constructor injection.
     */
    readonly constructorInjection?: boolean;

    /**
     * Enables circular dependency detection.
     */
    readonly detectCircularDependencies?: boolean;

    /**
     * Enables dependency validation.
     */
    readonly validateOnStartup?: boolean;

    /**
     * Enables runtime diagnostics.
     */
    readonly diagnostics?: boolean;

}