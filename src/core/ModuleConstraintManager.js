'use strict';

const ModuleConstraintRegistry = require('./ModuleConstraintRegistry');
const ModuleConstraintHistory = require('./ModuleConstraintHistory');

class ModuleConstraintManager {

    constructor() {

        this.registry = new ModuleConstraintRegistry();

        this.history = new ModuleConstraintHistory();

    }

    register(constraint) {

        this.registry.register(constraint);

        this.history.add(

            constraint.getName(),

            constraint.isEnabled()

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

module.exports = ModuleConstraintManager;