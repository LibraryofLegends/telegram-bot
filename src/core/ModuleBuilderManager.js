'use strict';

const ModuleBuilderRegistry = require('./ModuleBuilderRegistry');
const ModuleBuilderHistory = require('./ModuleBuilderHistory');

class ModuleBuilderManager {

    constructor() {

        this.registry = new ModuleBuilderRegistry();

        this.history = new ModuleBuilderHistory();

    }

    register(name, builder) {

        this.registry.register(name, builder);

        this.history.add(

            builder.count()

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

module.exports = ModuleBuilderManager;