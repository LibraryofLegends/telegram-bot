'use strict';

class ModuleContextRegistry {

    constructor() {

        this.contexts = new Map();

    }

    register(context) {

        this.contexts.set(

            context.getName(),

            context

        );

        return this;

    }

    get(name) {

        return this.contexts.get(name) || null;

    }

    has(name) {

        return this.contexts.has(name);

    }

    remove(name) {

        return this.contexts.delete(name);

    }

    all() {

        return [...this.contexts.values()];

    }

    clear() {

        this.contexts.clear();

    }

    count() {

        return this.contexts.size;

    }

}

module.exports = ModuleContextRegistry;