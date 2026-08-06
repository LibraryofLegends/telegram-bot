/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ServiceDescriptor

Architecture Layer..: Framework Core

Module..............: Dependency Injection

Module ID...........: LOL-MOD-DI-0004

LOL-ID..............: LOL-FRM-DI-0004

File................: service-descriptor.ts

Location............
Library Of Legends/src/framework/dependency-injection/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Defines the metadata describing a registered service within the
Dependency Injection container.

===============================================================================

Responsibilities

• Describe registered services
• Store service metadata
• Define implementation type
• Define service lifetime
• Support dependency resolution

===============================================================================

Design Decisions

• Immutable descriptor
• Strong TypeScript typing
• Framework-wide consistency
• Easy extensibility
• Provider-independent

===============================================================================

Future Extensions

• Factory registrations
• Constructor metadata
• Named services
• Service aliases
• Conditional registrations

===============================================================================
*/

import type { ServiceLifetime } from "./service-lifetime";

/**
 * Constructor type used by the service container.
 */
export type ServiceConstructor<T> = new (
    ...arguments_: unknown[]
) => T;

/**
 * Official service registration descriptor.
 */
export interface ServiceDescriptor<T = unknown> {

    /**
     * Unique service identifier.
     */
    readonly key: string;

    /**
     * Service implementation.
     */
    readonly implementation: ServiceConstructor<T>;

    /**
     * Service lifetime.
     */
    readonly lifetime: ServiceLifetime;

    /**
     * Optional cached singleton instance.
     */
    readonly instance?: T;

}