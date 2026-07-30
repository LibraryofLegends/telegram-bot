'use strict';

class ModulePermissionStore {

    constructor() {

        this.store = new Map();

    }

    save(name, permission) {

        this.store.set(name, permission);

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

module.exports = ModulePermissionStore;