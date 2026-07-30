'use strict';

class ModuleStateMachineCollection {

    constructor() {

        this.items = [];

    }

    add(machine) {

        this.items.push(machine);

        return this;

    }

    remove(machine) {

        this.items = this.items.filter(

            item => item !== machine

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

module.exports = ModuleStateMachineCollection;