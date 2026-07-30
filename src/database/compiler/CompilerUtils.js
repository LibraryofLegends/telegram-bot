/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/database/compiler/CompilerUtils.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Gemeinsame Hilfsfunktionen für sämtliche SQL-Compiler.
 *
 * ========================================================================
 */

'use strict';

class CompilerUtils {

    /**
     * SQL-Identifier validieren.
     *
     * @param {string} identifier
     * @returns {string}
     */
    static identifier(identifier) {

        if (typeof identifier !== 'string') {

            throw new TypeError(
                'SQL-Identifier muss ein String sein.'
            );

        }

        identifier = identifier.trim();

        const regex =

            /^[A-Za-z_][A-Za-z0-9_.]*$/;

        if (!regex.test(identifier)) {

            throw new Error(

                `Ungültiger SQL-Identifier: ${identifier}`

            );

        }

        return identifier;

    }

    /**
     * SQL-Operator validieren.
     *
     * @param {string} operator
     * @returns {string}
     */
    static operator(operator) {

        const allowed = [

            '=',

            '!=',

            '<>',

            '>',

            '<',

            '>=',

            '<=',

            'LIKE',

            'NOT LIKE',

            'IN',

            'NOT IN',

            'BETWEEN',

            'IS',

            'IS NOT'

        ];

        operator =

            String(operator)
                .trim()
                .toUpperCase();

        if (!allowed.includes(operator)) {

            throw new Error(

                `Ungültiger Operator: ${operator}`

            );

        }

        return operator;

    }

    /**
     * Platzhalter erzeugen.
     *
     * @param {number} count
     * @returns {string}
     */
    static placeholders(count) {

        if (count <= 0) {

            return '';

        }

        return new Array(count)

            .fill('?')

            .join(', ');

    }

    /**
     * Array?
     *
     * @param {*} value
     * @returns {boolean}
     */
    static isArray(value) {

        return Array.isArray(value);

    }

    /**
     * Raw Expression?
     *
     * @param {*} value
     * @returns {boolean}
     */
    static isRaw(value) {

        return (

            value &&

            typeof value === 'object' &&

            value.raw === true

        );

    }

    /**
     * SQL zusammenbauen.
     *
     * Entfernt automatisch
     * leere Einträge.
     *
     * @param {Array} parts
     * @returns {string}
     */
    static join(parts) {

        return parts

            .filter(Boolean)

            .join(' ')

            .replace(/\s+/g, ' ')

            .trim();

    }

}

module.exports = CompilerUtils;