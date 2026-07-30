'use strict';

const ModuleFlagRegistry = require('./ModuleFlagRegistry');
const ModuleFlagHistory = require('./ModuleFlagHistory');

class ModuleFlagManager {

    constructor() {

        this.registry = new ModuleFlagRegistry();

        this.history = new ModuleFlagHistory();

    }

    register(flag) {

        this.registry.register(flag);

        this.history.add(

            flag.getName(),

            flag.isEnabled()

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

module.exports = ModuleFlagManager;