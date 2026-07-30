/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/Module.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Basisklasse aller Framework-Module.
 *
 * ============================================================================
 */

'use strict';

class Module {

    /**
     * Konstruktor.
     */

    constructor() {

        this.application = null;

        this.enabled = true;

        this.loaded = false;

    }

    /**
     * Anwendung setzen.
     *
     * @param {Application} application
     * @returns {Module}
     */

    setApplication(application) {

        this.application = application;

        return this;

    }

    /**
     * Anwendung abrufen.
     *
     * @returns {Application}
     */

    getApplication() {

        return this.application;

    }

    /**
     * Modulname.
     *
     * @returns {String}
     */

    getName() {

        return this.constructor.name;

    }

    /**
     * Version.
     *
     * @returns {String}
     */

    getVersion() {

        return '1.0.0';

    }

    /**
     * Beschreibung.
     *
     * @returns {String}
     */

    getDescription() {

        return '';

    }

    /**
     * Abhängigkeiten.
     *
     * @returns {Array}
     */

    getDependencies() {

        return [];

    }

    /**
     * Registrierung.
     */

    async register() {

    }

    /**
     * Modul laden.
     */

    async boot() {

        this.loaded = true;

    }

    /**
     * Modul entladen.
     */

    async shutdown() {

        this.loaded = false;

    }

    /**
     * Modul aktivieren.
     *
     * @returns {Module}
     */

    enable() {

        this.enabled = true;

        return this;

    }

    /**
     * Modul deaktivieren.
     *
     * @returns {Module}
     */

    disable() {

        this.enabled = false;

        return this;

    }

    /**
     * Aktiv?
     *
     * @returns {Boolean}
     */

    isEnabled() {

        return this.enabled;

    }

    /**
     * Geladen?
     *
     * @returns {Boolean}
     */

    isLoaded() {

        return this.loaded;

    }

}

module.exports = Module;