'use strict';

class ModuleStatusMonitor {

    constructor(registry) {

        this.registry = registry;

        this.lastCheck = null;

    }

    check() {

        this.lastCheck = new Date();

        return {

            checkedAt: this.lastCheck,

            modules: this.registry.count(),

            statuses: this.registry.toJSON()

        };

    }

    getLastCheck() {

        return this.lastCheck;

    }

    toJSON() {

        return this.check();

    }

}

module.exports = ModuleStatusMonitor;