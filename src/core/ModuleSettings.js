'use strict';

class ModuleSettings {

    constructor(values = {}) {

        this.settings = new Map(
            Object.entries(values)
        );

    }

    set(key, value) {

        this.settings.set(key, value);

        return this;

    }

    get(key, defaultValue = null) {

        return this.settings.has(key)
            ? this.settings.get(key)
            : defaultValue;

    }

    has(key) {

        return this.settings.has(key);

    }

    remove(key) {

        return this.settings.delete(key);

    }

    merge(values = {}) {

        for (const [key, value] of Object.entries(values)) {

            this.settings.set(key, value);

        }

        return this;

    }

    clear() {

        this.settings.clear();

    }

    all() {

        return Object.fromEntries(
            this.settings.entries()
        );

    }

}

module.exports = ModuleSettings;