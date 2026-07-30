/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : Routing System                                          ║
 * ║ Paket        : 04                                                      ║
 * ║ Datei        : Route.js                                                ║
 * ║ Klasse       : Route                                                   ║
 * ║ ID           : LLF-ROUTING-0004                                        ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import RouteDefinition from './RouteDefinition.js';
import RouteParameter from './RouteParameter.js';

/**
 * Laufzeitrepräsentation einer Route.
 */
export default class Route {

    /**
     * Routendefinition.
     *
     * @type {RouteDefinition}
     */
    #definition;

    /**
     * Parameter.
     *
     * @type {Map<string, RouteParameter>}
     */
    #parameters;

    /**
     * Erstellt eine neue Route.
     *
     * @param {RouteDefinition} definition
     */
    constructor(definition) {

        if (!(definition instanceof RouteDefinition)) {

            throw new TypeError(
                'The definition must be an instance of RouteDefinition.'
            );

        }

        this.#definition = definition;
        this.#parameters = new Map();

    }

    get definition() {

        return this.#definition;

    }

    get method() {

        return this.#definition.method;

    }

    get path() {

        return this.#definition.path;

    }

    get handler() {

        return this.#definition.handler;

    }

    get name() {

        return this.#definition.name;

    }

    /**
     * Registriert einen Parameter.
     *
     * @param {RouteParameter} parameter
     *
     * @returns {Route}
     */
    addParameter(parameter) {

        if (!(parameter instanceof RouteParameter)) {

            throw new TypeError(
                'The parameter must be an instance of RouteParameter.'
            );

        }

        this.#parameters.set(
            parameter.name,
            parameter
        );

        return this;

    }

    /**
     * Liefert einen Parameter.
     *
     * @param {string} name
     *
     * @returns {RouteParameter|null}
     */
    getParameter(name) {

        return this.#parameters.get(name) ?? null;

    }

    /**
     * Prüft, ob ein Parameter existiert.
     *
     * @param {string} name
     *
     * @returns {boolean}
     */
    hasParameter(name) {

        return this.#parameters.has(name);

    }

    /**
     * Liefert alle Parameter.
     *
     * @returns {RouteParameter[]}
     */
    getParameters() {

        return Array.from(
            this.#parameters.values()
        );

    }

    /**
     * Exportiert die Route.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            definition: this.#definition.toJSON(),

            parameters: this
                .getParameters()
                .map(parameter => parameter.toJSON())

        };

    }

}