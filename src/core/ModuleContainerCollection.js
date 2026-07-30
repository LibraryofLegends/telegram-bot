'use strict';

class ModuleContainerCollection {

    constructor() {

        this.items = [];

    }

    add(container) {

        this.items.push(container);

        return this;

    }

    remove(container) {

        this.items = this.items.filter(

            item => item !== container

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

module.exports = ModuleContainerCollection;