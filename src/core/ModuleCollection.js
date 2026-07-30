/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleCollection.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Collection für Framework-Module.
 *
 * ============================================================================
 */

'use strict';

class ModuleCollection {

    /**
     * Konstruktor.
     */

    constructor(modules = []) {

        this.modules = new Map();

        for (const module of modules) {

            this.add(module);

        }

    }

    /**
     * Modul hinzufügen.
     *
     * @param {Module} module
     * @returns {ModuleCollection}
     */

    add(module) {

        this.modules.set(

            module.getName(),

            module

        );

        return this;

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
     * Modul abrufen.
     *
     * @param {String} name
     * @returns {Module|null}
     */

    get(name) {

        return this.modules.get(name) || null;

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
     * Collection leeren.
     */

    clear() {

        this.modules.clear();

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
     * Iterator.
     */

    [Symbol.iterator]() {

        return this.modules.values();

    }

    /**
     * JSON.
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

module.exports = ModuleCollection;