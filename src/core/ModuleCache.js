/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleCache.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Cache für Modulinstanzen und zugehörige Laufzeitdaten.
 *
 * ============================================================================
 */

'use strict';

class ModuleCache {

    /**
     * Konstruktor.
     */

    constructor() {

        this.cache = new Map();

    }

    /**
     * Eintrag speichern.
     *
     * @param {String} key
     * @param {*} value
     * @returns {ModuleCache}
     */

    set(key, value) {

        this.cache.set(key, value);

        return this;

    }

    /**
     * Eintrag abrufen.
     *
     * @param {String} key
     * @param {*} defaultValue
     * @returns {*}
     */

    get(key, defaultValue = null) {

        return this.cache.has(key)

            ? this.cache.get(key)

            : defaultValue;

    }

    /**
     * Existiert ein Eintrag?
     *
     * @param {String} key
     * @returns {Boolean}
     */

    has(key) {

        return this.cache.has(key);

    }

    /**
     * Eintrag entfernen.
     *
     * @param {String} key
     * @returns {Boolean}
     */

    remove(key) {

        return this.cache.delete(key);

    }

    /**
     * Cache leeren.
     */

    clear() {

        this.cache.clear();

    }

    /**
     * Anzahl Einträge.
     *
     * @returns {Number}
     */

    count() {

        return this.cache.size;

    }

    /**
     * Alle Schlüssel.
     *
     * @returns {Array<String>}
     */

    keys() {

        return [

            ...this.cache.keys()

        ];

    }

    /**
     * Alle Werte.
     *
     * @returns {Array}
     */

    values() {

        return [

            ...this.cache.values()

        ];

    }

    /**
     * Alle Einträge.
     *
     * @returns {Array}
     */

    entries() {

        return [

            ...this.cache.entries()

        ];

    }

    /**
     * Iterator.
     */

    [Symbol.iterator]() {

        return this.cache[Symbol.iterator]();

    }

    /**
     * JSON-Export.
     *
     * @returns {Object}
     */

    toJSON() {

        return Object.fromEntries(

            this.cache.entries()

        );

    }

}

module.exports = ModuleCache;