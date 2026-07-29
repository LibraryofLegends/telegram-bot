/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/engine/MediaEngine.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Zentrale Engine für sämtliche Medienoperationen.
 *
 * Diese Klasse koordiniert alle Services, Repositories
 * und Provider und dient als zentrale Einstiegsklasse
 * für alle Medienprozesse.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

class MediaEngine {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor({

        repositories,

        services,

        providers,

        parsers,

        telegram,

        ai,

        logger = console

    }) {

        this.repositories = repositories;

        this.services = services;

        this.providers = providers;

        this.parsers = parsers;

        this.telegram = telegram;

        this.ai = ai;

        this.logger = logger;

    }

}

module.exports = MediaEngine;