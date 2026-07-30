'use strict';

class ModuleManifestCollection {

    constructor() {

        this.items = [];

    }

    add(manifest) {

        this.items.push(manifest);

        return this;

    }

    remove(manifest) {

        this.items = this.items.filter(

            item => item !== manifest

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

module.exports = ModuleManifestCollection;