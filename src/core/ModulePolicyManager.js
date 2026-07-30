'use strict';

const ModulePolicyRegistry = require('./ModulePolicyRegistry');
const ModulePolicyHistory = require('./ModulePolicyHistory');

class ModulePolicyManager {

    constructor() {

        this.registry = new ModulePolicyRegistry();

        this.history = new ModulePolicyHistory();

    }

    register(policy) {

        this.registry.register(policy);

        this.history.add(

            policy.getName(),

            policy.isActive()

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

module.exports = ModulePolicyManager;