/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleReport.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Erstellt einen vollständigen Report aller registrierten Module.
 *
 * ============================================================================
 */

'use strict';

class ModuleReport {

    /**
     * Konstruktor.
     *
     * @param {ModuleRegistry} registry
     */

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    /**
     * Report erzeugen.
     *
     * @returns {Array<Object>}
     */

    generate() {

        return this.registry.all().map(module => ({

            name: module.getName(),

            version: module.getVersion(),

            description: module.getDescription(),

            dependencies: module.getDependencies(),

            enabled: module.isEnabled(),

            loaded: module.isLoaded()

        }));

    }

    /**
     * Anzahl Module.
     *
     * @returns {Number}
     */

    count() {

        return this.registry.count();

    }

    /**
     * Aktivierte Module.
     *
     * @returns {Number}
     */

    enabled() {

        return this.generate()

            .filter(module => module.enabled)

            .length;

    }

    /**
     * Geladene Module.
     *
     * @returns {Number}
     */

    loaded() {

        return this.generate()

            .filter(module => module.loaded)

            .length;

    }

    /**
     * Zusammenfassung.
     *
     * @returns {Object}
     */

    summary() {

        return {

            createdAt: this.createdAt,

            total: this.count(),

            enabled: this.enabled(),

            loaded: this.loaded()

        };

    }

    /**
     * Gesamter Report.
     *
     * @returns {Object}
     */

    toJSON() {

        return {

            summary: this.summary(),

            modules: this.generate()

        };

    }

}

module.exports = ModuleReport;