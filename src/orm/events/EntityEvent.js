/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/orm/events/EntityEvent.js
 * ----------------------------------------------------------------------------
 * Basisklasse aller ORM Entity Events.
 * ============================================================================
 */

'use strict';

const Event = require('./Event');

class EntityEvent extends Event {

    constructor({

        name = '',

        entity = null,

        metadata = null,

        entityManager = null,

        repository = null,

        driver = null,

        unitOfWork = null,

        context = null,

        originalValues = {},

        currentValues = {},

        changedFields = []

    } = {}) {

        super(name);

        this.entity = entity;

        this.metadata = metadata;

        this.entityManager = entityManager;

        this.repository = repository;

        this.driver = driver;

        this.unitOfWork = unitOfWork;

        this.context = context;

        this.originalValues = {

            ...originalValues

        };

        this.currentValues = {

            ...currentValues

        };

        this.changedFields = [

            ...changedFields

        ];

    }

    /**
     * ------------------------------------------------------------------------
     * Entity
     * ------------------------------------------------------------------------
     */

    getEntity() {

        return this.entity;

    }

    setEntity(entity) {

        this.entity = entity;

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Metadata
     * ------------------------------------------------------------------------
     */

    getMetadata() {

        return this.metadata;

    }

    /**
     * ------------------------------------------------------------------------
     * Repository
     * ------------------------------------------------------------------------
     */

    getRepository() {

        return this.repository;

    }

    /**
     * ------------------------------------------------------------------------
     * EntityManager
     * ------------------------------------------------------------------------
     */

    getEntityManager() {

        return this.entityManager;

    }

    /**
     * ------------------------------------------------------------------------
     * Driver
     * ------------------------------------------------------------------------
     */

    getDriver() {

        return this.driver;

    }

    /**
     * ------------------------------------------------------------------------
     * Unit Of Work
     * ------------------------------------------------------------------------
     */

    getUnitOfWork() {

        return this.unitOfWork;

    }

    /**
     * ------------------------------------------------------------------------
     * Context
     * ------------------------------------------------------------------------
     */

    getContext() {

        return this.context;

    }

    setContext(context) {

        this.context = context;

        return this;

    }

    /**
     * ------------------------------------------------------------------------
     * Original Values
     * ------------------------------------------------------------------------
     */

    getOriginalValues() {

        return {

            ...this.originalValues

        };

    }

    getOriginalValue(field) {

        return this.originalValues[field];

    }

    /**
     * ------------------------------------------------------------------------
     * Current Values
     * ------------------------------------------------------------------------
     */

    getCurrentValues() {

        return {

            ...this.currentValues

        };

    }

    getCurrentValue(field) {

        return this.currentValues[field];

    }

    /**
     * ------------------------------------------------------------------------
     * Changed Fields
     * ------------------------------------------------------------------------
     */

    getChangedFields() {

        return [

            ...this.changedFields

        ];

    }

    hasChanged(field) {

        return this.changedFields.includes(field);

    }

    /**
     * ------------------------------------------------------------------------
     * Export
     * ------------------------------------------------------------------------
     */

    toJSON() {

        return {

            ...super.toJSON(),

            entity:

                this.entity

                    ?.constructor

                    ?.name,

            table:

                this.metadata

                    ?.getTable

                    ?.(),

            changedFields:

                this.changedFields,

            originalValues:

                this.originalValues,

            currentValues:

                this.currentValues

        };

    }

}

module.exports = EntityEvent;