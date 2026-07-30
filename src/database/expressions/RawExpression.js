/**
 * ========================================================================
 * Raw SQL Expression
 * ========================================================================
 */

'use strict';

const Expression = require('./Expression');

class RawExpression extends Expression {

    constructor(sql, bindings = []) {

        super(sql);

        this._bindings = bindings;

    }

    /**
     * SQL unverändert zurückgeben.
     */

    compile() {

        return this.value;

    }

    /**
     * Bindings.
     */

    bindings() {

        return this._bindings;

    }

}

module.exports = RawExpression;