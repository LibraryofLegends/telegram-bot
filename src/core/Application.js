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
 * ║ Datei        : Application.js                                          ║
 * ║ Klasse       : Application                                             ║
 * ║ ID           : LLF-CORE-0005                                           ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Beschreibung:                                                          ║
 * ║                                                                        ║
 * ║ Öffentlicher Einstiegspunkt des Frameworks.                            ║
 * ║ Alle Framework-Funktionen werden später über diese Klasse              ║
 * ║ bereitgestellt.                                                        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import Kernel from './Kernel.js';

/**
 * Öffentliche Framework-API.
 */
export default class Application {

    /**
     * Kernel des Frameworks.
     *
     * @type {Kernel}
     */
    #kernel;

    /**
     * Erstellt eine neue Application.
     */
    constructor() {

        this.#kernel = new Kernel();

    }

    /**
     * Gibt den Kernel zurück.
     *
     * @returns {Kernel}
     */
    get kernel() {

        return this.#kernel;

    }

    /**
     * Startet die Anwendung.
     *
     * @returns {Application}
     */
    boot() {

        this.#kernel.boot();

        return this;

    }

    /**
     * Beendet die Anwendung.
     *
     * @returns {Application}
     */
    shutdown() {

        this.#kernel.shutdown();

        return this;

    }

    /**
     * Startet die Anwendung neu.
     *
     * @returns {Application}
     */
    restart() {

        this.#kernel.restart();

        return this;

    }

    /**
     * Prüft, ob die Anwendung läuft.
     *
     * @returns {boolean}
     */
    isRunning() {

        return this.#kernel.isRunning();

    }

    /**
     * Gibt Informationen über die Anwendung zurück.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            application: 'Library Of Legends Framework',
            kernel: this.#kernel.toJSON()

        };

    }

}