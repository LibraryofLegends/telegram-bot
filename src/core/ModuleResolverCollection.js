'use strict';

class ModuleResolverCollection {

    constructor() {

        this.items = [];

    }

    add(resolver) {

        this.items.push(resolver);

        return this;

    }

    remove(resolver) {

        this.items = this.items.filter(

            item => item !== resolver

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

module.exports = ModuleResolverCollection;