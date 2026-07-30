'use strict';

class ModuleFactoryStatistics {

    constructor(registry) {

        this.registry = registry;

    }

    total() {

        return this.registry.count();

    }

    toJSON() {

        return {

            total: this.total()

        };

    }

}

module.exports = ModuleFactoryStatistics;