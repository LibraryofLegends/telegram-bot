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

Component...........: Event Bus

LOL-ID..............: LOL-KERNEL-0005

File................: event-bus.ts

Location............: src/kernel/events/event-bus.ts

Dependencies........: None

Dependents..........:
- Import Pipeline
- Metadata Engine
- Plugin System
- Search
- Telegram
- Statistics
- AI

Stability...........: Stable

License.............: MIT

===============================================================================
*/

export interface Event {

    readonly type: string;

    readonly timestamp: Date;

}

export type EventHandler<T extends Event> =
    (event: T) => Promise<void> | void;

export class EventBus {

    private readonly handlers =
        new Map<string, EventHandler<Event>[]>();

    /**
     * Subscribe to an event.
     */
    public subscribe<T extends Event>(
        eventType: string,
        handler: EventHandler<T>
    ): void {

        if (!this.handlers.has(eventType)) {

            this.handlers.set(eventType, []);

        }

        this.handlers
            .get(eventType)!
            .push(handler as EventHandler<Event>);

    }

    /**
     * Publish an event.
     */
    public async publish<T extends Event>(
        event: T
    ): Promise<void> {

        const handlers =
            this.handlers.get(event.type) ?? [];

        for (const handler of handlers) {

            await handler(event);

        }

    }

    /**
     * Remove all subscriptions.
     */
    public clear(): void {

        this.handlers.clear();

    }

}