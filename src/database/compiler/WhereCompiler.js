/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/database/compiler/WhereCompiler.js
 * ========================================================================
 */

'use strict';

const ConditionCompiler = require('./ConditionCompiler');

class WhereCompiler {

    constructor() {

        this.conditionCompiler = new ConditionCompiler();

    }

    /**
     * WHERE kompilieren.
     *
     * @param {Object} query
     * @returns {{sql:string, bindings:Array}}
     */
    compile(query) {

        if (
            !query.wheres ||
            query.wheres.length === 0
        ) {

            return {

                sql: '',

                bindings: []

            };

        }

        const result =

            this.conditionCompiler.compile(

                query.wheres

            );

        return {

            sql: `WHERE ${result.sql}`,

            bindings: result.bindings

        };

    }

    /**
     * Prüfen ob WHERE existiert.
     *
     * @param {Object} query
     * @returns {boolean}
     */
    hasWhere(query) {

        return (

            Array.isArray(query.wheres) &&

            query.wheres.length > 0

        );

    }

}

module.exports = WhereCompiler;