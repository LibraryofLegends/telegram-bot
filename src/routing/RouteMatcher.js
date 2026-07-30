/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                 ║
 * ║                              (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║ Framework : Library Of Legends Framework                           ║
 * ║ Version   : 0.1.0                                                  ║
 * ║ Modul     : Routing                                                ║
 * ║ Datei     : RouteMatcher.js                                        ║
 * ║ Klasse    : RouteMatcher                                           ║
 * ║ Version   : 1.1.0                                                  ║
 * ║ Teil      : 1 / 2                                                  ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import RouteCollection from "./RouteCollection.js";
import RouteResult from "./RouteResult.js";

export default class RouteMatcher {

    /**
     * Erstellt einen neuen RouteMatcher.
     */
    constructor() {

        Object.freeze(this);

    }

    /**
     * Führt den Matching-Prozess aus.
     *
     * @param {RouteCollection} routes
     * @param {string} method
     * @param {string} path
     *
     * @returns {RouteResult}
     */
    match(routes, method, path) {

        this.#validateInput(
            routes,
            method,
            path
        );

        const normalizedMethod =
            this.#normalizeMethod(method);

        const normalizedPath =
            this.#normalizePath(path);

        const match =
            this.#findMatchingRoute(
                routes,
                normalizedMethod,
                normalizedPath
            );

        if (match === null) {

            return this.#createNotFoundResult();

        }

        const parameters =
            this.#extractParameters(
                match.definition.path,
                normalizedPath
            );

        return this.#createSuccessResult(

            match,

            parameters

        );

    }

    /**
     * Prüft sämtliche Eingaben.
     *
     * @private
     */
    #validateInput(routes, method, path) {

        if (!(routes instanceof RouteCollection)) {

            throw new TypeError(
                "Expected RouteCollection."
            );

        }

        if (typeof method !== "string") {

            throw new TypeError(
                "Method must be a string."
            );

        }

        if (typeof path !== "string") {

            throw new TypeError(
                "Path must be a string."
            );

        }

    }

    /**
     * Normalisiert die HTTP-Methode.
     *
     * @private
     *
     * @param {string} method
     *
     * @returns {string}
     */
    #normalizeMethod(method) {

        return method
            .trim()
            .toUpperCase();

    }

    /**
     * Normalisiert den Request-Pfad.
     *
     * @private
     *
     * @param {string} path
     *
     * @returns {string}
     */
    #normalizePath(path) {

        let normalized = path.trim();

        if (!normalized.startsWith("/")) {

            normalized = "/" + normalized;

        }

        if (

            normalized.length > 1 &&
            normalized.endsWith("/")

        ) {

            normalized =
                normalized.slice(0, -1);

        }

        return normalized;

    }

    /**
     * Sucht eine passende Route.
     *
     * @private
     *
     * @param {RouteCollection} routes
     * @param {string} method
     * @param {string} path
     *
     * @returns {Route|null}
     */
    #findMatchingRoute(routes, method, path) {

        for (const route of routes) {

            const definition =
                route.definition;

            if (

                definition.method !== method

            ) {

                continue;

            }

            if (

                this.#isMatchingPath(

                    definition.path,

                    path

                )

            ) {

                return route;

            }

        }

        return null;

    }
    
        /**
     * Prüft, ob zwei Pfade übereinstimmen.
     *
     * @private
     *
     * @param {string} routePath
     * @param {string} requestPath
     *
     * @returns {boolean}
     */
    #isMatchingPath(routePath, requestPath) {

        const routeSegments =
            routePath.split("/").filter(Boolean);

        const requestSegments =
            requestPath.split("/").filter(Boolean);

        if (
            routeSegments.length !==
            requestSegments.length
        ) {

            return false;

        }

        for (let i = 0; i < routeSegments.length; i++) {

            const routeSegment =
                routeSegments[i];

            const requestSegment =
                requestSegments[i];

            if (
                routeSegment.startsWith("{") &&
                routeSegment.endsWith("}")
            ) {

                continue;

            }

            if (routeSegment !== requestSegment) {

                return false;

            }

        }

        return true;

    }

    /**
     * Extrahiert sämtliche Parameter.
     *
     * @private
     *
     * @param {string} routePath
     * @param {string} requestPath
     *
     * @returns {Object}
     */
    #extractParameters(routePath, requestPath) {

        const parameters = {};

        const routeSegments =
            routePath.split("/").filter(Boolean);

        const requestSegments =
            requestPath.split("/").filter(Boolean);

        for (let i = 0; i < routeSegments.length; i++) {

            const segment =
                routeSegments[i];

            if (
                segment.startsWith("{") &&
                segment.endsWith("}")
            ) {

                const name = segment.slice(1, -1);

                parameters[name] =
                    requestSegments[i];

            }

        }

        return parameters;

    }

    /**
     * Erstellt ein erfolgreiches Matchergebnis.
     *
     * @private
     *
     * @param {Route} route
     * @param {Object} parameters
     *
     * @returns {RouteResult}
     */
    #createSuccessResult(route, parameters) {

        return new RouteResult({

            matched: true,

            route,

            parameters,

            status: 200,

            message: "Route matched."

        });

    }

    /**
     * Erstellt ein 404-Ergebnis.
     *
     * @private
     *
     * @returns {RouteResult}
     */
    #createNotFoundResult() {

        return new RouteResult({

            matched: false,

            route: null,

            parameters: {},

            status: 404,

            message: "Route not found."

        });

    }

    /**
     * Exportiert den Matcher.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            class: "RouteMatcher",

            version: "1.1.0"

        };

    }

}