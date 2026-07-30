/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : Event System                                            ║
 * ║ Paket        : 03                                                      ║
 * ║ Datei        : EventDispatcher.js                                      ║
 * ║ Klasse       : EventDispatcher                                         ║
 * ║ ID           : LLF-EVENT-0005                                          ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import Event from './Event.js';
import EventListener from './EventListener.js';
import EventCollection from './EventCollection.js';

/**
 * Zentraler Event Dispatcher.
 */
export default class EventDispatcher {

    /**
     * Registrierte Events.
     *
     * @type {Map<string, EventCollection>}
     */
    #events;

    constructor() {

        this.#events = new Map();

    }

    /**
     * Registriert einen Listener.
     *
     * @param {string} eventName
     * @param {EventListener} listener
     *
     * @returns {EventDispatcher}
     */
    listen(eventName, listener) {

        if (!(listener instanceof EventListener)) {

            throw new TypeError(
                'The listener must be an EventListener.'
            );

        }

        if (!this.#events.has(eventName)) {

            this.#events.set(
                eventName,
                new EventCollection()
            );

        }

        this.#events
            .get(eventName)
            .add(listener);

        return this;

    }

    /**
     * Löst ein Event aus.
     *
     * @param {Event} event
     *
     * @returns {Event}
     */
    dispatch(event) {

        if (!(event instanceof Event)) {

            throw new TypeError(
                'The event must be an Event.'
            );

        }

        const collection = this.#events.get(event.name);

        if (!collection) {

            return event;

        }

        for (const listener of collection.all()) {

            if (!event.canPropagate()) {

                break;

            }

            listener.execute(event);

            if (listener.shouldRemove()) {

                collection.remove(listener);

            }

        }

        return event;

    }

    /**
     * Prüft, ob Listener existieren.
     *
     * @param {string} eventName
     *
     * @returns {boolean}
     */
    has(eventName) {

        return this.#events.has(eventName);

    }

    /**
     * Entfernt alle Listener eines Events.
     *
     * @param {string} eventName
     *
     * @returns {boolean}
     */
    clear(eventName) {

        return this.#events.delete(eventName);

    }

    /**
     * Entfernt sämtliche Listener.
     *
     * @returns {EventDispatcher}
     */
    flush() {

        this.#events.clear();

        return this;

    }

    /**
     * Exportiert den Dispatcher.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            registeredEvents: this.#events.size

        };

    }

}