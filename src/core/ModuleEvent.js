/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleEvent.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Basis-Event für sämtliche Modul-Ereignisse.
 *
 * ============================================================================
 */

'use strict';

const Event = require('../events/Event');

class ModuleEvent extends Event {

    /**
     * Konstruktor.
     *
     * @param {String} name
     * @param {Module} module
     * @param {Object} context
     */

    constructor(

        name,

        module,

        context = {}

    ) {

        super(name);

        this.module = module;

        this.context = context;

        this.timestamp = new Date();

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
     * Version.
     *
     * @returns {String}
     */

    getModuleVersion() {

        return this.module.getVersion();

    }

    /**
     * Kontext.
     *
     * @returns {Object}
     */

    getContext() {

        return this.context;

    }

    /**
     * Einzelnen Kontextwert setzen.
     *
     * @param {String} key
     * @param {*} value
     * @returns {ModuleEvent}
     */

    setContextValue(

        key,

        value

    ) {

        this.context[key] = value;

        return this;

    }

    /**
     * Kontextwert abrufen.
     *
     * @param {String} key
     * @param {*} defaultValue
     * @returns {*}
     */

    getContextValue(

        key,

        defaultValue = null

    ) {

        return key in this.context

            ? this.context[key]

            : defaultValue;

    }

    /**
     * Zeitstempel.
     *
     * @returns {Date}
     */

    getTimestamp() {

        return this.timestamp;

    }

    /**
     * Export.
     *
     * @returns {Object}
     */

    toJSON() {

        return {

            event: this.name,

            module: this.getModuleName(),

            version: this.getModuleVersion(),

            timestamp: this.timestamp,

            context: this.context

        };

    }

}

module.exports = ModuleEvent;