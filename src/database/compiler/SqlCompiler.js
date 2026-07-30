/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/database/compiler/SqlCompiler.js
 * ========================================================================
 */

'use strict';

const BaseCompiler = require('./BaseCompiler');

const SelectCompiler = require('./SelectCompiler');
const JoinCompiler = require('./JoinCompiler');
const WhereCompiler = require('./WhereCompiler');

class SqlCompiler extends BaseCompiler {

    constructor() {

        super();

        this.selectCompiler = new SelectCompiler();
        this.joinCompiler = new JoinCompiler();
        this.whereCompiler = new WhereCompiler();

    }

    /**
     * Gesamte Query kompilieren.
     *
     * @param {Object} query
     * @returns {{sql:string, bindings:Array}}
     */
    compile(query) {

        this.reset();

        /*
         * SELECT
         */

        const select =

            this.selectCompiler.compile(query);

        this.push(select.sql);

        this.addBindings(select.bindings);

        /*
         * JOIN
         */

        const joins =

            this.joinCompiler.compile(query);

        this.push(joins.sql);

        this.addBindings(joins.bindings);

        /*
         * WHERE
         */

        const where =

            this.whereCompiler.compile(query);

        this.push(where.sql);

        this.addBindings(where.bindings);

        return this.result();

    }

    /**
     * Nur SQL zurückgeben.
     *
     * @param {Object} query
     * @returns {string}
     */
    toSql(query) {

        return this.compile(query).sql;

    }

    /**
     * Nur Bindings.
     *
     * @param {Object} query
     * @returns {Array}
     */
    getBindings(query) {

        return this.compile(query).bindings;

    }

}

module.exports = SqlCompiler;