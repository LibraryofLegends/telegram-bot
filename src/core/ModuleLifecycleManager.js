'use strict';

const ModuleLifecycleRegistry = require('./ModuleLifecycleRegistry');
const ModuleLifecycleHistory = require('./ModuleLifecycleHistory');

class ModuleLifecycleManager {

    constructor() {

        this.registry = new ModuleLifecycleRegistry();

        this.history = new ModuleLifecycleHistory();

    }

    register(name, lifecycle) {

        this.registry.register(

            name,

            lifecycle

        );

        return this;

    }

    transition(name, phase) {

        const lifecycle = this.registry.get(name);

        if (!lifecycle) {

            return false;

        }

        lifecycle.enter(phase);

        this.history.add(

            name,

            phase

        );

        return true;

    }

    get(name) {

        return this.registry.get(name);

    }

    clear() {

        this.registry.clear();

        this.history.clear();

    }

}

module.exports = ModuleLifecycleManager;