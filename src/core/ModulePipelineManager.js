'use strict';

const ModulePipelineRegistry = require('./ModulePipelineRegistry');
const ModulePipelineHistory = require('./ModulePipelineHistory');

class ModulePipelineManager {

    constructor() {

        this.registry = new ModulePipelineRegistry();

        this.history = new ModulePipelineHistory();

    }

    register(name, pipeline) {

        this.registry.register(name, pipeline);

        this.history.add(

            pipeline.count()

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

module.exports = ModulePipelineManager;