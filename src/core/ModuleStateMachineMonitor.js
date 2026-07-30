'use strict';

class ModuleStateMachineMonitor {

    constructor(registry) {

        this.registry = registry;
        this.checkedAt = null;

    }

    check() {

        this.checkedAt = new Date();

        return {

            checkedAt: this.checkedAt,
            machines: this.registry.count()

        };

    }

    getCheckedAt() {

        return this.checkedAt;

    }

}

module.exports = ModuleStateMachineMonitor;