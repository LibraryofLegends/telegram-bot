/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : Routing System                                          ║
 * ║ Paket        : 07                                                      ║
 * ║ Datei        : RouteMatcher.js                                         ║
 * ║ Klasse       : RouteMatcher                                            ║
 * ║ ID           : LLF-ROUTING-0007                                        ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import RouteCollection from './RouteCollection.js';

export default class RouteMatcher {

    /**
     * Durchsucht eine Collection nach einer Route.
     *
     * @param {RouteCollection} routes
     * @param {string} method
     * @param {string} path
     *
     * @returns {Route|null}
     */
    match(routes, method, path) {

        if (!(routes instanceof RouteCollection)) {

            throw new TypeError(
                'The routes argument must be a RouteCollection.'
            );

        }

        if (typeof method !== 'string') {

            throw new TypeError(
                'The HTTP method must be a string.'
            );

        }

        if (typeof path !== 'string') {

            throw new TypeError(
                'The route path must be a string.'
            );

        }

        const normalizedMethod = method.toUpperCase();

        for (const route of routes) {

            if (route.method !== normalizedMethod) {

                continue;

            }

            if (route.path === path) {

                return route;

            }

        }

        return null;

    }

    /**
     * Prüft, ob eine Route existiert.
     *
     * @param {RouteCollection} routes
     * @param {string} method
     * @param {string} path
     *
     * @returns {boolean}
     */
    has(routes, method, path) {

        return this.match(

            routes,
            method,
            path

        ) !== null;

    }

}