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

Subsystem...........: Common

Module..............: Kernel

Package.............: Registry

Component...........: Registry Exception

LOL-ID..............: LOL-COMMON-0003

File................: registry.exception.ts

Location............: src/kernel/common/registry/

Dependencies........: None

Dependents..........:
- Abstract Registry
- Manifest Registry
- Capability Registry
- Provider Registry
- Plugin Registry
- Service Registry

Stability...........: Stable

License.............: MIT

===============================================================================

DESCRIPTION

Base exception used by every registry implementation.

All registry related exceptions derive from this class.

===============================================================================
*/

export class RegistryException extends Error {

    constructor(

        message: string,

        public readonly registry: string,

        public readonly itemId?: string

    ) {

        super(message);

        this.name = "RegistryException";

    }

}

/**
 * Thrown when an item already exists.
 */
export class DuplicateRegistrationException
    extends RegistryException {

    constructor(

        registry: string,

        itemId: string

    ) {

        super(

            `Item "${itemId}" is already registered.`,

            registry,

            itemId

        );

        this.name =

            "DuplicateRegistrationException";

    }

}

/**
 * Thrown when an item cannot be found.
 */
export class ItemNotFoundException
    extends RegistryException {

    constructor(

        registry: string,

        itemId: string

    ) {

        super(

            `Item "${itemId}" was not found.`,

            registry,

            itemId

        );

        this.name =

            "ItemNotFoundException";

    }

}