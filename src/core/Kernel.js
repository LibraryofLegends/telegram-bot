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
 * ║ Datei        : Kernel.js                                               ║
 * ║ Klasse       : Kernel                                                  ║
 * ║ ID           : LLF-CORE-0004                                           ║
 * ║ Datei-Version: 2.0.0                                                   ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Beschreibung:                                                          ║
 * ║                                                                        ║
 * ║ Verwaltet den kompletten Lebenszyklus des Frameworks.                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import Framework from './Framework.js';
import Runtime from './Runtime.js';

/**
 * Kernklasse des Frameworks.
 */
export default class Kernel {

    /**
     * Framework-Instanz.
     *
     * @type {Framework}
     */
    #framework;

    /**
     * Runtime-Instanz.
     *
     * @type {Runtime}
     */
    #runtime;

    /**
     * Initialisierungsstatus.
     *
     * @type {boolean}
     */
    #initialized;

    /**
     * Erstellt einen neuen Kernel.
     */
    constructor() {

        this.#framework = new Framework();
        this.#runtime = new Runtime();

        this.#initialized = false;

    }

    /**
     * Framework-Instanz.
     *
     * @returns {Framework}
     */
    get framework() {

        return this.#framework;

    }

    /**
     * Runtime-Instanz.
     *
     * @returns {Runtime}
     */
    get runtime() {

        return this.#runtime;

    }

    /**
     * Initialisierungsstatus.
     *
     * @returns {boolean}
     */
    get initialized() {

        return this.#initialized;

    }

    /**
     * Initialisiert den Kernel.
     *
     * Diese Methode wird später erweitert und lädt
     * alle Framework-Module.
     *
     * @returns {Kernel}
     */
    initialize() {

        if (this.#initialized) {

            return this;

        }

        this.#initialized = true;

        return this;

    }

    /**
     * Startet das Framework.
     *
     * @returns {Kernel}
     */
    boot() {

        this.initialize();

        this.#framework.boot();

        this.#runtime.start();

        return this;

    }

    /**
     * Beendet das Framework.
     *
     * @returns {Kernel}
     */
    shutdown() {

        this.#runtime.stop();

        this.#framework.shutdown();

        return this;

    }

    /**
     * Startet das Framework neu.
     *
     * @returns {Kernel}
     */
    restart() {

        this.shutdown();

        this.boot();

        return this;

    }

    /**
     * Prüft, ob das Framework läuft.
     *
     * @returns {boolean}
     */
    isRunning() {

        return this.#framework.booted && this.#runtime.running;

    }

    /**
     * Gibt Informationen über den Kernel zurück.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            initialized: this.#initialized,
            running: this.isRunning(),
            framework: this.#framework.toJSON(),
            runtime: this.#runtime.toJSON()

        };

    }

}