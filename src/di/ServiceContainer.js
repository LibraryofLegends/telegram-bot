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
 * ║ Datei        : ServiceContainer.js                                     ║
 * ║ Klasse       : ServiceContainer                                        ║
 * ║ ID           : LLF-DI-0001                                             ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Beschreibung:                                                          ║
 * ║                                                                        ║
 * ║ Verwaltet alle registrierten Dienste des Frameworks.                   ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Zentraler Dependency-Injection-Container.
 */
export default class ServiceContainer {

    /**
     * Registrierte Dienste.
     *
     * @type {Map<string, *>}
     */
    #services;

    /**
     * Erstellt einen neuen ServiceContainer.
     */
    constructor() {

        this.#services = new Map();

    }

    /**
     * Registriert einen Dienst.
     *
     * @param {string} identifier
     * @param {*} service
     *
     * @returns {ServiceContainer}
     *
     * @throws {TypeError}
     */
    register(identifier, service) {

        if (typeof identifier !== 'string' || identifier.trim() === '') {

            throw new TypeError(
                'The service identifier must be a non-empty string.'
            );

        }

        this.#services.set(identifier, service);

        return this;

    }

    /**
     * Prüft, ob ein Dienst registriert wurde.
     *
     * @param {string} identifier
     *
     * @returns {boolean}
     */
    has(identifier) {

        return this.#services.has(identifier);

    }

    /**
     * Liefert einen registrierten Dienst zurück.
     *
     * @param {string} identifier
     *
     * @returns {*}
     *
     * @throws {Error}
     */
    get(identifier) {

        if (!this.has(identifier)) {

            throw new Error(
                `Service "${identifier}" is not registered.`
            );

        }

        return this.#services.get(identifier);

    }

    /**
     * Entfernt einen Dienst.
     *
     * @param {string} identifier
     *
     * @returns {boolean}
     */
    remove(identifier) {

        return this.#services.delete(identifier);

    }

    /**
     * Entfernt sämtliche registrierten Dienste.
     *
     * @returns {ServiceContainer}
     */
    clear() {

        this.#services.clear();

        return this;

    }

    /**
     * Anzahl registrierter Dienste.
     *
     * @returns {number}
     */
    get size() {

        return this.#services.size;

    }

    /**
     * Gibt sämtliche registrierten Dienstnamen zurück.
     *
     * @returns {string[]}
     */
    keys() {

        return [...this.#services.keys()];

    }

    /**
     * Exportiert den aktuellen Zustand.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            size: this.size,
            services: this.keys()

        };

    }

}