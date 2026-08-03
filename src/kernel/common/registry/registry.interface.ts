/*
===============================================================================
██╗      ██████╗  █████╗ ███████╗
██║     ██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║███████║█████╗
██║     ██║   ██║██╔══██║██╔══╝
███████╗╚██████╔╝██║  ██║██║
╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝

          Library Of Legends Application Framework

===============================================================================

Architecture Layer..: Foundation

Subsystem...........: Common

Module..............: Kernel

Package.............: Registry

Component...........: Registry Interface

LOL-ID..............: LOL-COMMON-0002

File................: registry.interface.ts

Location............: src/kernel/common/registry/

Dependencies........: None

Dependents..........:
- Abstract Registry
- Manifest Registry
- Capability Registry
- Provider Registry
- Plugin Registry
- Service Registry

Stability...........: Stable

License.............: MIT

===============================================================================

DESCRIPTION

Defines the common contract for every registry used by LOAF.

===============================================================================
*/

export interface Registry<T> {

    /**
     * Register an item.
     */
    register(item: T): void;

    /**
     * Returns an item.
     */
    get(id: string): T | undefined;

    /**
     * Returns every registered item.
     */
    getAll(): readonly T[];

    /**
     * Checks whether an item exists.
     */
    has(id: string): boolean;

    /**
     * Removes an item.
     */
    unregister(id: string): boolean;

    /**
     * Clears the registry.
     */
    clear(): void;

    /**
     * Number of registered items.
     */
    readonly size: number;

}