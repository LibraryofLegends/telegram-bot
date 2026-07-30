'use strict';

class ModuleOptionMonitor {

    constructor(registry) {

        this.registry = registry;

        this.checkedAt = null;

    }

    check() {

        this.checkedAt = new Date();

        return {

            checkedAt: this.checkedAt,

            options: this.registry.count()

        };

    }

    getCheckedAt() {

        return this.checkedAt;

    }

}

module.exports = ModuleOptionMonitor;