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
Package.............: Runtime

Component...........: Application Kernel

LOL-ID..............: LOL-KERNEL-0002

File................: kernel.ts

Location............: src/kernel/kernel.ts

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Application Kernel.

Responsible for bootstrapping and coordinating the complete runtime.

The Kernel owns the application lifecycle but delegates all business
logic to plugins and services.

===============================================================================
*/

import { PluginManager } from "./plugin-manager";

export enum KernelState {

    CREATED,

    BOOTING,

    RUNNING,

    STOPPING,

    STOPPED

}

export class Kernel {

    private state = KernelState.CREATED;

    private readonly pluginManager =
        new PluginManager();

    /**
     * Current kernel state.
     */
    public getState(): KernelState {

        return this.state;

    }

    /**
     * Starts Project Phoenix.
     */
    public async boot(): Promise<void> {

        if (this.state !== KernelState.CREATED) {

            throw new Error(
                "Kernel already started."
            );

        }

        this.state = KernelState.BOOTING;

        console.log("");
        console.log("======================================");
        console.log("Project Phoenix");
        console.log("Kernel Boot");
        console.log("======================================");

        await this.pluginManager.initialize();

        this.state = KernelState.RUNNING;

        console.log("");
        console.log("Kernel running.");

    }

    /**
     * Stops Project Phoenix.
     */
    public async shutdown(): Promise<void> {

        if (this.state !== KernelState.RUNNING) {

            return;

        }

        this.state = KernelState.STOPPING;

        await this.pluginManager.shutdown();

        this.state = KernelState.STOPPED;

        console.log("");
        console.log("Kernel stopped.");

    }

    /**
     * Returns the Plugin Manager.
     */
    public plugins(): PluginManager {

        return this.pluginManager;

    }

}