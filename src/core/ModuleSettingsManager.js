'use strict';

const ModuleSettingsRegistry = require('./ModuleSettingsRegistry');

class ModuleSettingsManager {

    constructor() {

        this.registry = new ModuleSettingsRegistry();

    }

    register(name, settings) {

        this.registry.register(

            name,

            settings

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

    }

}

module.exports = ModuleSettingsManager;