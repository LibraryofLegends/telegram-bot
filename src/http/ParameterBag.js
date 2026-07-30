/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : HTTP System                                             ║
 * ║ Paket        : 03                                                      ║
 * ║ Datei        : ParameterBag.js                                         ║
 * ║ Klasse       : ParameterBag                                            ║
 * ║ ID           : LLF-HTTP-0003                                           ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Verwaltet benannte Parameter.
 *
 * ParameterBag dient als universelle Sammlung für
 * Schlüssel-Wert-Paare und wird im gesamten Framework
 * für Query-, Body-, Route-, Session- und Attributdaten
 * verwendet.
 */
export default class ParameterBag {

    /**
     * Gespeicherte Parameter.
     *
     * @type {Map<string, *>}
     */
    #parameters;

    /**
     * Erstellt eine neue ParameterBag.
     *
     * @param {Object} [parameters={}]
     */
    constructor(parameters = {}) {

        if (

            parameters === null ||
            typeof parameters !== "object" ||
            Array.isArray(parameters)

        ) {

            throw new TypeError(
                "Parameters must be an object."
            );

        }

        this.#parameters = new Map();

        for (const [key, value] of Object.entries(parameters)) {

            this.set(key, value);

        }

    }

    /**
     * Anzahl gespeicherter Parameter.
     *
     * @returns {number}
     */
    get size() {

        return this.#parameters.size;

    }

    /**
     * Prüft, ob Parameter vorhanden sind.
     *
     * @returns {boolean}
     */
    get isEmpty() {

        return this.#parameters.size === 0;

    }

    /**
     * Speichert einen Parameter.
     *
     * @param {string} key
     * @param {*} value
     *
     * @returns {ParameterBag}
     */
    set(key, value) {

        if (

            typeof key !== "string" ||
            key.trim() === ""

        ) {

            throw new TypeError(
                "Parameter key must be a non-empty string."
            );

        }

        this.#parameters.set(

            key.trim(),

            value

        );

        return this;

    }

    /**
     * Liefert einen Parameter.
     *
     * @param {string} key
     * @param {*} defaultValue
     *
     * @returns {*}
     */
    get(key, defaultValue = null) {

        return this.#parameters.has(key)

            ? this.#parameters.get(key)

            : defaultValue;

    }

    /**
     * Prüft, ob ein Parameter existiert.
     *
     * @param {string} key
     *
     * @returns {boolean}
     */
    has(key) {

        return this.#parameters.has(key);

    }

    /**
     * Entfernt einen Parameter.
     *
     * @param {string} key
     *
     * @returns {boolean}
     */
    remove(key) {

        return this.#parameters.delete(key);

    }

    /**
     * Entfernt sämtliche Parameter.
     *
     * @returns {ParameterBag}
     */
    clear() {

        this.#parameters.clear();

        return this;

    }

    /**
     * Liefert alle Parameter.
     *
     * @returns {Object}
     */
    all() {

        return Object.fromEntries(

            this.#parameters

        );

    }

    /**
     * Exportiert alle Parameter.
     *
     * @returns {Object}
     */
    toJSON() {

        return this.all();

    }

}