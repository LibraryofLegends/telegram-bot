/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleResolver.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Löst Module anhand ihres Namens oder Typs auf.
 *
 * ============================================================================
 */

'use strict';

class ModuleResolver {

    /**
     * Konstruktor.
     *
     * @param {ModuleRegistry} registry
     */

    constructor(registry) {

        this.registry = registry;

    }

    /**
     * Modul auflösen.
     *
     * @param {String|Function|Object} module
     * @returns {Module}
     */

    resolve(module) {

        if (!module) {

            throw new Error(

                'Kein Modul angegeben.'

            );

        }

        if (typeof module === 'string') {

            return this.registry.get(module);

        }

        if (typeof module === 'function') {

            return this.registry.get(

                module.name

            );

        }

        return module;

    }

    /**
     * Existiert das Modul?
     *
     * @param {String|Function|Object} module
     * @returns {Boolean}
     */

    has(module) {

        try {

            this.resolve(module);

            return true;

        }

        catch {

            return false;

        }

    }

    /**
     * Modulname ermitteln.
     *
     * @param {String|Function|Object} module
     * @returns {String}
     */

    getName(module) {

        if (typeof module === 'string') {

            return module;

        }

        if (typeof module === 'function') {

            return module.name;

        }

        return module.getName();

    }

}

module.exports = ModuleResolver;