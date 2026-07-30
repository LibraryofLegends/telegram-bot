/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/LifecycleManager.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Verwaltet den kompletten Lebenszyklus der Anwendung.
 *
 * ============================================================================
 */

'use strict';

class LifecycleManager {

    constructor(logger = console) {

        this.logger = logger;

        this.startCallbacks = [];

        this.stopCallbacks = [];

        this.started = false;

    }

    /**
     * Callback beim Start registrieren.
     *
     * @param {Function} callback
     * @returns {LifecycleManager}
     */

    onStart(callback) {

        this.startCallbacks.push(callback);

        return this;

    }

    /**
     * Callback beim Beenden registrieren.
     *
     * @param {Function} callback
     * @returns {LifecycleManager}
     */

    onStop(callback) {

        this.stopCallbacks.push(callback);

        return this;

    }

    /**
     * Anwendung starten.
     */

    async start() {

        if (this.started) {

            return;

        }

        this.logger.info(

            '[Lifecycle] Starting...'

        );

        for (const callback of this.startCallbacks) {

            await callback();

        }

        this.started = true;

    }

    /**
     * Anwendung beenden.
     */

    async stop() {

        if (!this.started) {

            return;

        }

        this.logger.info(

            '[Lifecycle] Stopping...'

        );

        for (const callback of [...this.stopCallbacks].reverse()) {

            await callback();

        }

        this.started = false;

    }

    /**
     * Neustart.
     */

    async restart() {

        await this.stop();

        await this.start();

    }

    /**
     * Status.
     *
     * @returns {Boolean}
     */

    isStarted() {

        return this.started;

    }

    /**
     * Alle Callbacks entfernen.
     */

    clear() {

        this.startCallbacks = [];

        this.stopCallbacks = [];

    }

}

module.exports = LifecycleManager;