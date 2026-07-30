/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ServiceProvider.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Basisklasse aller Service Provider.
 *
 * ============================================================================
 */

'use strict';

class ServiceProvider {

    constructor() {

        this.application = null;

        this.container = null;

        this.booted = false;

    }

    /**
     * Application setzen.
     *
     * @param {Application} application
     * @returns {ServiceProvider}
     */

    setApplication(application) {

        this.application = application;

        return this;

    }

    /**
     * Container setzen.
     *
     * @param {Container} container
     * @returns {ServiceProvider}
     */

    setContainer(container) {

        this.container = container;

        return this;

    }

    /**
     * Application abrufen.
     *
     * @returns {Application}
     */

    getApplication() {

        return this.application;

    }

    /**
     * Container abrufen.
     *
     * @returns {Container}
     */

    getContainer() {

        return this.container;

    }

    /**
     * Services registrieren.
     */

    async register() {

        // überschreiben

    }

    /**
     * Provider booten.
     */

    async boot() {

        this.booted = true;

    }

    /**
     * Provider herunterfahren.
     */

    async shutdown() {

        this.booted = false;

    }

    /**
     * Status.
     *
     * @returns {boolean}
     */

    isBooted() {

        return this.booted;

    }

}

module.exports = ServiceProvider;