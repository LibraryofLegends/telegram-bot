'use strict';

const Clause = require('./Clause');

class WhereClause extends Clause {

    constructor(

        left,

        operator,

        right,

        boolean = 'AND'

    ) {

        super('where');

        this.left = left;

        this.operator = operator;

        this.right = right;

        this.boolean = boolean;

    }

    getLeft() {

        return this.left;

    }

    getOperator() {

        return this.operator;

    }

    getRight() {

        return this.right;

    }

    getBoolean() {

        return this.boolean;

    }

}

module.exports = WhereClause;