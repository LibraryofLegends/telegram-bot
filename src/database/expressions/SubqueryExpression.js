/**
 * ========================================================================
 * Subquery Expression
 * ========================================================================
 */

'use strict';

const Expression = require('./Expression');

class SubqueryExpression extends Expression {

    constructor(query) {

        super(query);

    }

    compile() {

        return `(${this.value.toSql()})`;

    }

    bindings() {

        return this.value.bindings();

    }

}

module.exports = SubqueryExpression;