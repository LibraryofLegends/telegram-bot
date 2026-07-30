'use strict';

class ModuleFeatureRegistry {

    constructor() {

        this.features = new Map();

    }

    register(feature) {

        this.features.set(
            feature.getName(),
            feature
        );

        return this;

    }

    get(name) {

        return this.features.get(name) || null;

    }

    has(name) {

        return this.features.has(name);

    }

    remove(name) {

        return this.features.delete(name);

    }

    all() {

        return [...this.features.values()];

    }

    clear() {

        this.features.clear();

    }

    count() {

        return this.features.size;

    }

}

module.exports = ModuleFeatureRegistry;