'use strict';

class ModuleOptionRegistry {

    constructor() {

        this.options = new Map();

    }

    register(option) {

        this.options.set(

            option.getName(),

            option

        );

        return this;

    }

    get(name) {

        return this.options.get(name) || null;

    }

    has(name) {

        return this.options.has(name);

    }

    remove(name) {

        return this.options.delete(name);

    }

    all() {

        return [...this.options.values()];

    }

    clear() {

        this.options.clear();

    }

    count() {

        return this.options.size;

    }

}

module.exports = ModuleOptionRegistry;