'use strict';

class ModuleEnvironmentRegistry {

    constructor() {

        this.environments = new Map();

    }

    register(environment) {

        this.environments.set(

            environment.getName(),

            environment

        );

        return this;

    }

    get(name) {

        return this.environments.get(name) || null;

    }

    has(name) {

        return this.environments.has(name);

    }

    remove(name) {

        return this.environments.delete(name);

    }

    all() {

        return [...this.environments.values()];

    }

    clear() {

        this.environments.clear();

    }

    count() {

        return this.environments.size;

    }

}

module.exports = ModuleEnvironmentRegistry;