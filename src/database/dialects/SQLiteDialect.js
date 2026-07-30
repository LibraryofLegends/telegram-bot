'use strict';

const BaseDialect = require('./BaseDialect');

class SQLiteDialect extends BaseDialect {

    getName() {

        return 'sqlite';

    }

    wrap(name) {

        return `"${name}"`;

    }

    compileString() {

        return 'TEXT';

    }

    compileInteger() {

        return 'INTEGER';

    }

    compileBoolean() {

        return 'INTEGER';

    }

    compileFloat() {

        return 'REAL';

    }

    compileDecimal() {

        return 'NUMERIC';

    }

    compileUUID() {

        return 'TEXT';

    }

    compileJson() {

        return 'TEXT';

    }

    compileDate() {

        return 'TEXT';

    }

    compileDateTime() {

        return 'TEXT';

    }

}