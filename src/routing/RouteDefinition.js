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
 * ║ Datei-Version: 1.1.0                                                   ║
 * ║ Teil         : 1 / 2                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import RouteMethod from "./RouteMethod.js";

/**
 * Enthält die unveränderliche Konfiguration einer Route.
 *
 * RouteDefinition speichert ausschließlich statische
 * Routinginformationen. Laufzeitdaten gehören nicht in
 * diese Klasse und werden von Route verwaltet.
 */
export default class RouteDefinition {

    /**
     * HTTP-Methode.
     *
     * @type {string}
     */
    #method;

    /**
     * Routenpfad.
     *
     * @type {string}
     */
    #path;

    /**
     * Handler.
     *
     * @type {Function|string}
     */
    #handler;

    /**
     * Optionaler Routenname.
     *
     * @type {string|null}
     */
    #name;

    /**
     * Middleware.
     *
     * @type {string[]}
     */
    #middleware;

    /**
     * Freie Metadaten.
     *
     * @type {Object}
     */
    #metadata;

    /**
     * Erstellt eine neue Routendefinition.
     *
     * @param {Object} options
     * @param {string} options.method
     * @param {string} options.path
     * @param {Function|string} options.handler
     * @param {string|null} [options.name=null]
     * @param {string[]} [options.middleware=[]]
     * @param {Object} [options.metadata={}]
     */
    constructor({

        method,

        path,

        handler,

        name = null,

        middleware = [],

        metadata = {}

    }) {

        this.#method =
            RouteMethod.validate(method);

        if (
            typeof path !== "string" ||
            path.trim() === ""
        ) {

            throw new TypeError(
                "The route path must be a non-empty string."
            );

        }

        if (

            typeof handler !== "function" &&
            typeof handler !== "string"

        ) {

            throw new TypeError(
                "The handler must be a function or string."
            );

        }

        if (

            name !== null &&
            typeof name !== "string"

        ) {

            throw new TypeError(
                "The route name must be a string or null."
            );

        }

        if (!Array.isArray(middleware)) {

            throw new TypeError(
                "Middleware must be an array."
            );

        }

        if (
            metadata === null ||
            typeof metadata !== "object" ||
            Array.isArray(metadata)
        ) {

            throw new TypeError(
                "Metadata must be an object."
            );

        }

        this.#path =
            this.#normalizePath(path);

        this.#handler = handler;

        this.#name = name;

        this.#middleware = [

            ...middleware

        ];

        this.#metadata = {

            ...metadata

        };

        Object.freeze(this.#middleware);

        Object.freeze(this.#metadata);

        Object.freeze(this);

    }

    /**
     * Liefert die HTTP-Methode.
     *
     * @returns {string}
     */
    get method() {

        return this.#method;

    }

    /**
     * Liefert den Pfad.
     *
     * @returns {string}
     */
    get path() {

        return this.#path;

    }

    /**
     * Liefert den Handler.
     *
     * @returns {Function|string}
     */
    get handler() {

        return this.#handler;

    }

    /**
     * Liefert den Routennamen.
     *
     * @returns {string|null}
     */
    get name() {

        return this.#name;

    }

    /**
     * Prüft, ob ein Name vergeben wurde.
     *
     * @returns {boolean}
     */
    get hasName() {

        return this.#name !== null;

    }
    
        /**
     * Liefert die Middleware.
     *
     * @returns {string[]}
     */
    get middleware() {

        return this.#middleware;

    }

    /**
     * Prüft, ob Middleware registriert wurde.
     *
     * @returns {boolean}
     */
    get hasMiddleware() {

        return this.#middleware.length > 0;

    }

    /**
     * Liefert die Metadaten.
     *
     * @returns {Object}
     */
    get metadata() {

        return this.#metadata;

    }

    /**
     * Prüft, ob Metadaten vorhanden sind.
     *
     * @returns {boolean}
     */
    get hasMetadata() {

        return Object.keys(this.#metadata).length > 0;

    }

    /**
     * Normalisiert den Routenpfad.
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
     * Exportiert die Routendefinition.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            method: this.#method,

            path: this.#path,

            handler: this.#handler,

            name: this.#name,

            middleware: [...this.#middleware],

            metadata: {

                ...this.#metadata

            }

        };

    }

}