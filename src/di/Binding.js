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
 * ║ Datei        : Binding.js                                              ║
 * ║ Klasse       : Binding                                                 ║
 * ║ ID           : LLF-DI-0004                                             ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Beschreibung:                                                          ║
 * ║                                                                        ║
 * ║ Verbindet eine Service-ID mit einer ServiceDefinition.                 ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import ServiceDefinition from './ServiceDefinition.js';

/**
 * Repräsentiert ein Binding innerhalb des ServiceContainers.
 */
export default class Binding {

    /**
     * Service-Identifier.
     *
     * @type {string}
     */
    #identifier;

    /**
     * Zugehörige Definition.
     *
     * @type {ServiceDefinition}
     */
    #definition;

    /**
     * Erstellt ein neues Binding.
     *
     * @param {string} identifier
     * @param {ServiceDefinition} definition
     */
    constructor(identifier, definition) {

        if (typeof identifier !== 'string' || identifier.trim() === '') {
            throw new TypeError(
                'The binding identifier must be a non-empty string.'
            );
        }

        if (!(definition instanceof ServiceDefinition)) {
            throw new TypeError(
                'The definition must be an instance of ServiceDefinition.'
            );
        }

        this.#identifier = identifier;
        this.#definition = definition;

    }

    /**
     * Liefert den Identifier.
     *
     * @returns {string}
     */
    get identifier() {

        return this.#identifier;

    }

    /**
     * Liefert die Definition.
     *
     * @returns {ServiceDefinition}
     */
    get definition() {

        return this.#definition;

    }

    /**
     * Aktualisiert die Definition.
     *
     * @param {ServiceDefinition} definition
     *
     * @returns {Binding}
     */
    setDefinition(definition) {

        if (!(definition instanceof ServiceDefinition)) {
            throw new TypeError(
                'The definition must be an instance of ServiceDefinition.'
            );
        }

        this.#definition = definition;

        return this;

    }

    /**
     * Exportiert das Binding.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            identifier: this.#identifier,
            definition: this.#definition.toJSON()

        };

    }

}