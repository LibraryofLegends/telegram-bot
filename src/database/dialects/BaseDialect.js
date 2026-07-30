/**
 * ============================================================================
 * BaseDialect
 * ============================================================================
 */

'use strict';

class BaseDialect {

    getName() {

        throw new Error(
            'getName() muss implementiert werden.'
        );

    }

    /**
     * Identifier escapen.
     */

    wrap(value) {

        return value;

    }

    /**
     * String
     */

    compileString(column) {

        throw new Error();

    }

    /**
     * Integer
     */

    compileInteger(column) {

        throw new Error();

    }

    /**
     * Boolean
     */

    compileBoolean(column) {

        throw new Error();

    }

    /**
     * Float
     */

    compileFloat(column) {

        throw new Error();

    }

    /**
     * Decimal
     */

    compileDecimal(column) {

        throw new Error();

    }

    /**
     * UUID
     */

    compileUUID(column) {

        throw new Error();

    }

    /**
     * JSON
     */

    compileJson(column) {

        throw new Error();

    }

    /**
     * Date
     */

    compileDate(column) {

        throw new Error();

    }

    /**
     * DateTime
     */

    compileDateTime(column) {

        throw new Error();

    }

}