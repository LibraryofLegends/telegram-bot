/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : HTTP System                                             ║
 * ║ Paket        : 05                                                      ║
 * ║ Datei        : CookieBag.js                                            ║
 * ║ Klasse       : CookieBag                                               ║
 * ║ ID           : LLF-HTTP-0005                                           ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Verwaltet HTTP-Cookies.
 *
 * CookieBag speichert Cookies als Schlüssel-Wert-Paare
 * und stellt eine einheitliche API zum Lesen, Schreiben,
 * Entfernen und Exportieren bereit.
 */
export default class CookieBag {

    /**
     * Gespeicherte Cookies.
     *
     * @type {Map<string,string>}
     */
    #cookies;

    /**
     * Erstellt eine neue CookieBag.
     *
     * @param {Object<string,string>} [cookies={}]
     */
    constructor(cookies = {}) {

        if (

            cookies === null ||
            typeof cookies !== "object" ||
            Array.isArray(cookies)

        ) {

            throw new TypeError(
                "Cookies must be an object."
            );

        }

        this.#cookies = new Map();

        for (const [name, value] of Object.entries(cookies)) {

            this.set(name, value);

        }

    }

    /**
     * Anzahl gespeicherter Cookies.
     *
     * @returns {number}
     */
    get size() {

        return this.#cookies.size;

    }

    /**
     * Prüft, ob Cookies vorhanden sind.
     *
     * @returns {boolean}
     */
    get isEmpty() {

        return this.#cookies.size === 0;

    }

    /**
     * Speichert ein Cookie.
     *
     * @param {string} name
     * @param {string} value
     *
     * @returns {CookieBag}
     */
    set(name, value) {

        if (

            typeof name !== "string" ||
            name.trim() === ""

        ) {

            throw new TypeError(
                "Cookie name must be a non-empty string."
            );

        }

        this.#cookies.set(

            name.trim(),

            String(value)

        );

        return this;

    }

    /**
     * Liefert ein Cookie.
     *
     * @param {string} name
     *
     * @returns {string|null}
     */
    get(name) {

        return this.#cookies.get(

            name.trim()

        ) ?? null;

    }

    /**
     * Prüft, ob ein Cookie existiert.
     *
     * @param {string} name
     *
     * @returns {boolean}
     */
    has(name) {

        return this.#cookies.has(

            name.trim()

        );

    }

    /**
     * Entfernt ein Cookie.
     *
     * @param {string} name
     *
     * @returns {boolean}
     */
    remove(name) {

        return this.#cookies.delete(

            name.trim()

        );

    }

    /**
     * Entfernt sämtliche Cookies.
     *
     * @returns {CookieBag}
     */
    clear() {

        this.#cookies.clear();

        return this;

    }

    /**
     * Liefert alle Cookies.
     *
     * @returns {Object<string,string>}
     */
    all() {

        return Object.fromEntries(

            this.#cookies

        );

    }

    /**
     * Exportiert sämtliche Cookies.
     *
     * @returns {Object}
     */
    toJSON() {

        return this.all();

    }

}