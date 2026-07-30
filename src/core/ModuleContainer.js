'use strict';

class ModuleContainer {

    constructor() {

        this.services = new Map();

    }

    set(name, service) {

        this.services.set(name, service);

        return this;

    }

    get(name) {

        return this.services.get(name) || null;

    }

    has(name) {

        return this.services.has(name);

    }

    remove(name) {

        return this.services.delete(name);

    }

    clear() {

        this.services.clear();

    }

    keys() {

        return [...this.services.keys()];

    }

    values() {

        return [...this.services.values()];

    }

    count() {

        return this.services.size;

    }

}

module.exports = ModuleContainer;