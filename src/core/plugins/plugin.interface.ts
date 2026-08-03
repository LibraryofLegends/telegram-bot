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

Module..............: Plugin System
Package.............: Core Plugins

Component...........: Plugin Interface

LOL-ID..............: LOL-PLUGIN-0001

File................: plugin.interface.ts

Location............: src/core/plugins/

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Defines the base contract for every Project Phoenix plugin.

Every plugin loaded by the system must implement this interface.

===============================================================================
*/

export interface Plugin {

    /**
     * Unique plugin identifier.
     */
    readonly id: string;

    /**
     * Human readable plugin name.
     */
    readonly name: string;

    /**
     * Plugin version.
     */
    readonly version: string;

    /**
     * Plugin author.
     */
    readonly author: string;

    /**
     * Plugin description.
     */
    readonly description: string;

    /**
     * Plugin execution priority.
     */
    readonly priority: number;

    /**
     * Enable plugin.
     */
    initialize(): Promise<void>;

    /**
     * Shutdown plugin.
     */
    shutdown(): Promise<void>;

}