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

Component...........: Event Dispatcher

LOL-ID..............: LOL-KERNEL-0006

File................: event-dispatcher.ts

Location............: src/kernel/events/event-dispatcher.ts

Dependencies........:
- EventBus

Dependents..........:
- Kernel
- Runtime
- Plugin System

Stability...........: Stable

License.............: MIT

-------------------------------------------------------------------------------
DESCRIPTION
-------------------------------------------------------------------------------

Coordinates event dispatching.

The dispatcher is responsible for forwarding events to the EventBus.

Future versions may support:

• Middleware
• Filtering
• Priorities
• Delayed Dispatch
• Scheduling
• Transactions
• Retry Policies
• Dead Letter Queue
• Event Metrics

===============================================================================
*/

import { EventBus, Event } from "./event-bus";

export class EventDispatcher {

    constructor(
        private readonly eventBus: EventBus
    ) {}

    /**
     * Dispatch an event.
     */
    public async dispatch(
        event: Event
    ): Promise<void> {

        await this.eventBus.publish(event);

    }

}