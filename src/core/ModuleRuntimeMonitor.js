/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleRuntimeMonitor.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Überwacht sämtliche ModuleRuntime-Instanzen und liefert Informationen
 * über laufende, gestoppte und fehlerhafte Module.
 *
 * ============================================================================
 */

'use strict';

class ModuleRuntimeMonitor {

    /**
     * Konstruktor.
     *
     * @param {ModuleRuntimeRegistry} registry
     */

    constructor(registry) {

        this.registry = registry;

        this.lastCheck = null;

    }

    /**
     * Überwachung ausführen.
     *
     * @returns {Object}
     */

    check() {

        this.lastCheck = new Date();

        const runtimes = this.registry.all();

        return {

            timestamp: this.lastCheck,

            total: runtimes.length,

            running: runtimes.filter(

                runtime => runtime.isRunning()

            ).length,

            stopped: runtimes.filter(

                runtime => !runtime.isRunning()

            ).length,

            failed: runtimes.filter(

                runtime => runtime.getLastError() !== null

            ).length

        };

    }

    /**
     * Laufende Module.
     *
     * @returns {Array<ModuleRuntime>}
     */

    running() {

        return this.registry.running();

    }

    /**
     * Gestoppte Module.
     *
     * @returns {Array<ModuleRuntime>}
     */

    stopped() {

        return this.registry.stopped();

    }

    /**
     * Fehlerhafte Module.
     *
     * @returns {Array<ModuleRuntime>}
     */

    failed() {

        return this.registry

            .all()

            .filter(

                runtime => runtime.getLastError() !== null

            );

    }

    /**
     * Zeitpunkt der letzten Prüfung.
     *
     * @returns {Date|null}
     */

    getLastCheck() {

        return this.lastCheck;

    }

    /**
     * JSON-Export.
     *
     * @returns {Object}
     */

    toJSON() {

        return this.check();

    }

}

module.exports = ModuleRuntimeMonitor;