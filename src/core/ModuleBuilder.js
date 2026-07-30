'use strict';

class ModuleBuilder {

    constructor() {

        this.builders = new Map();

    }

    register(name, builder) {

        this.builders.set(name, builder);

        return this;

    }

    build(name, ...args) {

        if (!this.builders.has(name)) {

            return null;

        }

        return this.builders.get(name)(...args);

    }

    has(name) {

        return this.builders.has(name);

    }

    remove(name) {

        return this.builders.delete(name);

    }

    clear() {

        this.builders.clear();

    }

    count() {

        return this.builders.size;

    }

}

module.exports = ModuleBuilder;