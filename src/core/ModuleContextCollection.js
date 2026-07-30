'use strict';

class ModuleContextCollection {

    constructor() {

        this.items = [];

    }

    add(context) {

        this.items.push(context);

        return this;

    }

    remove(context) {

        this.items = this.items.filter(

            item => item !== context

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

module.exports = ModuleContextCollection;