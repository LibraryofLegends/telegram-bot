/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : Routing System                                          ║
 * ║ Paket        : 03                                                      ║
 * ║ Datei        : RouteDefinition.js                                      ║
 * ║ Klasse       : RouteDefinition                                         ║
 * ║ ID           : LLF-ROUTING-0003                                        ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import RouteMethod from './RouteMethod.js';

/**
 * Beschreibt eine Route.
 *
 * Diese Klasse enthält ausschließlich
 * statische Routendefinitionen.
 */
export default class RouteDefinition {

    #method;

    #path;

    #handler;

    #name;

    #middleware;

    #metadata;

    /**
     * Erstellt eine neue Routendefinition.
     *
     * @param {string} method
     * @param {string} path
     * @param {Function|string} handler
     * @param {string|null} name
     * @param {Array} middleware
     * @param {Object} metadata
     */
    constructor(
        method,
        path,
        handler,
        name = null,
        middleware = [],
        metadata = {}
    ) {

        this.#method = RouteMethod.validate(method);

        if (typeof path !== 'string' || path.trim() === '') {

            throw new TypeError(
                'The route path must be a non-empty string.'
            );

        }

        if (
            typeof handler !== 'function' &&
            typeof handler !== 'string'
        ) {

            throw new TypeError(
                'The handler must be a function or string.'
            );

        }

        this.#path = path.trim();
        this.#handler = handler;
        this.#name = name;
        this.#middleware = [...middleware];
        this.#metadata = { ...metadata };

        Object.freeze(this.#middleware);
        Object.freeze(this.#metadata);

        Object.freeze(this);

    }

    get method() {

        return this.#method;

    }

    get path() {

        return this.#path;

    }

    get handler() {

        return this.#handler;

    }

    get name() {

        return this.#name;

    }

    get middleware() {

        return this.#middleware;

    }

    get metadata() {

        return this.#metadata;

    }

    /**
     * Exportiert die Definition.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            method: this.#method,
            path: this.#path,
            handler: this.#handler,
            name: this.#name,
            middleware: this.#middleware,
            metadata: this.#metadata

        };

    }

}