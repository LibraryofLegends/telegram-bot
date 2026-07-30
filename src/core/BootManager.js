/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/BootManager.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Verwaltet den kompletten Boot-Vorgang des Frameworks.
 *
 * ============================================================================
 */

'use strict';

class BootManager {

    constructor(logger = console) {

        this.logger = logger;

        this.steps = [];

        this.booted = false;

    }

    /**
     * Boot-Schritt registrieren.
     *
     * @param {String} name
     * @param {Function} callback
     * @returns {BootManager}
     */

    register(name, callback) {

        this.steps.push({

            name,

            callback

        });

        return this;

    }

    /**
     * Boot-Sequenz starten.
     */

    async boot() {

        if (this.booted) {

            return;

        }

        for (const step of this.steps) {

            this.logger.info(

                `[BOOT] ${step.name}`

            );

            await step.callback();

        }

        this.booted = true;

    }

    /**
     * Bootstatus.
     */

    isBooted() {

        return this.booted;

    }

    /**
     * Anzahl Boot-Schritte.
     */

    count() {

        return this.steps.length;

    }

    /**
     * Alle Schritte.
     */

    getSteps() {

        return [

            ...this.steps

        ];

    }

    /**
     * Alles zurücksetzen.
     */

    clear() {

        this.steps = [];

        this.booted = false;

    }

}

module.exports = BootManager;