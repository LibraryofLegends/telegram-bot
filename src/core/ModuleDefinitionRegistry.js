'use strict';

class ModuleDefinitionRegistry {

    constructor() {

        this.items = new Map();

    }

    register(definition) {

        this.items.set(

            definition.getName(),

            definition

        );

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

module.exports = ModuleDefinitionRegistry;