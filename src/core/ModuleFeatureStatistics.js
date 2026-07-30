'use strict';

class ModuleFeatureStatistics {

    constructor(registry) {

        this.registry = registry;

    }

    total() {

        return this.registry.count();

    }

    enabled() {

        return this.registry
            .all()
            .filter(feature => feature.isEnabled())
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

module.exports = ModuleFeatureStatistics;