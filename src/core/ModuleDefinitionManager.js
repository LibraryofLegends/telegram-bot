'use strict';

const ModuleDefinitionRegistry = require('./ModuleDefinitionRegistry');
const ModuleDefinitionHistory = require('./ModuleDefinitionHistory');

class ModuleDefinitionManager {

    constructor() {

        this.registry = new ModuleDefinitionRegistry();

        this.history = new ModuleDefinitionHistory();

    }

    register(definition) {

        this.registry.register(definition);

        this.history.add(

            definition.all()

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

module.exports = ModuleDefinitionManager;