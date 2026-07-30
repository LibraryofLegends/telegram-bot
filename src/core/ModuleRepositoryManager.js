'use strict';

const ModuleRepositoryRegistry = require('./ModuleRepositoryRegistry');
const ModuleRepositoryHistory = require('./ModuleRepositoryHistory');

class ModuleRepositoryManager {

    constructor() {

        this.registry = new ModuleRepositoryRegistry();

        this.history = new ModuleRepositoryHistory();

    }

    register(name, repository) {

        this.registry.register(name, repository);

        this.history.add(

            repository.count()

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

module.exports = ModuleRepositoryManager;