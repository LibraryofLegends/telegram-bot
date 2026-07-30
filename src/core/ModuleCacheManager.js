'use strict';

const ModuleCacheRegistry = require('./ModuleCacheRegistry');
const ModuleCacheHistory = require('./ModuleCacheHistory');

class ModuleCacheManager {

    constructor() {

        this.registry = new ModuleCacheRegistry();

        this.history = new ModuleCacheHistory();

    }

    register(name, cache) {

        this.registry.register(name, cache);

        this.history.add(

            cache.count()

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

module.exports = ModuleCacheManager;