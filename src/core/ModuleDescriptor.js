/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleDescriptor.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Beschreibt den aktuellen Zustand eines geladenen Moduls.
 *
 * ============================================================================
 */

'use strict';

class ModuleDescriptor {

    /**
     * Konstruktor.
     */

    constructor(module) {

        this.module = module;

        this.name = module.getName();

        this.version = module.getVersion();

        this.loaded = false;

        this.enabled = true;

        this.registeredAt = null;

        this.bootedAt = null;

        this.shutdownAt = null;

        this.loadTime = 0;

    }

    /**
     * Registrierung.
     */

    markRegistered() {

        this.registeredAt = new Date();

        return this;

    }

    /**
     * Boot abgeschlossen.
     */

    markBooted(loadTime = 0) {

        this.loaded = true;

        this.bootedAt = new Date();

        this.loadTime = loadTime;

        return this;

    }

    /**
     * Shutdown.
     */

    markShutdown() {

        this.loaded = false;

        this.shutdownAt = new Date();

        return this;

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
     * Aktiv?
     */

    isEnabled() {

        return this.enabled;

    }

    /**
     * Geladen?
     */

    isLoaded() {

        return this.loaded;

    }

    /**
     * Modul.
     */

    getModule() {

        return this.module;

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
     * Ladezeit.
     */

    getLoadTime() {

        return this.loadTime;

    }

    /**
     * JSON.
     */

    toJSON() {

        return {

            name: this.name,

            version: this.version,

            enabled: this.enabled,

            loaded: this.loaded,

            registeredAt: this.registeredAt,

            bootedAt: this.bootedAt,

            shutdownAt: this.shutdownAt,

            loadTime: this.loadTime

        };

    }

}

module.exports = ModuleDescriptor;