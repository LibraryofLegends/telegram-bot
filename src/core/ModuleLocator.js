'use strict';

class ModuleLocator {

    constructor() {

        this.items = new Map();

    }

    register(name, value) {

        this.items.set(name, value);

        return this;

    }

    resolve(name) {

        return this.items.get(name) || null;

    }

    has(name) {

        return this.items.has(name);

    }

    unregister(name) {

        return this.items.delete(name);

    }

    clear() {

        this.items.clear();

    }

    names() {

        return [...this.items.keys()];

    }

    count() {

        return this.items.size;

    }

}

module.exports = ModuleLocator;