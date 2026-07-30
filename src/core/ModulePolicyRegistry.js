'use strict';

class ModulePolicyRegistry {

    constructor() {

        this.policies = new Map();

    }

    register(policy) {

        this.policies.set(
            policy.getName(),
            policy
        );

        return this;

    }

    get(name) {

        return this.policies.get(name) || null;

    }

    has(name) {

        return this.policies.has(name);

    }

    remove(name) {

        return this.policies.delete(name);

    }

    all() {

        return [...this.policies.values()];

    }

    clear() {

        this.policies.clear();

    }

    count() {

        return this.policies.size;

    }

}

module.exports = ModulePolicyRegistry;