/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/orm/EntityProxy.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Proxy für ORM-Entitäten.
 *
 * Verantwortlich für:
 *
 * - Lazy Loading
 * - Dirty Checking
 * - Property Tracking
 * - Änderungsverfolgung
 * - Relation Loading
 *
 * ============================================================================
 */

'use strict';

class EntityProxy {

    /**
     * @param {Object} entity
     * @param {Object} options
     */
    constructor(entity, options = {}) {

        this.entity = entity;

        this.unitOfWork = options.unitOfWork ?? null;

        this.lazyLoader = options.lazyLoader ?? null;

        this.metadata = options.metadata ?? null;

        this.loadedRelations = new Set();

        this.changedProperties = new Set();

        this.originalValues = new Map();

        return new Proxy(entity, {

            get: (target, property, receiver) =>

                this.get(target, property, receiver),

            set: (target, property, value, receiver) =>

                this.set(target, property, value, receiver),

            deleteProperty: (target, property) =>

                this.delete(target, property),

            has: (target, property) =>

                Reflect.has(target, property),

            ownKeys: target =>

                Reflect.ownKeys(target),

            getOwnPropertyDescriptor: (target, property) =>

                Reflect.getOwnPropertyDescriptor(

                    target,

                    property

                )

        });

    }

    /**
     * ------------------------------------------------------------------------
     * Lesen
     * ------------------------------------------------------------------------
     */

    get(target, property, receiver) {

        /**
         * Lazy Relation
         */

        if (

            this.metadata &&

            typeof this.metadata.getRelation === 'function'

        ) {

            const relation =

                this.metadata.getRelation(property);

            if (

                relation &&

                this.lazyLoader &&

                !this.loadedRelations.has(property)

            ) {

                const value =

                    this.lazyLoader.load(

                        target,

                        relation

                    );

                target[property] = value;

                this.loadedRelations.add(

                    property

                );

            }

        }

        return Reflect.get(

            target,

            property,

            receiver

        );

    }

    /**
     * ------------------------------------------------------------------------
     * Schreiben
     * ------------------------------------------------------------------------
     */

    set(target, property, value, receiver) {

        const current =

            target[property];

        if (

            current !== value

        ) {

            if (

                !this.originalValues.has(property)

            ) {

                this.originalValues.set(

                    property,

                    current

                );

            }

            this.changedProperties.add(

                property

            );

            if (

                this.unitOfWork &&

                typeof this.unitOfWork.markDirty === 'function'

            ) {

                this.unitOfWork.markDirty(

                    target

                );

            }

        }

        return Reflect.set(

            target,

            property,

            value,

            receiver

        );

    }

    /**
     * ------------------------------------------------------------------------
     * Löschen
     * ------------------------------------------------------------------------
     */

    delete(target, property) {

        this.changedProperties.add(

            property

        );

        if (

            this.unitOfWork &&

            typeof this.unitOfWork.markDirty === 'function'

        ) {

            this.unitOfWork.markDirty(

                target

            );

        }

        return Reflect.deleteProperty(

            target,

            property

        );

    }

    /**
     * ------------------------------------------------------------------------
     * Änderungen
     * ------------------------------------------------------------------------
     */

    isDirty() {

        return this.changedProperties.size > 0;

    }

    getChangedProperties() {

        return [

            ...this.changedProperties

        ];

    }

    hasChanged(property) {

        return this.changedProperties.has(

            property

        );

    }

    clearChanges() {

        this.changedProperties.clear();

        this.originalValues.clear();

    }

    /**
     * ------------------------------------------------------------------------
     * Originalwerte
     * ------------------------------------------------------------------------
     */

    getOriginalValue(property) {

        return this.originalValues.get(

            property

        );

    }

    getOriginalValues() {

        return Object.fromEntries(

            this.originalValues

        );

    }

    /**
     * ------------------------------------------------------------------------
     * Geladene Beziehungen
     * ------------------------------------------------------------------------
     */

    isRelationLoaded(property) {

        return this.loadedRelations.has(

            property

        );

    }

    markRelationLoaded(property) {

        this.loadedRelations.add(

            property

        );

    }

    clearLoadedRelations() {

        this.loadedRelations.clear();

    }

}

module.exports = EntityProxy;