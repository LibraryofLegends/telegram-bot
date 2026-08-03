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

Component...........: Manifest Validator

LOL-ID..............: LOL-KERNEL-0011

File................: manifest-validator.ts

Location............: src/kernel/manifests/

Dependencies........:
- manifest-descriptor.ts

Dependents..........:
- Manifest Loader
- Manifest Registry
- Kernel Bootstrap

Stability...........: Stable

License.............: MIT

===============================================================================
DESCRIPTION
-------------------------------------------------------------------------------

Validates manifest descriptors before they are accepted by the kernel.

This validator performs structural validation only.

Business rules are handled by specialized validators.

===============================================================================
*/

import {

    ManifestDescriptor

} from "./manifest-descriptor";

export interface ValidationResult {

    valid: boolean;

    errors: string[];

    warnings: string[];

}

export class ManifestValidator {

    /**
     * Validate manifest.
     */
    public validate(

        manifest: ManifestDescriptor

    ): ValidationResult {

        const errors: string[] = [];

        const warnings: string[] = [];

        if (!manifest.id?.trim()) {

            errors.push(

                "Manifest id is required."

            );

        }

        if (!manifest.name?.trim()) {

            errors.push(

                "Manifest name is required."

            );

        }

        if (!manifest.version?.trim()) {

            errors.push(

                "Manifest version is required."

            );

        }

        if (!manifest.type) {

            errors.push(

                "Manifest type is required."

            );

        }

        if (

            manifest.dependencies

        ) {

            for (

                const dependency

                of manifest.dependencies

            ) {

                if (

                    !dependency.id?.trim()

                ) {

                    errors.push(

                        "Dependency id is required."

                    );

                }

            }

        }

        return {

            valid: errors.length === 0,

            errors,

            warnings

        };

    }

}