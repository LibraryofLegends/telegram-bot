/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/orm/MetadataBuilder.js
 * ----------------------------------------------------------------------------
 * Fluent Builder für EntityMetadata.
 * ============================================================================
 */

'use strict';

const EntityMetadata = require('./EntityMetadata');

class MetadataBuilder {

    constructor(entityClass) {

        this.metadata = new EntityMetadata({

            name: entityClass.name,

            target: entityClass

        });

    }

    /**
     * ------------------------------------------------------------------------
     * Tabelle
     * ------------------------------------------------------------------------
     */

    table(name) {

        this.metadata.setTable(name);

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Primärschlüssel
     * ------------------------------------------------------------------------
     */

    primaryKey(name = 'id') {

        this.metadata.setPrimaryKey(name);

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Repository
     * ------------------------------------------------------------------------
     */

    repository(repositoryClass) {

        this.metadata.setOption(

            'repository',

            repositoryClass

        );

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Spalte
     * ------------------------------------------------------------------------
     */

    column(columnMetadata) {

        this.metadata.addColumn(

            columnMetadata

        );

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Beziehung
     * ------------------------------------------------------------------------
     */

    relation(relationMetadata) {

        this.metadata.addRelation(

            relationMetadata

        );

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Index
     * ------------------------------------------------------------------------
     */

    index(indexMetadata) {

        this.metadata.addIndex(

            indexMetadata

        );

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Unique
     * ------------------------------------------------------------------------
     */

    unique(uniqueMetadata) {

        this.metadata.addUnique(

            uniqueMetadata

        );

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Timestamp Support
     * ------------------------------------------------------------------------
     */

    timestamps(

        createdAt = 'created_at',

        updatedAt = 'updated_at'

    ) {

        this.metadata.enableTimestamps(

            createdAt,

            updatedAt

        );

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Soft Deletes
     * ------------------------------------------------------------------------
     */

    softDeletes(

        column = 'deleted_at'

    ) {

        this.metadata.enableSoftDeletes(

            column

        );

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Versionierung
     * ------------------------------------------------------------------------
     */

    versioning(

        column = 'version'

    ) {

        this.metadata.enableVersioning(

            column

        );

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Cache
     * ------------------------------------------------------------------------
     */

    cache(ttl = 3600) {

        this.metadata.enableCache(ttl);

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Eigene Optionen
     * ------------------------------------------------------------------------
     */

    option(key, value) {

        this.metadata.setOption(

            key,

            value

        );

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Build
     * ------------------------------------------------------------------------
     */

    build() {

        return this.metadata;

    }

}

module.exports = MetadataBuilder;