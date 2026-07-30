/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleManifest.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Enthält sämtliche Metadaten eines Framework-Moduls.
 *
 * ============================================================================
 */

'use strict';

class ModuleManifest {

    /**
     * Konstruktor.
     */

    constructor({

        name,

        version = '1.0.0',

        description = '',

        author = '',

        homepage = '',

        license = 'MIT',

        priority = 100,

        dependencies = [],

        optionalDependencies = [],

        providers = [],

        commands = [],

        migrations = [],

        seeders = [],

        entities = [],

        services = [],

        enabled = true

    } = {}) {

        if (!name) {

            throw new Error(

                'Ein Modul benötigt einen Namen.'

            );

        }

        this.name = name;

        this.version = version;

        this.description = description;

        this.author = author;

        this.homepage = homepage;

        this.license = license;

        this.priority = priority;

        this.dependencies = [...dependencies];

        this.optionalDependencies = [...optionalDependencies];

        this.providers = [...providers];

        this.commands = [...commands];

        this.migrations = [...migrations];

        this.seeders = [...seeders];

        this.entities = [...entities];

        this.services = [...services];

        this.enabled = enabled;

    }

    /**
     * Name.
     */

    getName() {

        return this.name;

    }

    /**
     * Version.
     */

    getVersion() {

        return this.version;

    }

    /**
     * Priorität.
     */

    getPriority() {

        return this.priority;

    }

    /**
     * Abhängigkeiten.
     */

    getDependencies() {

        return [...this.dependencies];

    }

    /**
     * Optionale Abhängigkeiten.
     */

    getOptionalDependencies() {

        return [...this.optionalDependencies];

    }

    /**
     * Provider.
     */

    getProviders() {

        return [...this.providers];

    }

    /**
     * Commands.
     */

    getCommands() {

        return [...this.commands];

    }

    /**
     * Migrationen.
     */

    getMigrations() {

        return [...this.migrations];

    }

    /**
     * Seeder.
     */

    getSeeders() {

        return [...this.seeders];

    }

    /**
     * Entities.
     */

    getEntities() {

        return [...this.entities];

    }

    /**
     * Services.
     */

    getServices() {

        return [...this.services];

    }

    /**
     * Aktiv?
     */

    isEnabled() {

        return this.enabled;

    }

    /**
     * Aktivieren.
     */

    enable() {

        this.enabled = true;

        return this;

    }

    /**
     * Deaktivieren.
     */

    disable() {

        this.enabled = false;

        return this;

    }

    /**
     * JSON Export.
     */

    toJSON() {

        return {

            name: this.name,

            version: this.version,

            description: this.description,

            author: this.author,

            homepage: this.homepage,

            license: this.license,

            priority: this.priority,

            dependencies: [...this.dependencies],

            optionalDependencies: [...this.optionalDependencies],

            providers: [...this.providers],

            commands: [...this.commands],

            migrations: [...this.migrations],

            seeders: [...this.seeders],

            entities: [...this.entities],

            services: [...this.services],

            enabled: this.enabled

        };

    }

}

module.exports = ModuleManifest;