'use strict';

class ModuleStackCollection {

    constructor() {

        this.items = [];

    }

    add(stack) {

        this.items.push(stack);

        return this;

    }

    remove(stack) {

        this.items = this.items.filter(

            item => item !== stack

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

module.exports = ModuleStackCollection;