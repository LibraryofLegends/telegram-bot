'use strict';

class ModuleParameterCollection {

    constructor() {

        this.items = [];

    }

    add(parameter) {

        this.items.push(parameter);

        return this;

    }

    remove(parameter) {

        this.items = this.items.filter(

            item => item !== parameter

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

module.exports = ModuleParameterCollection;