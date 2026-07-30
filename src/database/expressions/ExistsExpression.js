/**
 * ========================================================================
 * EXISTS Expression
 * ========================================================================
 */

'use strict';

const Expression = require('./Expression');

class ExistsExpression extends Expression {

    constructor(query) {

        super(query);

    }

    compile(grammar) {

        return `EXISTS (${this.value.toSql()})`;

    }

    bindings() {

        return this.value.bindings();

    }

}

module.exports = ExistsExpression;