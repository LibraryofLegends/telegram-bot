/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleState.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Definiert den aktuellen Zustand eines Moduls.
 *
 * ============================================================================
 */

'use strict';

class ModuleState {

    static REGISTERED = 'registered';

    static RESOLVED = 'resolved';

    static LOADING = 'loading';

    static LOADED = 'loaded';

    static BOOTING = 'booting';

    static RUNNING = 'running';

    static STOPPING = 'stopping';

    static STOPPED = 'stopped';

    static DISABLED = 'disabled';

    static FAILED = 'failed';

    /**
     * Konstruktor.
     */

    constructor(state = ModuleState.REGISTERED) {

        this.state = state;

        this.updatedAt = new Date();

    }

    /**
     * Zustand setzen.
     *
     * @param {String} state
     * @returns {ModuleState}
     */

    set(state) {

        this.state = state;

        this.updatedAt = new Date();

        return this;

    }

    /**
     * Zustand abrufen.
     *
     * @returns {String}
     */

    get() {

        return this.state;

    }

    /**
     * Prüfen.
     *
     * @param {String} state
     * @returns {Boolean}
     */

    is(state) {

        return this.state === state;

    }

    /**
     * Läuft das Modul?
     *
     * @returns {Boolean}
     */

    isRunning() {

        return this.state === ModuleState.RUNNING;

    }

    /**
     * Ist das Modul geladen?
     *
     * @returns {Boolean}
     */

    isLoaded() {

        return [

            ModuleState.LOADED,

            ModuleState.BOOTING,

            ModuleState.RUNNING

        ].includes(this.state);

    }

    /**
     * Ist das Modul gestoppt?
     *
     * @returns {Boolean}
     */

    isStopped() {

        return this.state === ModuleState.STOPPED;

    }

    /**
     * Ist das Modul fehlgeschlagen?
     *
     * @returns {Boolean}
     */

    isFailed() {

        return this.state === ModuleState.FAILED;

    }

    /**
     * Zeitpunkt der letzten Änderung.
     *
     * @returns {Date}
     */

    getUpdatedAt() {

        return this.updatedAt;

    }

    /**
     * Export.
     *
     * @returns {Object}
     */

    toJSON() {

        return {

            state: this.state,

            updatedAt: this.updatedAt

        };

    }

}

module.exports = ModuleState;