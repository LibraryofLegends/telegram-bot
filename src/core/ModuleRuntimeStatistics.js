/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleRuntimeStatistics.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Ermittelt Statistiken über sämtliche ModuleRuntime-Instanzen.
 *
 * ============================================================================
 */

'use strict';

class ModuleRuntimeStatistics {

    /**
     * Konstruktor.
     *
     * @param {ModuleRuntimeRegistry} registry
     */

    constructor(registry) {

        this.registry = registry;

    }

    /**
     * Anzahl aller Runtimes.
     *
     * @returns {Number}
     */

    total() {

        return this.registry.count();

    }

    /**
     * Anzahl laufender Module.
     *
     * @returns {Number}
     */

    running() {

        return this.registry.running().length;

    }

    /**
     * Anzahl gestoppter Module.
     *
     * @returns {Number}
     */

    stopped() {

        return this.registry.stopped().length;

    }

    /**
     * Gesamte Uptime.
     *
     * @returns {Number}
     */

    totalUptime() {

        return this.registry

            .all()

            .reduce(

                (total, runtime) =>

                    total + runtime.getUptime(),

                0

            );

    }

    /**
     * Durchschnittliche Uptime.
     *
     * @returns {Number}
     */

    averageUptime() {

        if (this.total() === 0) {

            return 0;

        }

        return this.totalUptime() / this.total();

    }

    /**
     * Gesamtanzahl Neustarts.
     *
     * @returns {Number}
     */

    totalRestarts() {

        return this.registry

            .all()

            .reduce(

                (total, runtime) =>

                    total + runtime.getRestartCount(),

                0

            );

    }

    /**
     * Anzahl fehlerhafter Module.
     *
     * @returns {Number}
     */

    failed() {

        return this.registry

            .all()

            .filter(

                runtime => runtime.getLastError() !== null

            )

            .length;

    }

    /**
     * Statistik.
     *
     * @returns {Object}
     */

    summary() {

        return {

            total: this.total(),

            running: this.running(),

            stopped: this.stopped(),

            failed: this.failed(),

            totalRestarts: this.totalRestarts(),

            totalUptime: this.totalUptime(),

            averageUptime: this.averageUptime()

        };

    }

    /**
     * JSON-Export.
     *
     * @returns {Object}
     */

    toJSON() {

        return this.summary();

    }

}

module.exports = ModuleRuntimeStatistics;