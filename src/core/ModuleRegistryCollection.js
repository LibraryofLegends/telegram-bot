'use strict';

class ModuleRegistryCollection {

    constructor() {

        this.items = [];

    }

    add(registry) {

        this.items.push(registry);

        return this;

    }

    remove(registry) {

        this.items = this.items.filter(

            item => item !== registry

        );

        return this;

    }

    first() {

        return this.items[0] || null;

    }

    last() {

        return this.items.at(-1) || null;

    }

    all() {

        return [...this.items];

    }

    clear() {

        this.items = [];

    }

    count() {

        return this.items.length;

    }

}

module.exports = ModuleRegistryCollection;