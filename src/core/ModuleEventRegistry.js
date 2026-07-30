'use strict';

class ModuleEventRegistry {

    constructor() {

        this.events = new Map();

    }

    register(name, event) {

        this.events.set(name, event);

        return this;

    }

    get(name) {

        return this.events.get(name) || null;

    }

    has(name) {

        return this.events.has(name);

    }

    remove(name) {

        return this.events.delete(name);

    }

    clear() {

        this.events.clear();

    }

    count() {

        return this.events.size;

    }

    all() {

        return [...this.events.values()];

    }

}

module.exports = ModuleEventRegistry;