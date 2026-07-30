/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/database/compiler/ExpressionCompiler.js
 * ========================================================================
 */

'use strict';

const Expression = require('../expressions/Expression');

class ExpressionCompiler {

    /**
     * Konstruktor.
     *
     * @param {BaseGrammar} grammar
     */
    constructor(grammar) {

        this.grammar = grammar;

    }

    /**
     * Einzelnen Ausdruck kompilieren.
     *
     * @param {*} value
     * @returns {{sql:string, bindings:Array}}
     */
    compile(value) {

        /*
         * Expression-Klasse
         */

        if (value instanceof Expression) {

            return {

                sql: value.compile(this.grammar),

                bindings: value.bindings()

            };

        }

        /*
         * NULL
         */

        if (value === null) {

            return {

                sql: this.grammar.compileNull(),

                bindings: []

            };

        }

        /*
         * Boolean
         */

        if (typeof value === 'boolean') {

            return {

                sql: value

                    ? this.grammar.compileTrue()

                    : this.grammar.compileFalse(),

                bindings: []

            };

        }

        /*
         * Primitive Werte
         */

        return {

            sql: this.grammar.parameter(),

            bindings: [

                value

            ]

        };

    }

    /**
     * Mehrere Expressions.
     *
     * @param {Array} values
     * @returns {{sql:Array, bindings:Array}}
     */
    compileMany(values = []) {

        const sql = [];
        const bindings = [];

        for (const value of values) {

            const compiled = this.compile(value);

            sql.push(compiled.sql);

            bindings.push(

                ...compiled.bindings

            );

        }

        return {

            sql,

            bindings

        };

    }

}

module.exports = ExpressionCompiler;