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

Project.............: Library Of Legends Application Framework (LOAF)

Application.........: Project Phoenix

Architecture Layer..: Platform

Subsystem...........: Dependency Injection

Module..............: Kernel

Package.............: Container

Component...........: Service Contract

LOL-ID..............: LOL-KERNEL-0008

File................: service.ts

Location............: src/kernel/container/service.ts

Dependencies........: None

Dependents..........:
- ServiceContainer
- Runtime
- PluginManager
- EventBus
- All Modules

Stability...........: Stable

License.............: MIT

===============================================================================
*/

export interface Service {

    /**
     * Unique service identifier.
     */
    readonly id: string;

    /**
     * Human readable service name.
     */
    readonly name: string;

    /**
     * Service version.
     */
    readonly version: string;

    /**
     * Initializes the service.
     */
    initialize(): Promise<void>;

    /**
     * Disposes the service.
     */
    dispose(): Promise<void>;

}