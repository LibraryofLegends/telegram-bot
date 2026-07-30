/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleValidator.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Validiert Module vor der Registrierung.
 *
 * ============================================================================
 */

'use strict';

const Module = require('./Module');

class ModuleValidator {

    /**
     * Modul validieren.
     *
     * @param {Module} module
     * @returns {Boolean}
     */

    static validate(module) {

        if (!(module instanceof Module)) {

            throw new Error(
                'Die Instanz ist kein gültiges Modul.'
            );

        }

        this.validateName(module);

        this.validateVersion(module);

        this.validateDependencies(module);

        return true;

    }

    /**
     * Modulname validieren.
     *
     * @param {Module} module
     */

    static validateName(module) {

        const name = module.getName();

        if (typeof name !== 'string') {

            throw new Error(
                'Der Modulname muss ein String sein.'
            );

        }

        if (name.trim().length === 0) {

            throw new Error(
                'Der Modulname darf nicht leer sein.'
            );

        }

    }

    /**
     * Version validieren.
     *
     * @param {Module} module
     */

    static validateVersion(module) {

        const version = module.getVersion();

        if (typeof version !== 'string') {

            throw new Error(
                'Die Modulversion muss ein String sein.'
            );

        }

        if (version.trim().length === 0) {

            throw new Error(
                'Die Modulversion darf nicht leer sein.'
            );

        }

    }

    /**
     * Abhängigkeiten validieren.
     *
     * @param {Module} module
     */

    static validateDependencies(module) {

        const dependencies = module.getDependencies();

        if (!Array.isArray(dependencies)) {

            throw new Error(
                'Die Modulabhängigkeiten müssen ein Array sein.'
            );

        }

        for (const dependency of dependencies) {

            if (typeof dependency !== 'string') {

                throw new Error(
                    `Ungültige Modulabhängigkeit in "${module.getName()}".`
                );

            }

        }

    }

    /**
     * Mehrere Module validieren.
     *
     * @param {Array<Module>} modules
     */

    static validateMany(modules) {

        for (const module of modules) {

            this.validate(module);

        }

    }

}

module.exports = ModuleValidator;