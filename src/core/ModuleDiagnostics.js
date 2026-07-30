/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleDiagnostics.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Führt Diagnoseprüfungen für ein Modul durch und liefert einen
 * strukturierten Diagnosebericht.
 *
 * ============================================================================
 */

'use strict';

class ModuleDiagnostics {

    /**
     * Konstruktor.
     *
     * @param {Module} module
     */

    constructor(module) {

        this.module = module;

    }

    /**
     * Diagnose ausführen.
     *
     * @returns {Object}
     */

    run() {

        const diagnostics = [];

        diagnostics.push(this.checkName());

        diagnostics.push(this.checkVersion());

        diagnostics.push(this.checkDescription());

        diagnostics.push(this.checkDependencies());

        diagnostics.push(this.checkStatus());

        return {

            module: this.module.getName(),

            timestamp: new Date(),

            success: diagnostics.every(item => item.success),

            diagnostics

        };

    }

    /**
     * Modulname prüfen.
     */

    checkName() {

        const valid =

            typeof this.module.getName() === 'string' &&

            this.module.getName().trim().length > 0;

        return {

            check: 'name',

            success: valid,

            message: valid

                ? 'OK'

                : 'Modulname fehlt.'

        };

    }

    /**
     * Version prüfen.
     */

    checkVersion() {

        const valid =

            typeof this.module.getVersion() === 'string' &&

            this.module.getVersion().trim().length > 0;

        return {

            check: 'version',

            success: valid,

            message: valid

                ? 'OK'

                : 'Version fehlt.'

        };

    }

    /**
     * Beschreibung prüfen.
     */

    checkDescription() {

        const valid =

            typeof this.module.getDescription() === 'string';

        return {

            check: 'description',

            success: valid,

            message: valid

                ? 'OK'

                : 'Beschreibung ungültig.'

        };

    }

    /**
     * Abhängigkeiten prüfen.
     */

    checkDependencies() {

        const dependencies =

            this.module.getDependencies();

        const valid = Array.isArray(dependencies);

        return {

            check: 'dependencies',

            success: valid,

            count: valid

                ? dependencies.length

                : 0,

            message: valid

                ? 'OK'

                : 'Ungültige Abhängigkeiten.'

        };

    }

    /**
     * Status prüfen.
     */

    checkStatus() {

        return {

            check: 'status',

            success: true,

            enabled: this.module.isEnabled(),

            loaded: this.module.isLoaded(),

            message: 'OK'

        };

    }

    /**
     * JSON.
     *
     * @returns {Object}
     */

    toJSON() {

        return this.run();

    }

}

module.exports = ModuleDiagnostics;