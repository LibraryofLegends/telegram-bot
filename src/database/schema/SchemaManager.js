/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/database/schema/SchemaManager.js
 * ============================================================================
 */

'use strict';

const TableBlueprint = require('./TableBlueprint');

class SchemaManager {

    constructor(driver) {

        this.driver = driver;

    }

    /**
     * Tabelle erstellen.
     */

    create(name, callback) {

        const blueprint =

            new TableBlueprint(name);

        callback(blueprint);

        return this.execute(

            blueprint

        );

    }

    /**
     * Tabelle ändern.
     */

    table(name, callback) {

        const blueprint =

            new TableBlueprint(

                name,

                true

            );

        callback(blueprint);

        return this.execute(

            blueprint

        );

    }

    /**
     * Tabelle löschen.
     */

    async drop(name) {

        return this.driver.execute(

            `DROP TABLE IF EXISTS ${name}`

        );

    }

    /**
     * Tabelle umbenennen.
     */

    async rename(

        from,

        to

    ) {

        return this.driver.execute(

            `ALTER TABLE ${from} RENAME TO ${to}`

        );

    }

    /**
     * Blueprint ausführen.
     */

    async execute(

        blueprint

    ) {

        const sql =

            blueprint.compile();

        for (

            const statement

            of sql

        ) {

            await this.driver.execute(

                statement

            );

        }

    }

}

module.exports = SchemaManager;