'use strict';

class ModuleBuilderCollection {

    constructor() {

        this.items = [];

    }

    add(builder) {

        this.items.push(builder);

        return this;

    }

    remove(builder) {

        this.items = this.items.filter(

            item => item !== builder

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

module.exports = ModuleBuilderCollection;