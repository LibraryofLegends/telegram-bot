/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/database/expressions/Expression.js
 * ========================================================================
 */

'use strict';

class Expression {

    /**
     * Konstruktor.
     *
     * @param {*} value
     */
    constructor(value) {

        this.value = value;

    }

    /**
     * SQL erzeugen.
     *
     * Muss überschrieben werden.
     *
     * @param {BaseGrammar} grammar
     * @returns {string}
     */
    compile(grammar) {

        throw new Error(

            `${this.constructor.name}.compile() wurde nicht implementiert.`

        );

    }

    /**
     * Bindings.
     *
     * @returns {Array}
     */
    bindings() {

        return [];

    }

}

module.exports = Expression;