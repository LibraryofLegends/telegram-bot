/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ContainerBuilder.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Builder zum Erstellen und Konfigurieren eines Dependency Injection
 * Containers.
 *
 * ============================================================================
 */

'use strict';

const Container = require('./container/Container');

class ContainerBuilder {

    /**
     * Konstruktor.
     */

    constructor() {

        this.container = new Container();

    }

    /**
     * Singleton registrieren.
     *
     * @param {*} key
     * @param {*} resolver
     * @returns {ContainerBuilder}
     */

    singleton(key, resolver) {

        this.container.singleton(

            key,

            resolver

        );

        return this;

    }

    /**
     * Binding registrieren.
     *
     * @param {*} key
     * @param {*} resolver
     * @returns {ContainerBuilder}
     */

    bind(key, resolver) {

        this.container.bind(

            key,

            resolver

        );

        return this;

    }

    /**
     * Bereits erzeugte Instanz registrieren.
     *
     * @param {*} key
     * @param {*} instance
     * @returns {ContainerBuilder}
     */

    instance(key, instance) {

        this.container.instance(

            key,

            instance

        );

        return this;

    }

    /**
     * Alias registrieren.
     *
     * @param {*} alias
     * @param {*} target
     * @returns {ContainerBuilder}
     */

    alias(alias, target) {

        if (

            typeof this.container.alias === 'function'

        ) {

            this.container.alias(

                alias,

                target

            );

        }

        return this;

    }

    /**
     * Provider registrieren.
     *
     * @param {ServiceProvider} provider
     * @returns {ContainerBuilder}
     */

    provider(provider) {

        if (

            typeof provider.setContainer === 'function'

        ) {

            provider.setContainer(

                this.container

            );

        }

        if (

            typeof provider.register === 'function'

        ) {

            provider.register();

        }

        return this;

    }

    /**
     * Container zurückgeben.
     *
     * @returns {Container}
     */

    build() {

        return this.container;

    }

}

module.exports = ContainerBuilder;