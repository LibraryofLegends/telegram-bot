/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : Routing System                                          ║
 * ║ Paket        : 09                                                      ║
 * ║ Datei        : Router.js                                               ║
 * ║ Klasse       : Router                                                  ║
 * ║ ID           : LLF-ROUTING-0009                                        ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import RouteCollection from './RouteCollection.js';
import RouteMatcher from './RouteMatcher.js';
import RouteResult from './RouteResult.js';

export default class Router {

    /**
     * Registrierte Routen.
     *
     * @type {RouteCollection}
     */
    #routes;

    /**
     * Matching-Komponente.
     *
     * @type {RouteMatcher}
     */
    #matcher;

    /**
     * Erstellt einen Router.
     *
     * @param {RouteCollection} routes
     * @param {RouteMatcher} matcher
     */
    constructor(
        routes = new RouteCollection(),
        matcher = new RouteMatcher()
    ) {

        if (!(routes instanceof RouteCollection)) {

            throw new TypeError(
                'The routes argument must be a RouteCollection.'
            );

        }

        if (!(matcher instanceof RouteMatcher)) {

            throw new TypeError(
                'The matcher argument must be an instance of RouteMatcher.'
            );

        }

        this.#routes = routes;
        this.#matcher = matcher;

    }

    /**
     * Liefert die RouteCollection.
     *
     * @returns {RouteCollection}
     */
    get routes() {

        return this.#routes;

    }

    /**
     * Liefert den RouteMatcher.
     *
     * @returns {RouteMatcher}
     */
    get matcher() {

        return this.#matcher;

    }

    /**
     * Führt das Routing aus.
     *
     * @param {string} method
     * @param {string} path
     *
     * @returns {RouteResult}
     */
    dispatch(method, path) {

        const result = this.#matcher.match(

            this.#routes,
            method,
            path

        );

        if (result instanceof RouteResult) {

            return result;

        }

        return new RouteResult({

            matched: true,

            route: result,

            status: 200,

            message: 'Route matched.'

        });

    }

    /**
     * Prüft, ob eine Route existiert.
     *
     * @param {string} method
     * @param {string} path
     *
     * @returns {boolean}
     */
    has(method, path) {

        return this.dispatch(

            method,
            path

        ).isMatched();

    }

    /**
     * Exportiert den Router.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            routes: this.#routes.toJSON()

        };

    }

}