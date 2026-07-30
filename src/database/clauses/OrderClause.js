'use strict';

const Clause = require('./Clause');

class OrderClause extends Clause {

    constructor(

        expression,

        direction = 'ASC'

    ) {

        super('order');

        this.expression = expression;

        this.direction = direction;

    }

    getExpression() {

        return this.expression;

    }

    getDirection() {

        return this.direction;

    }

}

module.exports = OrderClause;