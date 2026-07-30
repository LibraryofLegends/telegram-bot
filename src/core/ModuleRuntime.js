/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleRuntime.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Verwaltet die Laufzeitinformationen eines Moduls.
 *
 * ============================================================================
 */

'use strict';

class ModuleRuntime {

    /**
     * Konstruktor.
     *
     * @param {Module} module
     */

    constructor(module) {

        this.module = module;

        this.startedAt = null;

        this.stoppedAt = null;

        this.restartCount = 0;

        this.lastError = null;

    }

    /**
     * Modulstart markieren.
     *
     * @returns {ModuleRuntime}
     */

    start() {

        this.startedAt = new Date();

        this.stoppedAt = null;

        return this;

    }

    /**
     * Modulstopp markieren.
     *
     * @returns {ModuleRuntime}
     */

    stop() {

        this.stoppedAt = new Date();

        return this;

    }

    /**
     * Neustart markieren.
     *
     * @returns {ModuleRuntime}
     */

    restart() {

        this.restartCount++;

        this.startedAt = new Date();

        this.stoppedAt = null;

        return this;

    }

    /**
     * Fehler speichern.
     *
     * @param {Error|*} error
     * @returns {ModuleRuntime}
     */

    setLastError(error) {

        this.lastError = error;

        return this;

    }

    /**
     * Letzten Fehler löschen.
     *
     * @returns {ModuleRuntime}
     */

    clearLastError() {

        this.lastError = null;

        return this;

    }

    /**
     * Läuft das Modul?
     *
     * @returns {Boolean}
     */

    isRunning() {

        return this.startedAt !== null && this.stoppedAt === null;

    }

    /**
     * Betriebszeit in Millisekunden.
     *
     * @returns {Number}
     */

    getUptime() {

        if (!this.startedAt) {

            return 0;

        }

        const end = this.stoppedAt || new Date();

        return end.getTime() - this.startedAt.getTime();

    }

    /**
     * Startzeit.
     *
     * @returns {Date|null}
     */

    getStartedAt() {

        return this.startedAt;

    }

    /**
     * Stoppzeit.
     *
     * @returns {Date|null}
     */

    getStoppedAt() {

        return this.stoppedAt;

    }

    /**
     * Neustarts.
     *
     * @returns {Number}
     */

    getRestartCount() {

        return this.restartCount;

    }

    /**
     * Letzter Fehler.
     *
     * @returns {*}
     */

    getLastError() {

        return this.lastError;

    }

    /**
     * JSON-Export.
     *
     * @returns {Object}
     */

    toJSON() {

        return {

            module: this.module.getName(),

            running: this.isRunning(),

            startedAt: this.startedAt,

            stoppedAt: this.stoppedAt,

            uptime: this.getUptime(),

            restartCount: this.restartCount,

            lastError: this.lastError

                ? this.lastError.message || String(this.lastError)

                : null

        };

    }

}

module.exports = ModuleRuntime;