/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : Routing System                                          ║
 * ║ Paket        : 08                                                      ║
 * ║ Datei        : RouteResult.js                                          ║
 * ║ Klasse       : RouteResult                                             ║
 * ║ ID           : LLF-ROUTING-0008                                        ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import Route from "./Route.js";

export default class RouteResult {

    #matched;

    #route;

    #parameters;

    #status;

    #message;

    /**
     * Erstellt ein neues Matchergebnis.
     *
     * @param {Object} options
     */
    constructor({

        matched = false,

        route = null,

        parameters = {},

        status = 404,

        message = "Route not found."

    } = {}) {

        if (route !== null && !(route instanceof Route)) {

            throw new TypeError(
                "The route must be an instance of Route."
            );

        }

        this.#matched = Boolean(matched);

        this.#route = route;

        this.#parameters = { ...parameters };

        this.#status = status;

        this.#message = message;

        Object.freeze(this.#parameters);

        Object.freeze(this);

    }

    get matched() {

        return this.#matched;

    }

    get route() {

        return this.#route;

    }

    get parameters() {

        return this.#parameters;

    }

    get status() {

        return this.#status;

    }

    get message() {

        return this.#message;

    }

    /**
     * Prüft, ob eine Route gefunden wurde.
     *
     * @returns {boolean}
     */
    isMatched() {

        return this.#matched;

    }

    /**
     * Exportiert das Ergebnis.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            matched: this.#matched,

            status: this.#status,

            message: this.#message,

            parameters: this.#parameters,

            route: this.#route
                ? this.#route.toJSON()
                : null

        };

    }

}