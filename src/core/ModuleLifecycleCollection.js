'use strict';

class ModuleLifecycleCollection {

    constructor() {

        this.items = [];

    }

    add(item) {

        this.items.push(item);

        return this;

    }

    remove(item) {

        this.items = this.items.filter(

            value => value !== item

        );

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

    count() {

        return this.items.length;

    }

    clear() {

        this.items = [];

    }

}

module.exports = ModuleLifecycleCollection;