'use strict';

const ModuleResolverRegistry = require('./ModuleResolverRegistry');
const ModuleResolverHistory = require('./ModuleResolverHistory');

class ModuleResolverManager {

    constructor() {

        this.registry = new ModuleResolverRegistry();

        this.history = new ModuleResolverHistory();

    }

    register(name, resolver) {

        this.registry.register(name, resolver);

        this.history.add(

            resolver.count()

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

module.exports = ModuleResolverManager;