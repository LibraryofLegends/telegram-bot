'use strict';

class ModuleConstraintStatistics {

    constructor(registry) {

        this.registry = registry;

    }

    total() {

        return this.registry.count();

    }

    enabled() {

        return this.registry
            .all()
            .filter(item => item.isEnabled())
            .length;

    }

    disabled() {

        return this.total() - this.enabled();

    }

    toJSON() {

        return {

            total: this.total(),
            enabled: this.enabled(),
            disabled: this.disabled()

        };

    }

}

module.exports = ModuleConstraintStatistics;