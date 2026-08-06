/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: ServiceContainer

Architecture Layer..: Framework Core

Module..............: Dependency Injection

Module ID...........: LOL-MOD-DI-0004

LOL-ID..............: LOL-FRM-DI-0002

File................: service-container.ts

Location............
Library Of Legends/src/framework/dependency-injection/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Provides the central registry responsible for storing and resolving all
services used throughout the Project Phoenix Framework.

===============================================================================

Responsibilities

• Register services
• Resolve services
• Prevent duplicate registrations
• Manage service instances
• Support future service lifetimes

===============================================================================

Design Decisions

• Centralized service registry
• Generic type-safe API
• Deterministic resolution
• Provider-independent implementation
• Easy future extensibility

===============================================================================

Future Extensions

• Singleton cache
• Scoped services
• Lazy instantiation
• Automatic registration
• Circular dependency detection

===============================================================================
*/

/**
 * Central service registry.
 */
export class ServiceContainer {

    private readonly services = new Map<string, unknown>();

    /**
     * Registers a service instance.
     */
    public register<T>(
        key: string,
        instance: T
    ): void {

        if (this.services.has(key)) {

            throw new Error(
                `Service '${key}' is already registered.`
            );

        }

        this.services.set(key, instance);

    }

    /**
     * Resolves a registered service.
     */
    public resolve<T>(
        key: string
    ): T {

        const service = this.services.get(key);

        if (!service) {

            throw new Error(
                `Service '${key}' is not registered.`
            );

        }

        return service as T;

    }

    /**
     * Determines whether a service is registered.
     */
    public has(
        key: string
    ): boolean {

        return this.services.has(key);

    }

    /**
     * Removes all registered services.
     */
    public clear(): void {

        this.services.clear();

    }

    /**
     * Returns the total number of registered services.
     */
    public size(): number {

        return this.services.size;

    }

}