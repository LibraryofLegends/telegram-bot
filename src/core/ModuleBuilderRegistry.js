'use strict';

class ModuleBuilderRegistry {

    constructor() {

        this.items = new Map();

    }

    register(name, builder) {

        this.items.set(name, builder);

        return this;

    }

    get(name) {

        return this.items.get(name) || null;

    }

    has(name) {

        return this.items.has(name);

    }

    remove(name) {

        return this.items.delete(name);

    }

    all() {

        return [...this.items.values()];

    }

    clear() {

        this.items.clear();

    }

    count() {

        return this.items.size;

    }

}

module.exports = ModuleBuilderRegistry;