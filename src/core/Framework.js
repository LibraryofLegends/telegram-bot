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
 * ║ Datei        : Framework.js                                            ║
 * ║ Klasse       : Framework                                               ║
 * ║ ID           : LLF-CORE-0002                                           ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Beschreibung:                                                          ║
 * ║                                                                        ║
 * ║ Repräsentiert die zentrale Instanz des Frameworks.                     ║
 * ║ Alle Kernkomponenten werden später über diese Klasse verwaltet.        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import Version from './Version.js';

/**
 * Zentrale Framework-Klasse.
 */
export default class Framework {

    /**
     * Erstellt eine neue Framework-Instanz.
     */
    constructor() {

        /**
         * Name des Frameworks.
         *
         * @type {string}
         */
        this.name = Version.NAME;

        /**
         * Aktuelle Framework-Version.
         *
         * @type {string}
         */
        this.version = Version.version;

        /**
         * Codename der aktuellen Version.
         *
         * @type {string}
         */
        this.codename = Version.CODENAME;

        /**
         * Gibt an, ob das Framework gestartet wurde.
         *
         * @type {boolean}
         */
        this.booted = false;

        /**
         * Startzeit des Frameworks.
         *
         * @type {Date|null}
         */
        this.startedAt = null;

    }

    /**
     * Startet das Framework.
     *
     * @returns {Framework}
     */
    boot() {

        if (this.booted) {

            return this;

        }

        this.booted = true;

        this.startedAt = new Date();

        return this;

    }

    /**
     * Beendet das Framework.
     *
     * @returns {Framework}
     */
    shutdown() {

        this.booted = false;

        this.startedAt = null;

        return this;

    }

    /**
     * Prüft, ob das Framework bereits gestartet wurde.
     *
     * @returns {boolean}
     */
    isBooted() {

        return this.booted;

    }

    /**
     * Gibt Informationen über die Framework-Instanz zurück.
     *
     * @returns {Object}
     */
    getInformation() {

        return {

            framework: this.name,
            version: this.version,
            codename: this.codename,
            booted: this.booted,
            startedAt: this.startedAt

        };

    }

}