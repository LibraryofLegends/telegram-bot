'use strict';

class ModuleDescriptorStore {

    constructor() {

        this.store = new Map();

    }

    save(name, descriptor) {

        this.store.set(name, descriptor);

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

    clear() {

        this.store.clear();

    }

    keys() {

        return [...this.store.keys()];

    }

    values() {

        return [...this.store.values()];

    }

}

module.exports = ModuleDescriptorStore;