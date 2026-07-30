'use strict';

class ModuleConstraintCollection {

    constructor() {

        this.items = [];

    }

    add(constraint) {

        this.items.push(constraint);

        return this;

    }

    remove(constraint) {

        this.items = this.items.filter(

            item => item !== constraint

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

module.exports = ModuleConstraintCollection;