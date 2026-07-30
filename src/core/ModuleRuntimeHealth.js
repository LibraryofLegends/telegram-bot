/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleRuntimeHealth.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Bewertet den Gesundheitszustand einer ModuleRuntime.
 *
 * ============================================================================
 */

'use strict';

class ModuleRuntimeHealth {

    /**
     * Konstruktor.
     *
     * @param {ModuleRuntime} runtime
     */

    constructor(runtime) {

        this.runtime = runtime;

        this.checkedAt = null;

    }

    /**
     * Gesundheitsprüfung.
     *
     * @returns {Object}
     */

    check() {

        this.checkedAt = new Date();

        const issues = [];

        if (!this.runtime.isRunning()) {

            issues.push('Modul läuft nicht.');

        }

        if (this.runtime.getLastError()) {

            issues.push('Letzter Lauf endete mit einem Fehler.');

        }

        return {

            module: this.runtime.toJSON().module,

            healthy: issues.length === 0,

            running: this.runtime.isRunning(),

            uptime: this.runtime.getUptime(),

            restartCount: this.runtime.getRestartCount(),

            issues,

            checkedAt: this.checkedAt

        };

    }

    /**
     * Modul gesund?
     *
     * @returns {Boolean}
     */

    isHealthy() {

        return this.check().healthy;

    }

    /**
     * Prüfdatum.
     *
     * @returns {Date|null}
     */

    getCheckedAt() {

        return this.checkedAt;

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

module.exports = ModuleRuntimeHealth;