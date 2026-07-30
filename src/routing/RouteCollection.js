/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : Routing System                                          ║
 * ║ Paket        : 05                                                      ║
 * ║ Datei        : RouteCollection.js                                      ║
 * ║ Klasse       : RouteCollection                                         ║
 * ║ ID           : LLF-ROUTING-0005                                        ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import Route from './Route.js';

export default class RouteCollection {

    /**
     * Registrierte Routen.
     *
     * @type {Route[]}
     */
    #routes;

    /**
     * Erstellt eine neue Collection.
     */
    constructor() {

        this.#routes = [];

    }

    /**
     * Fügt eine Route hinzu.
     *
     * @param {Route} route
     *
     * @returns {RouteCollection}
     */
    add(route) {

        if (!(route instanceof Route)) {

            throw new TypeError(
                'The route must be an instance of Route.'
            );

        }

        this.#routes.push(route);

        return this;

    }

    /**
     * Entfernt alle Routen.
     *
     * @returns {RouteCollection}
     */
    clear() {

        this.#routes.length = 0;

        return this;

    }

    /**
     * Prüft, ob Routen vorhanden sind.
     *
     * @returns {boolean}
     */
    isEmpty() {

        return this.#routes.length === 0;

    }

    /**
     * Anzahl der Routen.
     *
     * @returns {number}
     */
    count() {

        return this.#routes.length;

    }

    /**
     * Liefert alle Routen.
     *
     * @returns {Route[]}
     */
    all() {

        return [...this.#routes];

    }

    /**
     * Findet eine Route anhand ihres Namens.
     *
     * @param {string} name
     *
     * @returns {Route|null}
     */
    findByName(name) {

        return this.#routes.find(

            route => route.name === name

        ) ?? null;

    }

    /**
     * Findet alle Routen einer HTTP-Methode.
     *
     * @param {string} method
     *
     * @returns {Route[]}
     */
    findByMethod(method) {

        return this.#routes.filter(

            route => route.method === method

        );

    }

    /**
     * Prüft, ob eine Route existiert.
     *
     * @param {string} name
     *
     * @returns {boolean}
     */
    has(name) {

        return this.findByName(name) !== null;

    }

    /**
     * Iterator-Unterstützung.
     */
    *[Symbol.iterator]() {

        for (const route of this.#routes) {

            yield route;

        }

    }

    /**
     * Exportiert die Collection.
     *
     * @returns {Object[]}
     */
    toJSON() {

        return this.#routes.map(

            route => route.toJSON()

        );

    }

}