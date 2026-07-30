/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleStatistics.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Ermittelt Statistiken über alle registrierten Module.
 *
 * ============================================================================
 */

'use strict';

class ModuleStatistics {

    /**
     * Konstruktor.
     *
     * @param {ModuleRegistry} registry
     */

    constructor(registry) {

        this.registry = registry;

    }

    /**
     * Gesamtanzahl.
     *
     * @returns {Number}
     */

    total() {

        return this.registry.count();

    }

    /**
     * Aktivierte Module.
     *
     * @returns {Number}
     */

    enabled() {

        return this.registry
            .all()
            .filter(module => module.isEnabled())
            .length;

    }

    /**
     * Geladene Module.
     *
     * @returns {Number}
     */

    loaded() {

        return this.registry
            .all()
            .filter(module => module.isLoaded())
            .length;

    }

    /**
     * Deaktivierte Module.
     *
     * @returns {Number}
     */

    disabled() {

        return this.registry
            .all()
            .filter(module => !module.isEnabled())
            .length;

    }

    /**
     * Nicht geladene Module.
     *
     * @returns {Number}
     */

    unloaded() {

        return this.registry
            .all()
            .filter(module => !module.isLoaded())
            .length;

    }

    /**
     * Gesamtanzahl aller Abhängigkeiten.
     *
     * @returns {Number}
     */

    dependencies() {

        let total = 0;

        for (const module of this.registry.all()) {

            total += module.getDependencies().length;

        }

        return total;

    }

    /**
     * Durchschnittliche Anzahl an Abhängigkeiten.
     *
     * @returns {Number}
     */

    averageDependencies() {

        const modules = this.total();

        if (modules === 0) {

            return 0;

        }

        return this.dependencies() / modules;

    }

    /**
     * Statistiken.
     *
     * @returns {Object}
     */

    summary() {

        return {

            total: this.total(),

            enabled: this.enabled(),

            disabled: this.disabled(),

            loaded: this.loaded(),

            unloaded: this.unloaded(),

            dependencies: this.dependencies(),

            averageDependencies: this.averageDependencies()

        };

    }

    /**
     * JSON-Export.
     *
     * @returns {Object}
     */

    toJSON() {

        return this.summary();

    }

}

module.exports = ModuleStatistics;