'use strict';

class ModuleStatusCollection {

    constructor() {

        this.items = [];

    }

    add(status) {

        this.items.push(status);

        return this;

    }

    remove(status) {

        this.items = this.items.filter(

            item => item !== status

        );

        return this;

    }

    first() {

        return this.items[0] || null;

    }

    last() {

        return this.items.length

            ? this.items[this.items.length - 1]

            : null;

    }

    all() {

        return [...this.items];

    }

    clear() {

        this.items.length = 0;

    }

    count() {

        return this.items.length;

    }

}

module.exports = ModuleStatusCollection;