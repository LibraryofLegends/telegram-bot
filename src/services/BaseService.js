/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/services/BaseService.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Basisklasse aller Services.
 *
 * Stellt gemeinsame Funktionen für Logging,
 * Repository-Zugriff, Validierung,
 * Transaktionen und Fehlerbehandlung bereit.
 *
 * Version:
 * 1.0.0
 * ========================================================================
 */

'use strict';

class BaseService {

    /**
     * ============================================================
     * Konstruktor
     * ============================================================
     */

    constructor(repositories, logger = console) {

        this.repositories = repositories;

        this.logger = logger;

    }

    /**
     * ============================================================
     * Repository
     * ============================================================
     */

    repository(name) {

        return this.repositories.get(name);

    }

    /**
     * ============================================================
     * Logging
     * ============================================================
     */

    log(...args) {

        this.logger.log(...args);

    }

    info(...args) {

        this.logger.info(...args);

    }

    warn(...args) {

        this.logger.warn(...args);

    }

    error(...args) {

        this.logger.error(...args);

    }

    /**
     * ============================================================
     * Validierung
     * ============================================================
     */

    require(value, name) {

        if (value === null || value === undefined) {

            throw new Error(`${name} ist erforderlich.`);

        }

        return value;

    }

    /**
     * ============================================================
     * Ergebnisse
     * ============================================================
     */

    success(data = null, message = null) {

        return {

            success: true,

            message,

            data

        };

    }

    fail(message, error = null) {

        return {

            success: false,

            message,

            error

        };

    }

    /**
     * ============================================================
     * Fehlerbehandlung
     * ============================================================
     */

    handleError(error) {

        this.error(error);

        throw error;

    }

    /**
     * ============================================================
     * Informationen
     * ============================================================
     */

    infoObject() {

        return {

            service: this.constructor.name,

            repositories: this.repositories.info()

        };

    }

}

module.exports = BaseService;