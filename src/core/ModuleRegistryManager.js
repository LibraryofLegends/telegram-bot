'use strict';

const ModuleRegistry = require('./ModuleRegistry');
const ModuleRegistryHistory = require('./ModuleRegistryHistory');

class ModuleRegistryManager {

    constructor() {

        this.registry = new ModuleRegistry();

        this.history = new ModuleRegistryHistory();

    }

    register(module) {

        this.registry.register(module);

        this.history.add(

            this.registry.count()

        );

        return this;

    }

    get(name) {

        return this.registry.get(name);

    }

    has(name) {

        return this.registry.has(name);

    }

    remove(name) {

        return this.registry.unregister(name);

    }

    clear() {

        this.registry.clear();

        this.history.clear();

    }

}

module.exports = ModuleRegistryManager;