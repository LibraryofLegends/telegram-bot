'use strict';

class ModuleConstraintRegistry {

    constructor() {

        this.constraints = new Map();

    }

    register(constraint) {

        this.constraints.set(

            constraint.getName(),

            constraint

        );

        return this;

    }

    get(name) {

        return this.constraints.get(name) || null;

    }

    has(name) {

        return this.constraints.has(name);

    }

    remove(name) {

        return this.constraints.delete(name);

    }

    all() {

        return [...this.constraints.values()];

    }

    clear() {

        this.constraints.clear();

    }

    count() {

        return this.constraints.size;

    }

}

module.exports = ModuleConstraintRegistry;