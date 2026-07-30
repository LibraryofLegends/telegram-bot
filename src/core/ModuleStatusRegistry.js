'use strict';

class ModuleStatusRegistry {

    constructor() {

        this.statuses = new Map();

    }

    set(name, status) {

        this.statuses.set(name, status);

        return this;

    }

    get(name) {

        return this.statuses.get(name) || null;

    }

    has(name) {

        return this.statuses.has(name);

    }

    remove(name) {

        return this.statuses.delete(name);

    }

    all() {

        return [...this.statuses.entries()];

    }

    clear() {

        this.statuses.clear();

    }

    count() {

        return this.statuses.size;

    }

    toJSON() {

        return Object.fromEntries(

            this.statuses.entries()

        );

    }

}

module.exports = ModuleStatusRegistry;