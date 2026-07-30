'use strict';

class ModuleEventStore {

    constructor() {

        this.store = new Map();

    }

    save(id, event) {

        this.store.set(id, event);

        return this;

    }

    load(id) {

        return this.store.get(id) || null;

    }

    has(id) {

        return this.store.has(id);

    }

    delete(id) {

        return this.store.delete(id);

    }

    keys() {

        return [...this.store.keys()];

    }

    values() {

        return [...this.store.values()];

    }

    count() {

        return this.store.size;

    }

    clear() {

        this.store.clear();

    }

}

module.exports = ModuleEventStore;