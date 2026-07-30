/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ServiceRegistry.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Zentrale Registry aller Framework-Services.
 *
 * ============================================================================
 */

'use strict';

class ServiceRegistry {

    constructor() {

        this.services = new Map();

    }

    /**
     * Service registrieren.
     *
     * @param {String} name
     * @param {*} service
     * @returns {ServiceRegistry}
     */

    register(name, service) {

        if (!name) {

            throw new Error(

                'Service benötigt einen Namen.'

            );

        }

        this.services.set(

            name,

            service

        );

        return this;

    }

    /**
     * Mehrere Services registrieren.
     *
     * @param {Object} services
     * @returns {ServiceRegistry}
     */

    registerMany(services = {}) {

        for (

            const [name, service]

            of Object.entries(services)

        ) {

            this.register(

                name,

                service

            );

        }

        return this;

    }

    /**
     * Service abrufen.
     *
     * @param {String} name
     * @returns {*}
     */

    get(name) {

        if (

            !this.services.has(name)

        ) {

            throw new Error(

                `Service "${name}" wurde nicht gefunden.`

            );

        }

        return this.services.get(name);

    }

    /**
     * Prüfen ob Service existiert.
     *
     * @param {String} name
     * @returns {Boolean}
     */

    has(name) {

        return this.services.has(name);

    }

    /**
     * Service entfernen.
     *
     * @param {String} name
     * @returns {Boolean}
     */

    remove(name) {

        return this.services.delete(name);

    }

    /**
     * Alle Services.
     *
     * @returns {Object}
     */

    all() {

        return Object.fromEntries(

            this.services

        );

    }

    /**
     * Anzahl registrierter Services.
     *
     * @returns {Number}
     */

    count() {

        return this.services.size;

    }

    /**
     * Registry leeren.
     */

    clear() {

        this.services.clear();

    }

}

module.exports = ServiceRegistry;