/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleLoader.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Lädt, registriert und initialisiert Framework-Module.
 *
 * ============================================================================
 */

'use strict';

class ModuleLoader {

    /**
     * Konstruktor.
     *
     * @param {ModuleRegistry} registry
     * @param {Application} application
     * @param {Object} logger
     */

    constructor(

        registry,

        application,

        logger = console

    ) {

        this.registry = registry;

        this.application = application;

        this.logger = logger;

    }

    /**
     * Einzelnes Modul laden.
     *
     * @param {Function|Module} ModuleClass
     * @returns {Module}
     */

    async load(ModuleClass) {

        const module =

            typeof ModuleClass === 'function'

                ? new ModuleClass()

                : ModuleClass;

        module.setApplication(

            this.application

        );

        if (

            typeof module.register === 'function'

        ) {

            this.logger.info(

                `[Module] Register: ${module.getName()}`

            );

            await module.register();

        }

        this.registry.register(

            module

        );

        return module;

    }

    /**
     * Mehrere Module laden.
     *
     * @param {Array}
     */

    async loadMany(modules = []) {

        for (

            const module

            of modules

        ) {

            await this.load(module);

        }

    }

    /**
     * Modul starten.
     *
     * @param {String} name
     */

    async boot(name) {

        const module =

            this.registry.get(name);

        if (

            !module.isLoaded()

        ) {

            this.logger.info(

                `[Module] Boot: ${module.getName()}`

            );

            await module.boot();

        }

        return module;

    }

    /**
     * Alle Module starten.
     */

    async bootAll() {

        await this.registry.boot();

    }

    /**
     * Modul stoppen.
     *
     * @param {String} name
     */

    async shutdown(name) {

        const module =

            this.registry.get(name);

        if (

            module.isLoaded()

        ) {

            this.logger.info(

                `[Module] Shutdown: ${module.getName()}`

            );

            await module.shutdown();

        }

        return module;

    }

    /**
     * Alle Module stoppen.
     */

    async shutdownAll() {

        await this.registry.shutdown();

    }

}

module.exports = ModuleLoader;