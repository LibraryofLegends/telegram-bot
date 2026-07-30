/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/database/state/QueryState.js
 * ========================================================================
 */

'use strict';

class QueryState {

    constructor() {

        this.reset();

    }

    /**
     * Query vollständig zurücksetzen.
     */

    reset() {

        this.type = 'select';

        this.table = null;

        this.alias = null;

        this.distinct = false;

        this.columns = [];

        this.joins = [];

        this.wheres = [];

        this.groups = [];

        this.havings = [];

        this.orders = [];

        this.unions = [];

        this.limit = null;

        this.offset = null;

        this.lock = null;

        this.comment = null;

        this.ctes = [];

        return this;

    }

    /**
     * Tabelle.
     */

    from(table, alias = null) {

        this.table = table;

        this.alias = alias;

        return this;

    }

    /**
     * Query-Typ.
     */

    setType(type) {

        this.type = type;

        return this;

    }

    /**
     * DISTINCT.
     */

    setDistinct(value = true) {

        this.distinct = Boolean(value);

        return this;

    }

    /**
     * SELECT.
     */

    addColumn(column) {

        this.columns.push(column);

        return this;

    }

    /**
     * JOIN.
     */

    addJoin(join) {

        this.joins.push(join);

        return this;

    }

    /**
     * WHERE.
     */

    addWhere(where) {

        this.wheres.push(where);

        return this;

    }

    /**
     * GROUP BY.
     */

    addGroup(group) {

        this.groups.push(group);

        return this;

    }

    /**
     * HAVING.
     */

    addHaving(having) {

        this.havings.push(having);

        return this;

    }

    /**
     * ORDER BY.
     */

    addOrder(order) {

        this.orders.push(order);

        return this;

    }

    /**
     * UNION.
     */

    addUnion(union) {

        this.unions.push(union);

        return this;

    }

    /**
     * LIMIT.
     */

    setLimit(limit) {

        this.limit = limit;

        return this;

    }

    /**
     * OFFSET.
     */

    setOffset(offset) {

        this.offset = offset;

        return this;

    }

    /**
     * Kommentar.
     */

    setComment(comment) {

        this.comment = comment;

        return this;

    }

    /**
     * Locking.
     */

    setLock(lock) {

        this.lock = lock;

        return this;

    }

    /**
     * WITH.
     */

    addCte(cte) {

        this.ctes.push(cte);

        return this;

    }

}