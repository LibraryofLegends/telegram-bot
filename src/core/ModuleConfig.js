'use strict';

class ModuleConfig {

    constructor(values = {}) {

        this.values = new Map(
            Object.entries(values)
        );

    }

    get(key, defaultValue = null) {

        return this.values.has(key)
            ? this.values.get(key)
            : defaultValue;

    }

    set(key, value) {

        this.values.set(key, value);

        return this;

    }

    has(key) {

        return this.values.has(key);

    }

    remove(key) {

        return this.values.delete(key);

    }

    merge(values = {}) {

        for (const [key, value] of Object.entries(values)) {

            this.values.set(key, value);

        }

        return this;

    }

    clear() {

        this.values.clear();

    }

    all() {

        return Object.fromEntries(
            this.values.entries()
        );

    }

}

module.exports = ModuleConfig;