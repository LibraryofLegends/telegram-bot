/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/orm/EntityHydrator.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Erstellt Entity-Objekte aus Datenbankdatensätzen.
 *
 * Verantwortlich für:
 *
 * - Hydration
 * - Dehydration
 * - Identity Map
 * - Typkonvertierung
 * * Standardwerte
 * - Collections
 *
 * ============================================================================
 */

'use strict';

class EntityHydrator {

    constructor({

        registry,

        identityMap = null

    } = {}) {

        this.registry = registry;

        this.identityMap = identityMap;

    }

    /**
     * Einzelne Entity erzeugen.
     */

    hydrate(entityClass, row = {}) {

        if (!row) {

            return null;

        }

        const metadata =

            this.registry.get(entityClass);

        const primaryKey =

            metadata.getPrimaryKey();

        const id = row[primaryKey];

        /**
         * Identity Map
         */

        if (

            this.identityMap &&

            id !== undefined &&

            this.identityMap.has(

                entityClass.name,

                id

            )

        ) {

            return this.identityMap.get(

                entityClass.name,

                id

            );

        }

        const entity =

            new entityClass();

        for (

            const column of

            metadata.getColumns()

        ) {

            const property =

                column.property ??

                column.name;

            entity[property] =

                this.convertValue(

                    row[column.name],

                    column

                );

        }

        if (

            this.identityMap &&

            id !== undefined

        ) {

            this.identityMap.add(

                entityClass.name,

                id,

                entity

            );

        }

        return entity;

    }

    /**
     * Mehrere Entities erzeugen.
     */

    hydrateMany(

        entityClass,

        rows = []

    ) {

        return rows.map(

            row =>

                this.hydrate(

                    entityClass,

                    row

                )

        );

    }

    /**
     * Entity in Datenbankobjekt umwandeln.
     */

    dehydrate(entity) {

        const metadata =

            this.registry.get(

                entity.constructor

            );

        const row = {};

        for (

            const column of

            metadata.getColumns()

        ) {

            const property =

                column.property ??

                column.name;

            row[column.name] =

                this.normalizeValue(

                    entity[property],

                    column

                );

        }

        return row;

    }

    /**
     * Mehrere Entities exportieren.
     */

    dehydrateMany(

        entities = []

    ) {

        return entities.map(

            entity =>

                this.dehydrate(entity)

        );

    }

    /**
     * Typkonvertierung.
     */

    convertValue(

        value,

        column

    ) {

        if (

            value === null ||

            value === undefined

        ) {

            return value;

        }

        switch (

            column.type

        ) {

            case 'integer':

                return Number.parseInt(

                    value,

                    10

                );

            case 'float':

            case 'double':

            case 'decimal':

                return Number(value);

            case 'boolean':

                return Boolean(value);

            case 'json':

                return typeof value === 'string'

                    ? JSON.parse(value)

                    : value;

            case 'date':

            case 'datetime':

                return value instanceof Date

                    ? value

                    : new Date(value);

            default:

                return value;

        }

    }

    /**
     * Rückkonvertierung.
     */

    normalizeValue(

        value,

        column

    ) {

        if (

            value === undefined

        ) {

            return null;

        }

        switch (

            column.type

        ) {

            case 'json':

                return JSON.stringify(value);

            case 'boolean':

                return value ? 1 : 0;

            case 'date':

            case 'datetime':

                return value instanceof Date

                    ? value.toISOString()

                    : value;

            default:

                return value;

        }

    }

    /**
     * Entity aktualisieren.
     */

    fill(entity, values = {}) {

        Object.assign(

            entity,

            values

        );

        return entity;

    }

    /**
     * Klonen.
     */

    clone(entity) {

        return structuredClone(entity);

    }

}

module.exports = EntityHydrator;