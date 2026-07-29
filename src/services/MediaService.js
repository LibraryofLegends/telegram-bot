/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/services/MediaService.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Basisklasse aller Mediendienste.
 *
 * Enthält gemeinsame Geschäftslogik für Filme,
 * Serien und Episoden.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

const BaseService = require('./BaseService');

class MediaService extends BaseService {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor(repositories, repositoryName) {

        super(repositories);

        this.media = repositories.get(repositoryName);

    }

    /**
     * ============================================================
     * Abrufen
     * ============================================================
     */

    getById(id) {

        return this.media.findById(id);

    }

    getByLibraryId(id) {

        return this.media.findByLibraryId(id);

    }

    getByTMDB(id) {

        return this.media.findByTMDB(id);

    }

    getByIMDb(id) {

        return this.media.findByIMDb(id);

    }

    /**
     * ============================================================
     * Suche
     * ============================================================
     */

    search(query) {

        return this.media.searchEverywhere(query);

    }

    /**
     * ============================================================
     * Favoriten
     * ============================================================
     */

    favorites() {

        return this.media.favorites();

    }

    /**
     * ============================================================
     * Gesehen
     * ============================================================
     */

    watched() {

        return this.media.watched();

    }

    unwatched() {

        return this.media.unwatched();

    }

    /**
     * ============================================================
     * Dashboard
     * ============================================================
     */

    latest(limit = 10) {

        return this.media.latest(limit);

    }

    random(limit = 10) {

        return this.media.random(limit);

    }

    /**
     * ============================================================
     * Metadaten
     * ============================================================
     */

    missingMetadata() {

        return this.media.missingMetadata();

    }

    /**
     * ============================================================
     * Statistiken
     * ============================================================
     */

    statistics() {

        return this.media.dashboardStatistics();

    }

}

module.exports = MediaService;