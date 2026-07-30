'use strict';

const Clause = require('./Clause');

class JoinClause extends Clause {

    constructor(

        type,

        table,

        alias = null

    ) {

        super('join');

        this.joinType = type;

        this.table = table;

        this.alias = alias;

        this.conditions = [];

    }

    addCondition(condition) {

        this.conditions.push(condition);

        return this;

    }

    getConditions() {

        return this.conditions;

    }

    getType() {

        return this.joinType;

    }

    getTable() {

        return this.table;

    }

    getAlias() {

        return this.alias;

    }

}

module.exports = JoinClause;