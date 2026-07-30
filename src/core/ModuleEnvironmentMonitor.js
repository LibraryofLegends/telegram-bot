'use strict';

class ModuleEnvironmentMonitor {

    constructor(registry) {

        this.registry = registry;

        this.checkedAt = null;

    }

    check() {

        this.checkedAt = new Date();

        return {

            checkedAt: this.checkedAt,
            environments: this.registry.count()

        };

    }

    getCheckedAt() {

        return this.checkedAt;

    }

}

module.exports = ModuleEnvironmentMonitor;