/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/Kernel.js
 * ============================================================================
 */

'use strict';

class Kernel {

    /**
     * @param {Application} application
     */
    constructor(application) {

        this.application = application;

        this.booted = false;

    }

    /**
     * Framework starten.
     */
    async boot() {

        if (this.booted) {

            return;

        }

        if (this.application.database?.connect) {

            await this.application.database.connect();

        }

        if (this.application.eventBus?.start) {

            await this.application.eventBus.start();

        }

        if (this.application.scheduler?.start) {

            await this.application.scheduler.start();

        }

        if (this.application.telegram?.start) {

            await this.application.telegram.start();

        }

        if (this.application.api?.start) {

            await this.application.api.start();

        }

        this.booted = true;

    }

    /**
     * Framework herunterfahren.
     */
    async shutdown() {

        if (this.application.scheduler?.stop) {

            await this.application.scheduler.stop();

        }

        if (this.application.telegram?.stop) {

            await this.application.telegram.stop();

        }

        if (this.application.api?.stop) {

            await this.application.api.stop();

        }

        if (this.application.database?.disconnect) {

            await this.application.database.disconnect();

        }

        this.booted = false;

    }

    /**
     * Status.
     */
    isBooted() {

        return this.booted;

    }

}

module.exports = Kernel;