'use strict';

const ColumnType = require('./ColumnType');

class StringColumnType extends ColumnType {

    getName() {

        return 'string';

    }

    supportsLength() {

        return true;

    }

    getDefaultLength() {

        return 255;

    }

    compile(driver, column) {

        switch (driver) {

            case 'mysql':

                return `VARCHAR(${column.length ?? 255})`;

            case 'sqlite':

                return 'TEXT';

            case 'postgres':

                return `VARCHAR(${column.length ?? 255})`;

            case 'mariadb':

                return `VARCHAR(${column.length ?? 255})`;

            default:

                throw new Error(

                    `Treiber ${driver} wird nicht unterstützt.`

                );

        }

    }

}

module.exports = StringColumnType;