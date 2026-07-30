/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     🚀 Library Of Legends Framework                     ║
 * ║                                  (LLF)                                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║ Framework    : Library Of Legends Framework                            ║
 * ║ Version      : 0.1.0                                                   ║
 * ║ Codename     : Foundation                                              ║
 * ║ Modul        : Routing System                                          ║
 * ║ Paket        : 02                                                      ║
 * ║ Datei        : RouteParameter.js                                       ║
 * ║ Klasse       : RouteParameter                                          ║
 * ║ ID           : LLF-ROUTING-0002                                        ║
 * ║ Datei-Version: 1.0.0                                                   ║
 * ║ Status       : Stable                                                  ║
 * ║ Erstellt     : 30.07.2026                                              ║
 * ║ Autor        : Mr. Library Of Legends                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Repräsentiert einen einzelnen Routenparameter.
 */
export default class RouteParameter {

    /**
     * Parametername.
     *
     * @type {string}
     */
    #name;

    /**
     * Parameterwert.
     *
     * @type {*}
     */
    #value;

    /**
     * Regulärer Ausdruck zur Validierung.
     *
     * @type {RegExp|null}
     */
    #constraint;

    /**
     * Erstellt einen neuen Parameter.
     *
     * @param {string} name
     * @param {*} value
     * @param {RegExp|null} constraint
     */
    constructor(name, value = null, constraint = null) {

        if (typeof name !== 'string' || name.trim() === '') {

            throw new TypeError(
                'The parameter name must be a non-empty string.'
            );

        }

        if (
            constraint !== null &&
            !(constraint instanceof RegExp)
        ) {

            throw new TypeError(
                'The constraint must be a RegExp or null.'
            );

        }

        this.#name = name.trim();
        this.#value = value;
        this.#constraint = constraint;

    }

    get name() {

        return this.#name;

    }

    get value() {

        return this.#value;

    }

    set value(value) {

        this.#value = value;

    }

    get constraint() {

        return this.#constraint;

    }

    /**
     * Prüft den aktuellen Wert gegen die Einschränkung.
     *
     * @returns {boolean}
     */
    isValid() {

        if (this.#constraint === null) {

            return true;

        }

        return this.#constraint.test(
            String(this.#value)
        );

    }

    /**
     * Exportiert den Parameter.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            name: this.#name,
            value: this.#value,
            hasConstraint: this.#constraint !== null,
            valid: this.isValid()

        };

    }

}