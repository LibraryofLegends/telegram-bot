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
 * ║ Datei        : Event.js                                                ║
 * ║ Klasse       : Event                                                   ║
 * ║ ID           : LLF-EVENT-0001                                          ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Beschreibung:                                                          ║
 * ║                                                                        ║
 * ║ Basisklasse sämtlicher Framework-Events.                               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Basisklasse aller Framework-Events.
 */
export default class Event {

    /**
     * Eventname.
     *
     * @type {string}
     */
    #name;

    /**
     * Zeitpunkt der Erstellung.
     *
     * @type {Date}
     */
    #timestamp;

    /**
     * Wurde die Ausbreitung gestoppt?
     *
     * @type {boolean}
     */
    #propagationStopped;

    /**
     * Erstellt ein neues Event.
     *
     * @param {string} name
     */
    constructor(name) {

        if (typeof name !== 'string' || name.trim() === '') {

            throw new TypeError(
                'The event name must be a non-empty string.'
            );

        }

        this.#name = name;
        this.#timestamp = new Date();
        this.#propagationStopped = false;

    }

    /**
     * Eventname.
     *
     * @returns {string}
     */
    get name() {

        return this.#name;

    }

    /**
     * Erstellungszeitpunkt.
     *
     * @returns {Date}
     */
    get timestamp() {

        return this.#timestamp;

    }

    /**
     * Prüft, ob die Ausbreitung gestoppt wurde.
     *
     * @returns {boolean}
     */
    get propagationStopped() {

        return this.#propagationStopped;

    }

    /**
     * Stoppt die weitere Verarbeitung dieses Events.
     *
     * @returns {Event}
     */
    stopPropagation() {

        this.#propagationStopped = true;

        return this;

    }

    /**
     * Prüft, ob das Event weitergegeben werden darf.
     *
     * @returns {boolean}
     */
    canPropagate() {

        return !this.#propagationStopped;

    }

    /**
     * Exportiert das Event.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            name: this.#name,
            timestamp: this.#timestamp,
            propagationStopped: this.#propagationStopped

        };

    }

}