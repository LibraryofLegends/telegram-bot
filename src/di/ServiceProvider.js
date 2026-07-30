/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : Dependency Injection                                    ║
 * ║ Paket        : 02                                                      ║
 * ║ Datei        : ServiceProvider.js                                      ║
 * ║ Klasse       : ServiceProvider                                         ║
 * ║ ID           : LLF-DI-0006                                             ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Beschreibung:                                                          ║
 * ║                                                                        ║
 * ║ Basisklasse für sämtliche Service Provider des Frameworks.             ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import ServiceContainer from './ServiceContainer.js';

/**
 * Basisklasse aller Service Provider.
 */
export default class ServiceProvider {

    /**
     * Zugehöriger ServiceContainer.
     *
     * @type {ServiceContainer}
     */
    #container;

    /**
     * Registrierungsstatus.
     *
     * @type {boolean}
     */
    #registered;

    /**
     * Bootstatus.
     *
     * @type {boolean}
     */
    #booted;

    /**
     * Erstellt einen neuen ServiceProvider.
     *
     * @param {ServiceContainer} container
     */
    constructor(container) {

        if (!(container instanceof ServiceContainer)) {

            throw new TypeError(
                'The container must be an instance of ServiceContainer.'
            );

        }

        this.#container = container;

        this.#registered = false;
        this.#booted = false;

    }

    /**
     * ServiceContainer.
     *
     * @returns {ServiceContainer}
     */
    get container() {

        return this.#container;

    }

    /**
     * Registrierungsstatus.
     *
     * @returns {boolean}
     */
    get registered() {

        return this.#registered;

    }

    /**
     * Bootstatus.
     *
     * @returns {boolean}
     */
    get booted() {

        return this.#booted;

    }

    /**
     * Registriert Dienste.
     *
     * Diese Methode wird von erbenden Klassen überschrieben.
     *
     * @returns {ServiceProvider}
     */
    register() {

        this.#registered = true;

        return this;

    }

    /**
     * Startet den Provider.
     *
     * Diese Methode wird von erbenden Klassen überschrieben.
     *
     * @returns {ServiceProvider}
     */
    boot() {

        this.#booted = true;

        return this;

    }

    /**
     * Beendet den Provider.
     *
     * @returns {ServiceProvider}
     */
    shutdown() {

        this.#booted = false;

        return this;

    }

    /**
     * Exportiert den aktuellen Status.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            provider: this.constructor.name,
            registered: this.#registered,
            booted: this.#booted

        };

    }

}