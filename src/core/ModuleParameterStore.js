'use strict';

class ModuleParameterStore {

    constructor() {

        this.store = new Map();

    }

    save(name, parameter) {

        this.store.set(name, parameter);

        return this;

    }

    load(name) {

        return this.store.get(name) || null;

    }

    has(name) {

        return this.store.has(name);

    }

    delete(name) {

        return this.store.delete(name);

    }

    keys() {

        return [...this.store.keys()];

    }

    values() {

        return [...this.store.values()];

    }

    clear() {

        this.store.clear();

    }

}

module.exports = ModuleParameterStore;