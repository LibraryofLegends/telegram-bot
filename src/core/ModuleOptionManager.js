'use strict';

const ModuleOptionRegistry = require('./ModuleOptionRegistry');
const ModuleOptionHistory = require('./ModuleOptionHistory');

class ModuleOptionManager {

    constructor() {

        this.registry = new ModuleOptionRegistry();

        this.history = new ModuleOptionHistory();

    }

    register(option) {

        this.registry.register(option);

        this.history.add(

            option.getName(),

            option.getValue()

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

module.exports = ModuleOptionManager;