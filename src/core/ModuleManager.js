/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleManager.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Zentrale Verwaltung aller Framework-Module.
 *
 * ============================================================================
 */

'use strict';

class ModuleManager {

    /**
     * Konstruktor.
     *
     * @param {ModuleLoader} loader
     * @param {ModuleRegistry} registry
     * @param {Object} logger
     */

    constructor(

        loader,

        registry,

        logger = console

    ) {

        this.loader = loader;

        this.registry = registry;

        this.logger = logger;

    }

    /**
     * Modul registrieren.
     *
     * @param {Function|Module} module
     * @returns {Promise<Module>}
     */

    async register(module) {

        return this.loader.load(module);

    }

    /**
     * Mehrere Module registrieren.
     *
     * @param {Array} modules
     */

    async registerMany(modules = []) {

        await this.loader.loadMany(modules);

    }

    /**
     * Modul starten.
     *
     * @param {String} name
     */

    async start(name) {

        return this.loader.boot(name);

    }

    /**
     * Alle Module starten.
     */

    async startAll() {

        await this.loader.bootAll();

    }

    /**
     * Modul stoppen.
     *
     * @param {String} name
     */

    async stop(name) {

        return this.loader.shutdown(name);

    }

    /**
     * Alle Module stoppen.
     */

    async stopAll() {

        await this.loader.shutdownAll();

    }

    /**
     * Modul abrufen.
     *
     * @param {String} name
     * @returns {Module}
     */

    get(name) {

        return this.registry.get(name);

    }

    /**
     * Existiert ein Modul?
     *
     * @param {String} name
     * @returns {Boolean}
     */

    has(name) {

        return this.registry.has(name);

    }

    /**
     * Alle Module.
     *
     * @returns {Array}
     */

    all() {

        return this.registry.all();

    }

    /**
     * Anzahl Module.
     *
     * @returns {Number}
     */

    count() {

        return this.registry.count();

    }

}

module.exports = ModuleManager;