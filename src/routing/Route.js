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
 * ║ Datei-Version: 1.1.0                                                   ║
 * ║ Teil         : 1 / 2                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import RouteDefinition from "./RouteDefinition.js";
import RouteParameter from "./RouteParameter.js";

/**
 * Repräsentiert eine registrierte Route zur Laufzeit.
 *
 * Die eigentliche Konfiguration befindet sich vollständig
 * innerhalb der RouteDefinition.
 *
 * Route dient ausschließlich als Laufzeitobjekt und verwaltet
 * zusätzliche Informationen wie Parameter oder zukünftige
 * Laufzeit-Metadaten.
 */
export default class Route {

    /**
     * Unveränderliche Routendefinition.
     *
     * @type {RouteDefinition}
     */
    #definition;

    /**
     * Registrierte Parameter.
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
                "The definition must be an instance of RouteDefinition."
            );

        }

        this.#definition = definition;
        this.#parameters = new Map();

    }

    /**
     * Liefert die Routendefinition.
     *
     * @returns {RouteDefinition}
     */
    get definition() {

        return this.#definition;

    }

    /**
     * Liefert die HTTP-Methode.
     *
     * @returns {string}
     */
    get method() {

        return this.#definition.method;

    }

    /**
     * Liefert den Routenpfad.
     *
     * @returns {string}
     */
    get path() {

        return this.#definition.path;

    }

    /**
     * Liefert den Handler.
     *
     * @returns {*}
     */
    get handler() {

        return this.#definition.handler;

    }

    /**
     * Liefert den Routennamen.
     *
     * @returns {string|null}
     */
    get name() {

        return this.#definition.name;

    }

    /**
     * Anzahl registrierter Parameter.
     *
     * @returns {number}
     */
    get parameterCount() {

        return this.#parameters.size;

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
                "The parameter must be an instance of RouteParameter."
            );

        }

        this.#parameters.set(

            parameter.name,

            parameter

        );

        return this;

    }

    /**
     * Entfernt einen Parameter.
     *
     * @param {string} name
     *
     * @returns {boolean}
     */
    removeParameter(name) {

        return this.#parameters.delete(name);

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
     * Liefert alle registrierten Parameter.
     *
     * @returns {RouteParameter[]}
     */
    getParameters() {

        return Array.from(

            this.#parameters.values()

        );

    }

    /**
     * Entfernt sämtliche Parameter.
     *
     * @returns {Route}
     */
    clearParameters() {

        this.#parameters.clear();

        return this;

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