/*
===============================================================================

                            PROJECT PHOENIX

===============================================================================

Component...........: EventBus

Architecture Layer..: Framework Core

Module..............: Event System

Module ID...........: LOL-MOD-EVT-0006

LOL-ID..............: LOL-FRM-EVT-0002

File................: event-bus.ts

Location............
Library Of Legends/src/framework/event-system/src/

Version.............: 1.0.0

Status..............: Draft

Lifecycle...........: Development

Description.........

Provides the central event dispatcher responsible for registering event
listeners, publishing events and delivering them to subscribers.

===============================================================================

Responsibilities

• Register listeners
• Remove listeners
• Publish events
• Dispatch events
• Maintain deterministic execution order

===============================================================================

Design Decisions

• Generic type-safe API
• Listener order preserved
• Async event dispatch
• Framework-wide compatibility
• Easy extensibility

===============================================================================

Future Extensions

• Event priorities
• Wildcard subscriptions
• Middleware pipeline
• Event replay
• Distributed transport

===============================================================================
*/

import type { Event } from "./event";
import type { EventListener } from "./event-listener";

/**
 * Central event dispatcher.
 */
export class EventBus {

    private readonly listeners = new Map<
        string,
        EventListener[]
    >();

    /**
     * Registers an event listener.
     */
    public subscribe(
        eventName: string,
        listener: EventListener
    ): void {

        const listeners = this.listeners.get(eventName) ?? [];

        listeners.push(listener);

        this.listeners.set(eventName, listeners);

    }

    /**
     * Removes an event listener.
     */
    public unsubscribe(
        eventName: string,
        listener: EventListener
    ): void {

        const listeners = this.listeners.get(eventName);

        if (!listeners) {

            return;

        }

        this.listeners.set(

            eventName,

            listeners.filter(

                registered => registered !== listener

            )

        );

    }

    /**
     * Publishes an event.
     */
    public async publish(
        event: Event
    ): Promise<void> {

        const listeners = this.listeners.get(event.name);

        if (!listeners) {

            return;

        }

        for (const listener of listeners) {

            await listener.handle(event);

        }

    }

    /**
     * Returns whether listeners exist.
     */
    public hasListeners(
        eventName: string
    ): boolean {

        return (this.listeners.get(eventName)?.length ?? 0) > 0;

    }

}