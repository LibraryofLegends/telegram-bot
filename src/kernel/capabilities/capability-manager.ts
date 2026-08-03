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

Component...........: Capability Manager

LOL-ID..............: LOL-CAPABILITY-0002

File................: capability-manager.ts

Location............: src/kernel/capabilities/capability-manager.ts

Dependencies........:
- capability.interface.ts

Dependents..........:
- Kernel
- Runtime
- Provider Registry

Stability...........: Stable

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Central registry and lifecycle manager for all platform capabilities.

Responsibilities

• Register capabilities
• Resolve capabilities
• Initialize capabilities
• Shutdown capabilities
• Validate uniqueness
• Maintain execution order

===============================================================================
*/

import { Capability } from "./capability.interface";

export class CapabilityManager {

    private readonly capabilities = new Map<string, Capability>();

    /**
     * Register a capability.
     */
    public register(capability: Capability): void {

        if (this.capabilities.has(capability.id)) {

            throw new Error(
                `Capability "${capability.id}" is already registered.`
            );

        }

        this.capabilities.set(
            capability.id,
            capability
        );

    }

    /**
     * Resolve a capability.
     */
    public resolve<T extends Capability>(
        id: string
    ): T {

        const capability = this.capabilities.get(id);

        if (!capability) {

            throw new Error(
                `Unknown capability "${id}".`
            );

        }

        return capability as T;

    }

    /**
     * Returns all registered capabilities.
     */
    public getAll(): readonly Capability[] {

        return [...this.capabilities.values()];

    }

    /**
     * Initialize every capability.
     */
    public async initialize(): Promise<void> {

        for (const capability of this.capabilities.values()) {

            await capability.initialize();

        }

    }

    /**
     * Shutdown every capability.
     */
    public async shutdown(): Promise<void> {

        const capabilities =
            [...this.capabilities.values()].reverse();

        for (const capability of capabilities) {

            await capability.dispose();

        }

    }

}