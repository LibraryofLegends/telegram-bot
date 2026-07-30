'use strict';

class ModuleMetadataCollection {

    constructor() {

        this.items = [];

    }

    add(metadata) {

        this.items.push(metadata);

        return this;

    }

    remove(metadata) {

        this.items = this.items.filter(

            item => item !== metadata

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

module.exports = ModuleMetadataCollection;