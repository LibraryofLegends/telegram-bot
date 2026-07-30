'use strict';

const ModuleManifestRegistry = require('./ModuleManifestRegistry');
const ModuleManifestHistory = require('./ModuleManifestHistory');

class ModuleManifestManager {

    constructor() {

        this.registry = new ModuleManifestRegistry();

        this.history = new ModuleManifestHistory();

    }

    register(manifest) {

        this.registry.register(manifest);

        this.history.add(

            manifest.all()

        );

        return this;

    }

    get(name) {

        return this.registry.get(name);

    }

    has(name) {

        return this.registry.has(name);

    }

    remove(name) {

        return this.registry.remove(name);

    }

    clear() {

        this.registry.clear();

        this.history.clear();

    }

}

module.exports = ModuleManifestManager;