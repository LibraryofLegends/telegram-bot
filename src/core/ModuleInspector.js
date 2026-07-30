/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleInspector.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Analysiert Module und liefert Metadaten für Debugging, Monitoring
 * und Verwaltung.
 *
 * ============================================================================
 */

'use strict';

class ModuleInspector {

    /**
     * Informationen über ein Modul abrufen.
     *
     * @param {Module} module
     * @returns {Object}
     */

    inspect(module) {

        return {

            name: module.getName(),

            version: module.getVersion(),

            description: module.getDescription(),

            dependencies: module.getDependencies(),

            enabled: module.isEnabled(),

            loaded: module.isLoaded()

        };

    }

    /**
     * Vollständigen Report erzeugen.
     *
     * @param {Module} module
     * @returns {Object}
     */

    report(module) {

        return {

            ...this.inspect(module),

            constructor: module.constructor.name,

            methods: this.getMethods(module),

            properties: this.getProperties(module),

            timestamp: new Date()

        };

    }

    /**
     * Öffentliche Methoden.
     *
     * @param {Module} module
     * @returns {Array<String>}
     */

    getMethods(module) {

        return Object.getOwnPropertyNames(

            Object.getPrototypeOf(module)

        )

            .filter(method => method !== 'constructor')

            .sort();

    }

    /**
     * Eigenschaften.
     *
     * @param {Module} module
     * @returns {Array<String>}
     */

    getProperties(module) {

        return Object.keys(module).sort();

    }

    /**
     * Abhängigkeiten.
     *
     * @param {Module} module
     * @returns {Array<String>}
     */

    getDependencies(module) {

        return module.getDependencies();

    }

    /**
     * Ist das Modul aktiv?
     *
     * @param {Module} module
     * @returns {Boolean}
     */

    isEnabled(module) {

        return module.isEnabled();

    }

    /**
     * Ist das Modul geladen?
     *
     * @param {Module} module
     * @returns {Boolean}
     */

    isLoaded(module) {

        return module.isLoaded();

    }

    /**
     * JSON-Export.
     *
     * @param {Module} module
     * @returns {Object}
     */

    toJSON(module) {

        return this.report(module);

    }

}

module.exports = ModuleInspector;