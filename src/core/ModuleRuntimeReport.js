/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleRuntimeReport.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Erstellt einen vollständigen Laufzeitbericht aller Module.
 *
 * ============================================================================
 */

'use strict';

class ModuleRuntimeReport {

    /**
     * Konstruktor.
     *
     * @param {ModuleRuntimeRegistry} registry
     */

    constructor(registry) {

        this.registry = registry;

        this.createdAt = new Date();

    }

    /**
     * Einzelne Runtime-Berichte.
     *
     * @returns {Array<Object>}
     */

    generate() {

        return this.registry

            .all()

            .map(runtime => runtime.toJSON());

    }

    /**
     * Anzahl.
     *
     * @returns {Number}
     */

    count() {

        return this.registry.count();

    }

    /**
     * Laufende Module.
     *
     * @returns {Number}
     */

    running() {

        return this.generate()

            .filter(runtime => runtime.running)

            .length;

    }

    /**
     * Gestoppte Module.
     *
     * @returns {Number}
     */

    stopped() {

        return this.generate()

            .filter(runtime => !runtime.running)

            .length;

    }

    /**
     * Fehlerhafte Module.
     *
     * @returns {Number}
     */

    failed() {

        return this.generate()

            .filter(runtime => runtime.lastError !== null)

            .length;

    }

    /**
     * Gesamte Uptime.
     *
     * @returns {Number}
     */

    totalUptime() {

        return this.generate()

            .reduce(

                (total, runtime) =>

                    total + runtime.uptime,

                0

            );

    }

    /**
     * Gesamte Neustarts.
     *
     * @returns {Number}
     */

    totalRestarts() {

        return this.generate()

            .reduce(

                (total, runtime) =>

                    total + runtime.restartCount,

                0

            );

    }

    /**
     * Zusammenfassung.
     *
     * @returns {Object}
     */

    summary() {

        return {

            createdAt: this.createdAt,

            total: this.count(),

            running: this.running(),

            stopped: this.stopped(),

            failed: this.failed(),

            totalRestarts: this.totalRestarts(),

            totalUptime: this.totalUptime()

        };

    }

    /**
     * JSON-Export.
     *
     * @returns {Object}
     */

    toJSON() {

        return {

            summary: this.summary(),

            runtimes: this.generate()

        };

    }

}

module.exports = ModuleRuntimeReport;