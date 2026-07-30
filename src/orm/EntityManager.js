/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/orm/EntityManager.js
 * ========================================================================
 */

'use strict';

class EntityManager {

    constructor({

        driver,
        unitOfWork,
        hydrator,
        repositoryFactory,
        eventDispatcher

    }) {

        this.driver = driver;

        this.unitOfWork = unitOfWork;

        this.hydrator = hydrator;

        this.repositoryFactory = repositoryFactory;

        this.events = eventDispatcher;

    }

    /**
     * Repository abrufen.
     */

    repository(entityClass) {

        return this.repositoryFactory.make(

            entityClass,

            this

        );

    }

    /**
     * Entität merken.
     */

    persist(entity) {

        this.unitOfWork.persist(entity);

        return entity;

    }

    /**
     * Entität entfernen.
     */

    remove(entity) {

        this.unitOfWork.remove(entity);

        return entity;

    }

    /**
     * Änderungen schreiben.
     */

    async flush() {

        return this.unitOfWork.commit();

    }

    /**
     * Datenbank leeren.
     */

    clear() {

        this.unitOfWork.clear();

    }

}