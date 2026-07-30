'use strict';

const ModuleContainerRegistry = require('./ModuleContainerRegistry');
const ModuleContainerHistory = require('./ModuleContainerHistory');

class ModuleContainerManager {

    constructor() {

        this.registry = new ModuleContainerRegistry();

        this.history = new ModuleContainerHistory();

    }

    register(name, container) {

        this.registry.register(name, container);

        this.history.add(

            container.count()

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

module.exports = ModuleContainerManager;