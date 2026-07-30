/**
 * ============================================================================
 * Library Of Legends 2.0
 * ---------------------------------------------------------------------------
 * Datei:
 * src/core/Scope.js
 * ---------------------------------------------------------------------------
 * Beschreibung:
 *
 * Verwaltet einen Scope innerhalb des Dependency Injection Containers.
 *
 * ============================================================================
 */

'use strict';

class Scope {

    /**
     * Konstruktor
     */

    constructor(name = 'default') {

        this.name = name;

        this.instances = new Map();

    }

    /**
     * Name des Scopes.
     *
     * @returns {String}
     */

    getName() {

        return this.name;

    }

    /**
     * Instanz registrieren.
     *
     * @param {String} key
     * @param {*} instance
     * @returns {Scope}
     */

    set(key, instance) {

        this.instances.set(

            key,

            instance

        );

        return this;

    }

    /**
     * Instanz abrufen.
     *
     * @param {String} key
     * @returns {*}
     */

    get(key) {

        return this.instances.get(key);

    }

    /**
     * Existiert eine Instanz?
     *
     * @param {String} key
     * @returns {Boolean}
     */

    has(key) {

        return this.instances.has(key);

    }

    /**
     * Instanz entfernen.
     *
     * @param {String} key
     * @returns {Boolean}
     */

    remove(key) {

        return this.instances.delete(key);

    }

    /**
     * Alle Instanzen.
     *
     * @returns {Array}
     */

    all() {

        return [...this.instances.entries()];

    }

    /**
     * Anzahl Instanzen.
     *
     * @returns {Number}
     */

    count() {

        return this.instances.size;

    }

    /**
     * Scope leeren.
     */

    clear() {

        this.instances.clear();

    }

    /**
     * Scope zerstören.
     */

    dispose() {

        for (const instance of this.instances.values()) {

            if (

                instance &&

                typeof instance.dispose === 'function'

            ) {

                instance.dispose();

            }

        }

        this.clear();

    }

}

module.exports = Scope;