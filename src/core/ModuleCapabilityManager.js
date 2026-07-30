'use strict';

const ModuleCapabilityRegistry = require('./ModuleCapabilityRegistry');
const ModuleCapabilityHistory = require('./ModuleCapabilityHistory');

class ModuleCapabilityManager {

    constructor() {

        this.registry = new ModuleCapabilityRegistry();

        this.history = new ModuleCapabilityHistory();

    }

    register(capability) {

        this.registry.register(capability);

        this.history.add(

            capability.getName(),

            capability.isEnabled()

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

module.exports = ModuleCapabilityManager;