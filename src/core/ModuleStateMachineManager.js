'use strict';

const ModuleStateMachineRegistry = require('./ModuleStateMachineRegistry');
const ModuleStateMachineHistory = require('./ModuleStateMachineHistory');

class ModuleStateMachineManager {

    constructor() {

        this.registry = new ModuleStateMachineRegistry();
        this.history = new ModuleStateMachineHistory();

    }

    register(name, machine) {

        this.registry.register(name, machine);

        this.history.add(

            machine.getState()

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

module.exports = ModuleStateMachineManager;