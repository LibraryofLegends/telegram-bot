'use strict';

class ModuleLifecycleStatistics {

    constructor(registry) {

        this.registry = registry;

    }

    total() {

        return this.registry.count();

    }

    phases() {

        const result = {};

        for (const lifecycle of this.registry.all()) {

            const phase = lifecycle.current();

            result[phase] = (result[phase] || 0) + 1;

        }

        return result;

    }

    toJSON() {

        return {

            total: this.total(),

            phases: this.phases()

        };

    }

}

module.exports = ModuleLifecycleStatistics;