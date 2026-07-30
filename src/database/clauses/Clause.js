/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/database/clauses/Clause.js
 * ========================================================================
 */

'use strict';

class Clause {

    /**
     * @param {string} type
     */
    constructor(type) {

        this.type = type;

    }

    /**
     * Typ zurückgeben.
     *
     * @returns {string}
     */
    getType() {

        return this.type;

    }

    /**
     * Serialisierung.
     */

    toJSON() {

        return {

            type: this.type

        };

    }

}

module.exports = Clause;