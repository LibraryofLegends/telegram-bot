'use strict';

class ModuleDescriptorCollection {

    constructor() {

        this.items = [];

    }

    add(descriptor) {

        this.items.push(descriptor);

        return this;

    }

    remove(descriptor) {

        this.items = this.items.filter(

            item => item !== descriptor

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

module.exports = ModuleDescriptorCollection;