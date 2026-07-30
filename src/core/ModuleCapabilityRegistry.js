'use strict';

class ModuleCapabilityRegistry {

    constructor() {

        this.capabilities = new Map();

    }

    register(capability) {

        this.capabilities.set(

            capability.getName(),

            capability

        );

        return this;

    }

    get(name) {

        return this.capabilities.get(name) || null;

    }

    has(name) {

        return this.capabilities.has(name);

    }

    remove(name) {

        return this.capabilities.delete(name);

    }

    all() {

        return [...this.capabilities.values()];

    }

    clear() {

        this.capabilities.clear();

    }

    count() {

        return this.capabilities.size;

    }

}

module.exports = ModuleCapabilityRegistry;