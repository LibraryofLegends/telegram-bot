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
 * ║ Datei        : EventCollection.js                                      ║
 * ║ Klasse       : EventCollection                                         ║
 * ║ ID           : LLF-EVENT-0004                                          ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import EventListener from './EventListener.js';
import EventPriority from './EventPriority.js';

/**
 * Verwaltet EventListener.
 */
export default class EventCollection {

    /**
     * Registrierte Listener.
     *
     * @type {EventListener[]}
     */
    #listeners;

    /**
     * Erstellt eine neue Collection.
     */
    constructor() {

        this.#listeners = [];

    }

    /**
     * Anzahl registrierter Listener.
     *
     * @returns {number}
     */
    get size() {

        return this.#listeners.length;

    }

    /**
     * Registriert einen Listener.
     *
     * @param {EventListener} listener
     *
     * @returns {EventCollection}
     */
    add(listener) {

        if (!(listener instanceof EventListener)) {

            throw new TypeError(
                'The listener must be an instance of EventListener.'
            );

        }

        this.#listeners.push(listener);

        this.#sort();

        return this;

    }

    /**
     * Entfernt einen Listener.
     *
     * @param {EventListener} listener
     *
     * @returns {boolean}
     */
    remove(listener) {

        const index = this.#listeners.indexOf(listener);

        if (index === -1) {

            return false;

        }

        this.#listeners.splice(index, 1);

        return true;

    }

    /**
     * Entfernt alle Listener.
     *
     * @returns {EventCollection}
     */
    clear() {

        this.#listeners.length = 0;

        return this;

    }

    /**
     * Prüft, ob Listener vorhanden sind.
     *
     * @returns {boolean}
     */
    isEmpty() {

        return this.#listeners.length === 0;

    }

    /**
     * Liefert alle Listener.
     *
     * @returns {EventListener[]}
     */
    all() {

        return [...this.#listeners];

    }

    /**
     * Sortiert Listener nach Priorität.
     *
     * @returns {void}
     */
    #sort() {

        this.#listeners.sort((left, right) =>

            EventPriority.compare(
                left.priority,
                right.priority
            )

        );

    }

    /**
     * Exportiert die Collection.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            size: this.size,
            listeners: this.#listeners.map(listener => listener.toJSON())

        };

    }

}