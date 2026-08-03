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

Component...........: Abstract Registry

LOL-ID..............: LOL-COMMON-0001

File................: abstract-registry.ts

Location............: src/kernel/common/registry/

Dependencies........: None

Dependents..........:
- Manifest Registry
- Capability Registry
- Provider Registry
- Plugin Registry
- Service Registry

Stability...........: Stable

License.............: MIT

===============================================================================

DESCRIPTION

Generic registry implementation used throughout LOAF.

Provides a common implementation for registration, lookup,
removal and enumeration.

===============================================================================
*/

export abstract class AbstractRegistry<T> {

    protected readonly items =

        new Map<string, T>();

    /**
     * Returns identifier of an item.
     */
    protected abstract getId(

        item: T

    ): string;

    /**
     * Register item.
     */
    public register(

        item: T

    ): void {

        const id = this.getId(item);

        if (this.items.has(id)) {

            throw new Error(

                `Item "${id}" already registered.`

            );

        }

        this.items.set(

            id,

            item

        );

    }

    /**
     * Returns item.
     */
    public get(

        id: string

    ): T | undefined {

        return this.items.get(id);

    }

    /**
     * Returns every item.
     */
    public getAll(): readonly T[] {

        return [...this.items.values()];

    }

    /**
     * Checks whether item exists.
     */
    public has(

        id: string

    ): boolean {

        return this.items.has(id);

    }

    /**
     * Removes item.
     */
    public unregister(

        id: string

    ): boolean {

        return this.items.delete(id);

    }

    /**
     * Clears registry.
     */
    public clear(): void {

        this.items.clear();

    }

    /**
     * Registry size.
     */
    public get size(): number {

        return this.items.size;

    }

}