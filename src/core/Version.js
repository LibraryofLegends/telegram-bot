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
 * ║ Datei        : Version.js                                              ║
 * ║ Klasse       : Version                                                 ║
 * ║ ID           : LLF-CORE-0001                                           ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Beschreibung:                                                          ║
 * ║                                                                        ║
 * ║ Verwaltet sämtliche Versionsinformationen des Frameworks und stellt    ║
 * ║ diese zentral allen Komponenten zur Verfügung.                         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

export default class Version {

    /**
     * Hauptversion des Frameworks.
     *
     * @type {number}
     */
    static MAJOR = 0;

    /**
     * Nebenversion des Frameworks.
     *
     * @type {number}
     */
    static MINOR = 1;

    /**
     * Patch-Version des Frameworks.
     *
     * @type {number}
     */
    static PATCH = 0;

    /**
     * Codename der aktuellen Version.
     *
     * @type {string}
     */
    static CODENAME = 'Foundation';

    /**
     * Vollständiger Name des Frameworks.
     *
     * @type {string}
     */
    static NAME = 'Library Of Legends Framework';

    /**
     * Kurzname des Frameworks.
     *
     * @type {string}
     */
    static SHORT_NAME = 'LLF';

    /**
     * Gibt die Versionsnummer zurück.
     *
     * @returns {string}
     */
    static get version() {

        return `${this.MAJOR}.${this.MINOR}.${this.PATCH}`;

    }

    /**
     * Gibt die vollständige Versionsnummer zurück.
     *
     * @returns {string}
     */
    static get fullVersion() {

        return `v${this.version}`;

    }

    /**
     * Gibt den vollständigen Framework-Namen zurück.
     *
     * @returns {string}
     */
    static get framework() {

        return `${this.NAME} ${this.fullVersion}`;

    }

    /**
     * Gibt sämtliche Versionsinformationen als Objekt zurück.
     *
     * @returns {Object}
     */
    static toJSON() {

        return {

            name: this.NAME,
            shortName: this.SHORT_NAME,
            version: this.version,
            fullVersion: this.fullVersion,
            codename: this.CODENAME

        };

    }

}