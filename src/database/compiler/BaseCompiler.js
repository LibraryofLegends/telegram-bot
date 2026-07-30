/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/database/compiler/BaseCompiler.js
 * ========================================================================
 */

'use strict';

const CompilerUtils = require('./CompilerUtils');

class BaseCompiler {

    /**
     * Konstruktor.
     */
    constructor() {

        this.reset();

    }

    /**
     * Compiler zurücksetzen.
     *
     * @returns {BaseCompiler}
     */
    reset() {

        this.sql = [];

        this.bindings = [];

        return this;

    }

    /**
     * SQL-Teil hinzufügen.
     *
     * @param {string} value
     * @returns {BaseCompiler}
     */
    push(value) {

        if (
            value !== undefined &&
            value !== null &&
            value !== ''
        ) {

            this.sql.push(value);

        }

        return this;

    }

    /**
     * Mehrere SQL-Teile hinzufügen.
     *
     * @param {Array} values
     * @returns {BaseCompiler}
     */
    pushMany(values = []) {

        for (const value of values) {

            this.push(value);

        }

        return this;

    }

    /**
     * Binding hinzufügen.
     *
     * @param {*} value
     * @returns {BaseCompiler}
     */
    addBinding(value) {

        this.bindings.push(value);

        return this;

    }

    /**
     * Mehrere Bindings hinzufügen.
     *
     * @param {Array} values
     * @returns {BaseCompiler}
     */
    addBindings(values = []) {

        this.bindings.push(...values);

        return this;

    }

    /**
     * SQL zurückgeben.
     *
     * @returns {string}
     */
    getSql() {

        return CompilerUtils.join(

            this.sql

        );

    }

    /**
     * Bindings zurückgeben.
     *
     * @returns {Array}
     */
    getBindings() {

        return [

            ...this.bindings

        ];

    }

    /**
     * Komplettes Ergebnis.
     *
     * @returns {{sql:string, bindings:Array}}
     */
    result() {

        return {

            sql: this.getSql(),

            bindings: this.getBindings()

        };

    }

    /**
     * SQL-Identifier.
     *
     * @param {string} identifier
     * @returns {string}
     */
    identifier(identifier) {

        return CompilerUtils.identifier(

            identifier

        );

    }

    /**
     * SQL-Operator.
     *
     * @param {string} operator
     * @returns {string}
     */
    operator(operator) {

        return CompilerUtils.operator(

            operator

        );

    }

    /**
     * Platzhalter.
     *
     * @param {number} count
     * @returns {string}
     */
    placeholders(count) {

        return CompilerUtils.placeholders(

            count

        );

    }

    /**
     * Raw Expression?
     *
     * @param {*} value
     * @returns {boolean}
     */
    isRaw(value) {

        return CompilerUtils.isRaw(

            value

        );

    }

    /**
     * Array?
     *
     * @param {*} value
     * @returns {boolean}
     */
    isArray(value) {

        return CompilerUtils.isArray(

            value

        );

    }

}

module.exports = BaseCompiler;