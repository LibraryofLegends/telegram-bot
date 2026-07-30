/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleSnapshot.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Erstellt einen unveränderlichen Snapshot eines Moduls für Debugging,
 * Monitoring und Statusberichte.
 *
 * ============================================================================
 */

'use strict';

class ModuleSnapshot {

    /**
     * Konstruktor.
     *
     * @param {Module} module
     */

    constructor(module) {

        this.timestamp = new Date();

        this.name = module.getName();

        this.version = module.getVersion();

        this.description = module.getDescription();

        this.dependencies = [

            ...module.getDependencies()

        ];

        this.enabled = module.isEnabled();

        this.loaded = module.isLoaded();

    }

    /**
     * Name.
     *
     * @returns {String}
     */

    getName() {

        return this.name;

    }

    /**
     * Version.
     *
     * @returns {String}
     */

    getVersion() {

        return this.version;

    }

    /**
     * Beschreibung.
     *
     * @returns {String}
     */

    getDescription() {

        return this.description;

    }

    /**
     * Abhängigkeiten.
     *
     * @returns {Array<String>}
     */

    getDependencies() {

        return [

            ...this.dependencies

        ];

    }

    /**
     * Aktiv?
     *
     * @returns {Boolean}
     */

    isEnabled() {

        return this.enabled;

    }

    /**
     * Geladen?
     *
     * @returns {Boolean}
     */

    isLoaded() {

        return this.loaded;

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
     * JSON-Export.
     *
     * @returns {Object}
     */

    toJSON() {

        return {

            timestamp: this.timestamp,

            name: this.name,

            version: this.version,

            description: this.description,

            dependencies: [

                ...this.dependencies

            ],

            enabled: this.enabled,

            loaded: this.loaded

        };

    }

}

module.exports = ModuleSnapshot;