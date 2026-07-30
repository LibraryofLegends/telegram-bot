/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleRuntimeDiagnostics.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Führt detaillierte Laufzeitdiagnosen für eine ModuleRuntime durch.
 *
 * ============================================================================
 */

'use strict';

class ModuleRuntimeDiagnostics {

    /**
     * Konstruktor.
     *
     * @param {ModuleRuntime} runtime
     */

    constructor(runtime) {

        this.runtime = runtime;

    }

    /**
     * Diagnose ausführen.
     *
     * @returns {Object}
     */

    run() {

        const diagnostics = [

            this.checkRunning(),

            this.checkUptime(),

            this.checkRestartCount(),

            this.checkLastError()

        ];

        return {

            module: this.runtime.toJSON().module,

            timestamp: new Date(),

            success: diagnostics.every(

                diagnostic => diagnostic.success

            ),

            diagnostics

        };

    }

    /**
     * Läuft das Modul?
     *
     * @returns {Object}
     */

    checkRunning() {

        const running = this.runtime.isRunning();

        return {

            check: 'running',

            success: running,

            value: running,

            message: running

                ? 'Modul läuft.'

                : 'Modul ist gestoppt.'

        };

    }

    /**
     * Uptime prüfen.
     *
     * @returns {Object}
     */

    checkUptime() {

        return {

            check: 'uptime',

            success: true,

            value: this.runtime.getUptime(),

            message: 'OK'

        };

    }

    /**
     * Neustarts prüfen.
     *
     * @returns {Object}
     */

    checkRestartCount() {

        return {

            check: 'restartCount',

            success: true,

            value: this.runtime.getRestartCount(),

            message: 'OK'

        };

    }

    /**
     * Letzten Fehler prüfen.
     *
     * @returns {Object}
     */

    checkLastError() {

        const error = this.runtime.getLastError();

        return {

            check: 'lastError',

            success: error === null,

            value: error

                ? error.message || String(error)

                : null,

            message: error

                ? 'Fehler vorhanden.'

                : 'Kein Fehler.'

        };

    }

    /**
     * JSON-Export.
     *
     * @returns {Object}
     */

    toJSON() {

        return this.run();

    }

}

module.exports = ModuleRuntimeDiagnostics;