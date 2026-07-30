/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleRuntimeSnapshot.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Erstellt einen unveränderlichen Snapshot einer ModuleRuntime.
 *
 * ============================================================================
 */

'use strict';

class ModuleRuntimeSnapshot {

    /**
     * Konstruktor.
     *
     * @param {ModuleRuntime} runtime
     */

    constructor(runtime) {

        const data = runtime.toJSON();

        this.createdAt = new Date();

        this.module = data.module;

        this.running = data.running;

        this.startedAt = data.startedAt;

        this.stoppedAt = data.stoppedAt;

        this.uptime = data.uptime;

        this.restartCount = data.restartCount;

        this.lastError = data.lastError;

    }

    /**
     * Modulname.
     *
     * @returns {String}
     */

    getModule() {

        return this.module;

    }

    /**
     * Läuft das Modul?
     *
     * @returns {Boolean}
     */

    isRunning() {

        return this.running;

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
     * Laufzeit.
     *
     * @returns {Number}
     */

    getUptime() {

        return this.uptime;

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
     * @returns {String|null}
     */

    getLastError() {

        return this.lastError;

    }

    /**
     * Zeitpunkt des Snapshots.
     *
     * @returns {Date}
     */

    getCreatedAt() {

        return this.createdAt;

    }

    /**
     * JSON-Export.
     *
     * @returns {Object}
     */

    toJSON() {

        return {

            createdAt: this.createdAt,

            module: this.module,

            running: this.running,

            startedAt: this.startedAt,

            stoppedAt: this.stoppedAt,

            uptime: this.uptime,

            restartCount: this.restartCount,

            lastError: this.lastError

        };

    }

}

module.exports = ModuleRuntimeSnapshot;