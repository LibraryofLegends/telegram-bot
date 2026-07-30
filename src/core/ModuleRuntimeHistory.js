/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleRuntimeHistory.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Speichert die komplette Laufzeithistorie eines Moduls.
 *
 * ============================================================================
 */

'use strict';

class ModuleRuntimeHistory {

    /**
     * Konstruktor.
     */

    constructor() {

        this.entries = [];

    }

    /**
     * Eintrag hinzufügen.
     *
     * @param {String} type
     * @param {Object} data
     * @returns {ModuleRuntimeHistory}
     */

    add(type, data = {}) {

        this.entries.push({

            timestamp: new Date(),

            type,

            data

        });

        return this;

    }

    /**
     * Start protokollieren.
     */

    started(data = {}) {

        return this.add('started', data);

    }

    /**
     * Stopp protokollieren.
     */

    stopped(data = {}) {

        return this.add('stopped', data);

    }

    /**
     * Neustart protokollieren.
     */

    restarted(data = {}) {

        return this.add('restarted', data);

    }

    /**
     * Fehler protokollieren.
     */

    failed(error) {

        return this.add('failed', {

            message:

                error?.message ||

                String(error)

        });

    }

    /**
     * Benutzerdefiniertes Ereignis.
     */

    event(type, data = {}) {

        return this.add(type, data);

    }

    /**
     * Gesamte Historie.
     */

    all() {

        return [...this.entries];

    }

    /**
     * Letzter Eintrag.
     */

    latest() {

        if (this.entries.length === 0) {

            return null;

        }

        return this.entries[

            this.entries.length - 1

        ];

    }

    /**
     * Erster Eintrag.
     */

    first() {

        if (this.entries.length === 0) {

            return null;

        }

        return this.entries[0];

    }

    /**
     * Anzahl Einträge.
     */

    count() {

        return this.entries.length;

    }

    /**
     * Historie löschen.
     */

    clear() {

        this.entries.length = 0;

    }

    /**
     * JSON-Export.
     */

    toJSON() {

        return this.all();

    }

}

module.exports = ModuleRuntimeHistory;