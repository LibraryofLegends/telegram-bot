/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/Binding.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Repräsentiert einen einzelnen Container-Binding.
 *
 * ============================================================================
 */

'use strict';

class Binding {

    /**
     * Konstruktor.
     */

    constructor({

        key,

        resolver,

        singleton = false,

        scoped = false,

        tags = []

    } = {}) {

        this.key = key;

        this.resolver = resolver;

        this.singleton = singleton;

        this.scoped = scoped;

        this.tags = new Set(tags);

        this.instance = null;

    }

    /**
     * Schlüssel.
     */

    getKey() {

        return this.key;

    }

    /**
     * Resolver.
     */

    getResolver() {

        return this.resolver;

    }

    /**
     * Singleton?
     */

    isSingleton() {

        return this.singleton;

    }

    /**
     * Scoped?
     */

    isScoped() {

        return this.scoped;

    }

    /**
     * Instanz vorhanden?
     */

    hasInstance() {

        return this.instance !== null;

    }

    /**
     * Instanz setzen.
     */

    setInstance(instance) {

        this.instance = instance;

        return this;

    }

    /**
     * Instanz abrufen.
     */

    getInstance() {

        return this.instance;

    }

    /**
     * Instanz entfernen.
     */

    clearInstance() {

        this.instance = null;

        return this;

    }

    /**
     * Tag hinzufügen.
     */

    addTag(tag) {

        this.tags.add(tag);

        return this;

    }

    /**
     * Tag entfernen.
     */

    removeTag(tag) {

        this.tags.delete(tag);

        return this;

    }

    /**
     * Tag vorhanden?
     */

    hasTag(tag) {

        return this.tags.has(tag);

    }

    /**
     * Alle Tags.
     */

    getTags() {

        return [

            ...this.tags

        ];

    }

    /**
     * Export.
     */

    toJSON() {

        return {

            key: this.key,

            singleton: this.singleton,

            scoped: this.scoped,

            hasInstance: this.hasInstance(),

            tags: this.getTags()

        };

    }

}

module.exports = Binding;