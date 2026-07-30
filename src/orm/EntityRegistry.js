/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/orm/EntityRegistry.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Zentrale Registry für sämtliche ORM-Entitäten.
 *
 * Verantwortlich für:
 *
 * - EntityMetadata
 * - Repositories
 * - Entity-Klassen
 * - Tabellenzuordnung
 * - Namensauflösung
 *
 * ============================================================================
 */

'use strict';

const EntityMetadata = require('./EntityMetadata');

class EntityRegistry {

    constructor() {

        /**
         * Entity-Klasse -> Metadata
         */
        this.entities = new Map();

        /**
         * Tabellenname -> Metadata
         */
        this.tables = new Map();

        /**
         * Entity-Name -> Metadata
         */
        this.names = new Map();

        /**
         * Entity-Klasse -> Repository
         */
        this.repositories = new Map();

    }

    /**
     * ------------------------------------------------------------------------
     * Registrierung
     * ------------------------------------------------------------------------
     */

    register(metadata) {

        if (!(metadata instanceof EntityMetadata)) {

            throw new TypeError(

                'EntityMetadata erwartet.'

            );

        }

        const target = metadata.getTarget();

        const table = metadata.getTable();

        const name = metadata.getName();

        if (!target) {

            throw new Error(

                'Metadata besitzt keine Target-Klasse.'

            );

        }

        if (!table) {

            throw new Error(

                'Metadata besitzt keinen Tabellennamen.'

            );

        }

        if (this.entities.has(target)) {

            throw new Error(

                `Entity bereits registriert: ${name}`

            );

        }

        this.entities.set(

            target,

            metadata

        );

        this.tables.set(

            table,

            metadata

        );

        this.names.set(

            name,

            metadata

        );

        return metadata;

    }

    /**
     * ------------------------------------------------------------------------
     * Repository registrieren
     * ------------------------------------------------------------------------
     */

    registerRepository(

        entity,

        repository

    ) {

        this.repositories.set(

            entity,

            repository

        );

        return repository;

    }

    /**
     * ------------------------------------------------------------------------
     * Existiert?
     * ------------------------------------------------------------------------
     */

    has(entity) {

        return this.entities.has(entity);

    }

    hasTable(table) {

        return this.tables.has(table);

    }

    hasName(name) {

        return this.names.has(name);

    }

    hasRepository(entity) {

        return this.repositories.has(entity);

    }

    /**
     * ------------------------------------------------------------------------
     * Metadata
     * ------------------------------------------------------------------------
     */

    get(entity) {

        const metadata =

            this.entities.get(entity);

        if (!metadata) {

            throw new Error(

                'Entity nicht registriert.'

            );

        }

        return metadata;

    }

    getByName(name) {

        const metadata =

            this.names.get(name);

        if (!metadata) {

            throw new Error(

                `Unbekannte Entity: ${name}`

            );

        }

        return metadata;

    }

    getByTable(table) {

        const metadata =

            this.tables.get(table);

        if (!metadata) {

            throw new Error(

                `Unbekannte Tabelle: ${table}`

            );

        }

        return metadata;

    }

    /**
     * ------------------------------------------------------------------------
     * Repository
     * ------------------------------------------------------------------------
     */

    getRepository(entity) {

        return this.repositories.get(entity);

    }

    /**
     * ------------------------------------------------------------------------
     * Listen
     * ------------------------------------------------------------------------
     */

    getEntities() {

        return [

            ...this.entities.values()

        ];

    }

    getTables() {

        return [

            ...this.tables.keys()

        ];

    }

    getNames() {

        return [

            ...this.names.keys()

        ];

    }

    getRepositories() {

        return [

            ...this.repositories.values()

        ];

    }

    /**
     * ------------------------------------------------------------------------
     * Anzahl
     * ------------------------------------------------------------------------
     */

    count() {

        return this.entities.size;

    }

    /**
     * ------------------------------------------------------------------------
     * Registry leeren
     * ------------------------------------------------------------------------
     */

    clear() {

        this.entities.clear();

        this.tables.clear();

        this.names.clear();

        this.repositories.clear();

    }

    /**
     * ------------------------------------------------------------------------
     * Export
     * ------------------------------------------------------------------------
     */

    toJSON() {

        return {

            entities: this.getNames(),

            tables: this.getTables(),

            repositories:

                this.repositories.size,

            count: this.count()

        };

    }

}

module.exports = EntityRegistry;