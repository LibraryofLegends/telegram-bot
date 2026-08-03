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

Component...........: Capability Interface

LOL-ID..............: LOL-CAPABILITY-0001

File................: capability.interface.ts

Location............: src/kernel/capabilities/capability.interface.ts

Dependencies........: None

Dependents..........:
- Capability Registry
- Metadata
- Search
- Artwork
- AI
- Storage
- Messaging

Stability...........: Stable

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Base contract for every capability provided by LOAF.

A capability defines WHAT the platform can do.

It does not define HOW it is implemented.

Concrete implementations are provided by one or more providers.

===============================================================================
*/

export interface Capability {

    /**
     * Unique capability identifier.
     */
    readonly id: string;

    /**
     * Human readable capability name.
     */
    readonly name: string;

    /**
     * Semantic version.
     */
    readonly version: string;

    /**
     * Short description.
     */
    readonly description: string;

    /**
     * Initializes the capability.
     */
    initialize(): Promise<void>;

    /**
     * Disposes the capability.
     */
    dispose(): Promise<void>;

}