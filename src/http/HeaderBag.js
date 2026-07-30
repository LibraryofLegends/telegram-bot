/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : HTTP System                                             ║
 * ║ Paket        : 02                                                      ║
 * ║ Datei        : HeaderBag.js                                            ║
 * ║ Klasse       : HeaderBag                                               ║
 * ║ ID           : LLF-HTTP-0002                                           ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Verwaltet HTTP-Header.
 *
 * HeaderBag speichert Header unabhängig von ihrer
 * Groß-/Kleinschreibung und stellt eine komfortable
 * API zum Lesen, Schreiben und Entfernen bereit.
 */
export default class HeaderBag {

    /**
     * Header-Sammlung.
     *
     * @type {Map<string,string>}
     */
    #headers;

    /**
     * Erstellt eine neue HeaderBag.
     *
     * @param {Object<string,string>} [headers={}]
     */
    constructor(headers = {}) {

        if (

            headers === null ||
            typeof headers !== "object" ||
            Array.isArray(headers)

        ) {

            throw new TypeError(
                "Headers must be an object."
            );

        }

        this.#headers = new Map();

        for (const [name, value] of Object.entries(headers)) {

            this.set(name, value);

        }

    }

    /**
     * Anzahl der Header.
     *
     * @returns {number}
     */
    get size() {

        return this.#headers.size;

    }

    /**
     * Prüft, ob Header vorhanden sind.
     *
     * @returns {boolean}
     */
    get isEmpty() {

        return this.#headers.size === 0;

    }

    /**
     * Setzt einen Header.
     *
     * @param {string} name
     * @param {string} value
     *
     * @returns {HeaderBag}
     */
    set(name, value) {

        if (typeof name !== "string" || name.trim() === "") {

            throw new TypeError(
                "Header name must be a non-empty string."
            );

        }

        this.#headers.set(

            name.trim().toLowerCase(),

            String(value)

        );

        return this;

    }

    /**
     * Liefert einen Header.
     *
     * @param {string} name
     *
     * @returns {string|null}
     */
    get(name) {

        return this.#headers.get(

            name.trim().toLowerCase()

        ) ?? null;

    }

    /**
     * Prüft, ob ein Header existiert.
     *
     * @param {string} name
     *
     * @returns {boolean}
     */
    has(name) {

        return this.#headers.has(

            name.trim().toLowerCase()

        );

    }

    /**
     * Entfernt einen Header.
     *
     * @param {string} name
     *
     * @returns {boolean}
     */
    remove(name) {

        return this.#headers.delete(

            name.trim().toLowerCase()

        );

    }

    /**
     * Entfernt alle Header.
     *
     * @returns {HeaderBag}
     */
    clear() {

        this.#headers.clear();

        return this;

    }

    /**
     * Liefert alle Header.
     *
     * @returns {Object<string,string>}
     */
    all() {

        return Object.fromEntries(

            this.#headers

        );

    }

    /**
     * Exportiert die Header.
     *
     * @returns {Object}
     */
    toJSON() {

        return this.all();

    }

}