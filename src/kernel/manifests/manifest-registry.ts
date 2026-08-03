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

Component...........: Manifest Registry

LOL-ID..............: LOL-KERNEL-0012

File................: manifest-registry.ts

Location............: src/kernel/manifests/

Dependencies........:
- manifest-descriptor.ts
- manifest-validator.ts

Dependents..........:
- Kernel Bootstrap
- Runtime
- Capability Manager
- Provider Manager
- Plugin Manager

Stability...........: Stable

License.............: MIT

===============================================================================
DESCRIPTION
-------------------------------------------------------------------------------

Central registry for every manifest loaded by LOAF.

The registry stores validated manifest descriptors and provides
query operations for the entire framework.

===============================================================================
*/

import {

    ManifestDescriptor,
    ManifestType

} from "./manifest-descriptor";

import {

    ManifestValidator

} from "./manifest-validator";

export class ManifestRegistry {

    private readonly validator =
        new ManifestValidator();

    private readonly manifests =
        new Map<string, ManifestDescriptor>();

    /**
     * Register a manifest.
     */
    public register(
        manifest: ManifestDescriptor
    ): void {

        const result =
            this.validator.validate(manifest);

        if (!result.valid) {

            throw new Error(

                result.errors.join("\n")

            );

        }

        if (this.manifests.has(manifest.id)) {

            throw new Error(

                `Manifest "${manifest.id}" already registered.`

            );

        }

        this.manifests.set(

            manifest.id,

            manifest

        );

    }

    /**
     * Returns a manifest by id.
     */
    public get(
        id: string
    ): ManifestDescriptor | undefined {

        return this.manifests.get(id);

    }

    /**
     * Returns all manifests.
     */
    public getAll(): readonly ManifestDescriptor[] {

        return [...this.manifests.values()];

    }

    /**
     * Returns manifests by type.
     */
    public getByType(
        type: ManifestType
    ): readonly ManifestDescriptor[] {

        return [...this.manifests.values()]

            .filter(

                manifest =>

                    manifest.type === type

            );

    }

    /**
     * Returns whether a manifest exists.
     */
    public has(
        id: string
    ): boolean {

        return this.manifests.has(id);

    }

    /**
     * Removes a manifest.
     */
    public unregister(
        id: string
    ): boolean {

        return this.manifests.delete(id);

    }

    /**
     * Clears the registry.
     */
    public clear(): void {

        this.manifests.clear();

    }

    /**
     * Returns the number of registered manifests.
     */
    public get size(): number {

        return this.manifests.size;

    }

}