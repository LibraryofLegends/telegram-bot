/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ProviderRegistry.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Verwaltet sämtliche ServiceProvider des Frameworks.
 *
 * ============================================================================
 */

'use strict';

class ProviderRegistry {

    constructor(logger = console) {

        this.logger = logger;

        this.providers = [];

    }

    /**
     * Provider registrieren.
     *
     * @param {Object} provider
     * @returns {ProviderRegistry}
     */

    register(provider) {

        if (!provider) {

            throw new Error(

                'Ungültiger ServiceProvider.'

            );

        }

        this.providers.push(provider);

        return this;

    }

    /**
     * Alle Provider registrieren.
     *
     * @param {Array} providers
     * @returns {ProviderRegistry}
     */

    registerMany(providers = []) {

        for (const provider of providers) {

            this.register(provider);

        }

        return this;

    }

    /**
     * register() aller Provider ausführen.
     */

    async initialize(application) {

        for (const provider of this.providers) {

            if (typeof provider.setApplication === 'function') {

                provider.setApplication(application);

            }

            if (typeof provider.register === 'function') {

                this.logger.info(

                    `[Provider] Register: ${provider.constructor.name}`

                );

                await provider.register();

            }

        }

    }

    /**
     * boot() aller Provider ausführen.
     */

    async boot() {

        for (const provider of this.providers) {

            if (typeof provider.boot === 'function') {

                this.logger.info(

                    `[Provider] Boot: ${provider.constructor.name}`

                );

                await provider.boot();

            }

        }

    }

    /**
     * Provider entfernen.
     */

    unregister(provider) {

        this.providers = this.providers.filter(

            item => item !== provider

        );

        return this;

    }

    /**
     * Provider abrufen.
     */

    all() {

        return [

            ...this.providers

        ];

    }

    /**
     * Anzahl.
     */

    count() {

        return this.providers.length;

    }

    /**
     * Registry leeren.
     */

    clear() {

        this.providers = [];

    }

}

module.exports = ProviderRegistry;