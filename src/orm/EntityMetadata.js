/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/orm/EntityMetadata.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Enthält sämtliche Metadaten einer Entität.
 *
 * Wird verwendet von:
 *
 * - EntityManager
 * - Repository
 * - Hydrator
 * - Persister
 * - Validator
 * - Migration Generator
 * - Admin Generator
 *
 * ============================================================================
 */

'use strict';

class EntityMetadata {

    /**
     * @param {Object} options
     */
    constructor(options = {}) {

        this.name = options.name ?? '';

        this.target = options.target ?? null;

        this.table = options.table ?? '';

        this.primaryKey = options.primaryKey ?? 'id';

        this.columns = [];

        this.relations = [];

        this.indexes = [];

        this.uniques = [];

        this.timestamps = {

            enabled: false,

            createdAt: 'created_at',

            updatedAt: 'updated_at'

        };

        this.softDeletes = {

            enabled: false,

            column: 'deleted_at'

        };

        this.versioning = {

            enabled: false,

            column: 'version'

        };

        this.cache = {

            enabled: false,

            ttl: 0

        };

        this.options = {};

    }

    /**
     * ------------------------------------------------------------------------
     * Grunddaten
     * ------------------------------------------------------------------------
     */

    setName(name) {

        this.name = name;

        return this;

    }

    getName() {

        return this.name;

    }

    setTarget(target) {

        this.target = target;

        return this;

    }

    getTarget() {

        return this.target;

    }

    setTable(table) {

        this.table = table;

        return this;

    }

    getTable() {

        return this.table;

    }

    setPrimaryKey(primaryKey) {

        this.primaryKey = primaryKey;

        return this;

    }

    getPrimaryKey() {

        return this.primaryKey;

    }

    /**
     * ------------------------------------------------------------------------
     * Spalten
     * ------------------------------------------------------------------------
     */

    addColumn(column) {

        this.columns.push(column);

        return this;

    }

    getColumns() {

        return [...this.columns];

    }

    hasColumn(name) {

        return this.columns.some(

            column => column.name === name

        );

    }

    getColumn(name) {

        return this.columns.find(

            column => column.name === name

        );

    }

    /**
     * ------------------------------------------------------------------------
     * Beziehungen
     * ------------------------------------------------------------------------
     */

    addRelation(relation) {

        this.relations.push(relation);

        return this;

    }

    getRelations() {

        return [...this.relations];

    }

    getRelation(name) {

        return this.relations.find(

            relation => relation.name === name

        );

    }

    /**
     * ------------------------------------------------------------------------
     * Indexe
     * ------------------------------------------------------------------------
     */

    addIndex(index) {

        this.indexes.push(index);

        return this;

    }

    getIndexes() {

        return [...this.indexes];

    }

    /**
     * ------------------------------------------------------------------------
     * Unique Keys
     * ------------------------------------------------------------------------
     */

    addUnique(unique) {

        this.uniques.push(unique);

        return this;

    }

    getUniques() {

        return [...this.uniques];

    }

    /**
     * ------------------------------------------------------------------------
     * Timestamp Support
     * ------------------------------------------------------------------------
     */

    enableTimestamps(

        createdAt = 'created_at',

        updatedAt = 'updated_at'

    ) {

        this.timestamps.enabled = true;

        this.timestamps.createdAt = createdAt;

        this.timestamps.updatedAt = updatedAt;

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Soft Deletes
     * ------------------------------------------------------------------------
     */

    enableSoftDeletes(

        column = 'deleted_at'

    ) {

        this.softDeletes.enabled = true;

        this.softDeletes.column = column;

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Optimistic Locking
     * ------------------------------------------------------------------------
     */

    enableVersioning(

        column = 'version'

    ) {

        this.versioning.enabled = true;

        this.versioning.column = column;

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Cache
     * ------------------------------------------------------------------------
     */

    enableCache(ttl = 3600) {

        this.cache.enabled = true;

        this.cache.ttl = ttl;

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Optionen
     * ------------------------------------------------------------------------
     */

    setOption(key, value) {

        this.options[key] = value;

        return this;

    }

    getOption(key, defaultValue = null) {

        return this.options[key] ?? defaultValue;

    }

    /**
     * ------------------------------------------------------------------------
     * Export
     * ------------------------------------------------------------------------
     */

    toJSON() {

        return {

            name: this.name,

            table: this.table,

            target: this.target,

            primaryKey: this.primaryKey,

            columns: this.columns,

            relations: this.relations,

            indexes: this.indexes,

            uniques: this.uniques,

            timestamps: this.timestamps,

            softDeletes: this.softDeletes,

            versioning: this.versioning,

            cache: this.cache,

            options: this.options

        };

    }

}

module.exports = EntityMetadata;