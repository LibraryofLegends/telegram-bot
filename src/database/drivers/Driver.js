/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/database/drivers/Driver.js
 * ========================================================================
 */

'use strict';

class Driver {

    constructor(connection) {

        this.connection = connection;

    }

    /**
     * SELECT
     */

    async select(sql, bindings = []) {

        throw new Error(

            'Driver.select() muss implementiert werden.'

        );

    }

    /**
     * INSERT
     */

    async insert(sql, bindings = []) {

        throw new Error(

            'Driver.insert() muss implementiert werden.'

        );

    }

    /**
     * UPDATE
     */

    async update(sql, bindings = []) {

        throw new Error(

            'Driver.update() muss implementiert werden.'

        );

    }

    /**
     * DELETE
     */

    async delete(sql, bindings = []) {

        throw new Error(

            'Driver.delete() muss implementiert werden.'

        );

    }

    /**
     * RAW
     */

    async execute(sql, bindings = []) {

        throw new Error(

            'Driver.execute() muss implementiert werden.'

        );

    }

    /**
     * TRANSACTION
     */

    beginTransaction() {

        throw new Error(

            'Driver.beginTransaction() muss implementiert werden.'

        );

    }

    commit() {

        throw new Error(

            'Driver.commit() muss implementiert werden.'

        );

    }

    rollback() {

        throw new Error(

            'Driver.rollback() muss implementiert werden.'

        );

    }

}

module.exports = Driver;