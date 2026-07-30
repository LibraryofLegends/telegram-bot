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
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Beschreibung:                                                          ║
 * ║                                                                        ║
 * ║ Verwaltet den Lebenszyklus des Frameworks und bildet den zentralen     ║
 * ║ Einstiegspunkt für alle zukünftigen Framework-Komponenten.             ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import Framework from './Framework.js';
import Runtime from './Runtime.js';

/**
 * Zentrale Kernel-Klasse des Frameworks.
 */
export default class Kernel {

    /**
     * Erstellt einen neuen Kernel.
     */
    constructor() {

        /**
         * Framework-Instanz.
         *
         * @type {Framework}
         */
        this.framework = new Framework();

        /**
         * Runtime-Instanz.
         *
         * @type {Runtime}
         */
        this.runtime = new Runtime();

    }

    /**
     * Startet den Kernel.
     *
     * @returns {Kernel}
     */
    boot() {

        this.framework.boot();

        this.runtime.start();

        return this;

    }

    /**
     * Beendet den Kernel.
     *
     * @returns {Kernel}
     */
    shutdown() {

        this.runtime.stop();

        this.framework.shutdown();

        return this;

    }

    /**
     * Startet den Kernel neu.
     *
     * @returns {Kernel}
     */
    restart() {

        this.shutdown();

        this.boot();

        return this;

    }

    /**
     * Gibt die Framework-Instanz zurück.
     *
     * @returns {Framework}
     */
    getFramework() {

        return this.framework;

    }

    /**
     * Gibt die Runtime-Instanz zurück.
     *
     * @returns {Runtime}
     */
    getRuntime() {

        return this.runtime;

    }

    /**
     * Prüft, ob der Kernel vollständig gestartet wurde.
     *
     * @returns {boolean}
     */
    isRunning() {

        return this.framework.isBooted() && this.runtime.isRunning();

    }

    /**
     * Gibt Informationen über den Kernel zurück.
     *
     * @returns {Object}
     */
    getInformation() {

        return {

            framework: this.framework.getInformation(),
            runtime: this.runtime.getInformation(),
            running: this.isRunning()

        };

    }

}