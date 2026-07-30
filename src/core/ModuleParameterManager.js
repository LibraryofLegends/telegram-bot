'use strict';

const ModuleParameterRegistry = require('./ModuleParameterRegistry');
const ModuleParameterHistory = require('./ModuleParameterHistory');

class ModuleParameterManager {

    constructor() {

        this.registry = new ModuleParameterRegistry();

        this.history = new ModuleParameterHistory();

    }

    register(parameter) {

        this.registry.register(parameter);

        this.history.add(

            parameter.getName(),

            parameter.getValue()

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

module.exports = ModuleParameterManager;