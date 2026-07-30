/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleFactory.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Erstellt Modulinstanzen und validiert den Modultyp.
 *
 * ============================================================================
 */

'use strict';

const Module = require('./Module');

class ModuleFactory {

    /**
     * Modul erstellen.
     *
     * @param {Function|Module} definition
     * @param {Application|null} application
     * @returns {Module}
     */

    static create(definition, application = null) {

        let instance = definition;

        if (typeof definition === 'function') {

            instance = new definition();

        }

        if (!(instance instanceof Module)) {

            throw new Error(

                'Die Moduldefinition muss von Module erben.'

            );

        }

        if (application) {

            instance.setApplication(application);

        }

        return instance;

    }

    /**
     * Mehrere Module erstellen.
     *
     * @param {Array} definitions
     * @param {Application|null} application
     * @returns {Array<Module>}
     */

    static createMany(

        definitions,

        application = null

    ) {

        return definitions.map(

            definition => this.create(

                definition,

                application

            )

        );

    }

    /**
     * Prüfen, ob eine Definition gültig ist.
     *
     * @param {*} definition
     * @returns {Boolean}
     */

    static isValid(definition) {

        try {

            this.create(definition);

            return true;

        }

        catch {

            return false;

        }

    }

    /**
     * Modulnamen ermitteln.
     *
     * @param {Function|Module} definition
     * @returns {String|null}
     */

    static getName(definition) {

        try {

            return this.create(definition)

                .getName();

        }

        catch {

            return null;

        }

    }

    /**
     * Modulversion ermitteln.
     *
     * @param {Function|Module} definition
     * @returns {String|null}
     */

    static getVersion(definition) {

        try {

            return this.create(definition)

                .getVersion();

        }

        catch {

            return null;

        }

    }

}

module.exports = ModuleFactory;