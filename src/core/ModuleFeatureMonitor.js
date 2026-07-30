'use strict';

class ModuleFeatureMonitor {

    constructor(registry) {

        this.registry = registry;
        this.checkedAt = null;

    }

    check() {

        this.checkedAt = new Date();

        return {

            checkedAt: this.checkedAt,
            features: this.registry.count()

        };

    }

    getCheckedAt() {

        return this.checkedAt;

    }

}

module.exports = ModuleFeatureMonitor;