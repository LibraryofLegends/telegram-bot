/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/database/compiler/ConditionCompiler.js
 * ========================================================================
 */

'use strict';

const CompilerUtils = require('./CompilerUtils');

class ConditionCompiler {

    /**
     * Bedingungen kompilieren.
     *
     * @param {Array} conditions
     * @returns {{ sql:string, bindings:Array }}
     */
    compile(conditions = []) {

        const sql = [];
        const bindings = [];

        conditions.forEach((condition, index) => {

            if (index > 0) {

                sql.push(condition.boolean || 'AND');

            }

            const result = this.compileCondition(condition);

            sql.push(result.sql);

            bindings.push(...result.bindings);

        });

        return {

            sql: CompilerUtils.join(sql),

            bindings

        };

    }

    /**
     * Einzelne Bedingung.
     *
     * @param {Object} condition
     * @returns {{ sql:string, bindings:Array }}
     */
    compileCondition(condition) {

        /*
         * Raw SQL
         */

        if (condition.raw) {

            return {

                sql: condition.raw,

                bindings: condition.bindings || []

            };

        }

        /*
         * IS NULL
         */

        if (condition.operator === 'IS NULL') {

            return {

                sql: `${condition.column} IS NULL`,

                bindings: []

            };

        }

        /*
         * IS NOT NULL
         */

        if (condition.operator === 'IS NOT NULL') {

            return {

                sql: `${condition.column} IS NOT NULL`,

                bindings: []

            };

        }

        /*
         * BETWEEN
         */

        if (condition.operator === 'BETWEEN') {

            return {

                sql:

                    `${condition.column} BETWEEN ? AND ?`,

                bindings: [

                    condition.value[0],

                    condition.value[1]

                ]

            };

        }

        /*
         * IN / NOT IN
         */

        if (

            condition.operator === 'IN' ||

            condition.operator === 'NOT IN'

        ) {

            const placeholders =

                CompilerUtils.placeholders(

                    condition.value.length

                );

            return {

                sql:

                    `${condition.column} ${condition.operator} (${placeholders})`,

                bindings: condition.value

            };

        }

        /*
         * Standardoperator
         */

        return {

            sql:

                `${condition.column} ${condition.operator} ?`,

            bindings: [

                condition.value

            ]

        };

    }

}

module.exports = ConditionCompiler;