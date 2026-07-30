'use strict';

class ModuleConfigStatistics {

    constructor(registry) {

        this.registry = registry;

    }

    total() {

        return this.registry.count();

    }

    summary() {

        return {

            total: this.total()

        };

    }

    toJSON() {

        return this.summary();

    }

}

module.exports = ModuleConfigStatistics;