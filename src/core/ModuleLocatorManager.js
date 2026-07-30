'use strict';

const ModuleLocatorRegistry = require('./ModuleLocatorRegistry');
const ModuleLocatorHistory = require('./ModuleLocatorHistory');

class ModuleLocatorManager {

    constructor() {

        this.registry = new ModuleLocatorRegistry();

        this.history = new ModuleLocatorHistory();

    }

    register(name, locator) {

        this.registry.register(name, locator);

        this.history.add(

            locator.count()

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

module.exports = ModuleLocatorManager;