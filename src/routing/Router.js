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
 * ║ Datei-Version: 1.1.0                                                   ║
 * ║ Teil         : 1 / 2                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import RouteCollection from "./RouteCollection.js";
import RouteMatcher from "./RouteMatcher.js";

/**
 * Zentraler Einstiegspunkt des Routing-Systems.
 *
 * Der Router besitzt ausschließlich koordinierende Aufgaben.
 * Das eigentliche Matching wird vollständig an den
 * RouteMatcher delegiert.
 */
export default class Router {

    /**
     * Registrierte Routen.
     *
     * @type {RouteCollection}
     */
    #routes;

    /**
     * Zuständige Matching-Komponente.
     *
     * @type {RouteMatcher}
     */
    #matcher;

    /**
     * Erstellt einen neuen Router.
     *
     * @param {RouteCollection} [routes=new RouteCollection()]
     * @param {RouteMatcher} [matcher=new RouteMatcher()]
     */
    constructor(

        routes = new RouteCollection(),

        matcher = new RouteMatcher()

    ) {

        if (!(routes instanceof RouteCollection)) {

            throw new TypeError(
                "The routes argument must be an instance of RouteCollection."
            );

        }

        if (!(matcher instanceof RouteMatcher)) {

            throw new TypeError(
                "The matcher argument must be an instance of RouteMatcher."
            );

        }

        this.#routes = routes;

        this.#matcher = matcher;

    }

    /**
     * Liefert die registrierten Routen.
     *
     * @returns {RouteCollection}
     */
    get routes() {

        return this.#routes;

    }

    /**
     * Liefert den verwendeten Matcher.
     *
     * @returns {RouteMatcher}
     */
    get matcher() {

        return this.#matcher;

    }

    /**
     * Führt den Routing-Vorgang aus.
     *
     * Der Router delegiert das Matching vollständig
     * an den RouteMatcher.
     *
     * @param {string} method
     * @param {string} path
     *
     * @returns {RouteResult}
     */
    dispatch(method, path) {

        return this.#matcher.match(

            this.#routes,

            method,

            path

        );

    }

    /**
     * Prüft, ob eine passende Route existiert.
     *
     * @param {string} method
     * @param {string} path
     *
     * @returns {boolean}
     */
    has(method, path) {

        return this
            .dispatch(method, path)
            .isMatched();

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