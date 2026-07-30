'use strict';

class ModuleFactoryCollection {

    constructor() {

        this.items = [];

    }

    add(factory) {

        this.items.push(factory);

        return this;

    }

    remove(factory) {

        this.items = this.items.filter(

            item => item !== factory

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

module.exports = ModuleFactoryCollection;