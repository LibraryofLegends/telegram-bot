/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/orm/events/EventDispatcher.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Zentraler Event Dispatcher.
 *
 * Verantwortlich für:
 *
 * - Event Listener
 * - Prioritäten
 * - Async Events
 * - Once Listener
 * - Wildcard Events
 * - Event Propagation
 *
 * ============================================================================
 */

'use strict';

class EventDispatcher {

    constructor() {

        /**
         * Eventname -> Listener[]
         */

        this.listeners = new Map();

    }

    /**
     * ------------------------------------------------------------------------
     * Listener registrieren
     * ------------------------------------------------------------------------
     */

    on(

        event,

        listener,

        priority = 0

    ) {

        if (

            typeof listener !== 'function'

        ) {

            throw new TypeError(

                'Listener muss eine Funktion sein.'

            );

        }

        if (

            !this.listeners.has(event)

        ) {

            this.listeners.set(

                event,

                []

            );

        }

        this.listeners.get(event).push({

            listener,

            priority,

            once: false

        });

        this.sort(event);

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Einmaliger Listener
     * ------------------------------------------------------------------------
     */

    once(

        event,

        listener,

        priority = 0

    ) {

        if (

            typeof listener !== 'function'

        ) {

            throw new TypeError(

                'Listener muss eine Funktion sein.'

            );

        }

        if (

            !this.listeners.has(event)

        ) {

            this.listeners.set(

                event,

                []

            );

        }

        this.listeners.get(event).push({

            listener,

            priority,

            once: true

        });

        this.sort(event);

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Listener entfernen
     * ------------------------------------------------------------------------
     */

    off(event, listener) {

        if (

            !this.listeners.has(event)

        ) {

            return this;

        }

        this.listeners.set(

            event,

            this.listeners

                .get(event)

                .filter(

                    item =>

                        item.listener !== listener

                )

        );

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Event auslösen
     * ------------------------------------------------------------------------
     */

    async dispatch(

        event,

        payload = null

    ) {

        const listeners = [

            ...(this.listeners.get(event) ?? []),

            ...(this.listeners.get('*') ?? [])

        ];

        for (

            const item

            of listeners

        ) {

            if (

                payload?.propagationStopped

            ) {

                break;

            }

            await item.listener(payload);

            if (

                item.once

            ) {

                this.off(

                    event,

                    item.listener

                );

            }

        }

        return payload;

    }

    /**
     * ------------------------------------------------------------------------
     * Alias
     * ------------------------------------------------------------------------
     */

    async emit(

        event,

        payload

    ) {

        return this.dispatch(

            event,

            payload

        );

    }

    /**
     * ------------------------------------------------------------------------
     * Prioritäten sortieren
     * ------------------------------------------------------------------------
     */

    sort(event) {

        const listeners =

            this.listeners.get(event);

        listeners.sort(

            (a, b) =>

                b.priority -

                a.priority

        );

    }

    /**
     * ------------------------------------------------------------------------
     * Listener abrufen
     * ------------------------------------------------------------------------
     */

    getListeners(

        event = null

    ) {

        if (

            event === null

        ) {

            return this.listeners;

        }

        return this.listeners.get(

            event

        ) ?? [];

    }

    /**
     * ------------------------------------------------------------------------
     * Existieren Listener?
     * ------------------------------------------------------------------------
     */

    has(event) {

        return this.listeners.has(

            event

        );

    }

    /**
     * ------------------------------------------------------------------------
     * Anzahl Listener
     * ------------------------------------------------------------------------
     */

    count(

        event = null

    ) {

        if (

            event === null

        ) {

            let total = 0;

            for (

                const listeners

                of this.listeners.values()

            ) {

                total += listeners.length;

            }

            return total;

        }

        return (

            this.listeners.get(event)

            ?.length ?? 0

        );

    }

    /**
     * ------------------------------------------------------------------------
     * Alle Listener entfernen
     * ------------------------------------------------------------------------
     */

    clear(

        event = null

    ) {

        if (

            event === null

        ) {

            this.listeners.clear();

        }

        else {

            this.listeners.delete(

                event

            );

        }

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Export
     * ------------------------------------------------------------------------
     */

    toJSON() {

        return {

            events:

                this.listeners.size,

            listeners:

                this.count()

        };

    }

}

module.exports = EventDispatcher;