/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/database/grammar/BaseGrammar.js
 * ========================================================================
 */

'use strict';

class BaseGrammar {

    /**
     * Identifier quoten.
     *
     * Beispiel:
     * movies.title
     * =>
     * "movies"."title"
     *
     * @param {string} identifier
     * @returns {string}
     */
    wrap(identifier) {

        if (identifier === '*') {

            return '*';

        }

        return identifier
            .split('.')
            .map(part => this.wrapValue(part))
            .join('.');

    }

    /**
     * Einzelnen Identifier quoten.
     *
     * Wird von den Dialekten überschrieben.
     *
     * @param {string} value
     * @returns {string}
     */
    wrapValue(value) {

        return `"${value}"`;

    }

    /**
     * Tabelle mit Alias.
     *
     * @param {string} table
     * @param {string|null} alias
     * @returns {string}
     */
    wrapTable(table, alias = null) {

        let sql = this.wrap(table);

        if (alias) {

            sql += ` AS ${this.wrap(alias)}`;

        }

        return sql;

    }

    /**
     * Platzhalter.
     *
     * SQLite/PostgreSQL/MySQL
     * verwenden '?'
     *
     * @returns {string}
     */
    parameter() {

        return '?';

    }

    /**
     * Mehrere Platzhalter.
     *
     * @param {number} count
     * @returns {string}
     */
    parameterize(count) {

        return new Array(count)

            .fill(this.parameter())

            .join(', ');

    }

    /**
     * TRUE
     */

    compileTrue() {

        return 'TRUE';

    }

    /**
     * FALSE
     */

    compileFalse() {

        return 'FALSE';

    }

    /**
     * NULL
     */

    compileNull() {

        return 'NULL';

    }

}

module.exports = BaseGrammar;