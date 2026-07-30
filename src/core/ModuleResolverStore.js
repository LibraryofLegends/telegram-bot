'use strict';

class ModuleResolverStore {

    constructor() {

        this.store = new Map();

    }

    save(name, resolver) {

        this.store.set(name, resolver);

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

module.exports = ModuleResolverStore;