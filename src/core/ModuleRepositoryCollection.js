'use strict';

class ModuleRepositoryCollection {

    constructor() {

        this.items = [];

    }

    add(repository) {

        this.items.push(repository);

        return this;

    }

    remove(repository) {

        this.items = this.items.filter(

            item => item !== repository

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

module.exports = ModuleRepositoryCollection;