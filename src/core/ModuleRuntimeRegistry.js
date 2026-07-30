/**
 * ============================================================================
 * Library Of Legends 2.0
 * ----------------------------------------------------------------------------
 * Datei:
 * src/core/ModuleRuntimeRegistry.js
 * ----------------------------------------------------------------------------
 * Beschreibung:
 *
 * Verwaltet sämtliche Runtime-Informationen aller geladenen Module.
 *
 * ============================================================================
 */

'use strict';

const ModuleRuntime = require('./ModuleRuntime');

class ModuleRuntimeRegistry {

    /**
     * Konstruktor.
     */

    constructor() {

        this.runtimes = new Map();

    }

    /**
     * Runtime registrieren.
     *
     * @param {Module} module
     * @returns {ModuleRuntime}
     */

    register(module) {

        const runtime = new ModuleRuntime(module);

        this.runtimes.set(

            module.getName(),

            runtime

        );

        return runtime;

    }

    /**
     * Runtime abrufen.
     *
     * @param {String} name
     * @returns {ModuleRuntime|null}
     */

    get(name) {

        return this.runtimes.get(name) || null;

    }

    /**
     * Runtime vorhanden?
     *
     * @param {String} name
     * @returns {Boolean}
     */

    has(name) {

        return this.runtimes.has(name);

    }

    /**
     * Runtime entfernen.
     *
     * @param {String} name
     * @returns {Boolean}
     */

    remove(name) {

        return this.runtimes.delete(name);

    }

    /**
     * Alle Runtime-Objekte.
     *
     * @returns {Array<ModuleRuntime>}
     */

    all() {

        return [

            ...this.runtimes.values()

        ];

    }

    /**
     * Anzahl.
     *
     * @returns {Number}
     */

    count() {

        return this.runtimes.size;

    }

    /**
     * Registry leeren.
     */

    clear() {

        this.runtimes.clear();

    }

    /**
     * Laufende Module.
     *
     * @returns {Array<ModuleRuntime>}
     */

    running() {

        return this.all().filter(

            runtime => runtime.isRunning()

        );

    }

    /**
     * Gestoppte Module.
     *
     * @returns {Array<ModuleRuntime>}
     */

    stopped() {

        return this.all().filter(

            runtime => !runtime.isRunning()

        );

    }

    /**
     * Iterator.
     */

    [Symbol.iterator]() {

        return this.runtimes.values();

    }

    /**
     * JSON-Export.
     *
     * @returns {Array<Object>}
     */

    toJSON() {

        return this.all().map(

            runtime => runtime.toJSON()

        );

    }

}

module.exports = ModuleRuntimeRegistry;