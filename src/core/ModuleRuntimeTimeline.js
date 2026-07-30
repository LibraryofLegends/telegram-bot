/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleRuntimeTimeline.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Verwaltet die zeitliche Abfolge aller Laufzeitereignisse eines Moduls.
 *
 * ============================================================================
 */

'use strict';

class ModuleRuntimeTimeline {

    /**
     * Konstruktor.
     */

    constructor() {

        this.events = [];

    }

    /**
     * Ereignis hinzufügen.
     *
     * @param {String} type
     * @param {Object} payload
     * @returns {ModuleRuntimeTimeline}
     */

    add(type, payload = {}) {

        this.events.push({

            id: this.events.length + 1,

            type,

            timestamp: new Date(),

            payload

        });

        return this;

    }

    /**
     * Start.
     */

    started(payload = {}) {

        return this.add(

            'started',

            payload

        );

    }

    /**
     * Gestoppt.
     */

    stopped(payload = {}) {

        return this.add(

            'stopped',

            payload

        );

    }

    /**
     * Neustart.
     */

    restarted(payload = {}) {

        return this.add(

            'restarted',

            payload

        );

    }

    /**
     * Fehler.
     */

    failed(error) {

        return this.add(

            'failed',

            {

                message:

                    error?.message ||

                    String(error)

            }

        );

    }

    /**
     * Benutzerdefiniertes Ereignis.
     */

    event(type, payload = {}) {

        return this.add(

            type,

            payload

        );

    }

    /**
     * Alle Ereignisse.
     */

    all() {

        return [...this.events];

    }

    /**
     * Ereignisse nach Typ.
     */

    byType(type) {

        return this.events.filter(

            event => event.type === type

        );

    }

    /**
     * Letztes Ereignis.
     */

    latest() {

        return this.events.length

            ? this.events[this.events.length - 1]

            : null;

    }

    /**
     * Erstes Ereignis.
     */

    first() {

        return this.events.length

            ? this.events[0]

            : null;

    }

    /**
     * Anzahl.
     */

    count() {

        return this.events.length;

    }

    /**
     * Timeline leeren.
     */

    clear() {

        this.events.length = 0;

    }

    /**
     * JSON-Export.
     */

    toJSON() {

        return {

            total: this.count(),

            events: this.all()

        };

    }

}

module.exports = ModuleRuntimeTimeline;