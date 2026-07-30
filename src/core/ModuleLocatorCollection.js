'use strict';

class ModuleLocatorCollection {

    constructor() {

        this.items = [];

    }

    add(locator) {

        this.items.push(locator);

        return this;

    }

    remove(locator) {

        this.items = this.items.filter(

            item => item !== locator

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

module.exports = ModuleLocatorCollection;