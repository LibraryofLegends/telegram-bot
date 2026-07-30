/**
 * ========================================================================
 * Column Expression
 * ========================================================================
 */

'use strict';

const Expression = require('./Expression');

class ColumnExpression extends Expression {

    /**
     * Spalte kompilieren.
     */

    compile(grammar) {

        return grammar.wrap(

            this.value

        );

    }

}

module.exports = ColumnExpression;