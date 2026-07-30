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
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Beschreibung:                                                          ║
 * ║                                                                        ║
 * ║ Verwaltet den Laufzeitzustand des Frameworks und liefert               ║
 * ║ Informationen über den aktuellen Status der Anwendung.                 ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

 /**
  * Repräsentiert die aktuelle Laufzeit des Frameworks.
  */
export default class Runtime {

    /**
     * Erstellt eine neue Runtime.
     */
    constructor() {

        /**
         * Aktueller Status.
         *
         * @type {string}
         */
        this.state = 'created';

        /**
         * Zeitpunkt des Starts.
         *
         * @type {Date|null}
         */
        this.startedAt = null;

        /**
         * Zeitpunkt des Stopps.
         *
         * @type {Date|null}
         */
        this.stoppedAt = null;

    }

    /**
     * Startet die Runtime.
     *
     * @returns {Runtime}
     */
    start() {

        if (this.state === 'running') {

            return this;

        }

        this.state = 'running';
        this.startedAt = new Date();
        this.stoppedAt = null;

        return this;

    }

    /**
     * Stoppt die Runtime.
     *
     * @returns {Runtime}
     */
    stop() {

        if (this.state !== 'running') {

            return this;

        }

        this.state = 'stopped';
        this.stoppedAt = new Date();

        return this;

    }

    /**
     * Startet die Runtime erneut.
     *
     * @returns {Runtime}
     */
    restart() {

        this.stop();

        this.start();

        return this;

    }

    /**
     * Prüft, ob die Runtime aktiv ist.
     *
     * @returns {boolean}
     */
    isRunning() {

        return this.state === 'running';

    }

    /**
     * Gibt alle Runtime-Informationen zurück.
     *
     * @returns {Object}
     */
    getInformation() {

        return {

            state: this.state,
            startedAt: this.startedAt,
            stoppedAt: this.stoppedAt

        };

    }

}