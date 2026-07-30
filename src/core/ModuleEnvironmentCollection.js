'use strict';

class ModuleEnvironmentCollection {

    constructor() {

        this.items = [];

    }

    add(environment) {

        this.items.push(environment);

        return this;

    }

    remove(environment) {

        this.items = this.items.filter(

            item => item !== environment

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

module.exports = ModuleEnvironmentCollection;