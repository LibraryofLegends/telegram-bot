'use strict';

class ModuleStorageCollection {

    constructor() {

        this.items = [];

    }

    add(storage) {

        this.items.push(storage);

        return this;

    }

    remove(storage) {

        this.items = this.items.filter(

            item => item !== storage

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

module.exports = ModuleStorageCollection;