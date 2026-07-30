'use strict';

class ModuleCapabilityCollection {

    constructor() {

        this.items = [];

    }

    add(capability) {

        this.items.push(capability);

        return this;

    }

    remove(capability) {

        this.items = this.items.filter(

            item => item !== capability

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

module.exports = ModuleCapabilityCollection;