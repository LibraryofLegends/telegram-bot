'use strict';

class ModuleProfileRegistry {

    constructor() {

        this.profiles = new Map();

    }

    register(profile) {

        this.profiles.set(
            profile.getName(),
            profile
        );

        return this;

    }

    get(name) {

        return this.profiles.get(name) || null;

    }

    has(name) {

        return this.profiles.has(name);

    }

    remove(name) {

        return this.profiles.delete(name);

    }

    all() {

        return [...this.profiles.values()];

    }

    clear() {

        this.profiles.clear();

    }

    count() {

        return this.profiles.size;

    }

}

module.exports = ModuleProfileRegistry;