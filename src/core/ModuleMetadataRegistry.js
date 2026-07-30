'use strict';

class ModuleMetadataRegistry {

    constructor() {

        this.items = new Map();

    }

    register(metadata) {

        this.items.set(

            metadata.getName(),

            metadata

        );

        return this;

    }

    get(name) {

        return this.items.get(name) || null;

    }

    has(name) {

        return this.items.has(name);

    }

    remove(name) {

        return this.items.delete(name);

    }

    all() {

        return [...this.items.values()];

    }

    clear() {

        this.items.clear();

    }

    count() {

        return this.items.size;

    }

}

module.exports = ModuleMetadataRegistry;