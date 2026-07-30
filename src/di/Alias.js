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
 * ║ Datei        : Alias.js                                                ║
 * ║ Klasse       : Alias                                                   ║
 * ║ ID           : LLF-DI-0005                                             ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Beschreibung:                                                          ║
 * ║                                                                        ║
 * ║ Repräsentiert einen Alias innerhalb des DI-Containers.                 ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Repräsentiert einen Service-Alias.
 */
export default class Alias {

    /**
     * Aliasname.
     *
     * @type {string}
     */
    #name;

    /**
     * Ziel-Service.
     *
     * @type {string}
     */
    #target;

    /**
     * Erstellt einen neuen Alias.
     *
     * @param {string} name
     * @param {string} target
     */
    constructor(name, target) {

        if (typeof name !== 'string' || name.trim() === '') {

            throw new TypeError(
                'The alias name must be a non-empty string.'
            );

        }

        if (typeof target !== 'string' || target.trim() === '') {

            throw new TypeError(
                'The target identifier must be a non-empty string.'
            );

        }

        if (name === target) {

            throw new TypeError(
                'An alias cannot reference itself.'
            );

        }

        this.#name = name;
        this.#target = target;

    }

    /**
     * Aliasname.
     *
     * @returns {string}
     */
    get name() {

        return this.#name;

    }

    /**
     * Ziel-Identifier.
     *
     * @returns {string}
     */
    get target() {

        return this.#target;

    }

    /**
     * Prüft, ob der Alias auf einen bestimmten Dienst zeigt.
     *
     * @param {string} identifier
     *
     * @returns {boolean}
     */
    pointsTo(identifier) {

        return this.#target === identifier;

    }

    /**
     * Vergleicht zwei Alias-Objekte.
     *
     * @param {Alias} alias
     *
     * @returns {boolean}
     */
    equals(alias) {

        return alias instanceof Alias
            && alias.name === this.#name
            && alias.target === this.#target;

    }

    /**
     * Exportiert den Alias.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            name: this.#name,
            target: this.#target

        };

    }

}