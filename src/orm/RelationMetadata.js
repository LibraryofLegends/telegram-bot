/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/orm/RelationMetadata.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Beschreibt eine Beziehung zwischen zwei Entitäten.
 *
 * Unterstützt:
 *
 * - hasOne
 * - hasMany
 * - belongsTo
 * - belongsToMany
 * - manyToMany
 * - eager loading
 * - lazy loading
 * - cascade
 * - orphan removal
 *
 * ============================================================================
 */

'use strict';

class RelationMetadata {

    constructor({

        name,

        type,

        target,

        localKey = 'id',

        foreignKey = null,

        pivotTable = null,

        pivotLocalKey = null,

        pivotForeignKey = null,

        eager = false,

        lazy = true,

        nullable = true,

        cascade = [],

        orphanRemoval = false,

        inverse = null

    } = {}) {

        if (!name) {

            throw new Error(
                'Relation benötigt einen Namen.'
            );

        }

        if (!type) {

            throw new Error(
                'Relation benötigt einen Typ.'
            );

        }

        if (!target) {

            throw new Error(
                'Relation benötigt eine Ziel-Entity.'
            );

        }

        this.name = name;

        this.type = type;

        this.target = target;

        this.localKey = localKey;

        this.foreignKey = foreignKey;

        this.pivotTable = pivotTable;

        this.pivotLocalKey = pivotLocalKey;

        this.pivotForeignKey = pivotForeignKey;

        this.eager = eager;

        this.lazy = lazy;

        this.nullable = nullable;

        this.cascade = [...cascade];

        this.orphanRemoval = orphanRemoval;

        this.inverse = inverse;

    }

    /*
     * ------------------------------------------------------------------------
     * Getter
     * ------------------------------------------------------------------------
     */

    getName() {

        return this.name;

    }

    getType() {

        return this.type;

    }

    getTarget() {

        return this.target;

    }

    getLocalKey() {

        return this.localKey;

    }

    getForeignKey() {

        return this.foreignKey;

    }

    getPivotTable() {

        return this.pivotTable;

    }

    getPivotLocalKey() {

        return this.pivotLocalKey;

    }

    getPivotForeignKey() {

        return this.pivotForeignKey;

    }

    getInverse() {

        return this.inverse;

    }

    /*
     * ------------------------------------------------------------------------
     * Status
     * ------------------------------------------------------------------------
     */

    isLazy() {

        return this.lazy;

    }

    isEager() {

        return this.eager;

    }

    isNullable() {

        return this.nullable;

    }

    hasCascade(operation) {

        return this.cascade.includes(operation);

    }

    getCascadeOperations() {

        return [...this.cascade];

    }

    hasOrphanRemoval() {

        return this.orphanRemoval;

    }

    /*
     * ------------------------------------------------------------------------
     * Relationstypen
     * ------------------------------------------------------------------------
     */

    isHasOne() {

        return this.type === 'hasOne';

    }

    isHasMany() {

        return this.type === 'hasMany';

    }

    isBelongsTo() {

        return this.type === 'belongsTo';

    }

    isBelongsToMany() {

        return this.type === 'belongsToMany';

    }

    isManyToMany() {

        return this.type === 'manyToMany';

    }

    /*
     * ------------------------------------------------------------------------
     * Fluent Setter
     * ------------------------------------------------------------------------
     */

    setLazy(value = true) {

        this.lazy = value;

        return this;

    }

    setEager(value = true) {

        this.eager = value;

        return this;

    }

    setNullable(value = true) {

        this.nullable = value;

        return this;

    }

    addCascade(operation) {

        if (!this.cascade.includes(operation)) {

            this.cascade.push(operation);

        }

        return this;

    }

    /*
     * ------------------------------------------------------------------------
     * Export
     * ------------------------------------------------------------------------
     */

    toJSON() {

        return {

            name: this.name,

            type: this.type,

            target: this.target?.name,

            localKey: this.localKey,

            foreignKey: this.foreignKey,

            pivotTable: this.pivotTable,

            pivotLocalKey: this.pivotLocalKey,

            pivotForeignKey: this.pivotForeignKey,

            eager: this.eager,

            lazy: this.lazy,

            nullable: this.nullable,

            cascade: this.cascade,

            orphanRemoval: this.orphanRemoval,

            inverse: this.inverse

        };

    }

}

module.exports = RelationMetadata;