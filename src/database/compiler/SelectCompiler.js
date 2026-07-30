/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/database/compiler/SelectCompiler.js
 * ========================================================================
 */

'use strict';

const CompilerUtils = require('./CompilerUtils');

class SelectCompiler {

    /**
     * SELECT erzeugen.
     *
     * @param {Object} query
     * @returns {string}
     */
    compile(query) {

        const sql = [];

        sql.push('SELECT');

        if (query.distinct) {

            sql.push('DISTINCT');

        }

        sql.push(this.compileColumns(query.columns));

        sql.push('FROM');

        sql.push(this.compileTable(query));

        return CompilerUtils.join(sql);

    }

    /**
     * Tabellenname.
     *
     * @param {Object} query
     * @returns {string}
     */
    compileTable(query) {

        let table = query.table;

        if (query.alias) {

            table += ` AS ${query.alias}`;

        }

        return table;

    }

    /**
     * SELECT-Spalten.
     *
     * @param {Array} columns
     * @returns {string}
     */
    compileColumns(columns = []) {

        if (!columns.length) {

            return '*';

        }

        const result = [];

        for (const column of columns) {

            if (CompilerUtils.isRaw(column)) {

                result.push(column.expression);

                continue;

            }

            result.push(

                CompilerUtils.identifier(column)

            );

        }

        return result.join(', ');

    }

    /**
     * COUNT(*)
     */

    compileCount(alias = 'count') {

        return `COUNT(*) AS ${alias}`;

    }

    /**
     * SUM()
     */

    compileSum(column, alias = 'sum') {

        column = CompilerUtils.identifier(column);

        return `SUM(${column}) AS ${alias}`;

    }

    /**
     * AVG()
     */

    compileAvg(column, alias = 'avg') {

        column = CompilerUtils.identifier(column);

        return `AVG(${column}) AS ${alias}`;

    }

    /**
     * MIN()
     */

    compileMin(column, alias = 'min') {

        column = CompilerUtils.identifier(column);

        return `MIN(${column}) AS ${alias}`;

    }

    /**
     * MAX()
     */

    compileMax(column, alias = 'max') {

        column = CompilerUtils.identifier(column);

        return `MAX(${column}) AS ${alias}`;

    }

}

module.exports = SelectCompiler;