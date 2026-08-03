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

Component...........: Runtime Interface

LOL-ID..............: LOL-KERNEL-0003

File................: runtime.interface.ts

Location............: src/kernel/runtime/runtime.interface.ts

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Defines the runtime contract for every Project Phoenix runtime.

A runtime represents the execution environment of the application.

Examples

• Telegram Runtime
• Web Runtime
• CLI Runtime
• Test Runtime
• Desktop Runtime

===============================================================================
*/

export interface Runtime {

    /**
     * Runtime identifier.
     */
    readonly id: string;

    /**
     * Runtime name.
     */
    readonly name: string;

    /**
     * Runtime version.
     */
    readonly version: string;

    /**
     * Initialize runtime.
     */
    initialize(): Promise<void>;

    /**
     * Start runtime.
     */
    start(): Promise<void>;

    /**
     * Stop runtime.
     */
    stop(): Promise<void>;

    /**
     * Dispose runtime.
     */
    dispose(): Promise<void>;

}