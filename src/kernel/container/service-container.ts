/*
===============================================================================
██╗     ██╗██████╗ ██████╗  █████╗ ██████╗ ██╗   ██╗
██║     ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝
██║     ██║██████╔╝██████╔╝███████║██████╔╝ ╚████╔╝
██║     ██║██╔══██╗██╔══██╗██╔══██║██╔══██╗  ╚██╔╝
███████╗██║██████╔╝██║  ██║██║  ██║██║  ██║   ██║
╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝

                         PROJECT PHOENIX

===============================================================================

Project.............: Library Of Legends
Framework...........: LOAF

Architecture Layer..: Platform
Subsystem...........: Dependency Injection

Module..............: Kernel
Package.............: Container

Component...........: Service Container

LOL-ID..............: LOL-KERNEL-0004

File................: service-container.ts

Location............: src/kernel/container/service-container.ts

Dependencies........: None
Dependents..........: Runtime, EventBus, PluginManager

Stability...........: Stable

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Central Dependency Injection Container.

Responsible for registering, resolving and managing application services.

The Service Container is the primary entry point for accessing shared
infrastructure across Project Phoenix.

===============================================================================
*/

export type ServiceFactory<T> = () => T;

interface ServiceRegistration<T> {

    singleton: boolean;

    instance?: T;

    factory: ServiceFactory<T>;

}

export class ServiceContainer {

    private readonly services = new Map<
        string,
        ServiceRegistration<unknown>
    >();

    /**
     * Register singleton service.
     */
    public registerSingleton<T>(
        key: string,
        factory: ServiceFactory<T>
    ): void {

        if (this.services.has(key)) {

            throw new Error(
                `Service "${key}" already registered.`
            );

        }

        this.services.set(key, {

            singleton: true,

            factory

        });

    }

    /**
     * Register transient service.
     */
    public registerTransient<T>(
        key: string,
        factory: ServiceFactory<T>
    ): void {

        if (this.services.has(key)) {

            throw new Error(
                `Service "${key}" already registered.`
            );

        }

        this.services.set(key, {

            singleton: false,

            factory

        });

    }

    /**
     * Resolve service.
     */
    public resolve<T>(
        key: string
    ): T {

        const registration = this.services.get(key);

        if (!registration) {

            throw new Error(
                `Unknown service "${key}".`
            );

        }

        if (registration.singleton) {

            if (!registration.instance) {

                registration.instance =
                    registration.factory();

            }

            return registration.instance as T;

        }

        return registration.factory() as T;

    }

    /**
     * Check registration.
     */
    public has(
        key: string
    ): boolean {

        return this.services.has(key);

    }

    /**
     * Remove service.
     */
    public unregister(
        key: string
    ): boolean {

        return this.services.delete(key);

    }

    /**
     * Remove all services.
     */
    public clear(): void {

        this.services.clear();

    }

}