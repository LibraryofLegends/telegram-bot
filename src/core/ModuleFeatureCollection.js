'use strict';

class ModuleFeatureCollection {

    constructor() {

        this.items = [];

    }

    add(feature) {

        this.items.push(feature);

        return this;

    }

    remove(feature) {

        this.items = this.items.filter(

            item => item !== feature

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

module.exports = ModuleFeatureCollection;