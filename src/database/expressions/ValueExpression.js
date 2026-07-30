/**
 * ========================================================================
 * Value Expression
 * ========================================================================
 */

'use strict';

const Expression = require('./Expression');

class ValueExpression extends Expression {

    /**
     * Parameter-Platzhalter.
     */

    compile(grammar) {

        return grammar.parameter();

    }

    /**
     * Binding.
     */

    bindings() {

        return [

            this.value

        ];

    }

}

module.exports = ValueExpression;