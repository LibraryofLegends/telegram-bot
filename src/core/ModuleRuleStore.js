'use strict';

class ModuleRuleStore {

    constructor() {

        this.store = new Map();

    }

    save(name, rule) {

        this.store.set(name, rule);

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

module.exports = ModuleRuleStore;