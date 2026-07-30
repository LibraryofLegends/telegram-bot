/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/database/schema/Blueprint.js
 * ============================================================================
 */

'use strict';

class Blueprint {

    constructor(table) {

        this.table = table;

        this.columns = [];

        this.indexes = [];

        this.foreignKeys = [];

        this.commands = [];

    }

    /**
     * ------------------------------------------------------------------------
     * Columns
     * ------------------------------------------------------------------------
     */

    addColumn(column) {

        this.columns.push(column);

        return column;

    }

    getColumns() {

        return [...this.columns];

    }

    /**
     * ------------------------------------------------------------------------
     * Indexes
     * ------------------------------------------------------------------------
     */

    addIndex(index) {

        this.indexes.push(index);

        return index;

    }

    getIndexes() {

        return [...this.indexes];

    }

    /**
     * ------------------------------------------------------------------------
     * Foreign Keys
     * ------------------------------------------------------------------------
     */

    addForeignKey(foreignKey) {

        this.foreignKeys.push(foreignKey);

        return foreignKey;

    }

    getForeignKeys() {

        return [...this.foreignKeys];

    }

    /**
     * ------------------------------------------------------------------------
     * Commands
     * ------------------------------------------------------------------------
     */

    addCommand(command) {

        this.commands.push(command);

        return this;

    }

    getCommands() {

        return [...this.commands];

    }

    /**
     * ------------------------------------------------------------------------
     * Reset
     * ------------------------------------------------------------------------
     */

    clear() {

        this.columns.length = 0;

        this.indexes.length = 0;

        this.foreignKeys.length = 0;

        this.commands.length = 0;

        return this;

    }

}

module.exports = Blueprint;