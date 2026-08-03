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

Subsystem...........: Event System

Module..............: Kernel

Package.............: Events

Component...........: Base Event

LOL-ID..............: LOL-KERNEL-0007

File................: event.ts

Location............: src/kernel/events/event.ts

Dependencies........: None

Dependents..........:
- EventBus
- EventDispatcher
- EventPipeline
- EventRegistry
- All Plugins

Stability...........: Stable

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Base event model used by every subsystem of Project Phoenix.

Every event in the application derives from this class.

===============================================================================
*/

/*
===============================================================================
IMPORTS
===============================================================================
*/

import { randomUUID } from "node:crypto";

/*
===============================================================================
BASE EVENT
===============================================================================
*/

export abstract class Event {

    /**
     * Unique event identifier.
     */
    public readonly id: string = randomUUID();

    /**
     * Event type.
     */
    public abstract readonly type: string;

    /**
     * Event creation timestamp.
     */
    public readonly timestamp: Date = new Date();

    /**
     * Event version.
     */
    public readonly version: number = 1;

    /**
     * Correlation identifier.
     *
     * Used to group related events.
     */
    public readonly correlationId?: string;

    /**
     * Event metadata.
     */
    public readonly metadata: Record<string, unknown>;

    protected constructor(options?: {

        correlationId?: string;

        metadata?: Record<string, unknown>;

    }) {

        this.correlationId = options?.correlationId;

        this.metadata = options?.metadata ?? {};

    }

}