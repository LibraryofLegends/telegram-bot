'use strict';

class ModulePolicyStatistics {

    constructor(registry) {

        this.registry = registry;

    }

    total() {

        return this.registry.count();

    }

    active() {

        return this.registry
            .all()
            .filter(policy => policy.isActive())
            .length;

    }

    inactive() {

        return this.total() - this.active();

    }

    toJSON() {

        return {

            total: this.total(),
            active: this.active(),
            inactive: this.inactive()

        };

    }

}

module.exports = ModulePolicyStatistics;