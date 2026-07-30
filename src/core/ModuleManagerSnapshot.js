/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleManagerSnapshot.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Erstellt einen Snapshot des aktuellen ModuleManagers.
 *
 * ============================================================================
 */

'use strict';

class ModuleManagerSnapshot {

    /**
     * Konstruktor.
     *
     * @param {ModuleManager} manager
     */

    constructor(manager) {

        this.createdAt = new Date();

        this.modules = manager.all().map(module => ({

            name: module.getName(),

            version: module.getVersion(),

            description: module.getDescription(),

            enabled: module.isEnabled(),

            loaded: module.isLoaded(),

            dependencies: module.getDependencies()

        }));

    }

    /**
     * Zeitpunkt.
     *
     * @returns {Date}
     */

    getCreatedAt() {

        return this.createdAt;

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
     * Modul finden.
     *
     * @param {String} name
     * @returns {Object|null}
     */

    find(name) {

        return this.modules.find(

            module => module.name === name

        ) || null;

    }

    /**
     * Existiert ein Modul?
     *
     * @param {String} name
     * @returns {Boolean}
     */

    has(name) {

        return this.find(name) !== null;

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
     * Deaktivierte Module.
     *
     * @returns {Array<Object>}
     */

    disabled() {

        return this.modules.filter(

            module => !module.enabled

        );

    }

    /**
     * Nicht geladene Module.
     *
     * @returns {Array<Object>}
     */

    unloaded() {

        return this.modules.filter(

            module => !module.loaded

        );

    }

    /**
     * JSON-Export.
     *
     * @returns {Object}
     */

    toJSON() {

        return {

            createdAt: this.createdAt,

            total: this.count(),

            modules: [...this.modules]

        };

    }

}

module.exports = ModuleManagerSnapshot;