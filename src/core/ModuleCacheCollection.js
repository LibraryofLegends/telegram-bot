'use strict';

class ModuleCacheCollection {

    constructor() {

        this.items = [];

    }

    add(cache) {

        this.items.push(cache);

        return this;

    }

    remove(cache) {

        this.items = this.items.filter(

            item => item !== cache

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

module.exports = ModuleCacheCollection;