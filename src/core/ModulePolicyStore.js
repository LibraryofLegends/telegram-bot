'use strict';

class ModulePolicyStore {

    constructor() {

        this.store = new Map();

    }

    save(name, policy) {

        this.store.set(name, policy);

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

module.exports = ModulePolicyStore;