'use strict';

const ModuleQueueRegistry = require('./ModuleQueueRegistry');
const ModuleQueueHistory = require('./ModuleQueueHistory');

class ModuleQueueManager {

    constructor() {

        this.registry = new ModuleQueueRegistry();

        this.history = new ModuleQueueHistory();

    }

    register(name, queue) {

        this.registry.register(name, queue);

        this.history.add(

            queue.count()

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

module.exports = ModuleQueueManager;