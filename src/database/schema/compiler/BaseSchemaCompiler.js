/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * BaseSchemaCompiler.js
 * ============================================================================
 */

'use strict';

class BaseSchemaCompiler {

    constructor(grammar) {

        this.grammar = grammar;

    }

    /**
     * ------------------------------------------------------------------------
     * CREATE TABLE
     * ------------------------------------------------------------------------
     */

    compileCreate(blueprint) {

        throw new Error(

            'compileCreate() muss implementiert werden.'

        );

    }

    /**
     * ------------------------------------------------------------------------
     * ALTER TABLE
     * ------------------------------------------------------------------------
     */

    compileAlter(blueprint) {

        throw new Error(

            'compileAlter() muss implementiert werden.'

        );

    }

    /**
     * ------------------------------------------------------------------------
     * DROP TABLE
     * ------------------------------------------------------------------------
     */

    compileDrop(table) {

        throw new Error(

            'compileDrop() muss implementiert werden.'

        );

    }

    /**
     * ------------------------------------------------------------------------
     * RENAME TABLE
     * ------------------------------------------------------------------------
     */

    compileRename(from, to) {

        throw new Error(

            'compileRename() muss implementiert werden.'

        );

    }

    /**
     * ------------------------------------------------------------------------
     * COLUMN
     * ------------------------------------------------------------------------
     */

    compileColumn(column) {

        throw new Error(

            'compileColumn() muss implementiert werden.'

        );

    }

    /**
     * ------------------------------------------------------------------------
     * INDEX
     * ------------------------------------------------------------------------
     */

    compileIndex(index) {

        throw new Error(

            'compileIndex() muss implementiert werden.'

        );

    }

    /**
     * ------------------------------------------------------------------------
     * FOREIGN KEY
     * ------------------------------------------------------------------------
     */

    compileForeignKey(foreignKey) {

        throw new Error(

            'compileForeignKey() muss implementiert werden.'

        );

    }

}

module.exports = BaseSchemaCompiler;