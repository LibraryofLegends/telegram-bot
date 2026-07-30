'use strict';

const ModuleEventHistory = require('./ModuleEventHistory');
const ModuleEventRegistry = require('./ModuleEventRegistry');

class ModuleEventManager {

    constructor() {

        this.registry = new ModuleEventRegistry();

        this.history = new ModuleEventHistory();

    }

    register(name, event) {

        this.registry.register(name, event);

        this.history.push(name);

        return this;

    }

    get(name) {

        return this.registry.get(name);

    }

    remove(name) {

        return this.registry.remove(name);

    }

    clear() {

        this.registry.clear();

        this.history.clear();

    }

}

module.exports = ModuleEventManager;