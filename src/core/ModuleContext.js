/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleContext.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Stellt einem Modul den Laufzeit-Kontext zur Verfügung.
 *
 * ============================================================================
 */

'use strict';

class ModuleContext {

    /**
     * Konstruktor.
     *
     * @param {Application} application
     * @param {Module} module
     */

    constructor(application, module) {

        this.application = application;

        this.module = module;

        this.values = new Map();

        this.createdAt = new Date();

    }

    /**
     * Application.
     *
     * @returns {Application}
     */

    getApplication() {

        return this.application;

    }

    /**
     * Modul.
     *
     * @returns {Module}
     */

    getModule() {

        return this.module;

    }

    /**
     * Modulname.
     *
     * @returns {String}
     */

    getModuleName() {

        return this.module.getName();

    }

    /**
     * Wert speichern.
     *
     * @param {String} key
     * @param {*} value
     * @returns {ModuleContext}
     */

    set(key, value) {

        this.values.set(key, value);

        return this;

    }

    /**
     * Wert abrufen.
     *
     * @param {String} key
     * @param {*} defaultValue
     * @returns {*}
     */

    get(key, defaultValue = null) {

        return this.values.has(key)

            ? this.values.get(key)

            : defaultValue;

    }

    /**
     * Existiert ein Wert?
     *
     * @param {String} key
     * @returns {Boolean}
     */

    has(key) {

        return this.values.has(key);

    }

    /**
     * Wert entfernen.
     *
     * @param {String} key
     * @returns {Boolean}
     */

    remove(key) {

        return this.values.delete(key);

    }

    /**
     * Alle Werte.
     *
     * @returns {Object}
     */

    all() {

        return Object.fromEntries(

            this.values.entries()

        );

    }

    /**
     * Anzahl.
     *
     * @returns {Number}
     */

    count() {

        return this.values.size;

    }

    /**
     * Kontext leeren.
     */

    clear() {

        this.values.clear();

    }

    /**
     * Erstellungszeitpunkt.
     *
     * @returns {Date}
     */

    getCreatedAt() {

        return this.createdAt;

    }

    /**
     * Export.
     *
     * @returns {Object}
     */

    toJSON() {

        return {

            module: this.getModuleName(),

            createdAt: this.createdAt,

            values: this.all()

        };

    }

}

module.exports = ModuleContext;