/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleMetadata.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Verwaltet die Metadaten eines Framework-Moduls.
 *
 * ============================================================================
 */

'use strict';

class ModuleMetadata {

    /**
     * Konstruktor.
     *
     * @param {Object} metadata
     */

    constructor(metadata = {}) {

        this.metadata = {

            name: metadata.name || '',

            version: metadata.version || '1.0.0',

            description: metadata.description || '',

            author: metadata.author || '',

            homepage: metadata.homepage || '',

            repository: metadata.repository || '',

            license: metadata.license || '',

            category: metadata.category || '',

            tags: Array.isArray(metadata.tags)

                ? [...metadata.tags]

                : [],

            createdAt: metadata.createdAt || new Date(),

            updatedAt: metadata.updatedAt || new Date()

        };

    }

    /**
     * Metadaten abrufen.
     *
     * @returns {Object}
     */

    get() {

        return {

            ...this.metadata,

            tags: [...this.metadata.tags]

        };

    }

    /**
     * Einzelnen Wert abrufen.
     *
     * @param {String} key
     * @param {*} defaultValue
     * @returns {*}
     */

    getValue(key, defaultValue = null) {

        return key in this.metadata

            ? this.metadata[key]

            : defaultValue;

    }

    /**
     * Wert setzen.
     *
     * @param {String} key
     * @param {*} value
     * @returns {ModuleMetadata}
     */

    setValue(key, value) {

        this.metadata[key] = value;

        this.metadata.updatedAt = new Date();

        return this;

    }

    /**
     * Tag hinzufügen.
     *
     * @param {String} tag
     * @returns {ModuleMetadata}
     */

    addTag(tag) {

        if (!this.metadata.tags.includes(tag)) {

            this.metadata.tags.push(tag);

            this.metadata.updatedAt = new Date();

        }

        return this;

    }

    /**
     * Tag entfernen.
     *
     * @param {String} tag
     * @returns {ModuleMetadata}
     */

    removeTag(tag) {

        this.metadata.tags = this.metadata.tags.filter(

            value => value !== tag

        );

        this.metadata.updatedAt = new Date();

        return this;

    }

    /**
     * Prüfen, ob ein Tag existiert.
     *
     * @param {String} tag
     * @returns {Boolean}
     */

    hasTag(tag) {

        return this.metadata.tags.includes(tag);

    }

    /**
     * Alle Tags.
     *
     * @returns {Array<String>}
     */

    getTags() {

        return [...this.metadata.tags];

    }

    /**
     * Export.
     *
     * @returns {Object}
     */

    toJSON() {

        return this.get();

    }

}

module.exports = ModuleMetadata;