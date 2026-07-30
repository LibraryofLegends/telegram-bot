/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/database/schema/ColumnDefinition.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Definition einer Datenbankspalte.
 *
 * ============================================================================
 */

'use strict';

class ColumnDefinition {

    constructor({

        name,

        type = 'string',

        length = null,

        precision = null,

        scale = null

    } = {}) {

        if (!name) {

            throw new Error(

                'Column benötigt einen Namen.'

            );

        }

        this.name = name;

        this.type = type;

        this.length = length;

        this.precision = precision;

        this.scale = scale;

        this.nullable = false;

        this.defaultValue = undefined;

        this.primary = false;

        this.unique = false;

        this.index = false;

        this.unsigned = false;

        this.autoIncrement = false;

        this.generated = false;

        this.charset = null;

        this.collation = null;

        this.comment = '';

        this.after = null;

        this.first = false;

        this.virtual = false;

        this.stored = false;

        this.invisible = false;

    }

    /*
     * ------------------------------------------------------------------------
     * Fluent API
     * ------------------------------------------------------------------------
     */

    nullable(value = true) {

        this.nullable = value;

        return this;

    }

    default(value) {

        this.defaultValue = value;

        return this;

    }

    primary(value = true) {

        this.primary = value;

        return this;

    }

    unique(value = true) {

        this.unique = value;

        return this;

    }

    index(value = true) {

        this.index = value;

        return this;

    }

    unsigned(value = true) {

        this.unsigned = value;

        return this;

    }

    autoIncrement(value = true) {

        this.autoIncrement = value;

        this.generated = value;

        return this;

    }

    generated(value = true) {

        this.generated = value;

        return this;

    }

    charset(value) {

        this.charset = value;

        return this;

    }

    collation(value) {

        this.collation = value;

        return this;

    }

    comment(value) {

        this.comment = value;

        return this;

    }

    after(column) {

        this.after = column;

        return this;

    }

    first(value = true) {

        this.first = value;

        return this;

    }

    invisible(value = true) {

        this.invisible = value;

        return this;

    }

    virtual(value = true) {

        this.virtual = value;

        return this;

    }

    stored(value = true) {

        this.stored = value;

        return this;

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

    getLength() {

        return this.length;

    }

    getPrecision() {

        return this.precision;

    }

    getScale() {

        return this.scale;

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

            length: this.length,

            precision: this.precision,

            scale: this.scale,

            nullable: this.nullable,

            defaultValue: this.defaultValue,

            primary: this.primary,

            unique: this.unique,

            index: this.index,

            unsigned: this.unsigned,

            autoIncrement: this.autoIncrement,

            generated: this.generated,

            charset: this.charset,

            collation: this.collation,

            comment: this.comment,

            after: this.after,

            first: this.first,

            invisible: this.invisible,

            virtual: this.virtual,

            stored: this.stored

        };

    }

}

module.exports = ColumnDefinition;