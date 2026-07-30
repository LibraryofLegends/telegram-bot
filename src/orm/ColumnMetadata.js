/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/orm/ColumnMetadata.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Beschreibt eine einzelne Datenbankspalte.
 *
 * ============================================================================
 */

'use strict';

class ColumnMetadata {

    constructor({

        name,

        property = null,

        type = 'string',

        primary = false,

        generated = false,

        autoIncrement = false,

        nullable = false,

        unique = false,

        indexed = false,

        unsigned = false,

        defaultValue = null,

        length = null,

        precision = null,

        scale = null,

        readonly = false,

        hidden = false,

        virtual = false,

        selectable = true,

        insertable = true,

        updatable = true,

        comment = ''

    } = {}) {

        if (!name) {

            throw new Error(

                'Column benötigt einen Namen.'

            );

        }

        this.name = name;

        this.property = property ?? name;

        this.type = type;

        this.primary = primary;

        this.generated = generated;

        this.autoIncrement = autoIncrement;

        this.nullable = nullable;

        this.unique = unique;

        this.indexed = indexed;

        this.unsigned = unsigned;

        this.defaultValue = defaultValue;

        this.length = length;

        this.precision = precision;

        this.scale = scale;

        this.readonly = readonly;

        this.hidden = hidden;

        this.virtual = virtual;

        this.selectable = selectable;

        this.insertable = insertable;

        this.updatable = updatable;

        this.comment = comment;

    }

    /*
     * ------------------------------------------------------------------------
     * Getter
     * ------------------------------------------------------------------------
     */

    getName() {

        return this.name;

    }

    getProperty() {

        return this.property;

    }

    getType() {

        return this.type;

    }

    getDefaultValue() {

        return this.defaultValue;

    }

    getLength() {

        return this.length;

    }

    getPrecision() {

        return this.precision;

    }

    getScale() {

        return this.scale;

    }

    getComment() {

        return this.comment;

    }

    /*
     * ------------------------------------------------------------------------
     * Status
     * ------------------------------------------------------------------------
     */

    isPrimary() {

        return this.primary;

    }

    isGenerated() {

        return this.generated;

    }

    isAutoIncrement() {

        return this.autoIncrement;

    }

    isNullable() {

        return this.nullable;

    }

    isUnique() {

        return this.unique;

    }

    isIndexed() {

        return this.indexed;

    }

    isUnsigned() {

        return this.unsigned;

    }

    isReadonly() {

        return this.readonly;

    }

    isHidden() {

        return this.hidden;

    }

    isVirtual() {

        return this.virtual;

    }

    isSelectable() {

        return this.selectable;

    }

    isInsertable() {

        return this.insertable;

    }

    isUpdatable() {

        return this.updatable;

    }

    /*
     * ------------------------------------------------------------------------
     * Fluent Setter
     * ------------------------------------------------------------------------
     */

    setDefaultValue(value) {

        this.defaultValue = value;

        return this;

    }

    setLength(length) {

        this.length = length;

        return this;

    }

    setPrecision(value) {

        this.precision = value;

        return this;

    }

    setScale(value) {

        this.scale = value;

        return this;

    }

    setComment(comment) {

        this.comment = comment;

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

            property: this.property,

            type: this.type,

            primary: this.primary,

            generated: this.generated,

            autoIncrement: this.autoIncrement,

            nullable: this.nullable,

            unique: this.unique,

            indexed: this.indexed,

            unsigned: this.unsigned,

            defaultValue: this.defaultValue,

            length: this.length,

            precision: this.precision,

            scale: this.scale,

            readonly: this.readonly,

            hidden: this.hidden,

            virtual: this.virtual,

            selectable: this.selectable,

            insertable: this.insertable,

            updatable: this.updatable,

            comment: this.comment

        };

    }

}

module.exports = ColumnMetadata;