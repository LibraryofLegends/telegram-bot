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
 * ║ Datei-Version: 2.0.0                                                   ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Beschreibung:                                                          ║
 * ║                                                                        ║
 * ║ Repräsentiert die zentrale Framework-Instanz und stellt grundlegende   ║
 * ║ Informationen über das Framework bereit.                               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import Version from './Version.js';

/**
 * Repräsentiert eine Framework-Instanz.
 */
export default class Framework {

    /**
     * Name des Frameworks.
     *
     * @type {string}
     */
    #name;

    /**
     * Kurzname des Frameworks.
     *
     * @type {string}
     */
    #shortName;

    /**
     * Versionsnummer.
     *
     * @type {string}
     */
    #version;

    /**
     * Codename der aktuellen Version.
     *
     * @type {string}
     */
    #codename;

    /**
     * Gibt an, ob das Framework gestartet wurde.
     *
     * @type {boolean}
     */
    #booted;

    /**
     * Zeitpunkt des Frameworkstarts.
     *
     * @type {Date|null}
     */
    #startedAt;

    /**
     * Erstellt eine neue Framework-Instanz.
     */
    constructor() {

        this.#name = Version.NAME;
        this.#shortName = Version.SHORT_NAME;
        this.#version = Version.version;
        this.#codename = Version.CODENAME;

        this.#booted = false;
        this.#startedAt = null;

    }

    /**
     * Gibt den Frameworknamen zurück.
     *
     * @returns {string}
     */
    get name() {

        return this.#name;

    }

    /**
     * Gibt den Kurznamen zurück.
     *
     * @returns {string}
     */
    get shortName() {

        return this.#shortName;

    }

    /**
     * Gibt die aktuelle Version zurück.
     *
     * @returns {string}
     */
    get version() {

        return this.#version;

    }

    /**
     * Gibt den aktuellen Codenamen zurück.
     *
     * @returns {string}
     */
    get codename() {

        return this.#codename;

    }

    /**
     * Gibt den Startzeitpunkt zurück.
     *
     * @returns {Date|null}
     */
    get startedAt() {

        return this.#startedAt;

    }

    /**
     * Gibt zurück, ob das Framework gestartet wurde.
     *
     * @returns {boolean}
     */
    get booted() {

        return this.#booted;

    }

    /**
     * Markiert das Framework als gestartet.
     *
     * @returns {Framework}
     */
    boot() {

        if (this.#booted) {

            return this;

        }

        this.#booted = true;
        this.#startedAt = new Date();

        return this;

    }

    /**
     * Markiert das Framework als beendet.
     *
     * @returns {Framework}
     */
    shutdown() {

        this.#booted = false;
        this.#startedAt = null;

        return this;

    }

    /**
     * Gibt alle Frameworkinformationen zurück.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            name: this.#name,
            shortName: this.#shortName,
            version: this.#version,
            codename: this.#codename,
            booted: this.#booted,
            startedAt: this.#startedAt

        };

    }

}