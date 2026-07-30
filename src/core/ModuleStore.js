/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleStore.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Zentraler Speicher für alle registrierten Module.
 *
 * ============================================================================
 */

'use strict';

class ModuleStore {

    /**
     * Konstruktor.
     */

    constructor() {

        this.modules = new Map();

    }

    /**
     * Modul speichern.
     *
     * @param {Module} module
     * @returns {ModuleStore}
     */

    add(module) {

        this.modules.set(

            module.getName(),

            module

        );

        return this;

    }

    /**
     * Modul abrufen.
     *
     * @param {String} name
     * @returns {Module|null}
     */

    get(name) {

        return this.modules.get(name) || null;

    }

    /**
     * Modul entfernen.
     *
     * @param {String} name
     * @returns {Boolean}
     */

    remove(name) {

        return this.modules.delete(name);

    }

    /**
     * Modul vorhanden?
     *
     * @param {String} name
     * @returns {Boolean}
     */

    has(name) {

        return this.modules.has(name);

    }

    /**
     * Anzahl Module.
     *
     * @returns {Number}
     */

    count() {

        return this.modules.size;

    }

    /**
     * Alle Module.
     *
     * @returns {Array<Module>}
     */

    all() {

        return [

            ...this.modules.values()

        ];

    }

    /**
     * Alle Modulnamen.
     *
     * @returns {Array<String>}
     */

    names() {

        return [

            ...this.modules.keys()

        ];

    }

    /**
     * Aktivierte Module.
     *
     * @returns {Array<Module>}
     */

    enabled() {

        return this.all().filter(

            module => module.isEnabled()

        );

    }

    /**
     * Geladene Module.
     *
     * @returns {Array<Module>}
     */

    loaded() {

        return this.all().filter(

            module => module.isLoaded()

        );

    }

    /**
     * Collection leeren.
     */

    clear() {

        this.modules.clear();

    }

    /**
     * Iterator.
     */

    [Symbol.iterator]() {

        return this.modules.values();

    }

    /**
     * JSON-Export.
     *
     * @returns {Array<Object>}
     */

    toJSON() {

        return this.all().map(

            module => ({

                name: module.getName(),

                version: module.getVersion(),

                enabled: module.isEnabled(),

                loaded: module.isLoaded()

            })

        );

    }

}

module.exports = ModuleStore;