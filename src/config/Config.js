/**
 * ========================================================================
 * Library Of Legends 2.0
 * ------------------------------------------------------------------------
 * Datei:
 * src/config/Config.js
 * ------------------------------------------------------------------------
 * Beschreibung:
 *
 * Zentrale Konfigurationsklasse.
 * ========================================================================
 */

'use strict';

class Config {

    constructor(values = {}) {

        this.values = values;

    }

    get(path, fallback = null) {

        const keys = path.split('.');

        let current = this.values;

        for (const key of keys) {

            if (
                current === undefined ||
                current === null
            ) {

                return fallback;

            }

            current = current[key];

        }

        return current ?? fallback;

    }

    set(path, value) {

        const keys = path.split('.');

        let current = this.values;

        while (keys.length > 1) {

            const key = keys.shift();

            if (!current[key]) {

                current[key] = {};

            }

            current = current[key];

        }

        current[keys[0]] = value;

        return this;

    }

    has(path) {

        return this.get(path) !== null;

    }

    all() {

        return structuredClone(this.values);

    }

}

module.exports = Config;