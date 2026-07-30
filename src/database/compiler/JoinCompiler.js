/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/database/compiler/JoinCompiler.js
 * ========================================================================
 */

'use strict';

const CompilerUtils = require('./CompilerUtils');

class JoinCompiler {

    /**
     * Kompiliert alle JOINs.
     *
     * @param {Object} query
     * @returns {string}
     */
    compile(query) {

        if (!query.joins || query.joins.length === 0) {

            return '';

        }

        return query.joins
            .map(join => this.compileJoin(join))
            .join(' ');

    }

    /**
     * Einzelnen JOIN kompilieren.
     *
     * @param {Object} join
     * @returns {string}
     */
    compileJoin(join) {

        if (CompilerUtils.isRaw(join)) {

            return join.sql;

        }

        const sql = [];

        sql.push(join.type);

        sql.push('JOIN');

        sql.push(this.compileTable(join));

        if (join.type !== 'CROSS') {

            sql.push('ON');

            sql.push(this.compileConditions(join));

        }

        return CompilerUtils.join(sql);

    }

    /**
     * Tabelle + Alias.
     *
     * @param {Object} join
     * @returns {string}
     */
    compileTable(join) {

        let table = join.table;

        if (join.alias) {

            table += ` AS ${join.alias}`;

        }

        return table;

    }

    /**
     * ON-Bedingungen.
     *
     * Unterstützt beliebig viele
     * Bedingungen.
     *
     * @param {Object} join
     * @returns {string}
     */
    compileConditions(join) {

        /*
         * Neue Struktur:
         *
         * conditions: [
         *   {
         *      boolean:'AND',
         *      first:'movies.id',
         *      operator:'=',
         *      second:'genres.movie_id'
         *   }
         * ]
         */

        if (join.conditions) {

            return join.conditions

                .map((condition, index) => {

                    const clause =

                        `${condition.first} ${condition.operator} ${condition.second}`;

                    if (index === 0) {

                        return clause;

                    }

                    return `${condition.boolean} ${clause}`;

                })

                .join(' ');

        }

        /*
         * Rückwärtskompatibilität
         */

        return [

            join.first,

            join.operator,

            join.second

        ].join(' ');

    }

    /**
     * INNER JOIN.
     */

    compileInner(join) {

        join.type = 'INNER';

        return this.compileJoin(join);

    }

    /**
     * LEFT JOIN.
     */

    compileLeft(join) {

        join.type = 'LEFT';

        return this.compileJoin(join);

    }

    /**
     * RIGHT JOIN.
     */

    compileRight(join) {

        join.type = 'RIGHT';

        return this.compileJoin(join);

    }

    /**
     * FULL JOIN.
     */

    compileFull(join) {

        join.type = 'FULL';

        return this.compileJoin(join);

    }

    /**
     * CROSS JOIN.
     */

    compileCross(join) {

        join.type = 'CROSS';

        return this.compileJoin(join);

    }

}

module.exports = JoinCompiler;