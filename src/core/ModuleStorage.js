'use strict';

class ModuleStorage {

    constructor() {

        this.storage = new Map();

    }

    set(key, value) {

        this.storage.set(key, value);

        return this;

    }

    get(key, defaultValue = null) {

        return this.storage.has(key)

            ? this.storage.get(key)

            : defaultValue;

    }

    has(key) {

        return this.storage.has(key);

    }

    delete(key) {

        return this.storage.delete(key);

    }

    clear() {

        this.storage.clear();

    }

    keys() {

        return [...this.storage.keys()];

    }

    values() {

        return [...this.storage.values()];

    }

    count() {

        return this.storage.size;

    }

}

module.exports = ModuleStorage;