/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/orm/RepositoryFactory.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Erstellt Repository-Instanzen für registrierte Entitäten.
 *
 * Verantwortlich für:
 *
 * - Repository-Erzeugung
 * - Repository-Cache
 * - BaseRepository-Fallback
 * - EntityMetadata-Verknüpfung
 * - EntityManager-Injektion
 *
 * ============================================================================
 */

'use strict';

const BaseRepository = require('../database/BaseRepository');

class RepositoryFactory {

    /**
     * @param {EntityRegistry} registry
     */
    constructor(registry) {

        this.registry = registry;

        /**
         * Repository Cache
         *
         * Entity -> Repository
         */

        this.repositories = new Map();

    }

    /**
     * Repository erzeugen oder aus Cache holen.
     *
     * @param {Function} entity
     * @param {EntityManager} entityManager
     *
     * @returns {BaseRepository}
     */

    make(entity, entityManager) {

        if (this.repositories.has(entity)) {

            return this.repositories.get(entity);

        }

        const metadata =

            this.registry.get(entity);

        const RepositoryClass =

            metadata.getOption(

                'repository',

                BaseRepository

            );

        const repository =

            new RepositoryClass({

                entity,

                metadata,

                entityManager

            });

        this.repositories.set(

            entity,

            repository

        );

        return repository;

    }

    /**
     * Repository registrieren.
     *
     * @param {Function} entity
     * @param {Object} repository
     */

    register(entity, repository) {

        this.repositories.set(

            entity,

            repository

        );

        return this;

    }

    /**
     * Existiert bereits?
     */

    has(entity) {

        return this.repositories.has(entity);

    }

    /**
     * Repository abrufen.
     */

    get(entity) {

        return this.repositories.get(entity);

    }

    /**
     * Repository entfernen.
     */

    remove(entity) {

        return this.repositories.delete(entity);

    }

    /**
     * Anzahl.
     */

    count() {

        return this.repositories.size;

    }

    /**
     * Alle Repositories.
     */

    all() {

        return [

            ...this.repositories.values()

        ];

    }

    /**
     * Registry.
     */

    getRegistry() {

        return this.registry;

    }

    /**
     * Cache leeren.
     */

    clear() {

        this.repositories.clear();

    }

    /**
     * Export.
     */

    toJSON() {

        return {

            repositories:

                this.repositories.size

        };

    }

}

module.exports = RepositoryFactory;