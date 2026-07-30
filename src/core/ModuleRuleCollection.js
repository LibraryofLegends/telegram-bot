'use strict';

class ModuleRuleCollection {

    constructor() {

        this.items = [];

    }

    add(rule) {

        this.items.push(rule);

        return this;

    }

    remove(rule) {

        this.items = this.items.filter(

            item => item !== rule

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

module.exports = ModuleRuleCollection;