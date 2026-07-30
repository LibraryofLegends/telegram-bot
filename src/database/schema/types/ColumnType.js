'use strict';

class ColumnType {

    /**
     * Name des Typs.
     */

    getName() {

        throw new Error(

            'getName() muss implementiert werden.'

        );

    }

    /**
     * SQL für eine bestimmte Datenbank.
     */

    compile(driver, column) {

        throw new Error(

            'compile() muss implementiert werden.'

        );

    }

    /**
     * Standardlänge.
     */

    getDefaultLength() {

        return null;

    }

    /**
     * Unterstützt Länge?
     */

    supportsLength() {

        return false;

    }

    /**
     * Unterstützt Precision?
     */

    supportsPrecision() {

        return false;

    }

    /**
     * Unterstützt Scale?
     */

    supportsScale() {

        return false;

    }

}

module.exports = ColumnType;