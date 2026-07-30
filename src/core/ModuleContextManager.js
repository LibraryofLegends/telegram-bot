'use strict';

const ModuleContextRegistry = require('./ModuleContextRegistry');
const ModuleContextHistory = require('./ModuleContextHistory');

class ModuleContextManager {

    constructor() {

        this.registry = new ModuleContextRegistry();

        this.history = new ModuleContextHistory();

    }

    register(context) {

        this.registry.register(context);

        this.history.add(

            context.getName(),

            context.all()

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

module.exports = ModuleContextManager;