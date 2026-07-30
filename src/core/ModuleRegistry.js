/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleRegistry.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Verwaltet sämtliche Module des Frameworks.
 *
 * ============================================================================
 */

'use strict';

class ModuleRegistry {

    constructor(logger = console) {

        this.logger = logger;

        this.modules = new Map();

    }

    /**
     * Modul registrieren.
     *
     * @param {Module} module
     * @returns {ModuleRegistry}
     */

    register(module) {

        const name = module.getName();

        if (this.modules.has(name)) {

            throw new Error(

                `Modul "${name}" ist bereits registriert.`

            );

        }

        this.modules.set(

            name,

            module

        );

        return this;

    }

    /**
     * Mehrere Module registrieren.
     *
     * @param {Array<Module>} modules
     * @returns {ModuleRegistry}
     */

    registerMany(modules = []) {

        for (const module of modules) {

            this.register(module);

        }

        return this;

    }

    /**
     * Modul abrufen.
     *
     * @param {String} name
     * @returns {Module}
     */

    get(name) {

        if (!this.modules.has(name)) {

            throw new Error(

                `Modul "${name}" wurde nicht gefunden.`

            );

        }

        return this.modules.get(name);

    }

    /**
     * Existiert ein Modul?
     *
     * @param {String} name
     * @returns {Boolean}
     */

    has(name) {

        return this.modules.has(name);

    }

    /**
     * Alle Module laden.
     */

    async boot() {

        for (const module of this.modules.values()) {

            if (!module.isEnabled()) {

                continue;

            }

            this.logger.info(

                `[Module] Boot: ${module.getName()}`

            );

            await module.boot();

        }

    }

    /**
     * Alle Module herunterfahren.
     */

    async shutdown() {

        const modules = [

            ...this.modules.values()

        ].reverse();

        for (const module of modules) {

            if (!module.isLoaded()) {

                continue;

            }

            this.logger.info(

                `[Module] Shutdown: ${module.getName()}`

            );

            await module.shutdown();

        }

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
     * Anzahl Module.
     *
     * @returns {Number}
     */

    count() {

        return this.modules.size;

    }

    /**
     * Registry leeren.
     */

    clear() {

        this.modules.clear();

    }

}

module.exports = ModuleRegistry;