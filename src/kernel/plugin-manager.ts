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

Module..............: Kernel
Package.............: Plugin System

Component...........: Plugin Manager

LOL-ID..............: LOL-KERNEL-0001

File................: plugin-manager.ts

Location............: src/kernel/plugin-manager.ts

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Central manager responsible for the complete lifecycle of all plugins.

Responsibilities

• Register plugins
• Initialize plugins
• Shutdown plugins
• Plugin lookup
• Dependency validation
• Plugin state management

===============================================================================
*/

import { Plugin } from "../core/plugins/plugin.interface";

export class PluginManager {

    private readonly plugins = new Map<string, Plugin>();

    /**
     * Register a plugin.
     */
    public register(plugin: Plugin): void {

        if (this.plugins.has(plugin.id)) {

            throw new Error(
                `Plugin "${plugin.id}" is already registered.`
            );

        }

        this.plugins.set(plugin.id, plugin);

    }

    /**
     * Returns a plugin by id.
     */
    public get(id: string): Plugin | undefined {

        return this.plugins.get(id);

    }

    /**
     * Returns all plugins.
     */
    public getAll(): readonly Plugin[] {

        return [...this.plugins.values()];

    }

    /**
     * Initialize all registered plugins.
     */
    public async initialize(): Promise<void> {

        const plugins = [...this.plugins.values()]

            .sort((a, b) => a.priority - b.priority);

        for (const plugin of plugins) {

            console.log(
                `[Kernel] Loading ${plugin.name} (${plugin.version})`
            );

            await plugin.initialize();

        }

    }

    /**
     * Shutdown all plugins.
     */
    public async shutdown(): Promise<void> {

        const plugins = [...this.plugins.values()]

            .sort((a, b) => b.priority - a.priority);

        for (const plugin of plugins) {

            console.log(
                `[Kernel] Stopping ${plugin.name}`
            );

            await plugin.shutdown();

        }

    }

}