'use strict';

class ModuleEnvironmentStatistics {

    constructor(registry) {

        this.registry = registry;

    }

    total() {

        return this.registry.count();

    }

    active() {

        return this.registry
            .all()
            .filter(environment => environment.isActive())
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

module.exports = ModuleEnvironmentStatistics;