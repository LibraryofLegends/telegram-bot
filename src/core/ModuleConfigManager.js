'use strict';

const ModuleConfigRegistry = require('./ModuleConfigRegistry');

class ModuleConfigManager {

    constructor() {

        this.registry = new ModuleConfigRegistry();

    }

    register(name, config) {

        this.registry.register(name, config);

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

    }

}

module.exports = ModuleConfigManager;