/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: DependencyResolver

Architecture Layer..: Framework Core

Module..............: Dependency Injection

Module ID...........: LOL-MOD-DI-0004

LOL-ID..............: LOL-FRM-DI-0003

File................: dependency-resolver.ts

Location............
Library Of Legends/src/framework/dependency-injection/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Resolves registered services from the ServiceContainer and provides a
type-safe dependency resolution API for the Project Phoenix Framework.

===============================================================================

Responsibilities

• Resolve registered services
• Validate registrations
• Provide type-safe access
• Centralize dependency resolution
• Support future constructor injection

===============================================================================

Design Decisions

• Delegates storage to ServiceContainer
• Generic type-safe API
• Deterministic resolution
• Framework-wide compatibility
• Easy future extensibility

===============================================================================

Future Extensions

• Constructor injection
• Property injection
• Circular dependency detection
• Scoped resolution
• Lazy resolution

===============================================================================
*/

import { ServiceContainer } from "./service-container";

/**
 * Resolves services from the ServiceContainer.
 */
export class DependencyResolver {

    /**
     * Creates a new resolver.
     */
    public constructor(

        private readonly container: ServiceContainer

    ) {}

    /**
     * Resolves a registered service.
     */
    public resolve<T>(
        key: string
    ): T {

        return this.container.resolve<T>(key);

    }

    /**
     * Determines whether a service is available.
     */
    public canResolve(
        key: string
    ): boolean {

        return this.container.has(key);

    }

}