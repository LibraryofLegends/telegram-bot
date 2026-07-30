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
 * ║ Datei        : ServiceDefinition.js                                    ║
 * ║ Klasse       : ServiceDefinition                                       ║
 * ║ ID           : LLF-DI-0002                                             ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Beschreibung:                                                          ║
 * ║                                                                        ║
 * ║ Beschreibt einen einzelnen Dienst innerhalb des Dependency            ║
 * ║ Injection Containers.                                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import Lifetime from './Lifetime.js';

/**
 * Repräsentiert die Definition eines Dienstes.
 */
export default class ServiceDefinition {

    /**
     * Dienstkennung.
     *
     * @type {string}
     */
    #identifier;

    /**
     * Implementierung.
     *
     * @type {*}
     */
    #implementation;

    /**
     * Lebensdauer des Dienstes.
     *
     * @type {string}
     */
    #lifetime;

    /**
     * Gespeicherte Singleton-Instanz.
     *
     * @type {*|null}
     */
    #instance;

    /**
     * Erstellt eine neue ServiceDefinition.
     *
     * @param {string} identifier
     * @param {*} implementation
     * @param {string} lifetime
     */
    constructor(
        identifier,
        implementation,
        lifetime = Lifetime.TRANSIENT
    ) {

        this.#identifier = identifier;
        this.#implementation = implementation;
        this.#lifetime = lifetime;

        this.#instance = null;

    }

    /**
     * Dienstkennung.
     *
     * @returns {string}
     */
    get identifier() {

        return this.#identifier;

    }

    /**
     * Implementierung.
     *
     * @returns {*}
     */
    get implementation() {

        return this.#implementation;

    }

    /**
     * Lebensdauer.
     *
     * @returns {string}
     */
    get lifetime() {

        return this.#lifetime;

    }

    /**
     * Singleton-Instanz.
     *
     * @returns {*|null}
     */
    get instance() {

        return this.#instance;

    }

    /**
     * Speichert die Singleton-Instanz.
     *
     * @param {*} instance
     *
     * @returns {ServiceDefinition}
     */
    setInstance(instance) {

        this.#instance = instance;

        return this;

    }

    /**
     * Prüft, ob bereits eine Instanz existiert.
     *
     * @returns {boolean}
     */
    hasInstance() {

        return this.#instance !== null;

    }

    /**
     * Exportiert die Definition.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            identifier: this.#identifier,
            lifetime: this.#lifetime,
            instantiated: this.hasInstance()

        };

    }

}