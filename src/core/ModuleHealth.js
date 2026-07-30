/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleHealth.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Ermittelt den Gesundheitsstatus eines Moduls.
 *
 * ============================================================================
 */

'use strict';

class ModuleHealth {

    /**
     * Konstruktor.
     *
     * @param {Module} module
     */

    constructor(module) {

        this.module = module;

        this.lastCheck = null;

    }

    /**
     * Gesundheitsprüfung durchführen.
     *
     * @returns {Object}
     */

    check() {

        this.lastCheck = new Date();

        const issues = [];

        if (!this.module.getName()) {

            issues.push('Fehlender Modulname.');

        }

        if (!this.module.getVersion()) {

            issues.push('Fehlende Modulversion.');

        }

        if (!Array.isArray(this.module.getDependencies())) {

            issues.push('Ungültige Modulabhängigkeiten.');

        }

        return {

            healthy: issues.length === 0,

            issues,

            checkedAt: this.lastCheck

        };

    }

    /**
     * Modul ist gesund?
     *
     * @returns {Boolean}
     */

    isHealthy() {

        return this.check().healthy;

    }

    /**
     * Letzte Prüfung.
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

module.exports = ModuleHealth;