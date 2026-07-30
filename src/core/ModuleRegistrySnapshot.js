/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleRegistrySnapshot.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Erstellt einen Snapshot aller aktuell registrierten Module.
 *
 * ============================================================================
 */

'use strict';

class ModuleRegistrySnapshot {

    /**
     * Konstruktor.
     *
     * @param {ModuleRegistry} registry
     */

    constructor(registry) {

        this.timestamp = new Date();

        this.modules = registry.all().map(module => ({

            name: module.getName(),

            version: module.getVersion(),

            description: module.getDescription(),

            dependencies: module.getDependencies(),

            enabled: module.isEnabled(),

            loaded: module.isLoaded()

        }));

    }

    /**
     * Zeitpunkt.
     *
     * @returns {Date}
     */

    getTimestamp() {

        return this.timestamp;

    }

    /**
     * Alle Module.
     *
     * @returns {Array<Object>}
     */

    all() {

        return [...this.modules];

    }

    /**
     * Modul anhand des Namens.
     *
     * @param {String} name
     * @returns {Object|null}
     */

    get(name) {

        return this.modules.find(

            module => module.name === name

        ) || null;

    }

    /**
     * Modul vorhanden?
     *
     * @param {String} name
     * @returns {Boolean}
     */

    has(name) {

        return this.modules.some(

            module => module.name === name

        );

    }

    /**
     * Anzahl.
     *
     * @returns {Number}
     */

    count() {

        return this.modules.length;

    }

    /**
     * Aktivierte Module.
     *
     * @returns {Array<Object>}
     */

    enabled() {

        return this.modules.filter(

            module => module.enabled

        );

    }

    /**
     * Geladene Module.
     *
     * @returns {Array<Object>}
     */

    loaded() {

        return this.modules.filter(

            module => module.loaded

        );

    }

    /**
     * JSON-Export.
     *
     * @returns {Object}
     */

    toJSON() {

        return {

            timestamp: this.timestamp,

            total: this.count(),

            modules: [...this.modules]

        };

    }

}

module.exports = ModuleRegistrySnapshot;