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
 * ║ Datei        : EventListener.js                                        ║
 * ║ Klasse       : EventListener                                           ║
 * ║ ID           : LLF-EVENT-0003                                          ║
 * ║ Datei-Version: 1.0.1                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Beschreibung:                                                          ║
 * ║                                                                        ║
 * ║ Repräsentiert einen registrierten Event-Listener.                      ║
 * ║                                                                        ║
 * ║ Kapselt Callback, Priorität, Status und Laufzeitinformationen.         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import EventPriority from './EventPriority.js';

/**
 * Repräsentiert einen registrierten Listener.
 */
export default class EventListener {

    /**
     * Callback-Funktion.
     *
     * @type {Function}
     */
    #callback;

    /**
     * Priorität.
     *
     * @type {number}
     */
    #priority;

    /**
     * Einmalige Ausführung.
     *
     * @type {boolean}
     */
    #once;

    /**
     * Aktivierungsstatus.
     *
     * @type {boolean}
     */
    #enabled;

    /**
     * Anzahl der bisherigen Ausführungen.
     *
     * @type {number}
     */
    #executions;

    /**
     * Erstellt einen EventListener.
     *
     * @param {Function} callback
     * @param {number} priority
     * @param {boolean} once
     */
    constructor(
        callback,
        priority = EventPriority.NORMAL,
        once = false
    ) {

        if (typeof callback !== 'function') {
            throw new TypeError(
                'The callback must be a function.'
            );
        }

        EventPriority.validate(priority);

        this.#callback = callback;
        this.#priority = priority;
        this.#once = once;
        this.#enabled = true;
        this.#executions = 0;

    }

    get callback() {
        return this.#callback;
    }

    get priority() {
        return this.#priority;
    }

    get once() {
        return this.#once;
    }

    get enabled() {
        return this.#enabled;
    }

    get executions() {
        return this.#executions;
    }

    enable() {

        this.#enabled = true;

        return this;

    }

    disable() {

        this.#enabled = false;

        return this;

    }

    execute(event) {

        if (!this.#enabled) {
            return;
        }

        this.#executions++;

        return this.#callback(event);

    }

    shouldRemove() {

        return this.#once && this.#executions > 0;

    }

    toJSON() {

        return {

            priority: this.#priority,
            once: this.#once,
            enabled: this.#enabled,
            executions: this.#executions

        };

    }

}