/*
===============================================================================
██╗     ██╗██████╗ ██████╗  █████╗ ██████╗ ██╗   ██╗
██║     ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝
██║     ██║██████╔╝██████╔╝███████║██████╔╝ ╚████╔╝
██║     ██║██╔══██╗██╔══██╗██╔══██║██╔══██╗  ╚██╔╝
███████╗██║██████╔╝██║  ██║██║  ██║██║  ██║   ██║
╚══════╝╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝

                         LOAF
      Library Of Legends Application Framework

===============================================================================

Architecture Layer..: Foundation
Subsystem...........: Manifest System

Module..............: Kernel
Package.............: Manifest Loader

Component...........: Manifest Loader

LOL-ID..............: LOL-KERNEL-0009

File................: manifest-loader.ts

Location............: src/kernel/manifests/

Dependencies........:
- Manifest Descriptor

Dependents..........:
- Kernel
- Runtime
- Capability Registry
- Provider Registry
- Plugin Manager

Stability...........: Stable

License.............: MIT

===============================================================================

DESCRIPTION

Discovers and loads every manifest available to the framework.

The loader itself does NOT interpret manifests.

Its only responsibility is discovery and loading.

===============================================================================
*/

export interface Manifest {

    id: string;

    type: string;

    version: string;

    name: string;

}

export class ManifestLoader {

    /**
     * Loads every manifest.
     */
    public async load(): Promise<Manifest[]> {

        // TODO:
        // Scan manifest directories
        // Parse JSON
        // Validate schema
        // Return descriptors

        return [];

    }

}