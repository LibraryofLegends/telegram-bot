'use strict';

const ModuleEnvironmentRegistry = require('./ModuleEnvironmentRegistry');
const ModuleEnvironmentHistory = require('./ModuleEnvironmentHistory');

class ModuleEnvironmentManager {

    constructor() {

        this.registry = new ModuleEnvironmentRegistry();

        this.history = new ModuleEnvironmentHistory();

    }

    register(environment) {

        this.registry.register(environment);

        this.history.add(

            environment.getName(),

            environment.isActive()

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

module.exports = ModuleEnvironmentManager;