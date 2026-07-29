/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/core/Application.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Hauptklasse der gesamten Anwendung.
 *
 * Initialisiert sämtliche Komponenten und startet
 * Library Of Legends.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

class Application {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor({

        database,

        repositories,

        services,

        engines,

        eventBus,

        scheduler,

        telegram,

        api,

        logger = console

    }) {

        this.database = database;

        this.repositories = repositories;

        this.services = services;

        this.engines = engines;

        this.eventBus = eventBus;

        this.scheduler = scheduler;

        this.telegram = telegram;

        this.api = api;

        this.logger = logger;

    }

    /**
     * ============================================================
     * Start
     * ============================================================
     */

    async start() {

        this.logger.info('===================================');
        this.logger.info('Library Of Legends 2.0');
        this.logger.info('Starting...');
        this.logger.info('===================================');

    }

}

module.exports = Application;