/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : Dependency Injection                                    ║
 * ║ Paket        : 02                                                      ║
 * ║ Datei        : Lifetime.js                                             ║
 * ║ Klasse       : Lifetime                                                ║
 * ║ ID           : LLF-DI-0003                                             ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Beschreibung:                                                          ║
 * ║                                                                        ║
 * ║ Definiert sämtliche unterstützten Lebenszyklen eines Services.         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Statische Hilfsklasse zur Verwaltung von Service-Lifetimes.
 */
export default class Lifetime {

    /**
     * Singleton.
     *
     * Eine Instanz pro Container.
     *
     * @type {string}
     */
    static SINGLETON = 'singleton';

    /**
     * Transient.
     *
     * Neue Instanz bei jeder Auflösung.
     *
     * @type {string}
     */
    static TRANSIENT = 'transient';

    /**
     * Scoped.
     *
     * Eine Instanz pro Scope.
     *
     * @type {string}
     */
    static SCOPED = 'scoped';

    /**
     * Gibt sämtliche unterstützten Lifetimes zurück.
     *
     * @returns {string[]}
     */
    static values() {

        return [
            this.SINGLETON,
            this.TRANSIENT,
            this.SCOPED
        ];

    }

    /**
     * Prüft, ob ein Wert gültig ist.
     *
     * @param {string} lifetime
     *
     * @returns {boolean}
     */
    static isValid(lifetime) {

        return this.values().includes(lifetime);

    }

    /**
     * Prüft auf Singleton.
     *
     * @param {string} lifetime
     *
     * @returns {boolean}
     */
    static isSingleton(lifetime) {

        return lifetime === this.SINGLETON;

    }

    /**
     * Prüft auf Transient.
     *
     * @param {string} lifetime
     *
     * @returns {boolean}
     */
    static isTransient(lifetime) {

        return lifetime === this.TRANSIENT;

    }

    /**
     * Prüft auf Scoped.
     *
     * @param {string} lifetime
     *
     * @returns {boolean}
     */
    static isScoped(lifetime) {

        return lifetime === this.SCOPED;

    }

    /**
     * Validiert einen Lifetime-Wert.
     *
     * @param {string} lifetime
     *
     * @returns {string}
     *
     * @throws {TypeError}
     */
    static validate(lifetime) {

        if (!this.isValid(lifetime)) {

            throw new TypeError(
                `Unsupported lifetime "${lifetime}".`
            );

        }

        return lifetime;

    }

}