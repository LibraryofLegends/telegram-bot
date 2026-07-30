'use strict';

class ModuleStatusStore {

    constructor() {

        this.store = new Map();

    }

    save(module, status) {

        this.store.set(module, status);

        return this;

    }

    load(module) {

        return this.store.get(module) || null;

    }

    has(module) {

        return this.store.has(module);

    }

    delete(module) {

        return this.store.delete(module);

    }

    clear() {

        this.store.clear();

    }

    count() {

        return this.store.size;

    }

    keys() {

        return [...this.store.keys()];

    }

}

module.exports = ModuleStatusStore;