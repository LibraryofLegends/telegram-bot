'use strict';

class ModuleConfigRegistry {

    constructor() {

        this.registry = new Map();

    }

    register(name, config) {

        this.registry.set(name, config);

        return this;

    }

    get(name) {

        return this.registry.get(name) || null;

    }

    has(name) {

        return this.registry.has(name);

    }

    remove(name) {

        return this.registry.delete(name);

    }

    all() {

        return [...this.registry.values()];

    }

    clear() {

        this.registry.clear();

    }

    count() {

        return this.registry.size;

    }

}

module.exports = ModuleConfigRegistry;