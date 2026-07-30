'use strict';

class ModuleStateMachineRegistry {

    constructor() {

        this.items = new Map();

    }

    register(name, machine) {

        this.items.set(name, machine);

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

module.exports = ModuleStateMachineRegistry;