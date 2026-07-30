/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/orm/EntityPersister.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Verantwortlich für das Speichern, Aktualisieren und Löschen
 * von Entitäten.
 *
 * Wird verwendet von:
 *
 * - UnitOfWork
 * - EntityManager
 *
 * ============================================================================
 */

'use strict';

class EntityPersister {

    constructor({

        driver,

        hydrator,

        registry

    } = {}) {

        this.driver = driver;

        this.hydrator = hydrator;

        this.registry = registry;

    }

    /**
     * ------------------------------------------------------------------------
     * INSERT
     * ------------------------------------------------------------------------
     */

    async insert(entity) {

        const metadata =

            this.registry.get(

                entity.constructor

            );

        const row =

            this.hydrator.dehydrate(

                entity

            );

        const columns = [];

        const placeholders = [];

        const bindings = [];

        for (

            const [column, value]

            of Object.entries(row)

        ) {

            if (

                value === undefined

            ) {

                continue;

            }

            columns.push(column);

            placeholders.push('?');

            bindings.push(value);

        }

        const sql =

            `INSERT INTO ${metadata.getTable()} (${columns.join(', ')})
VALUES (${placeholders.join(', ')})`;

        return this.driver.insert(

            sql,

            bindings

        );

    }

    /**
     * ------------------------------------------------------------------------
     * UPDATE
     * ------------------------------------------------------------------------
     */

    async update(entity) {

        const metadata =

            this.registry.get(

                entity.constructor

            );

        const primaryKey =

            metadata.getPrimaryKey();

        const row =

            this.hydrator.dehydrate(

                entity

            );

        const assignments = [];

        const bindings = [];

        for (

            const [column, value]

            of Object.entries(row)

        ) {

            if (

                column === primaryKey

            ) {

                continue;

            }

            assignments.push(

                `${column} = ?`

            );

            bindings.push(value);

        }

        bindings.push(

            row[primaryKey]

        );

        const sql =

            `UPDATE ${metadata.getTable()}
SET ${assignments.join(', ')}
WHERE ${primaryKey} = ?`;

        return this.driver.update(

            sql,

            bindings

        );

    }

    /**
     * ------------------------------------------------------------------------
     * DELETE
     * ------------------------------------------------------------------------
     */

    async delete(entity) {

        const metadata =

            this.registry.get(

                entity.constructor

            );

        const primaryKey =

            metadata.getPrimaryKey();

        const row =

            this.hydrator.dehydrate(

                entity

            );

        /**
         * Soft Delete
         */

        if (

            metadata.softDeletes?.enabled

        ) {

            const sql =

                `UPDATE ${metadata.getTable()}
SET ${metadata.softDeletes.column} = ?
WHERE ${primaryKey} = ?`;

            return this.driver.update(

                sql,

                [

                    new Date().toISOString(),

                    row[primaryKey]

                ]

            );

        }

        /**
         * Hard Delete
         */

        const sql =

            `DELETE FROM ${metadata.getTable()}
WHERE ${primaryKey} = ?`;

        return this.driver.delete(

            sql,

            [

                row[primaryKey]

            ]

        );

    }

    /**
     * ------------------------------------------------------------------------
     * UPSERT
     * ------------------------------------------------------------------------
     */

    async save(entity) {

        const metadata =

            this.registry.get(

                entity.constructor

            );

        const primaryKey =

            metadata.getPrimaryKey();

        if (

            entity[primaryKey] === null ||

            entity[primaryKey] === undefined

        ) {

            return this.insert(

                entity

            );

        }

        return this.update(

            entity

        );

    }

    /**
     * ------------------------------------------------------------------------
     * INSERT MANY
     * ------------------------------------------------------------------------
     */

    async insertMany(

        entities = []

    ) {

        const results = [];

        for (

            const entity

            of entities

        ) {

            results.push(

                await this.insert(

                    entity

                )

            );

        }

        return results;

    }

    /**
     * ------------------------------------------------------------------------
     * UPDATE MANY
     * ------------------------------------------------------------------------
     */

    async updateMany(

        entities = []

    ) {

        const results = [];

        for (

            const entity

            of entities

        ) {

            results.push(

                await this.update(

                    entity

                )

            );

        }

        return results;

    }

    /**
     * ------------------------------------------------------------------------
     * DELETE MANY
     * ------------------------------------------------------------------------
     */

    async deleteMany(

        entities = []

    ) {

        const results = [];

        for (

            const entity

            of entities

        ) {

            results.push(

                await this.delete(

                    entity

                )

            );

        }

        return results;

    }

}

module.exports = EntityPersister;