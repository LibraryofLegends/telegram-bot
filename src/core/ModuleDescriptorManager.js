'use strict';

const ModuleDescriptorRegistry = require('./ModuleDescriptorRegistry');
const ModuleDescriptorHistory = require('./ModuleDescriptorHistory');

class ModuleDescriptorManager {

    constructor() {

        this.registry = new ModuleDescriptorRegistry();

        this.history = new ModuleDescriptorHistory();

    }

    register(descriptor) {

        this.registry.register(descriptor);

        this.history.add({

            name: descriptor.getName(),
            version: descriptor.getVersion()

        });

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

module.exports = ModuleDescriptorManager;