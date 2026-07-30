'use strict';

class ModuleProfileCollection {

    constructor() {

        this.items = [];

    }

    add(profile) {

        this.items.push(profile);

        return this;

    }

    remove(profile) {

        this.items = this.items.filter(

            item => item !== profile

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

module.exports = ModuleProfileCollection;