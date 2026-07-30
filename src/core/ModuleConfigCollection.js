'use strict';

class ModuleConfigCollection {

    constructor() {

        this.items = [];

    }

    add(config) {

        this.items.push(config);

        return this;

    }

    remove(config) {

        this.items = this.items.filter(

            item => item !== config

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

    clear() {

        this.items = [];

    }

    count() {

        return this.items.length;

    }

}

module.exports = ModuleConfigCollection;