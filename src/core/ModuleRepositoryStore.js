'use strict';

class ModuleRepositoryStore {

    constructor() {

        this.store = new Map();

    }

    save(name, repository) {

        this.store.set(name, repository);

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

module.exports = ModuleRepositoryStore;