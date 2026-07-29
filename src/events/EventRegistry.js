/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/events/EventRegistry.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Registriert sämtliche Event-Module der Anwendung.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

class EventRegistry {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor(eventBus, logger = console) {

        this.eventBus = eventBus;

        this.logger = logger;

        this.modules = [];

    }

    /**
     * ============================================================
     * Modul hinzufügen
     * ============================================================
     */

    register(module) {

        if (!module) {

            return this;

        }

        this.modules.push(module);

        return this;

    }

    /**
     * ============================================================
     * Alle Module initialisieren
     * ============================================================
     */

    initialize() {

        for (const module of this.modules) {

            if (typeof module.register === 'function') {

                module.register(this.eventBus);

            }

        }

        this.logger.info(
            `[EventRegistry] ${this.modules.length} Module registriert.`
        );

    }

    /**
     * ============================================================
     * Module
     * ============================================================
     */

    list() {

        return this.modules.map(module => module.constructor.name);

    }

    /**
     * ============================================================
     * Informationen
     * ============================================================
     */

    info() {

        return {

            modules: this.list(),

            count: this.modules.length

        };

    }

}

module.exports = EventRegistry;