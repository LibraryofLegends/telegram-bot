/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : Event System                                            ║
 * ║ Paket        : 03                                                      ║
 * ║ Datei        : EventPriority.js                                        ║
 * ║ Klasse       : EventPriority                                           ║
 * ║ ID           : LLF-EVENT-0002                                          ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Beschreibung:                                                          ║
 * ║                                                                        ║
 * ║ Definiert sämtliche Prioritätsstufen für Event-Listener.               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Statische Hilfsklasse für Event-Prioritäten.
 */
export default class EventPriority {

    /**
     * Niedrigste Priorität.
     *
     * @type {number}
     */
    static LOWEST = 0;

    /**
     * Niedrige Priorität.
     *
     * @type {number}
     */
    static LOW = 250;

    /**
     * Normale Priorität.
     *
     * @type {number}
     */
    static NORMAL = 500;

    /**
     * Hohe Priorität.
     *
     * @type {number}
     */
    static HIGH = 750;

    /**
     * Höchste Priorität.
     *
     * @type {number}
     */
    static HIGHEST = 1000;

    /**
     * Liefert alle Prioritäten.
     *
     * @returns {number[]}
     */
    static values() {

        return [

            this.LOWEST,
            this.LOW,
            this.NORMAL,
            this.HIGH,
            this.HIGHEST

        ];

    }

    /**
     * Prüft eine Priorität.
     *
     * @param {number} priority
     *
     * @returns {boolean}
     */
    static isValid(priority) {

        return Number.isInteger(priority)
            && this.values().includes(priority);

    }

    /**
     * Validiert eine Priorität.
     *
     * @param {number} priority
     *
     * @returns {number}
     *
     * @throws {TypeError}
     */
    static validate(priority) {

        if (!this.isValid(priority)) {

            throw new TypeError(
                `Unsupported event priority "${priority}".`
            );

        }

        return priority;

    }

    /**
     * Vergleicht zwei Prioritäten.
     *
     * @param {number} left
     * @param {number} right
     *
     * @returns {number}
     */
    static compare(left, right) {

        return right - left;

    }

}