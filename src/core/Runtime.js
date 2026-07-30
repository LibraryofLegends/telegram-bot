/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : Core Foundation                                         ║
 * ║ Paket        : 01                                                      ║
 * ║ Datei        : Runtime.js                                              ║
 * ║ Klasse       : Runtime                                                 ║
 * ║ ID           : LLF-CORE-0003                                           ║
 * ║ Datei-Version: 2.0.0                                                   ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Beschreibung:                                                          ║
 * ║                                                                        ║
 * ║ Verwaltet den aktuellen Laufzeitzustand des Frameworks.                ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

 /**
  * Repräsentiert die Laufzeitumgebung des Frameworks.
  */
export default class Runtime {

    /**
     * Aktueller Status.
     *
     * @type {string}
     */
    #state;

    /**
     * Startzeitpunkt.
     *
     * @type {Date|null}
     */
    #startedAt;

    /**
     * Endzeitpunkt.
     *
     * @type {Date|null}
     */
    #stoppedAt;

    /**
     * Erstellt eine neue Runtime.
     */
    constructor() {

        this.#state = 'created';
        this.#startedAt = null;
        this.#stoppedAt = null;

    }

    /**
     * Aktueller Runtime-Status.
     *
     * @returns {string}
     */
    get state() {

        return this.#state;

    }

    /**
     * Startzeitpunkt.
     *
     * @returns {Date|null}
     */
    get startedAt() {

        return this.#startedAt;

    }

    /**
     * Endzeitpunkt.
     *
     * @returns {Date|null}
     */
    get stoppedAt() {

        return this.#stoppedAt;

    }

    /**
     * Prüft, ob die Runtime läuft.
     *
     * @returns {boolean}
     */
    get running() {

        return this.#state === 'running';

    }

    /**
     * Startet die Runtime.
     *
     * @returns {Runtime}
     */
    start() {

        if (this.running) {

            return this;

        }

        this.#state = 'running';
        this.#startedAt = new Date();
        this.#stoppedAt = null;

        return this;

    }

    /**
     * Stoppt die Runtime.
     *
     * @returns {Runtime}
     */
    stop() {

        if (!this.running) {

            return this;

        }

        this.#state = 'stopped';
        this.#stoppedAt = new Date();

        return this;

    }

    /**
     * Setzt die Runtime zurück.
     *
     * @returns {Runtime}
     */
    reset() {

        this.#state = 'created';
        this.#startedAt = null;
        this.#stoppedAt = null;

        return this;

    }

    /**
     * Gibt sämtliche Runtime-Informationen zurück.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            state: this.#state,
            running: this.running,
            startedAt: this.#startedAt,
            stoppedAt: this.#stoppedAt

        };

    }

}