/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleRuntimeTracker.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Verfolgt Statusänderungen einer ModuleRuntime und speichert deren Verlauf.
 *
 * ============================================================================
 */

'use strict';

class ModuleRuntimeTracker {

    /**
     * Konstruktor.
     *
     * @param {ModuleRuntime} runtime
     */

    constructor(runtime) {

        this.runtime = runtime;

        this.history = [];

    }

    /**
     * Ereignis aufzeichnen.
     *
     * @param {String} event
     * @param {Object} data
     * @returns {ModuleRuntimeTracker}
     */

    track(event, data = {}) {

        this.history.push({

            timestamp: new Date(),

            event,

            data

        });

        return this;

    }

    /**
     * Modulstart.
     *
     * @returns {ModuleRuntimeTracker}
     */

    started() {

        return this.track('started', {

            uptime: this.runtime.getUptime()

        });

    }

    /**
     * Modulstopp.
     *
     * @returns {ModuleRuntimeTracker}
     */

    stopped() {

        return this.track('stopped', {

            uptime: this.runtime.getUptime()

        });

    }

    /**
     * Modulneustart.
     *
     * @returns {ModuleRuntimeTracker}
     */

    restarted() {

        return this.track('restarted', {

            restartCount: this.runtime.getRestartCount()

        });

    }

    /**
     * Fehler protokollieren.
     *
     * @param {Error|*} error
     * @returns {ModuleRuntimeTracker}
     */

    failed(error) {

        return this.track('failed', {

            message:

                error?.message ||

                String(error)

        });

    }

    /**
     * Verlauf.
     *
     * @returns {Array<Object>}
     */

    getHistory() {

        return [...this.history];

    }

    /**
     * Letztes Ereignis.
     *
     * @returns {Object|null}
     */

    latest() {

        if (this.history.length === 0) {

            return null;

        }

        return this.history[

            this.history.length - 1

        ];

    }

    /**
     * Anzahl Ereignisse.
     *
     * @returns {Number}
     */

    count() {

        return this.history.length;

    }

    /**
     * Verlauf löschen.
     */

    clear() {

        this.history.length = 0;

    }

    /**
     * JSON-Export.
     *
     * @returns {Array<Object>}
     */

    toJSON() {

        return this.getHistory();

    }

}

module.exports = ModuleRuntimeTracker;