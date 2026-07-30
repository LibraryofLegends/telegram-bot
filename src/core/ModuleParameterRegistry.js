'use strict';

class ModuleParameterRegistry {

    constructor() {

        this.parameters = new Map();

    }

    register(parameter) {

        this.parameters.set(

            parameter.getName(),

            parameter

        );

        return this;

    }

    get(name) {

        return this.parameters.get(name) || null;

    }

    has(name) {

        return this.parameters.has(name);

    }

    remove(name) {

        return this.parameters.delete(name);

    }

    all() {

        return [...this.parameters.values()];

    }

    clear() {

        this.parameters.clear();

    }

    count() {

        return this.parameters.size;

    }

}

module.exports = ModuleParameterRegistry;