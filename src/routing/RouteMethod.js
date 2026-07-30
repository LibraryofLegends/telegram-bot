/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : Routing System                                          ║
 * ║ Paket        : 01                                                      ║
 * ║ Datei        : RouteMethod.js                                          ║
 * ║ Klasse       : RouteMethod                                             ║
 * ║ ID           : LLF-ROUTING-0001                                        ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

export default class RouteMethod {

    static GET = 'GET';

    static POST = 'POST';

    static PUT = 'PUT';

    static PATCH = 'PATCH';

    static DELETE = 'DELETE';

    static OPTIONS = 'OPTIONS';

    static HEAD = 'HEAD';

    static TRACE = 'TRACE';

    static CONNECT = 'CONNECT';

    /**
     * Liefert sämtliche HTTP-Methoden.
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
            this.OPTIONS,
            this.HEAD,
            this.TRACE,
            this.CONNECT

        ];

    }

    /**
     * Prüft, ob eine Methode gültig ist.
     *
     * @param {string} method
     *
     * @returns {boolean}
     */
    static isValid(method) {

        return this.all().includes(
            this.normalize(method)
        );

    }

    /**
     * Validiert eine HTTP-Methode.
     *
     * @param {string} method
     *
     * @returns {string}
     */
    static validate(method) {

        method = this.normalize(method);

        if (!this.isValid(method)) {

            throw new TypeError(
                `Unsupported HTTP method: ${method}`
            );

        }

        return method;

    }

    /**
     * Normalisiert eine HTTP-Methode.
     *
     * @param {string} method
     *
     * @returns {string}
     */
    static normalize(method) {

        if (typeof method !== 'string') {

            throw new TypeError(
                'The method must be a string.'
            );

        }

        return method
            .trim()
            .toUpperCase();

    }

    /**
     * Exportiert sämtliche Methoden.
     *
     * @returns {Object}
     */
    static toJSON() {

        return {

            methods: this.all(),
            count: this.all().length

        };

    }

}