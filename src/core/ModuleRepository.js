/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleRepository.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Repository zur Verwaltung aller registrierten Module.
 *
 * ============================================================================
 */

'use strict';

class ModuleRepository {

    /**
     * Konstruktor.
     */

    constructor() {

        this.modules = new Map();

    }

    /**
     * Modul registrieren.
     *
     * @param {Module} module
     * @returns {ModuleRepository}
     */

    register(module) {

        this.modules.set(

            module.getName(),

            module

        );

        return this;

    }

    /**
     * Mehrere Module registrieren.
     *
     * @param {Array<Module>} modules
     * @returns {ModuleRepository}
     */

    registerMany(modules) {

        for (const module of modules) {

            this.register(module);

        }

        return this;

    }

    /**
     * Modul abrufen.
     *
     * @param {String} name
     * @returns {Module|null}
     */

    find(name) {

        return this.modules.get(name) || null;

    }

    /**
     * Modul vorhanden?
     *
     * @param {String} name
     * @returns {Boolean}
     */

    exists(name) {

        return this.modules.has(name);

    }

    /**
     * Modul entfernen.
     *
     * @param {String} name
     * @returns {Boolean}
     */

    unregister(name) {

        return this.modules.delete(name);

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
     * Anzahl.
     *
     * @returns {Number}
     */

    count() {

        return this.modules.size;

    }

    /**
     * Repository leeren.
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

        return this.all().map(module => ({

            name: module.getName(),

            version: module.getVersion(),

            enabled: module.isEnabled(),

            loaded: module.isLoaded()

        }));

    }

}

module.exports = ModuleRepository;