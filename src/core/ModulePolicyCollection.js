'use strict';

class ModulePolicyCollection {

    constructor() {

        this.items = [];

    }

    add(policy) {

        this.items.push(policy);

        return this;

    }

    remove(policy) {

        this.items = this.items.filter(
            item => item !== policy
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

module.exports = ModulePolicyCollection;