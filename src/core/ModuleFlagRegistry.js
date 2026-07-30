'use strict';

class ModuleFlagRegistry {

    constructor() {

        this.flags = new Map();

    }

    register(flag) {

        this.flags.set(

            flag.getName(),

            flag

        );

        return this;

    }

    get(name) {

        return this.flags.get(name) || null;

    }

    has(name) {

        return this.flags.has(name);

    }

    remove(name) {

        return this.flags.delete(name);

    }

    all() {

        return [...this.flags.values()];

    }

    clear() {

        this.flags.clear();

    }

    count() {

        return this.flags.size;

    }

}

module.exports = ModuleFlagRegistry;