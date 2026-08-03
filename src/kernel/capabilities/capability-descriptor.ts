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

Component...........: Capability Descriptor

LOL-ID..............: LOL-CAPABILITY-0003

File................: capability-descriptor.ts

Location............: src/kernel/capabilities/capability-descriptor.ts

Dependencies........: None

Dependents..........:
- Capability Manager
- Capability Registry
- Provider Manager
- Kernel

Stability...........: Stable

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Describes a capability independently from its implementation.

The descriptor contains metadata used for discovery, validation,
dependency resolution and lifecycle management.

===============================================================================
*/

/*
===============================================================================
CAPABILITY STABILITY
===============================================================================
*/

export enum CapabilityStability {

    EXPERIMENTAL = "experimental",

    DEVELOPMENT = "development",

    STABLE = "stable",

    DEPRECATED = "deprecated"

}

/*
===============================================================================
CAPABILITY DESCRIPTOR
===============================================================================
*/

export interface CapabilityDescriptor {

    /**
     * Unique identifier.
     */
    readonly id: string;

    /**
     * Display name.
     */
    readonly name: string;

    /**
     * Semantic version.
     */
    readonly version: string;

    /**
     * Description.
     */
    readonly description: string;

    /**
     * Capability author.
     */
    readonly author: string;

    /**
     * Capability owner.
     */
    readonly owner?: string;

    /**
     * Stability level.
     */
    readonly stability: CapabilityStability;

    /**
     * Whether this capability is mandatory.
     */
    readonly required: boolean;

    /**
     * Dependency identifiers.
     */
    readonly dependencies: readonly string[];

    /**
     * Supported providers.
     */
    readonly providers: readonly string[];

    /**
     * Capability tags.
     */
    readonly tags: readonly string[];

}