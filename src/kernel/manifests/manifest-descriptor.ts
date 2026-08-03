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
Subsystem...........: Manifest System

Module..............: Kernel
Package.............: Manifests

Component...........: Manifest Descriptor

LOL-ID..............: LOL-KERNEL-0010

File................: manifest-descriptor.ts

Location............: src/kernel/manifests/

Dependencies........: None

Dependents..........:
- Manifest Loader
- Capability Registry
- Provider Registry
- Plugin Manager
- Runtime

Stability...........: Stable

License.............: MIT

===============================================================================
DESCRIPTION
-------------------------------------------------------------------------------

Canonical description of every manifest understood by LOAF.

Every manifest type extends this base descriptor.

===============================================================================
*/

export enum ManifestType {

    APPLICATION = "application",

    CAPABILITY = "capability",

    PROVIDER = "provider",

    PLUGIN = "plugin",

    MODULE = "module"

}

export interface ManifestDependency {

    id: string;

    version?: string;

    optional?: boolean;

}

export interface ManifestDescriptor {

    /**
     * Unique identifier.
     */
    id: string;

    /**
     * Manifest type.
     */
    type: ManifestType;

    /**
     * Display name.
     */
    name: string;

    /**
     * Semantic version.
     */
    version: string;

    /**
     * Description.
     */
    description?: string;

    /**
     * Author.
     */
    author?: string;

    /**
     * License.
     */
    license?: string;

    /**
     * Dependencies.
     */
    dependencies?: ManifestDependency[];

    /**
     * Custom metadata.
     */
    metadata?: Record<string, unknown>;

}