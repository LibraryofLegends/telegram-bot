/**
 * ========================================================================
 * SQLite Grammar
 * ========================================================================
 */

'use strict';

const BaseGrammar =

    require('./BaseGrammar');

class SQLiteGrammar extends BaseGrammar {

    /**
     * SQLite nutzt "
     */

    wrapValue(value) {

        return `"${value}"`;

    }

    /**
     * LIMIT
     */

    compileLimit(limit) {

        return `LIMIT ${limit}`;

    }

    /**
     * OFFSET
     */

    compileOffset(offset) {

        return `OFFSET ${offset}`;

    }

    /**
     * LIMIT + OFFSET
     */

    compilePagination(limit, offset) {

        let sql = '';

        if (limit !== null) {

            sql +=

                this.compileLimit(limit);

        }

        if (offset !== null) {

            sql +=

                ` ${this.compileOffset(offset)}`;

        }

        return sql.trim();

    }

}

module.exports = SQLiteGrammar;