/**
 * ========================================================================
 * Aggregate Expression
 * ========================================================================
 */

'use strict';

const FunctionExpression =

    require('./FunctionExpression');

class AggregateExpression extends FunctionExpression {

    /**
     * @param {string} functionName
     * @param {Expression} column
     * @param {string|null} alias
     */
    constructor(functionName, column, alias = null) {

        super(functionName, [

            column

        ]);

        this.alias = alias;

    }

    compile(grammar) {

        let sql =

            super.compile(grammar);

        if (this.alias) {

            sql +=

                ` AS ${grammar.wrap(this.alias)}`;

        }

        return sql;

    }

}

module.exports = AggregateExpression;