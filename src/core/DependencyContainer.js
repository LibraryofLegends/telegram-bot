/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/core/DependencyContainer.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Dependency Injection Container.
 *
 * Verwaltet sämtliche Komponenten der Anwendung.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

class DependencyContainer {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor(logger = console) {

        this.logger = logger;

        this.services = new Map();

        this.singletons = new Map();

    }

    /**
     * ============================================================
     * Singleton registrieren
     * ============================================================
     */

    singleton(name, instance) {

        if (this.singletons.has(name)) {

            throw new Error(
                `Singleton '${name}' existiert bereits.`
            );

        }

        this.singletons.set(name, instance);

        return this;

    }

    /**
     * ============================================================
     * Factory registrieren
     * ============================================================
     */

    register(name, factory) {

        if (this.services.has(name)) {

            throw new Error(
                `Service '${name}' existiert bereits.`
            );

        }

        this.services.set(name, factory);

        return this;

    }

    /**
     * ============================================================
     * Auflösen
     * ============================================================
     */

    resolve(name) {

        if (this.singletons.has(name)) {

            return this.singletons.get(name);

        }

        if (!this.services.has(name)) {

            throw new Error(
                `Service '${name}' wurde nicht gefunden.`
            );

        }

        return this.services
            .get(name)(this);

    }

    /**
     * ============================================================
     * Vorhanden
     * ============================================================
     */

    has(name) {

        return this.singletons.has(name)
            || this.services.has(name);

    }

    /**
     * ============================================================
     * Entfernen
     * ============================================================
     */

    remove(name) {

        this.singletons.delete(name);

        this.services.delete(name);

    }

    /**
     * ============================================================
     * Alle löschen
     * ============================================================
     */

    clear() {

        this.singletons.clear();

        this.services.clear();

    }

    /**
     * ============================================================
     * Liste
     * ============================================================
     */

    list() {

        return {

            singletons: [...this.singletons.keys()],

            services: [...this.services.keys()]

        };

    }

    /**
     * ============================================================
     * Informationen
     * ============================================================
     */

    info() {

        return {

            singletonCount: this.singletons.size,

            serviceCount: this.services.size,

            singletons: [...this.singletons.keys()],

            services: [...this.services.keys()]

        };

    }

}

module.exports = DependencyContainer;