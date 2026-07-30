'use strict';

const ModuleProfileRegistry = require('./ModuleProfileRegistry');
const ModuleProfileHistory = require('./ModuleProfileHistory');

class ModuleProfileManager {

    constructor() {

        this.registry = new ModuleProfileRegistry();

        this.history = new ModuleProfileHistory();

    }

    register(profile) {

        this.registry.register(profile);

        this.history.add(

            profile.getName(),

            profile.isActive()

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

module.exports = ModuleProfileManager;