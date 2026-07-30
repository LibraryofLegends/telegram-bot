/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : Routing System                                          ║
 * ║ Paket        : 06                                                      ║
 * ║ Datei        : RouteGroup.js                                           ║
 * ║ Klasse       : RouteGroup                                              ║
 * ║ ID           : LLF-ROUTING-0006                                        ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import RouteCollection from './RouteCollection.js';
import RouteDefinition from './RouteDefinition.js';
import Route from './Route.js';

export default class RouteGroup {

    #prefix;

    #middleware;

    #metadata;

    #routes;

    constructor(
        prefix = '',
        middleware = [],
        metadata = {}
    ) {

        this.#prefix = prefix;
        this.#middleware = [...middleware];
        this.#metadata = { ...metadata };
        this.#routes = new RouteCollection();

    }

    get prefix() {

        return this.#prefix;

    }

    get middleware() {

        return [...this.#middleware];

    }

    get metadata() {

        return { ...this.#metadata };

    }

    get routes() {

        return this.#routes;

    }

    /**
     * Registriert eine Route innerhalb der Gruppe.
     *
     * @param {RouteDefinition} definition
     *
     * @returns {Route}
     */
    add(definition) {

        if (!(definition instanceof RouteDefinition)) {

            throw new TypeError(
                'The definition must be an instance of RouteDefinition.'
            );

        }

        const route = new Route(
            new RouteDefinition(
                definition.method,
                this.#prefix + definition.path,
                definition.handler,
                definition.name,
                [
                    ...this.#middleware,
                    ...definition.middleware
                ],
                {
                    ...this.#metadata,
                    ...definition.metadata
                }
            )
        );

        this.#routes.add(route);

        return route;

    }

    /**
     * Exportiert die Gruppe.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            prefix: this.#prefix,

            middleware: [...this.#middleware],

            metadata: { ...this.#metadata },

            routes: this.#routes.toJSON()

        };

    }

}