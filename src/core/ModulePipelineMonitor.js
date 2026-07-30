'use strict';

class ModulePipelineMonitor {

    constructor(registry) {

        this.registry = registry;

        this.checkedAt = null;

    }

    check() {

        this.checkedAt = new Date();

        return {

            checkedAt: this.checkedAt,
            pipelines: this.registry.count()

        };

    }

    getCheckedAt() {

        return this.checkedAt;

    }

}

module.exports = ModulePipelineMonitor;