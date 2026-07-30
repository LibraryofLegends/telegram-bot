'use strict';

class ModuleOptionCollection {

    constructor() {

        this.items = [];

    }

    add(option) {

        this.items.push(option);

        return this;

    }

    remove(option) {

        this.items = this.items.filter(

            item => item !== option

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

module.exports = ModuleOptionCollection;