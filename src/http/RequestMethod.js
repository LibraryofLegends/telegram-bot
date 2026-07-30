/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : HTTP System                                             ║
 * ║ Paket        : 01                                                      ║
 * ║ Datei        : RequestMethod.js                                        ║
 * ║ Klasse       : RequestMethod                                           ║
 * ║ ID           : LLF-HTTP-0001                                           ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Enthält sämtliche unterstützten HTTP-Methoden.
 *
 * Die Klasse dient als zentrale Referenz für alle
 * HTTP-Methoden innerhalb des Frameworks und stellt
 * zusätzlich Hilfsmethoden zur Validierung und
 * Normalisierung bereit.
 */
export default class RequestMethod {

    /** @type {string} */
    static GET = "GET";

    /** @type {string} */
    static POST = "POST";

    /** @type {string} */
    static PUT = "PUT";

    /** @type {string} */
    static PATCH = "PATCH";

    /** @type {string} */
    static DELETE = "DELETE";

    /** @type {string} */
    static HEAD = "HEAD";

    /** @type {string} */
    static OPTIONS = "OPTIONS";

    /** @type {string} */
    static TRACE = "TRACE";

    /** @type {string} */
    static CONNECT = "CONNECT";

    /**
     * Liefert alle unterstützten HTTP-Methoden.
     *
     * @returns {string[]}
     */
    static all() {

        return [

            this.GET,
            this.POST,
            this.PUT,
            this.PATCH,
            this.DELETE,
            this.HEAD,
            this.OPTIONS,
            this.TRACE,
            this.CONNECT

        ];

    }

    /**
     * Prüft, ob eine HTTP-Methode gültig ist.
     *
     * @param {string} method
     *
     * @returns {boolean}
     */
    static isValid(method) {

        if (typeof method !== "string") {

            return false;

        }

        return this
            .all()
            .includes(method.toUpperCase());

    }

    /**
     * Validiert eine HTTP-Methode.
     *
     * @param {string} method
     *
     * @returns {string}
     */
    static validate(method) {

        if (!this.isValid(method)) {

            throw new TypeError(

                `Unsupported HTTP method: ${method}`

            );

        }

        return method.toUpperCase();

    }

    /**
     * Normalisiert eine HTTP-Methode.
     *
     * @param {string} method
     *
     * @returns {string}
     */
    static normalize(method) {

        return this.validate(method);

    }

    /**
     * Exportiert alle HTTP-Methoden.
     *
     * @returns {Object}
     */
    static toJSON() {

        return {

            methods: this.all()

        };

    }

}