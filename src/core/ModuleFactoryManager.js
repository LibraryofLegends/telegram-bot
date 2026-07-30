'use strict';

const ModuleFactoryRegistry = require('./ModuleFactoryRegistry');
const ModuleFactoryHistory = require('./ModuleFactoryHistory');

class ModuleFactoryManager {

    constructor() {

        this.registry = new ModuleFactoryRegistry();

        this.history = new ModuleFactoryHistory();

    }

    register(name, factory) {

        this.registry.register(name, factory);

        this.history.add(

            factory.count()

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

        return this.registry.remove(name);

    }

    clear() {

        this.registry.clear();

        this.history.clear();

    }

}

module.exports = ModuleFactoryManager;