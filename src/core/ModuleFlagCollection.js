'use strict';

class ModuleFlagCollection {

    constructor() {

        this.items = [];

    }

    add(flag) {

        this.items.push(flag);

        return this;

    }

    remove(flag) {

        this.items = this.items.filter(

            item => item !== flag

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

module.exports = ModuleFlagCollection;