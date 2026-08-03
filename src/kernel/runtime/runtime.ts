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

Subsystem...........: Runtime

Module..............: Kernel

Package.............: Runtime

Component...........: Runtime

LOL-ID..............: LOL-RUNTIME-0001

File................: runtime.ts

Location............: src/kernel/runtime/

Dependencies........:
- ServiceContainer
- EventBus
- PluginManager
- CapabilityManager
- ManifestRegistry

Dependents..........:
- Kernel
- Bootstrap
- Applications

Stability...........: Stable

License.............: MIT

===============================================================================

DESCRIPTION

Represents the active runtime environment of LOAF.

The Runtime coordinates all infrastructure services but contains
no business logic.

===============================================================================
*/

import { ServiceContainer } from "../container/service-container";
import { EventBus } from "../events/event-bus";
import { PluginManager } from "../plugin-manager";
import { CapabilityManager } from "../capabilities/capability-manager";
import { ManifestRegistry } from "../manifests/manifest-registry";

export class Runtime {

    constructor(

        public readonly services: ServiceContainer,

        public readonly events: EventBus,

        public readonly plugins: PluginManager,

        public readonly capabilities: CapabilityManager,

        public readonly manifests: ManifestRegistry

    ) {}

    /**
     * Initializes the runtime.
     */
    public async initialize(): Promise<void> {

        await this.capabilities.initialize();

        await this.plugins.initialize();

    }

    /**
     * Stops the runtime.
     */
    public async shutdown(): Promise<void> {

        await this.plugins.shutdown();

        await this.capabilities.shutdown();

    }

}