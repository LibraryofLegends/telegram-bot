'use strict';

const ModuleFeatureRegistry = require('./ModuleFeatureRegistry');
const ModuleFeatureHistory = require('./ModuleFeatureHistory');

class ModuleFeatureManager {

    constructor() {

        this.registry = new ModuleFeatureRegistry();
        this.history = new ModuleFeatureHistory();

    }

    register(feature) {

        this.registry.register(feature);

        this.history.add(

            feature.getName(),

            feature.isEnabled()

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

module.exports = ModuleFeatureManager;