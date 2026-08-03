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

Subsystem...........: Capability System

Module..............: Kernel

Package.............: Capabilities

Component...........: Capability Registry

LOL-ID..............: LOL-CAPABILITY-0004

File................: capability-registry.ts

Location............: src/kernel/capabilities/

Dependencies........:
- capability-descriptor.ts

Dependents..........:
- Capability Manager
- Kernel
- Runtime
- Provider Registry

Stability...........: Stable

License.............: MIT

===============================================================================
*/

import { CapabilityDescriptor } from "./capability-descriptor";

export class CapabilityRegistry {

    private readonly registry =
        new Map<string, CapabilityDescriptor>();

    /**
     * Register a capability descriptor.
     */
    public register(
        descriptor: CapabilityDescriptor
    ): void {

        if (this.registry.has(descriptor.id)) {

            throw new Error(

                `Capability "${descriptor.id}" already exists.`

            );

        }

        this.registry.set(

            descriptor.id,

            descriptor

        );

    }

    /**
     * Returns descriptor by id.
     */
    public get(
        id: string
    ): CapabilityDescriptor | undefined {

        return this.registry.get(id);

    }

    /**
     * Returns every descriptor.
     */
    public getAll(): readonly CapabilityDescriptor[] {

        return [...this.registry.values()];

    }

    /**
     * Checks if capability exists.
     */
    public has(
        id: string
    ): boolean {

        return this.registry.has(id);

    }

    /**
     * Removes descriptor.
     */
    public unregister(
        id: string
    ): boolean {

        return this.registry.delete(id);

    }

    /**
     * Clears registry.
     */
    public clear(): void {

        this.registry.clear();

    }

}