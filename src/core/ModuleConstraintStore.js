'use strict';

class ModuleConstraintStore {

    constructor() {

        this.store = new Map();

    }

    save(name, constraint) {

        this.store.set(name, constraint);

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

module.exports = ModuleConstraintStore;