'use strict';

class ModuleDefinitionCollection {

    constructor() {

        this.items = [];

    }

    add(definition) {

        this.items.push(definition);

        return this;

    }

    remove(definition) {

        this.items = this.items.filter(

            item => item !== definition

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

module.exports = ModuleDefinitionCollection;