'use strict';

const ModuleMetadataRegistry = require('./ModuleMetadataRegistry');
const ModuleMetadataHistory = require('./ModuleMetadataHistory');

class ModuleMetadataManager {

    constructor() {

        this.registry = new ModuleMetadataRegistry();

        this.history = new ModuleMetadataHistory();

    }

    register(metadata) {

        this.registry.register(metadata);

        this.history.add(

            metadata.entries()

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

module.exports = ModuleMetadataManager;