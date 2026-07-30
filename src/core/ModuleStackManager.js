'use strict';

const ModuleStackRegistry = require('./ModuleStackRegistry');
const ModuleStackHistory = require('./ModuleStackHistory');

class ModuleStackManager {

    constructor() {

        this.registry = new ModuleStackRegistry();

        this.history = new ModuleStackHistory();

    }

    register(name, stack) {

        this.registry.register(name, stack);

        this.history.add(

            stack.count()

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

module.exports = ModuleStackManager;