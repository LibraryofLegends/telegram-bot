'use strict';

const ModuleStorageRegistry = require('./ModuleStorageRegistry');
const ModuleStorageHistory = require('./ModuleStorageHistory');

class ModuleStorageManager {

    constructor() {

        this.registry = new ModuleStorageRegistry();

        this.history = new ModuleStorageHistory();

    }

    register(name, storage) {

        this.registry.register(name, storage);

        this.history.add(

            storage.count()

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

module.exports = ModuleStorageManager;